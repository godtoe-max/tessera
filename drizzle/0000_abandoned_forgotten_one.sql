CREATE TYPE "public"."account_type" AS ENUM('consultant', 'customer');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."membership_role" AS ENUM('customer_user', 'customer_manager', 'consultant', 'engagement_lead', 'operations_manager', 'administrator', 'auditor');--> statement-breakpoint
CREATE TYPE "public"."message_visibility" AS ENUM('customer', 'internal');--> statement-breakpoint
CREATE TYPE "public"."tessera_mark" AS ENUM('urgent', 'high', 'normal', 'low');--> statement-breakpoint
CREATE TYPE "public"."tessera_status" AS ENUM('open', 'in_progress', 'waiting', 'redeemed');--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tessera_id" uuid NOT NULL,
	"message_id" uuid,
	"uploaded_by_id" uuid NOT NULL,
	"storage_key" text NOT NULL,
	"filename" text NOT NULL,
	"content_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attachments_storage_key_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"account_type" "account_type" NOT NULL,
	"role" "membership_role" NOT NULL,
	"organization_id" uuid,
	"project_id" uuid,
	"invited_by_id" uuid NOT NULL,
	"identity_invite_id" text,
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tessera_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"visibility" "message_visibility" DEFAULT 'customer' NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"role" "membership_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "project_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "membership_role" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tessera_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tessera_id" uuid NOT NULL,
	"actor_id" uuid,
	"event_type" text NOT NULL,
	"event_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tesserae" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"requester_id" uuid NOT NULL,
	"assignee_id" uuid,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" "tessera_status" DEFAULT 'open' NOT NULL,
	"mark" "tessera_mark" DEFAULT 'normal' NOT NULL,
	"due_at" timestamp with time zone,
	"redeemed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tesserae_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identity_id" text NOT NULL,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"account_type" "account_type" NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_identity_id_unique" UNIQUE("identity_id")
);
--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_tessera_id_tesserae_id_fk" FOREIGN KEY ("tessera_id") REFERENCES "public"."tesserae"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_id_users_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_tessera_id_tesserae_id_fk" FOREIGN KEY ("tessera_id") REFERENCES "public"."tesserae"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_memberships" ADD CONSTRAINT "project_memberships_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_memberships" ADD CONSTRAINT "project_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tessera_events" ADD CONSTRAINT "tessera_events_tessera_id_tesserae_id_fk" FOREIGN KEY ("tessera_id") REFERENCES "public"."tesserae"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tessera_events" ADD CONSTRAINT "tessera_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tesserae" ADD CONSTRAINT "tesserae_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tesserae" ADD CONSTRAINT "tesserae_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tesserae" ADD CONSTRAINT "tesserae_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tesserae" ADD CONSTRAINT "tesserae_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attachments_tessera_idx" ON "attachments" USING btree ("tessera_id");--> statement-breakpoint
CREATE INDEX "invitations_email_idx" ON "invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "invitations_org_idx" ON "invitations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invitations_status_idx" ON "invitations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "messages_tessera_idx" ON "messages" USING btree ("tessera_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "org_membership_unique" ON "organization_memberships" USING btree ("user_id","organization_id");--> statement-breakpoint
CREATE INDEX "org_membership_org_idx" ON "organization_memberships" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_membership_unique" ON "project_memberships" USING btree ("project_id","user_id");--> statement-breakpoint
CREATE INDEX "project_membership_user_idx" ON "project_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_org_slug_unique" ON "projects" USING btree ("organization_id","slug");--> statement-breakpoint
CREATE INDEX "projects_org_idx" ON "projects" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "events_tessera_idx" ON "tessera_events" USING btree ("tessera_id","created_at");--> statement-breakpoint
CREATE INDEX "tesserae_org_idx" ON "tesserae" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "tesserae_project_idx" ON "tesserae" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "tesserae_assignee_idx" ON "tesserae" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX "tesserae_status_idx" ON "tesserae" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");