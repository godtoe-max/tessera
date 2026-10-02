# Netlify launch checklist

## First connection

1. In Netlify, select **Add new project → Import an existing project**.
2. Choose GitHub and select `godtoe-max/tessera`.
3. Confirm the production branch is `main`.
4. Netlify should detect `npm run build` and `.next` automatically from `netlify.toml`.
5. Run the first deploy before enabling add-on services.

## Database

1. Open the site's **Data & storage** area and enable Netlify Database.
2. Confirm the site detects the native `@netlify/database` package.
3. Keep generated SQL under `netlify/database/migrations`; Netlify applies it automatically immediately before publishing.
4. Validate schema changes in a deploy preview first so Netlify uses an isolated database branch.
5. Never paste database connection details into the repository.

## Identity

1. Enable Netlify Identity in invite-only mode.
2. Disable public registration.
3. Invite the first administrator account.
4. Require MFA for consultant and administrator accounts before production use.
5. Connect verified Identity IDs to the local `users.identity_id` field.
6. Keep organization and project memberships in Tessera's database; Identity roles alone are not granular enough.

## Before real customer data

### Acceptance checks for the local API-connected interface

Run these through a configured Netlify development environment or deploy preview before publishing the local changes. Use administrator and project-restricted customer test accounts and an active test project.

- Visit `/` without a session and confirm redirection to `/login`.
- Sign in as an administrator and confirm the consultant workspace and the actual account name appear.
- Open a new Tessera using a catalog project. Reload and confirm the request persists with the same number and UUID.
- Send a reply and an internal note. Reload and confirm both persist for the consultant.
- Sign in as a project-restricted customer. Confirm only authorized projects and requests are available and internal notes are absent from detail API responses.
- Request a different project's detail UUID directly and confirm a 404 response.
- Submit an organization UUID with a project UUID from another organization and confirm creation is rejected.
- Simulate a failed reply request in browser developer tools. Confirm the pending message disappears, the error appears, the draft remains, and retry saves only one message.
- Check an empty queue and a read-only auditor account. Confirm the interface remains usable and creation/reply controls respect permissions.
- Check the request list, detail view, and creation form at desktop and mobile widths.

### Remaining launch checks

- Verify a customer cannot fetch another organization's Tessera by changing an ID or URL.
- Verify project-restricted customers cannot fetch another project in their own organization.
- Verify internal notes are excluded from customer API responses, not merely hidden in the page.
- Verify disabled users lose access immediately.
- Verify attachment downloads require the same authorization as their Tessera.
- Confirm database backups and retention settings.
- Replace sample data and clearly label the initial organization, projects, and administrator.
