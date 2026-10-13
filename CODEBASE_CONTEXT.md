# Applyr codebase context

Reviewed: 2026-10-09. This document records repository observations, not a production readiness certification. Recheck the source as implementation changes.

## Implementation update — 2026-10-09

The initial observations below are retained as a baseline. Authentication and related high-priority gaps have since been addressed; see AUTH_SETUP.md for the current behavior and remaining deployment requirements. Clients are request-scoped with per-user JWTs, extraction is authenticated, the extension has session-based login, web requests refresh/retry tokens, signup supports email confirmation, and dashboard routes have an auth gate. API error handling and TypeScript checks were repaired; the template is excluded from compilation and build errors are no longer ignored. Resume edits and application resume ownership are validated; blocking handlers use workers and extraction polling is bounded. Live RLS and storage privacy remain unverified.

## Resume update — 2026-10-13

See RESUMES_SETUP.md for the current resume integration. Original filenames, a consistent 10 MB limit, list/delete feedback, normalized response contracts, compensating cleanup, and signed downloads are implemented. Live test-account login and SDK table checks succeeded, but storage reported the resumes bucket was not found. The owner-policy/private-bucket migration is prepared under backend/migrations and was left unapplied at the user's request. The initial resume observations below are superseded by these changes.

## Product and implementation scope

Applyr targets early-career job seekers with a web portal and Chrome extension. README.md describes resume-based form autofill, AI answers, user review, and application tracking. The current implementation primarily provides authentication, profile editing, resume extraction/editing, job extraction into draft applications, and tracking/analytics. No integrated form autofill or resume-grounded answer-generation flow was found in the active application code.

## Repository map

| Location | Responsibility |
| --- | --- |
| frontend/app | Active Next.js App Router pages: landing, login, registration, dashboard, applications, resumes, profile, analytics |
| frontend/lib | Fetch client, React auth context, typed API wrappers, auth form schemas |
| frontend/components | Dashboard/auth layouts, landing visuals, Radix/shadcn-style UI components |
| frontend/v0_template | Separate starter/reference source; not the active app route tree, but included by the current TypeScript glob |
| backend/main.py | FastAPI app, CORS, router registration, health routes |
| backend/routes | Auth, users, resumes, applications, analytics HTTP handlers |
| backend/core | Bearer validation, resume processing, Groq job extraction |
| backend/db/database.py | Shared Supabase client; no SQLAlchemy Base |
| backend/schemas | Pydantic user and application API contracts |
| backend/models | SQLAlchemy model remnants; import a nonexistent Base and are not used by active routes |
| chrome_extension | Manifest V3 extension, content extraction, popup API call |
| sample form | Standalone HTML/CSS/JS job-site fixtures |

## Stack and boundaries

- Frontend manifest: Next.js 16.1.6, React 19.2.4, TypeScript 5.7.3, Tailwind CSS 4, Radix UI, React Hook Form, Zod. Root layout forces dark theme and wraps pages in AuthProvider.
- Backend: FastAPI, Pydantic, Supabase Python SDK. Active persistence uses Supabase table/storage APIs directly, not the SQLAlchemy models.
- Job AI: LangChain prompt -> Groq llama-3.3-70b-versatile (temperature 0) -> PydanticOutputParser.
- Resume AI: LlamaCloud schema-driven extraction, agentic tier, with synchronous polling.
- No vector database, embeddings, retrieval pipeline, or agent orchestration was found in the active flows.

## Main flows

### Authentication and profile

The browser calls /api/auth/signup or /signin. Signup creates a Supabase Auth user and inserts a users profile. Signin upserts the profile and returns access/refresh tokens. AuthProvider stores these in localStorage, loads /api/auth/me, and exposes user state. The refresh token is stored but no refresh flow is implemented. Backend core/security.py validates bearer tokens with Supabase Auth and returns a UUID. core/auth.py is a separate unused variant returning a user object.

Profile GET/PUT use /api/users/me. Editable fields include names, phone, location, headline, bio, and skills. The frontend auth User type expects name, while the backend returns first_name and last_name.

### Resume ingestion

Browser multipart upload -> POST /api/resumes/ -> temporary file -> Supabase resumes bucket -> LlamaCloud file upload/extraction -> normalization -> resumes record -> resume_content record. The temporary local file is cleaned up in finally. Structured content includes summary, skills, experience, education, projects, certifications, achievements, and languages. Extracted contact fields are not written into resume_content by this pipeline.

The UI lists, opens, edits, uploads, and deletes resumes. Backend supports list/detail/update/delete, checking resume ownership before content edits. It constructs public storage URLs; actual bucket visibility/policies were not inspected. The stored filename comes from the temporary file rather than the original upload name.

