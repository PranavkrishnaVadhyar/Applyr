"""Read only schema diagnostics using the dedicated test account; no row data."""
import os
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parents[1] / ".env")
import httpx

with httpx.Client(timeout=30) as client:
    base = os.environ["SUPABASE_URL"].rstrip("/")
    headers = {"apikey": os.environ["SUPABASE_ANON_KEY"]}
    auth = client.post(base + "/auth/v1/token?grant_type=password", headers=headers,
                       json={"email": os.environ["RESUME_TEST_EMAIL"], "password": os.environ["RESUME_TEST_PASSWORD"]})
    print("Auth status:", auth.status_code)
    auth.raise_for_status()
    headers["Authorization"] = "Bearer " + auth.json()["access_token"]
    response = client.get(base + "/rest/v1/", headers={**headers, "Accept": "application/openapi+json"})
    print("Schema status:", response.status_code)
    if response.status_code != 200:
        body = response.json()
        print("Schema error:", body.get("code"), body.get("message"))
    if response.status_code == 200:
        for name in ("resumes", "resume_content"):
            definition = response.json().get("definitions", {}).get(name, {})
            print(name, "required:", definition.get("required"))
            for key, value in definition.get("properties", {}).items():
                print(" ", key, value.get("type"), value.get("format"), value.get("default"))
    buckets = client.get(base + "/storage/v1/bucket", headers=headers)
    print("Bucket-list status:", buckets.status_code)
    if buckets.status_code == 200:
        print("Visible buckets:", [(bucket.get("name"), bucket.get("public")) for bucket in buckets.json()])
    from db.database import get_supabase
    from fastapi.security import HTTPAuthorizationCredentials
    connection = get_supabase(HTTPAuthorizationCredentials(scheme="Bearer", credentials=auth.json()["access_token"]))
    sdk = next(connection)
    try:
        for table in ("resumes", "resume_content"):
            try:
                sdk.table(table).select("id").limit(0).execute()
                print("SDK table accessible:", table)
            except Exception as exc:
                print("SDK table failure:", table, type(exc).__name__, getattr(exc, "code", None), getattr(exc, "message", None))
        try:
            bucket = sdk.storage.get_bucket("resumes")
            print("SDK resumes bucket found; public:", bucket.public)
        except Exception as exc:
            print("SDK bucket failure:", type(exc).__name__, getattr(exc, "code", None))
    finally:
        connection.close()
    client.post(base + "/auth/v1/logout?scope=local", headers=headers)
