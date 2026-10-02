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
- authenticated consultant/customer routing through Netlify Identity
- consultant overview, client/project, account management, and settings workspaces
- queue filtering, sorting, pagination states, and mobile ticket details

Requests and conversations load from the authorized database APIs. Creation, replies, and internal notes persist through those APIs; project choices come from the authenticated catalog. Status, assignment, and due-date updates and account/settings administration are still pending.

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

These values are also recorded in `netlify.toml`. The project includes Netlify's native database package. Once Database is enabled, Netlify configures the connection automatically and applies migrations from `netlify/database/migrations` immediately before publishing each production deploy or deploy preview.

Do not commit a database URL, token, or Identity secret. Netlify-provided runtime values belong in the project environment.

## Status

The interface is connected to the deployed database and Identity APIs in the local source. Run through Netlify's development environment for database-backed local testing. Blob uploads, invitation administration, notifications, and record-update endpoints remain pending. See `HANDOFF.md` for local validation and deployment status.
