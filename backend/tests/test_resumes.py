"""Resume API and persistence regressions with an in-memory Supabase boundary."""
import copy
import os
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock, patch
from uuid import UUID, uuid4

os.environ.update(SUPABASE_URL="https://example.supabase.co", SUPABASE_ANON_KEY="test-key")
from fastapi.testclient import TestClient
from main import app
from db.database import get_supabase
from core.resume_mgmt import MAX_RESUME_BYTES, extract_resume_details, process_resume_upload, ResumeProcessingError

USER = "11111111-1111-4111-8111-111111111111"
OTHER = "22222222-2222-4222-8222-222222222222"


class Query:
    def __init__(self, db, table):
        self.db, self.table = db, table
        self.filters, self.operation, self.value, self.count = {}, "select", None, None

    def select(self, *_): return self
    def order(self, *_args, **_kwargs): return self
    def eq(self, key, value): self.filters[key] = value; return self
    def limit(self, value): self.count = value; return self
    def insert(self, value): self.operation, self.value = "insert", value; return self
    def update(self, value): self.operation, self.value = "update", value; return self
    def delete(self): self.operation = "delete"; return self

    def execute(self):
        key = f"{self.table}.{self.operation}"
        if key in self.db.failures:
            raise RuntimeError("Simulated persistence failure")
        rows = self.db.rows[self.table]
        matching = [row for row in rows if all(row.get(k) == v for k, v in self.filters.items())]
        if self.operation == "insert":
            row = {"id": str(uuid4()), "created_at": "2026-10-13T00:00:00Z", **self.value}
            rows.append(row)
            matching = [row]
        if self.operation == "update":
            for row in matching: row.update(self.value)
        if self.operation == "delete":
            for row in matching:
                rows.remove(row)
                if self.table == "resumes":
                    self.db.rows["resume_content"] = [c for c in self.db.rows["resume_content"] if c["resume_id"] != row["id"]]
        if key in self.db.uncertain_failures:
            raise RuntimeError("Write committed but response was lost")
        result = copy.deepcopy(matching[:self.count] if self.count else matching)
        if self.table == "resumes" and self.operation == "select":
            for row in result:
                content = copy.deepcopy([c for c in self.db.rows["resume_content"] if c["resume_id"] == row["id"]])
                row["resume_content"] = (content[0] if content else None) if self.db.object_relation else content
        return SimpleNamespace(data=result)


class Store:
    def __init__(self): self.files = {}; self.fail_remove = False; self.removed = []; self.noop_remove = False
    def from_(self, _): return self
    def upload(self, path, file, file_options): self.files[path] = file
    def remove(self, paths):
        if self.fail_remove: raise RuntimeError("Storage unavailable")
        if self.noop_remove: return []
        removed = []
        for path in paths:
            if path in self.files: removed.append({"name": path})
            self.files.pop(path, None); self.removed.append(path)
        return removed
    def info(self, path):
        from storage3.exceptions import StorageApiError
        if path not in self.files: raise StorageApiError("Missing", "NoSuchKey", 404)
        return {"name": path}
    def create_signed_url(self, path, expires, options):
        if path not in self.files: raise RuntimeError("Missing file")
        return {"signedURL": f"https://example.supabase.co/private/{path}?token=short-lived"}


class Database:
    def __init__(self):
        self.rows = {"resumes": [], "resume_content": [], "applications": []}
        self.failures, self.uncertain_failures = set(), set()
        self.storage = Store()
        self.object_relation = False
        self.auth = MagicMock()
        self.auth.get_user.return_value = SimpleNamespace(user=SimpleNamespace(id=USER))
    def table(self, name): return Query(self, name)


