CREATE TYPE "account_type" AS ENUM('consultant', 'customer');--> statement-breakpoint
CREATE TYPE "invitation_status" AS ENUM('pending', 'accepted', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "membership_role" AS ENUM('customer_user', 'customer_manager', 'consultant', 'engagement_lead', 'operations_manager', 'administrator', 'auditor');--> statement-breakpoint
CREATE TYPE "message_visibility" AS ENUM('customer', 'internal');--> statement-breakpoint
CREATE TYPE "tessera_mark" AS ENUM('urgent', 'high', 'normal', 'low');--> statement-breakpoint
CREATE TYPE "tessera_status" AS ENUM('open', 'in_progress', 'waiting', 'redeemed');--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"tessera_id" uuid NOT NULL,
	"message_id" uuid,
	"uploaded_by_id" uuid NOT NULL,
	"storage_key" text NOT NULL UNIQUE,
	"filename" text NOT NULL,
	"content_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"email" text NOT NULL,
	"account_type" "account_type" NOT NULL,
	"role" "membership_role" NOT NULL,
	"organization_id" uuid,
	"project_id" uuid,
	"invited_by_id" uuid NOT NULL,
	"identity_invite_id" text,
	"status" "invitation_status" DEFAULT 'pending'::"invitation_status" NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"tessera_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"visibility" "message_visibility" DEFAULT 'customer'::"message_visibility" NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"role" "membership_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "membership_role" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tessera_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"tessera_id" uuid NOT NULL,
	"actor_id" uuid,
	"event_type" text NOT NULL,
	"event_data" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tesserae" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"number" text NOT NULL UNIQUE,
	"organization_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"requester_id" uuid NOT NULL,
	"assignee_id" uuid,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" "tessera_status" DEFAULT 'open'::"tessera_status" NOT NULL,
	"mark" "tessera_mark" DEFAULT 'normal'::"tessera_mark" NOT NULL,
	"due_at" timestamp with time zone,
	"redeemed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"identity_id" text NOT NULL UNIQUE,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"account_type" "account_type" NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "attachments_tessera_idx" ON "attachments" ("tessera_id");--> statement-breakpoint
CREATE INDEX "invitations_email_idx" ON "invitations" ("email");--> statement-breakpoint
CREATE INDEX "invitations_org_idx" ON "invitations" ("organization_id");--> statement-breakpoint
CREATE INDEX "invitations_status_idx" ON "invitations" ("status");--> statement-breakpoint
CREATE INDEX "messages_tessera_idx" ON "messages" ("tessera_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "org_membership_unique" ON "organization_memberships" ("user_id","organization_id");--> statement-breakpoint
CREATE INDEX "org_membership_org_idx" ON "organization_memberships" ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_membership_unique" ON "project_memberships" ("project_id","user_id");--> statement-breakpoint
CREATE INDEX "project_membership_user_idx" ON "project_memberships" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_org_slug_unique" ON "projects" ("organization_id","slug");--> statement-breakpoint
CREATE INDEX "projects_org_idx" ON "projects" ("organization_id");--> statement-breakpoint
CREATE INDEX "events_tessera_idx" ON "tessera_events" ("tessera_id","created_at");--> statement-breakpoint
CREATE INDEX "tesserae_org_idx" ON "tesserae" ("organization_id");--> statement-breakpoint
CREATE INDEX "tesserae_project_idx" ON "tesserae" ("project_id");--> statement-breakpoint
CREATE INDEX "tesserae_assignee_idx" ON "tesserae" ("assignee_id");--> statement-breakpoint
CREATE INDEX "tesserae_status_idx" ON "tesserae" ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" ("email");--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_tessera_id_tesserae_id_fkey" FOREIGN KEY ("tessera_id") REFERENCES "tesserae"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_message_id_messages_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploaded_by_id_users_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_id_users_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_tessera_id_tesserae_id_fkey" FOREIGN KEY ("tessera_id") REFERENCES "tesserae"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_author_id_users_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "project_memberships" ADD CONSTRAINT "project_memberships_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "project_memberships" ADD CONSTRAINT "project_memberships_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "tessera_events" ADD CONSTRAINT "tessera_events_tessera_id_tesserae_id_fkey" FOREIGN KEY ("tessera_id") REFERENCES "tesserae"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "tessera_events" ADD CONSTRAINT "tessera_events_actor_id_users_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "tesserae" ADD CONSTRAINT "tesserae_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id");--> statement-breakpoint
ALTER TABLE "tesserae" ADD CONSTRAINT "tesserae_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id");--> statement-breakpoint
ALTER TABLE "tesserae" ADD CONSTRAINT "tesserae_requester_id_users_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "tesserae" ADD CONSTRAINT "tesserae_assignee_id_users_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id");