"""Offline regressions; no real Supabase or AI calls."""
import os
import unittest
import httpx
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import UUID

os.environ.update(SUPABASE_URL="https://example.supabase.co", SUPABASE_ANON_KEY="test-key")

from fastapi.testclient import TestClient
from fastapi.security import HTTPAuthorizationCredentials
from supabase_auth.errors import AuthApiError
from db.database import get_supabase
from main import app
from schemas.applications import ApplicationExtract

USER = "11111111-1111-4111-8111-111111111111"
OTHER = "22222222-2222-4222-8222-222222222222"


class AuthTests(unittest.TestCase):
    def setUp(self):
        self.db = MagicMock()
        self.user = SimpleNamespace(id=USER, email="user@example.com", user_metadata={"first_name": "Ada"})
        self.db.auth.get_user.return_value = SimpleNamespace(user=self.user)
        self.session = SimpleNamespace(access_token="new-access", refresh_token="new-refresh",
                                       expires_at=2000000000, user=self.user)
        app.dependency_overrides[get_supabase] = lambda: self.db
        self.client = TestClient(app)
        self.headers = {"Authorization": "Bearer user-token"}

    def tearDown(self):
        self.client.close()
        app.dependency_overrides.clear()

    def test_protected_endpoints_require_bearer(self):
        for method, path, body in [
            ("POST", "/api/applications/extract", {"text": "job"}),
            ("POST", "/api/auth/logout", {}),
            ("GET", "/api/auth/me", None),
            ("GET", "/api/users/me", None),
            ("GET", "/api/resumes/", None),
            ("GET", "/api/analytics/me", None),
        ]:
            with self.subTest(path=path):
                self.assertEqual(self.client.request(method, path, json=body).status_code, 401)
        self.db.table.assert_not_called()

    def test_invalid_token_rejected_before_extraction(self):
        self.db.auth.get_user.side_effect = AuthApiError("expired", 401, "bad_jwt")
        with patch("routes.applications.extract_application_fields", new_callable=AsyncMock) as extract:
            response = self.client.post("/api/applications/extract", headers=self.headers, json={"text": "job"})
        self.assertEqual(response.status_code, 401)
        extract.assert_not_called()

    def test_extraction_ignores_spoofed_owner(self):
        extracted = ApplicationExtract(job_role="Engineer", job_description="Build", company_name="Example")
        record = dict(id=OTHER, user_id=USER, job_role="Engineer", job_description="Build",
                      company_name="Example", status="draft")
        with patch("routes.applications.extract_application_fields", new_callable=AsyncMock, return_value=extracted), \
             patch("routes.applications.core_create_application", return_value=record) as create:
            response = self.client.post("/api/applications/extract", headers=self.headers,
                                        json={"text": "job", "user_id": OTHER})
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(create.call_args.kwargs["user_id"], UUID(USER))
        self.assertIs(create.call_args.kwargs["supabase"], self.db)

    def test_cross_user_application_list_forbidden(self):
        response = self.client.get(f"/api/applications/user/{OTHER}", headers=self.headers)
        self.assertEqual(response.status_code, 403)
        self.db.table.assert_not_called()

    def test_cannot_attach_another_users_resume(self):
        self.db.table.return_value.select.return_value.eq.return_value.eq.return_value.limit.return_value.execute.return_value = SimpleNamespace(data=[])
        response = self.client.post("/api/applications/", headers=self.headers, json={
            "resume_id": OTHER, "job_role": "Engineer", "job_description": "Build", "company_name": "Example",
        })
        self.assertEqual(response.status_code, 404)
        self.db.table.return_value.insert.assert_not_called()

    def test_resume_content_cannot_reassign_ownership(self):
        response = self.client.put(f"/api/resumes/{OTHER}", headers=self.headers, json={"resume_id": USER})
        self.assertEqual(response.status_code, 422)
        self.db.table.assert_not_called()

    def test_confirmation_signup_does_not_insert_anonymous_profile(self):
        self.db.auth.sign_up.return_value = SimpleNamespace(user=self.user, session=None)
        response = self.client.post("/api/auth/signup", json={
            "email": "user@example.com", "password": "long-password", "first_name": "Ada", "role": "admin",
        })
        self.assertEqual(response.status_code, 200, response.text)
        self.assertTrue(response.json()["requires_email_confirmation"])
        self.db.table.assert_not_called()
        self.assertNotIn("role", self.db.auth.sign_up.call_args.args[0]["options"]["data"])

    def test_signin_preserves_existing_profile(self):
        self.db.auth.sign_in_with_password.return_value = SimpleNamespace(user=self.user, session=self.session)
        response = self.client.post("/api/auth/signin", json={"email": "user@example.com", "password": "secret"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["cache-control"], "no-store")
        call = self.db.table.return_value.upsert.call_args
        self.assertTrue(call.kwargs["ignore_duplicates"])
        self.assertEqual(call.args[0]["role"], "user")

    def test_refresh_returns_rotated_tokens(self):
        self.db.auth.refresh_session.return_value = SimpleNamespace(session=self.session)
        response = self.client.post("/api/auth/refresh", json={"refresh_token": "old-refresh"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["refresh_token"], "new-refresh")
        self.db.auth.refresh_session.assert_called_once_with("old-refresh")

    def test_invalid_refresh_returns_401(self):
        self.db.auth.refresh_session.side_effect = AuthApiError("expired", 400, "refresh_token_not_found")
        self.assertEqual(self.client.post("/api/auth/refresh", json={"refresh_token": "invalid"}).status_code, 401)

    def test_logout_revokes_only_callers_session(self):
        response = self.client.post("/api/auth/logout", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.db.auth.admin.sign_out.assert_called_once_with("user-token", scope="local")

    def test_database_clients_are_isolated_and_forward_jwt(self):
        observed = []
        def handle(request):
            observed.append((request.url.path, request.headers.get("Authorization")))
            return httpx.Response(200, json=[])
        real_client = httpx.Client
        transport_patch = patch("db.database.httpx.Client", side_effect=lambda **kw: real_client(
            transport=httpx.MockTransport(handle), **kw))
        transport_patch.start()
        a = get_supabase(HTTPAuthorizationCredentials(scheme="Bearer", credentials="token-a"))
        b = get_supabase(HTTPAuthorizationCredentials(scheme="Bearer", credentials="token-b"))
        try:
            client_a, client_b = next(a), next(b)
            self.assertIsNot(client_a, client_b)
            self.assertEqual(client_a.options.headers["Authorization"], "Bearer token-a")
            self.assertEqual(client_b.options.headers["Authorization"], "Bearer token-b")
            client_a.table("users").select("id").execute()
            client_b.table("users").select("id").execute()
            client_a.storage.from_("resumes").list()
            self.assertEqual([token for _, token in observed], ["Bearer token-a", "Bearer token-b", "Bearer token-a"])
            self.assertFalse(client_a.options.persist_session)
            self.assertFalse(client_a.options.auto_refresh_token)
        finally:
            a.close()
            b.close()
            transport_patch.stop()


if __name__ == "__main__":
    unittest.main()
