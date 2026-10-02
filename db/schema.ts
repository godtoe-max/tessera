import { boolean, index, integer, jsonb, pgEnum, pgSequence, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const accountType = pgEnum("account_type", ["consultant", "customer"]);
export const membershipRole = pgEnum("membership_role", ["customer_user", "customer_manager", "consultant", "engagement_lead", "operations_manager", "administrator", "auditor"]);
export const tesseraStatus = pgEnum("tessera_status", ["open", "in_progress", "waiting", "redeemed"]);
export const tesseraMark = pgEnum("tessera_mark", ["urgent", "high", "normal", "low"]);
export const messageVisibility = pgEnum("message_visibility", ["customer", "internal"]);
export const invitationStatus = pgEnum("invitation_status", ["pending", "accepted", "expired", "revoked"]);
export const tesseraNumberSequence = pgSequence("tessera_number_seq",{startWith:1000});
export const administrationEvents = pgTable("administration_events",{
  id:uuid("id").primaryKey().defaultRandom(),actorId:uuid("actor_id").references(()=>users.id),eventType:text("event_type").notNull(),data:jsonb("data").notNull().default({}),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
});
export const workspaceSettings = pgTable("workspace_settings",{
  id:text("id").primaryKey(),name:text("name").notNull().default("Tessera"),defaultMark:tesseraMark("default_mark").notNull().default("normal"),updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(), identityId: text("identity_id").notNull().unique(), email: text("email").notNull(), displayName: text("display_name").notNull(), accountType: accountType("account_type").notNull(), active: boolean("active").notNull().default(true), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [uniqueIndex("users_email_idx").on(t.email)]);

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(), name: text("name").notNull(), slug: text("slug").notNull().unique(), active: boolean("active").notNull().default(true), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const organizationMemberships = pgTable("organization_memberships", {
  id: uuid("id").primaryKey().defaultRandom(), userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }), role: membershipRole("role").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [uniqueIndex("org_membership_unique").on(t.userId, t.organizationId), index("org_membership_org_idx").on(t.organizationId)]);

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(), organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }), name: text("name").notNull(), slug: text("slug").notNull(), active: boolean("active").notNull().default(true), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [uniqueIndex("project_org_slug_unique").on(t.organizationId, t.slug), index("projects_org_idx").on(t.organizationId)]);

export const projectMemberships = pgTable("project_memberships", {
  id: uuid("id").primaryKey().defaultRandom(), projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }), userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), role: membershipRole("role").notNull(),
}, t => [uniqueIndex("project_membership_unique").on(t.projectId, t.userId), index("project_membership_user_idx").on(t.userId)]);

export const invitations = pgTable("invitations", {
  id: uuid("id").primaryKey().defaultRandom(), email: text("email").notNull(), accountType: accountType("account_type").notNull(), role: membershipRole("role").notNull(), organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }), projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }), invitedById: uuid("invited_by_id").notNull().references(() => users.id), identityInviteId: text("identity_invite_id"), status: invitationStatus("status").notNull().default("pending"), expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), acceptedAt: timestamp("accepted_at", { withTimezone: true }), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [index("invitations_email_idx").on(t.email), index("invitations_org_idx").on(t.organizationId), index("invitations_status_idx").on(t.status)]);

export const tesserae = pgTable("tesserae", {
  id: uuid("id").primaryKey().defaultRandom(), number: text("number").notNull().unique(), organizationId: uuid("organization_id").notNull().references(() => organizations.id), projectId: uuid("project_id").notNull().references(() => projects.id), requesterId: uuid("requester_id").notNull().references(() => users.id), assigneeId: uuid("assignee_id").references(() => users.id), title: text("title").notNull(), description: text("description").notNull(), status: tesseraStatus("status").notNull().default("open"), mark: tesseraMark("mark").notNull().default("normal"), dueAt: timestamp("due_at", { withTimezone: true }), redeemedAt: timestamp("redeemed_at", { withTimezone: true }), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [index("tesserae_org_idx").on(t.organizationId), index("tesserae_project_idx").on(t.projectId), index("tesserae_assignee_idx").on(t.assigneeId), index("tesserae_status_idx").on(t.status)]);

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(), tesseraId: uuid("tessera_id").notNull().references(() => tesserae.id, { onDelete: "cascade" }), authorId: uuid("author_id").notNull().references(() => users.id), visibility: messageVisibility("visibility").notNull().default("customer"), body: text("body").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [index("messages_tessera_idx").on(t.tesseraId, t.createdAt)]);

export const attachments = pgTable("attachments", {
  id: uuid("id").primaryKey().defaultRandom(), tesseraId: uuid("tessera_id").notNull().references(() => tesserae.id, { onDelete: "cascade" }), messageId: uuid("message_id").references(() => messages.id, { onDelete: "cascade" }), uploadedById: uuid("uploaded_by_id").notNull().references(() => users.id), storageKey: text("storage_key").notNull().unique(), filename: text("filename").notNull(), contentType: text("content_type").notNull(), sizeBytes: integer("size_bytes").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [index("attachments_tessera_idx").on(t.tesseraId)]);

export const tesseraEvents = pgTable("tessera_events", {
  id: uuid("id").primaryKey().defaultRandom(), tesseraId: uuid("tessera_id").notNull().references(() => tesserae.id, { onDelete: "cascade" }), actorId: uuid("actor_id").references(() => users.id), eventType: text("event_type").notNull(), eventData: jsonb("event_data").notNull().default({}), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [index("events_tessera_idx").on(t.tesseraId, t.createdAt)]);

