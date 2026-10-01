# Tessera authorization model

Authentication identifies the user. Authorization is evaluated by Tessera on every server request from database memberships; browser-supplied roles and organization IDs are never trusted.

## Roles

| Role | Scope |
| --- | --- |
| Customer user | Customer-visible Tesserae in explicitly assigned projects |
| Customer manager | Customer-visible Tesserae across their organization |
| Consultant | Tesserae in assigned organizations/projects |
| Engagement lead | All Tesserae and assignment controls for managed engagements |
| Operations manager | Cross-client queues, reporting, SLA and assignment operations |
| Administrator | Accounts, memberships, configuration and all operational records |
| Auditor | Read-only access to explicitly authorized organizations/projects |

## Required checks

Every read or mutation must derive the user from a verified Netlify Identity session and then:

1. Load the local `users` record by immutable Identity ID.
2. Reject inactive or missing accounts.
3. Load organization and project memberships from the database.
4. Apply the narrowest permitted scope to the query itself.
5. Re-check mutation-specific permission before writing.
6. Record the operation in `tessera_events` where applicable.

Invitations use the same scope model. Administrators and operations managers may invite across clients; engagement leads may invite customer and consultant accounts only inside managed engagements; customer managers may invite customer users only inside their own organization. Invitations expire and are auditable.

Customer queries must always include an authorized `organization_id`; project-restricted customers must also match an authorized `project_id`. Internal messages are filtered at the database query layer, not hidden after they reach the browser.

## Security invariants

- A customer cannot enumerate or retrieve records from another organization.
- A customer never receives internal messages, consultant workload, Marks, assignment data or private events.
- Attachment keys include the organization and Tessera identifiers and are served only after authorization.
- Attachments are limited to approved document/image types and 20 MB; downloads repeat the parent Tessera authorization check.
- Role changes, membership changes and exports are audited.
- Account registration is invite-only.
- Consultant and administrator accounts require MFA before production use.
- Authorization failures return a generic not-found response when revealing record existence would leak information.

## Test matrix

Automated tests cover same-organization access, cross-organization denial, project-restricted denial, customer/internal message separation, consultant project scope, manager elevation, disabled accounts, forged identifiers, invitation boundaries, input validation and attachment access.
