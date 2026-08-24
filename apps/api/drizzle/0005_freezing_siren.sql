CREATE TABLE "routine_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"routine_id" uuid NOT NULL,
	"day_of_week" smallint NOT NULL,
	"local_time" time(0) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "routine_schedules_day_of_week_supported" CHECK ("routine_schedules"."day_of_week" BETWEEN 0 AND 6)
);
--> statement-breakpoint
ALTER TABLE "routine_schedules" ADD CONSTRAINT "routine_schedules_routine_id_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "routine_schedules_routine_day_time_unique" ON "routine_schedules" USING btree ("routine_id","day_of_week","local_time");