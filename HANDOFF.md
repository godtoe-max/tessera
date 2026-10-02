# Tessera project handoff

Last updated: October 1, 2026

## Where the project lives

- GitHub: <https://github.com/godtoe-max/tessera>
- Production: <https://kaleidoscopic-klepon-ec3166.netlify.app>
- Sign-in: <https://kaleidoscopic-klepon-ec3166.netlify.app/login>
- Netlify project: `kaleidoscopic-klepon-ec3166`
- Production branch: `main`

On the new computer, clone the GitHub repository instead of copying `node_modules`, `.next`, `.tools`, or other generated folders.

## What is complete

### Interface

- Next.js and TypeScript application with responsive desktop and mobile layouts.
- Separate consultant workspace and customer portal designs.
- Consultant queues, filters, sorting, details, activity, internal notes, overview, clients, team, and settings surfaces.
- Customer request list, request details, conversation, and new-Tessera flow.
- Branded Tessera sign-in page.
- Loading, error, empty, and not-found states.

### Database

- Netlify Database is provisioned and its production branch is active.
- Drizzle uses Netlify's native database adapter.
- The production migration has been applied successfully.
- The schema includes users, organizations, organization memberships, projects, project memberships, invitations, Tesserae, messages, attachments, and audit events.
- Database-backed server endpoints now exist for listing, reading, and creating Tesserae and adding messages.
- Customer queries are scoped to authorized organizations/projects before records leave PostgreSQL.
- Internal messages are filtered out for customer accounts.
- Creating Tesserae and messages writes audit events.

### Authentication and access

- Netlify Identity is enabled.
- Registration is **Invite only**.
- The first administrator account has been invited, accepted, and assigned the `administrator` role.
- A Netlify Identity event function provisions recognized consultant roles into the Tessera database on signup or login.
- The initial consulting organization is created automatically during administrator provisioning.
- State-changing endpoints include origin checks for CSRF protection.

### Deployment and verification

- GitHub `main` deploys automatically to Netlify.
- Latest verified production deployment: `f2c731d` — **Provision Identity users into Tessera**.
- Netlify reported the deployment as Published.
- TypeScript checking passed.
- Lint passed.
- All 18 authorization, validation, customer-projection, invitation, service, and attachment-policy tests passed.

## Current local progress on the new computer

The interface in `app/page.tsx` now fetches `/api/session`, chooses the consultant or customer workspace from the authenticated account, and redirects 401 responses to `/login`. Sample request state and the role-preview switch have been removed. Requests, details, conversations, creation, replies, and internal notes use the database APIs. Creation uses UUIDs from the new authorized `/api/catalog` endpoint. Replies show a pending message and roll back on failure while preserving the draft. Loading, retry, empty, and disabled-submit states are present.

Overview and Clients now derive their data from the request list and authorized catalog. Status, assignment, and due dates are read-only until update endpoints are implemented. Team and Settings show unfinished-feature notices instead of simulated successful saves.

Database queries now constrain project-only memberships by both organization and project. Creation checks that the project belongs to the chosen active organization. Database initialization happens on first use, so a production build no longer requires a runtime database secret.

Local verification: 22 tests pass, TypeScript passes as part of `next build`, and the production build succeeds. ESLint has no errors and one existing anonymous-default-export warning in the Identity function. This computer has Node 24.19 available but no `npm` command on PATH; checks were run directly with Node against the existing dependencies. The copied dependencies were sufficient for those checks; a fresh `npm ci` is still recommended once npm is available.

These edits are local and have not been committed, pushed, or deployed. Authenticated browser acceptance and actual database persistence have not been verified on this computer. Next: exercise administrator and customer sessions through Netlify development mode or a deploy preview, check create/reply persistence after reload, failed submission draft preservation, empty queues, and project isolation. Then proceed to account administration below. The initial administrator organization may have no projects; organization/project administration is still pending.

## What to do first on the new computer

### 6 PM MST review, October 1

