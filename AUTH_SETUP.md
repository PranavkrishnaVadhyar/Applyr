# Supabase authentication implementation

## What changed

Supabase remains the identity provider. FastAPI now creates one Supabase client per request, disables server-side session persistence/automatic refresh, and passes the caller's bearer token to database and storage requests. The HTTP transport is closed after the request. There is no service-role key in this design.

- Protected endpoints validate tokens with Supabase Auth. Job extraction derives the owner from that identity, never a submitted user ID.
- Signup stores first/last names in Auth metadata. With confirmation enabled, it returns a confirmation message without trying an anonymous profile insert. On first authenticated sign-in, the profile is inserted if absent; existing names, roles, and active flags are preserved.
- Signup cannot choose a privileged role through this API. This must also be enforced in database permissions because the Supabase public API is independently reachable.
- Refresh returns rotated access/refresh tokens. Browser requests refresh once after a 401 and retry; concurrent requests share a refresh, and Web Locks coordinate tabs where supported. Temporary refresh failures retain the local session.
- Logout validates the caller and revokes that session with local scope. Local tokens are cleared even if remote logout fails. Supabase access JWTs remain valid until expiry; logout revokes refresh capability, not an already issued JWT.
- The dashboard waits for auth initialization and redirects signed-out visitors. This UI gate complements server authorization; it is not a server-rendered auth boundary.
- The extension has its own sign-in, refresh, and sign-out flow. Tokens live in chrome.storage.session, which clears on browser restart and is not exposed to content scripts by default. Only popup-origin messages may invoke authenticated operations. It injects the extractor on demand using activeTab instead of installing a content script on every site.
- API errors preserve status/detail, including validation errors. Multipart resume uploads use the same refresh/retry path.
- Resume edits use an allowlisted schema, application resume references are checked for ownership, uploads are limited to 10 MB, synchronous backend work runs in FastAPI workers, and resume polling has a 120-second deadline between SDK calls (each SDK call also has a timeout).

## Required project configuration

Backend environment variables:

```dotenv
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-public-anon-or-publishable-key
GROQ_API_KEY=your-groq-key
LLAMA_CLOUD_API_KEY=your-llamacloud-key
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Use the real HTTPS portal origin for deployment. The browser uses NEXT_PUBLIC_API_URL. The extension API origin is configured in background.js and must also match host_permissions in manifest.json. Reload the unpacked extension after these changes. The extension now asks users to sign in separately from the web portal. Its privileged background fetch uses its host permission; the website CORS allowlist does not grant arbitrary sites access.

In Supabase Auth, configure the Site URL and confirmation redirect URLs. Confirmation links should land on a portal page from which the user can sign in. The registration UI explicitly tells users to confirm and then sign in; it does not implement an automatic callback/session exchange.

## Database and storage requirements — not verified or deployed

The repository does not contain the live schema or policies. Before deployment, inspect the existing policies and confirm the following using two separate test accounts and the anon key plus each user's JWT:

| Resource | Required authorization |
| --- | --- |
| users | SELECT/INSERT only the caller's id = auth.uid(); UPDATE only their own editable profile columns |
| users.role / users.active | Do not allow ordinary clients to assign privileged roles or change account-control fields; INSERT should require ordinary defaults |
| resumes | SELECT/INSERT/UPDATE/DELETE require user_id = auth.uid() |
| resume_content | Both USING and WITH CHECK resolve resume_id to a resume owned by auth.uid(); prevent ownership reassignment |
| applications | Both USING and WITH CHECK require user_id = auth.uid(); any resume_id must belong to the same user |
| storage.objects, resumes bucket | Upload/read/delete require the object path's first segment to equal auth.uid(); prefer a private bucket |

Enable RLS on all exposed tables. Review **all** existing policies: adding a narrow permissive policy does not undo another permissive policy that grants broad access. Review table/column grants as well as row policies. Do not bypass failing policies by switching the backend to a service-role key.

As of 2026-10-13, the resume API stores internal object locators and issues short-lived signed URLs through an authenticated download endpoint; legacy URL locators remain supported. The private-bucket/RLS migration is prepared but unapplied at the user's request. See RESUMES_SETUP.md for the live storage blocker and deployment steps.

The users.active column is preserved but is not an account suspension mechanism in this implementation. Use Supabase account controls for suspension or add an explicit application-level active check and policy before relying on that field.

## Local verification

From backend:

```powershell
env/Scripts/python.exe -m pip install -r requirements.txt
env/Scripts/python.exe -m unittest discover -s tests -v
env/Scripts/python.exe -m uvicorn main:app --reload
```

From frontend:

```powershell
node --test tests/api-client.test.cjs
node node_modules/typescript/bin/tsc --noEmit --incremental false
npm run build
```

From the repository root:

```powershell
node --test chrome_extension/background.test.cjs
```

Tests use mocked Supabase/AI responses and mocked HTTP transport. They cover bearer requirements, token rotation, logout scope, spoofed ownership, cross-user resume association, resume update field validation, outgoing SDK authorization headers, frontend concurrency/error behavior, and extension message restrictions. They do not certify the live Supabase deployment or real browser extension integration.

Remaining work includes applying and verifying live RLS/storage configuration, distributed rate limiting for auth/AI routes, durable resume-processing jobs and crash recovery, and end-to-end confirmation/login/expiry testing. Resume compensation and signed links are now implemented. Browser tokens remain in localStorage as in the existing SPA design; a server-session/HttpOnly-cookie approach would be a separate coordinated Next.js auth migration, with CSRF and extension behavior considered explicitly.

References: [Supabase refresh sessions](https://supabase.com/docs/reference/python/auth-refreshsession), [sign-out semantics](https://supabase.com/docs/reference/python/auth-signout).
