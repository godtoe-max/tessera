CREATE SEQUENCE "public"."tessera_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1000 CACHE 1;--> statement-breakpoint
CREATE TABLE "administration_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"actor_id" uuid,
	"event_type" text NOT NULL,
	"data" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_settings" (
	"id" text PRIMARY KEY,
	"name" text DEFAULT 'Tessera' NOT NULL,
	"default_mark" "tessera_mark" DEFAULT 'normal'::"tessera_mark" NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "administration_events" ADD CONSTRAINT "administration_events_actor_id_users_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id");