class ResumeTests(unittest.TestCase):
    def setUp(self):
        self.db = Database()
        app.dependency_overrides[get_supabase] = lambda: self.db
        self.client = TestClient(app)
        self.headers = {"Authorization": "Bearer test-token"}
        self.extract = patch("core.resume_mgmt.extract_resume_details", return_value={
            "summary": "Engineer", "skills": ["Python"], "experience": [], "education": [],
            "projects": [], "certifications": [], "achievements": [], "languages": [],
        }).start()

    def tearDown(self):
        patch.stopall()
        app.dependency_overrides.clear()
        self.client.close()

    def upload(self, name="My Resume.PDF", data=b"%PDF-1.4 test"):
        return self.client.post("/api/resumes/", headers=self.headers, files={"file": (name, data)})

    def test_full_upload_list_edit_download_delete_flow(self):
        result = self.upload()
        self.assertEqual(result.status_code, 200, result.text)
        resume = result.json()["data"]["resume"]
        self.assertEqual(resume["filename"], "My Resume.PDF")
        self.assertIsNone(resume["file_url"])
        self.assertEqual(len(resume["resume_content"]), 1)
        rid = resume["id"]
        self.db.object_relation = True
        listed = self.client.get("/api/resumes/", headers=self.headers).json()
        self.assertIsInstance(listed[0]["resume_content"], list)
        updated = self.client.put(f"/api/resumes/{rid}", headers=self.headers, json={"skills": ["TypeScript"]})
        self.assertEqual(updated.status_code, 200, updated.text)
        detail = self.client.get(f"/api/resumes/{rid}", headers=self.headers).json()
        self.assertEqual(detail["resume_content"][0]["skills"], ["TypeScript"])
        download = self.client.get(f"/api/resumes/{rid}/download", headers=self.headers)
        self.assertEqual(download.status_code, 200)
        self.assertEqual(download.json()["expires_in"], 60)
        deleted = self.client.delete(f"/api/resumes/{rid}", headers=self.headers)
        self.assertEqual(deleted.status_code, 200, deleted.text)
        self.assertFalse(self.db.storage.files)
        self.assertFalse(self.db.rows["resumes"])
        self.assertFalse(self.db.rows["resume_content"])

    def test_upload_limit_and_empty_file(self):
        for data, status in [(b"", 400), (b"x" * (MAX_RESUME_BYTES + 1), 413)]:
            self.assertEqual(self.upload(data=data).status_code, status)
        self.extract.assert_not_called()
        self.assertEqual(self.upload(data=b"x" * MAX_RESUME_BYTES).status_code, 200)

    def test_invalid_extension_rejected(self):
        self.assertEqual(self.upload(name="resume.exe").status_code, 400)
        self.extract.assert_not_called()

    def test_extraction_failure_creates_no_supabase_objects(self):
        self.extract.side_effect = RuntimeError("Provider failure")
        self.assertEqual(self.upload().status_code, 502)
        self.assertFalse(self.db.storage.files)
        self.assertFalse(self.db.rows["resumes"])

    def test_content_failure_compensates_storage_and_database(self):
        self.db.failures.add("resume_content.insert")
        self.assertEqual(self.upload().status_code, 502)
        self.assertFalse(self.db.storage.files)
        self.assertFalse(self.db.rows["resumes"])

    def test_uncertain_write_is_compensated_using_preallocated_id(self):
        self.db.uncertain_failures.add("resumes.insert")
        self.assertEqual(self.upload().status_code, 502)
        self.assertFalse(self.db.storage.files)
        self.assertFalse(self.db.rows["resumes"])

    def test_incomplete_cleanup_is_reported(self):
        self.db.failures.add("resume_content.insert")
        self.db.storage.fail_remove = True
        response = self.upload()
        self.assertEqual(response.status_code, 502)
        self.assertIn("cleanup is incomplete", response.json()["detail"])

    def test_delete_storage_failure_keeps_record_for_retry(self):
        rid = self.upload().json()["data"]["resume"]["id"]
        self.db.storage.fail_remove = True
        response = self.client.delete(f"/api/resumes/{rid}", headers=self.headers)
        self.assertEqual(response.status_code, 502)
        self.assertTrue(self.db.rows["resumes"])
        self.db.storage.fail_remove = False
        self.assertEqual(self.client.delete(f"/api/resumes/{rid}", headers=self.headers).status_code, 200)

    def test_delete_database_failure_is_retryable(self):
        rid = self.upload().json()["data"]["resume"]["id"]
        self.db.failures.add("resumes.delete")
        self.assertEqual(self.client.delete(f"/api/resumes/{rid}", headers=self.headers).status_code, 502)
        self.db.failures.clear()
        self.assertEqual(self.client.delete(f"/api/resumes/{rid}", headers=self.headers).status_code, 200)

    def test_silent_storage_noop_does_not_delete_record(self):
        rid = self.upload().json()["data"]["resume"]["id"]
        self.db.storage.noop_remove = True
        self.assertEqual(self.client.delete(f"/api/resumes/{rid}", headers=self.headers).status_code, 502)
        self.assertTrue(self.db.rows["resumes"])
        self.assertTrue(self.db.storage.files)

    def test_linked_application_prevents_file_deletion(self):
        rid = self.upload().json()["data"]["resume"]["id"]
        self.db.rows["applications"].append({"id": str(uuid4()), "user_id": USER, "resume_id": rid})
        self.assertEqual(self.client.delete(f"/api/resumes/{rid}", headers=self.headers).status_code, 409)
        self.assertTrue(self.db.storage.files)

    def test_missing_or_foreign_resume_returns_404(self):
        rid = self.upload().json()["data"]["resume"]["id"]
        self.db.auth.get_user.return_value.user.id = OTHER
        for method, suffix in [("GET", ""), ("GET", "/download"), ("DELETE", "")]:
            self.assertEqual(self.client.request(method, f"/api/resumes/{rid}{suffix}", headers=self.headers).status_code, 404)
        self.assertTrue(self.db.storage.files)

    def test_null_lists_and_missing_relation_are_normalized(self):
        rid = self.upload().json()["data"]["resume"]["id"]
        result = self.client.put(f"/api/resumes/{rid}", headers=self.headers, json={"skills": None})
        self.assertEqual(result.json()["data"]["skills"], [])
        self.db.rows["resume_content"].clear()
        self.db.object_relation = True
        self.assertEqual(self.client.get("/api/resumes/", headers=self.headers).json()[0]["resume_content"], [])

    def test_legacy_storage_url_can_be_downloaded_and_deleted(self):
        rid = self.upload().json()["data"]["resume"]["id"]
        row = self.db.rows["resumes"][0]
        row["file_url"] = row["file_url"].replace("storage://resumes/", "https://example.supabase.co/storage/v1/object/public/resumes/")
        self.assertEqual(self.client.get(f"/api/resumes/{rid}/download", headers=self.headers).status_code, 200)
        self.assertEqual(self.client.delete(f"/api/resumes/{rid}", headers=self.headers).status_code, 200)


class ProviderTests(unittest.TestCase):
    def test_provider_receives_path_and_resources_are_cleaned(self):
        provider = MagicMock()
        provider.files.create.return_value = SimpleNamespace(id="file-id")
        provider.extract.create.return_value = SimpleNamespace(id="job-id", status="COMPLETED", extract_result={"skills": None})
        with patch("core.resume_mgmt.LlamaCloud", return_value=provider), patch.dict(os.environ, {"LLAMA_CLOUD_API_KEY": "test"}):
            result = extract_resume_details("resume.pdf")
        self.assertIsInstance(provider.files.create.call_args.kwargs["file"], Path)
        self.assertEqual(result["skills"], [])
        provider.extract.delete.assert_called_once_with("job-id")
        provider.files.delete.assert_called_once_with("file-id")
        provider.close.assert_called_once()
