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

- Verify a customer cannot fetch another organization's Tessera by changing an ID or URL.
- Verify project-restricted customers cannot fetch another project in their own organization.
- Verify internal notes are excluded from customer API responses, not merely hidden in the page.
- Verify disabled users lose access immediately.
- Verify attachment downloads require the same authorization as their Tessera.
- Confirm database backups and retention settings.
- Replace sample data and clearly label the initial organization, projects, and administrator.
