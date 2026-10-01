# Tessera

Tessera is a client- and project-aware service desk for consulting teams. A single request is a **Tessera**; completed requests are **Redeemed**, and priority levels are presented as **Marks**.

## Current interface

The first working surface includes separate consultant and customer experiences:

- personal, unassigned, due-today, and all-Tesserae queues
- search across requests, clients, and projects
- a two-pane queue and activity view
- client, project, assignee, due-date, status, and Mark context
- a responsive mobile layout
- an accessible flow for opening a new Tessera
- a customer portal restricted to that customer's Tesserae
- consultant-only assignment controls and internal notes
- a role preview switch while authentication is still being connected
- consultant overview, client/project, account management, and settings workspaces
- queue filtering, sorting, pagination states, and mobile ticket details

Records currently live in in-memory sample data and reset when the page reloads.

## Intended production architecture

- **Application:** Next.js/TypeScript hosted on Netlify
- **Structured data:** Netlify Database (PostgreSQL)
- **Schema and migrations:** Drizzle ORM
- **Attachments:** Netlify Blobs
- **Server operations:** Netlify Functions
- **Authentication:** Netlify Identity or Microsoft Entra ID

The database schema already models organizations, projects, users, memberships, Tesserae, messages, attachments, and event history. SLA clocks and time entries are later-phase additions.

## Development

Requires Node.js 22.13 or newer.

```sh
npm ci
npm run dev
npm test
```

The main interface is implemented in `app/page.tsx`; shared styling is in `app/globals.css`.

## Netlify setup

This is a standard Next.js application. Push the repository to a Git provider, then choose **Add new project → Import an existing project** in Netlify. Netlify should detect:

- build command: `npm run build`
- publish directory: `.next`
- Node.js: version 22

These values are also recorded in `netlify.toml`. After the first successful deploy, enable Netlify Database for the project. Its `NETLIFY_DB_URL` environment value is already expected by the Drizzle configuration.

Do not commit a database URL, token, or Identity secret. Netlify-provided runtime values belong in the project environment.

## Status

The interface, PostgreSQL schema, invitation records, repository and identity-provider contracts, role authorization rules, attachment safeguards, automated tests, and Netlify project configuration are present. Live database persistence, Netlify Identity calls, Blob uploads, email ingestion, and deployment require the Netlify project connection.
