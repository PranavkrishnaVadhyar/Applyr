# Resume module integration

Updated 2026-10-13.

## Implemented

- Frontend and backend allow PDF, DOC, and DOCX up to **10 MB**, rejecting empty files. The UI prevents overlapping uploads and shows list/delete failures with retry guidance.
- Multipart uploads preserve the original display filename, while storage paths use an owned UUID. The LlamaCloud SDK receives a Path rather than a string filename.
- List/detail/upload responses consistently return resume_content as an array, regardless of whether Supabase embeds a one-to-one object or a list. Nullable content collections normalize to empty arrays. Response schemas validate the contract.
- Edits use an allowlisted request model and the UI adopts the saved server response.
- Extraction happens before Supabase upload. Provider files/jobs are cleaned up afterward. Supabase failures trigger compensating deletion of the generated object and rows, including writes whose response was lost. Cleanup failures are reported and logged with a resource identifier.
- Delete checks application references before removing files. Storage failures keep the resume record for retry; database failures after storage deletion also report a retryable partial failure. An empty storage-delete result is checked rather than silently treated as success.
- New rows store an internal storage:// locator in the existing file_url column. Legacy public URL locators remain supported. API responses hide the locator; GET /api/resumes/{id}/download verifies ownership and returns a 60-second signed attachment URL with Cache-Control: no-store.

These are compensating operations across multiple services, not a distributed transaction. A process crash or a remote outage during cleanup can still require administrator reconciliation; logged generated IDs identify affected resources.

## Live environment findings

Using the dedicated account configured in backend/.env:

- Authentication succeeded.
- The Supabase SDK could access both resumes and resume_content tables.
- A real synthetic-PDF upload was attempted. It failed before persistence completed.
- A second run with AI mocked isolated the failure to storage upload: **Bucket not found** for resumes. The SDK bucket lookup also returned Bucket not found. No Supabase resume was successfully created by these smoke runs.
- Direct REST OpenAPI metadata inspection returned 401 Invalid API key, while the app's authenticated SDK table checks succeeded. The deployed schema/policies therefore remain unverified; no production-readiness claim is made.

The user chose to apply the cloud migration later. It has **not** been executed.

## Required deployment step

Run backend/migrations/20261013_resume_storage.sql in the Supabase SQL editor as the project owner. The transaction creates or privatizes the resumes bucket, configures its size/MIME limits, and adds owner-scoped table and object policies. Restrictive policies cap older broad permissive policies. It also checks that resume_content.resume_id has an ON DELETE CASCADE foreign key; if not, the transaction rolls back with an actionable error.

The existing file_url column must accept text locators. No column is added. Existing public links stop working once the bucket is private; use the authenticated download endpoint. The migration does not repair legacy temporary display filenames because the original filenames were never persisted.

After applying the migration, run from backend:

```powershell
env/Scripts/python.exe tests/live_resume_smoke.py
```

It reads RESUME_TEST_EMAIL and RESUME_TEST_PASSWORD from backend/.env, uploads a synthetic PDF, uses real extraction, verifies listing/editing/download and anonymous access, then deletes only its test fixture and logs out. Never put these credentials in source control. Use --skip-ai only for storage/database diagnostics; this does not validate extraction. A second dedicated account is still needed to exercise deployed cross-user RLS policies, beyond the offline authorization tests.

## Local checks

```powershell
# backend
env/Scripts/python.exe -m unittest discover -s tests -v

# frontend
node --test tests/api-client.test.cjs tests/resumes-api.test.cjs
node node_modules/next/dist/bin/next typegen
node node_modules/typescript/bin/tsc --noEmit --incremental false
```

Verification on 2026-10-13: **27 backend tests and 12 frontend tests passed**. TypeScript checks passed after regenerating stale Next route types. **npm run build -- --webpack completed successfully**, including type checking and all static pages.

The default Turbopack production build currently fails in the existing next/font Google Fonts integration. The supported webpack build above provides a working production build without changing fonts or disabling type checking.