The source files in Ticketing System and the Netlify reference folders are readable. The local edits above remain intact. All 22 tests and the production build passed again at the scheduled review; `git diff --check` is clean. No applicable AGENTS.md was found in Ticketing System or its Documents parent. These checks establish that the files needed for compilation are available, but do not confirm that OneDrive has finished transferring every generated folder.

A working npm 11.6.2 is available at `.tools/package/bin/npm-cli.js`; use `node .tools/package/bin/npm-cli.js` in place of `npm` on this computer until PATH is configured. A Netlify CLI executable, Netlify connector, and runtime database environment variables are not available in this session. Authenticated acceptance testing therefore remains the next prerequisite; no production deployment was performed during this review. See the acceptance checklist in `docs/netlify-launch-checklist.md`.

1. Install Node.js 22.13 or newer and Git.
2. Clone <https://github.com/godtoe-max/tessera>.
3. Run `npm ci` from the repository root.
4. Run `npm test`, `npm run lint`, and `npm run build`.
5. Use Netlify CLI development mode when exercising the database locally so the Netlify Database emulator and migrations are available.
6. Sign in once through the production Tessera login with the administrator account. Because its role was assigned after invitation acceptance, this fresh login is what triggers database provisioning.

Do not copy or commit API tokens, database connection strings, Identity cookies, or Netlify secrets. A GitHub personal access token was exposed earlier during setup and should be revoked if that has not already been done.

## Recommended next implementation sequence

### 1. Connect the interface to live data

- Fetch `/api/session` at application startup.
- Redirect unauthenticated production visitors to `/login`.
- Select the consultant or customer experience from the authenticated user's `accountType`, not a preview toggle.
- Fetch `/api/tesserae` and replace the `seed` array in `app/page.tsx`.
- Add a catalog endpoint for the organizations and projects available to the current viewer.
- Send new-Tessera forms to `POST /api/tesserae` using database UUIDs.
- Load a selected record and its conversation from `GET /api/tesserae/:id`.
- Send replies and internal notes to `POST /api/tesserae/:id/messages`.
- Add proper loading, error, empty, and optimistic-update behavior.

### 2. Complete account administration

- Build application-level invitation endpoints around the existing `invitations` table.
- Connect the Team screen to Netlify Identity's server-side admin invitation API.
- Store the requested organization, project, account type, and role before sending an invitation.
- Extend the Identity provisioning function to consume customer invitations and create their scoped memberships.
- Add account disabling, invitation revocation, and role-change audit events.
- Remove the consultant/customer preview switch when real session routing is ready.

### 3. Complete Tessera operations

- Add secure status, Mark, assignee, and due-date update endpoints.
- Record every change in `tessera_events`.
- Add server-side queue filtering, searching, sorting, and pagination.
- Generate human-friendly sequential Tessera numbers rather than random suffixes.
- Add organization/project management for administrators.

### 4. Attachments and notifications

- Store uploaded files in Netlify Blobs and metadata in the existing `attachments` table.
- Enforce the existing type, size, tenant, and parent-Tessera authorization policy on upload and download.
- Add email notifications for invitations, replies, assignments, and status changes.
- Later, evaluate inbound email-to-Tessera creation and reply handling.

### 5. Production hardening

- Add database-backed integration tests using the Netlify local database emulator.
- Add API rate limiting and structured server logging.
- Add a security review for session handling, authorization, file downloads, and invitation flows.
- Add backups/retention review, monitoring, accessibility QA, and browser-level end-to-end tests.
- Replace the temporary Netlify project name with the final Tessera name and connect the final domain when ready.

## Useful project locations

- `app/page.tsx` — authenticated client interface and API-backed state
- `app/login/page.tsx` — Netlify Identity login and callback handling
- `app/api/tesserae/` — secured Tessera and message endpoints
- `lib/auth/current-viewer.ts` — Identity user to application viewer lookup
- `lib/auth/authorization.ts` — tenant and role authorization rules
- `lib/data/netlify-tessera-repository.ts` — production PostgreSQL repository
- `db/schema.ts` — Drizzle schema
- `netlify/database/migrations/` — production database migrations
- `netlify/functions/identity.mts` — signup/login provisioning
- `tests/` — authorization and validation test suite

