"""Explicitly run against a dedicated account; never discovered by unittest.

Reads RESUME_TEST_EMAIL/PASSWORD from backend/.env. Uploads a synthetic PDF,
checks real Supabase/LlamaCloud behavior, and deletes only the created fixture.
No passwords, tokens, signed URLs, or real resume content are printed.
"""
import os
import sys
from pathlib import Path
from contextlib import ExitStack
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parents[1] / ".env")
import httpx
from fastapi.testclient import TestClient
from main import app


def synthetic_pdf():
    content = (b"BT /F1 14 Tf 50 750 Td (Applyr Synthetic Test Resume) Tj "
               b"0 -25 Td (Test Candidate - Software Engineer) Tj "
               b"0 -25 Td (Skills: Python, TypeScript, FastAPI) Tj "
               b"0 -25 Td (Education: Example University, Computer Science, 2024) Tj ET")
    objects = [b"<< /Type /Catalog /Pages 2 0 R >>",
               b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
               b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
               b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
               b"<< /Length " + str(len(content)).encode() + b" >>\nstream\n" + content + b"\nendstream"]
    data, offsets = b"%PDF-1.4\n", [0]
    for number, body in enumerate(objects, 1):
        offsets.append(len(data))
        data += f"{number} 0 obj\n".encode() + body + b"\nendobj\n"
    xref = len(data)
    data += b"xref\n0 6\n0000000000 65535 f \n"
    data += b"".join(f"{offset:010} 00000 n \n".encode() for offset in offsets[1:])
    return data + f"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode()


def main():
    if not all(os.getenv(key) for key in ("RESUME_TEST_EMAIL", "RESUME_TEST_PASSWORD")):
        print("Missing dedicated test-account configuration.")
        return 2
    findings, resume_id, headers = [], None, None
    def check(condition, message):
        if not condition:
            raise RuntimeError(message)
        print("PASS:", message, flush=True)
    with ExitStack() as stack, TestClient(app, raise_server_exceptions=False) as api, httpx.Client(timeout=30) as network:
        if "--skip-ai" in sys.argv:
            from core.resume_mgmt import ensure_json_structure
            stack.enter_context(patch("core.resume_mgmt.extract_resume_details", return_value=ensure_json_structure({"skills": ["Python"]})))
            print("AI extraction mocked for storage/database diagnostics.", flush=True)
        try:
            response = api.post("/api/auth/signin", json={"email": os.environ["RESUME_TEST_EMAIL"], "password": os.environ["RESUME_TEST_PASSWORD"]})
            check(response.status_code == 200, f"Test-account sign-in (HTTP {response.status_code})")
            headers = {"Authorization": "Bearer " + response.json()["access_token"]}
            print("Running live synthetic resume extraction...", flush=True)
            uploaded = api.post("/api/resumes/", headers=headers, files={"file": ("Applyr-Synthetic-Test.pdf", synthetic_pdf(), "application/pdf")})
            if uploaded.status_code != 200:
                print("Upload response:", uploaded.text[:300], flush=True)
            check(uploaded.status_code == 200, f"Upload and real AI extraction (HTTP {uploaded.status_code})")
            resume = uploaded.json()["data"]["resume"]
            resume_id = resume["id"]
            check(resume["filename"] == "Applyr-Synthetic-Test.pdf", "Original filename preserved")
            check(bool(resume["resume_content"][0]["skills"]), "Structured extraction contains skills")
            listed = api.get("/api/resumes/", headers=headers)
            check(listed.status_code == 200 and any(row["id"] == resume_id for row in listed.json()), "Uploaded resume appears in list")
            edited = api.put(f"/api/resumes/{resume_id}", headers=headers, json={"summary": "Synthetic integration verification", "skills": ["Python", "TypeScript"]})
            check(edited.status_code == 200, "Structured content edit")
            detail = api.get(f"/api/resumes/{resume_id}", headers=headers)
            check(detail.json()["resume_content"][0]["summary"] == "Synthetic integration verification", "Edit persisted on reload")
            signed = api.get(f"/api/resumes/{resume_id}/download", headers=headers)
            check(signed.status_code == 200, "Authenticated signed download")
            downloaded = network.get(signed.json()["url"])
            check(downloaded.status_code == 200 and downloaded.content.startswith(b"%PDF"), "Original PDF downloadable")
            base = os.environ["SUPABASE_URL"].rstrip("/")
            object_path = f"{resume['user_id']}/{resume_id}.pdf"
            public = network.get(f"{base}/storage/v1/object/public/resumes/{object_path}")
            if public.status_code == 200:
                findings.append("BLOCKER: resumes bucket still permits public file downloads.")
            else:
                check(True, "Anonymous public download blocked")
            from db.database import get_supabase
            from postgrest.exceptions import APIError
            connection = get_supabase(None)
            anon = next(connection)
            try:
                rows = anon.table("resumes").select("id").eq("id", resume_id).execute().data
                if rows:
                    findings.append("BLOCKER: anonymous callers can read resume records.")
                else:
                    check(True, "Anonymous resume-record access blocked")
            except APIError as exc:
                if exc.code == "42501":
                    check(True, "Anonymous resume-record access denied")
                else:
                    findings.append(f"UNVERIFIED: anonymous RLS probe returned code {exc.code}.")
            finally:
                connection.close()
        except Exception as error:
            # Print controlled test labels only; never remote exception payloads/tokens.
            if isinstance(error, RuntimeError):
                print("FAIL:", str(error), flush=True)
            else:
                print("FAIL:", type(error).__name__, flush=True)
            findings.append("Live workflow verification did not complete.")
        finally:
            if resume_id:
                deleted = api.delete(f"/api/resumes/{resume_id}", headers=headers)
                if deleted.status_code == 200:
                    detail = api.get(f"/api/resumes/{resume_id}", headers=headers)
                    if detail.status_code == 404:
                        print("PASS: Synthetic fixture deleted", flush=True)
                    else:
                        findings.append("CLEANUP REQUIRED: Synthetic fixture still visible.")
                else:
                    findings.append(f"CLEANUP REQUIRED: synthetic resume {resume_id}, HTTP {deleted.status_code}.")
            if headers:
                api.post("/api/auth/logout", headers=headers)
    for finding in findings: print(finding, flush=True)
    return 1 if findings else 0


if __name__ == "__main__":
    raise SystemExit(main())