### Job extraction and tracking

The content script reads an h1, a heuristic company element, a deadline match, and up to 5,000 characters of paragraph text. Popup combines these with the source URL and calls POST /api/applications/extract. Groq extracts role, full description, company, company description, and deadline. The backend inserts a draft with no resume. The URL is included in model input but has no dedicated persisted field in the current application contract.

The extension currently sends a hardcoded user UUID and no bearer token. The extraction route accepts this UUID without authentication. The active applications page lists records and opens a detail modal; search/filter controls are not wired up. Backend CRUD supports more operations than this UI exposes.

### Analytics

GET /api/analytics/me aggregates applications into total count, interviewing/offer success rate, status counts, monthly counts, top companies, and average applied_at-to-updated_at time. Month grouping discards the year and does not explicitly sort chronologically. Update time is a proxy, not an actual employer response event. Dashboard overview has a real application count but several hardcoded metrics.

## API and data map

| Prefix | Operations |
| --- | --- |
| /api/auth | POST signup, signin, logout; GET me |
| /api/users | GET/PUT me |
| /api/resumes | POST/GET /; GET/PUT/DELETE /{resume_id} |
| /api/applications | POST /, POST /extract, GET /user/{user_id}, GET/PUT/DELETE /{application_id} |
| /api/analytics | GET /me |

Tables referenced by code: users, resumes, resume_content, applications. Relationships expected by code: user owns resumes/applications; resume_content references resume; application optionally references resume. Database migrations, deployed constraints, triggers, RLS, and bucket policies were not available in the inspected repository, so model declarations are not proof of deployed behavior.

## Configuration and local execution

- Frontend reads NEXT_PUBLIC_API_URL, defaulting to http://127.0.0.1:8000. Scripts: npm run dev/build/start/lint from frontend.
- Backend expects SUPABASE_URL, SUPABASE_ANON_KEY, GROQ_API_KEY, LLAMA_CLOUD_API_KEY. Secret values were not read or copied.
- Expected backend launch from backend: python -m uvicorn main:app --reload. The direct main.py runner currently targets app.main:app, which does not match the checked-in layout.
- AI clients initialize during import; service startup depends on configuration even before an AI endpoint is used.
- requirements.txt is largely unpinned. Job extraction uses legacy langchain import paths; dependency compatibility needs an import/startup check before relying on a fresh install.
- Both npm and pnpm lockfiles are present; agree on a package manager before dependency changes.

## Highest-priority engineering gaps

1. Authenticate extraction and derive ownership from the bearer token; connect extension login/session handling instead of the hardcoded UUID.
2. Review shared mutable Supabase auth state. Signin/logout operate on a process-wide client, and per-request bearer validation does not explicitly propagate that token to database/storage clients. Verify RLS behavior with the real deployment. Logout itself is unauthenticated.
3. Fix ApiClient error handling: it throws a plain ApiError object, then tests instanceof Error, replacing HTTP errors with status 0 and a generic message. Fix its HeadersInit mutation as well.
4. Add a token refresh path and consistent dashboard authentication/loading behavior. The shared dashboard layout does not redirect unauthenticated visitors.
5. Bound resume extraction time and move blocking upload/polling/database work out of async request handlers. Current time.sleep polling has no overall deadline. Partial failures have no compensating cleanup for remote files/records.
6. Validate resume update bodies with an explicit schema; current dict payload is forwarded to resume_content.update. Add upload size/content checks and review private resume storage requirements.
7. Align contracts: missing extracted required strings conflict with the prompt's null rule; application updates serialize UUID values without mode="json"; status is an unconstrained string. Verify submitted/applied resume requirements against the real DB.
8. Restore meaningful build checks, isolate the starter template, and establish automated tests. CORS currently permits every origin with credentials. Signup accepts a caller-supplied role; its authorization significance needs review.

## Verification and working-tree baseline

- Ran frontend tsc --noEmit --incremental false --pretty false: failed with four diagnostics. Active lib/api-client.ts and its template copy fail on HeadersInit.Authorization; template Tailwind config has two darkMode type diagnostics. next.config.mjs currently ignores build type errors.
- Parsed 20 backend application Python modules with ast.parse: passed. This validates syntax only, not imports or service behavior.
- Did not start services, call paid AI APIs, change cloud data, or validate live Supabase policies. No automated test suite was found; backend/test.py is an extraction experiment rather than an assertion-based suite.
- Existing changes before this review: modified backend/models/applications.py; deleted root requirements.txt; untracked backend/requirements.txt, backend/test.py, three version-named files, and a sample resume PDF. Preserve these user changes.
- This review adds only CODEBASE_CONTEXT.md; no implementation fixes were made.