## Git note

The final two production commits were transferred with the GitHub integration because the temporary local Git runtime lost its HTTPS helper. A fresh clone on the new computer will have the authoritative remote history and avoids carrying that local-runtime problem forward.

## Production push after user approval

The user authorized direct production iteration on October 1. The 13 changed files were published to GitHub main through the GitHub connector as commit f92bd87e132ca4f022e3fe0c1e290314fa39c992 (Connect Tessera workspace to authenticated database APIs). The local Git HTTPS helper remains unavailable, so the local HEAD has not been synchronized with that remote commit. Do not push the old local history over remote main. The live production root was verified to show the new loading state and redirect an unauthenticated browser to /login. Authenticated create/reply persistence remains to be exercised with the administrator account. This completion note is local only.

## Clients, Team, and Settings production delivery — October 1, 2026

User authorizes continued implementation, tests, and direct GitHub main/production deployment with minimal oversight. Request notification emails remain explicitly paused. Do not pursue Resend or DNS configuration now.

Completed and deployed:
- /clients: client and project creation, rename, archive/restore, search, archived-client filter.
- /team: consultant/customer invitations with scoped roles, Administrator option, existing account membership management, disable/enable, pending invitation revocation.
- /settings: workspace name, default Mark, administration audit history.
- Another consultant can be invited or promoted to Administrator. Only Administrators can grant this role or change another Administrator. Own-account disable/access removal is prohibited; transactional locking prevents removal of the last active Administrator.
- Identity provisioning consumes valid invitations, preserves existing memberships and disabled-account state, and denies uninvited users.
- Production database migration for administration_events and workspace_settings applied successfully, verified by live administration history and settings saves.
- Netlify proxy origin mismatch found during live testing and corrected using trusted deployment URLs rather than request forwarding headers. Missing/forged Origin rejected. All four mutation route families use the corrected helper.

Remote history: bac29ef9d06a1f90854f2b98765bc7f83d37c726 adds pages. 31cb2a74b0269dc90e71b2df489df58226bc0f0c fixes deployment origin verification. A follow-up commit corrects the address bar after creating a request from an administration page. Get authoritative current main using GitHub connector; local Git HEAD is stale and its HTTPS helper remains broken. Never push old local history over main.

Validation: 29 unit tests pass, production build and changed-file ESLint pass. Signed-in production browser successfully created client Tessera Test Drive and project Test Drive Project; both survive reload. Saved default Mark High persisted and reached the new-request dialog; restored default to Normal afterward. Created test request TSR-2026-6F8FCB25 and a customer-visible test reply successfully. Audit history records the client, project, and settings changes. User account sgarone@etymonconsulting.com is an Administrator. Team page exposes Administrator invitation scope and own-account protection.

Live invitation delivery and actual promotion of another real user remain unexercised: no second intended recipient supplied, so do not invent an address or grant random access. Invitation/password mail is separate from paused request notifications. Test records are deliberately left visible for the user's test drive.

Useful code: components/tessera/workspace.tsx, components/tessera/administration-panel.tsx, app/api/admin/route.ts, app/api/invitations/route.ts, lib/auth/request-origin.ts. The local @netlify/blobs dependency from earlier exploration remains unpublished; attachments were outside this pages batch.

Enabled one-time continuation automations: continue-tessera-pages-tonight at October 1 11:15 PM MST and continue-tessera-pages-tomorrow-morning at October 2 4:30 AM MST. Both confirmed ACTIVE from their saved automation files. Resume only unfinished work and avoid duplicate edits. Further feature backlog above (request status/assignment/due-date edits, attachments, production hardening) remains future work; prioritize actual defects found in the new pages before expanding scope.

