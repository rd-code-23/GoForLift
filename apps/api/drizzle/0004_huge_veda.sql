CREATE TABLE "routine_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"routine_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"sets" integer NOT NULL,
	"target_reps" integer NOT NULL,
	"weight" numeric(8, 2) NOT NULL,
	"weight_unit" text NOT NULL,
	"rest_between_sets_seconds" integer DEFAULT 0 NOT NULL,
	"rest_after_exercise_seconds" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "routine_exercises_position_nonnegative" CHECK ("routine_exercises"."position" >= 0),
	CONSTRAINT "routine_exercises_sets_positive" CHECK ("routine_exercises"."sets" > 0),
	CONSTRAINT "routine_exercises_target_reps_positive" CHECK ("routine_exercises"."target_reps" > 0),
	CONSTRAINT "routine_exercises_weight_nonnegative" CHECK ("routine_exercises"."weight" >= 0),
	CONSTRAINT "routine_exercises_weight_unit_supported" CHECK ("routine_exercises"."weight_unit" IN ('lb', 'kg')),
	CONSTRAINT "routine_exercises_rest_between_sets_nonnegative" CHECK ("routine_exercises"."rest_between_sets_seconds" >= 0),
	CONSTRAINT "routine_exercises_rest_after_exercise_nonnegative" CHECK ("routine_exercises"."rest_after_exercise_seconds" >= 0)
);
--> statement-breakpoint
ALTER TABLE "routine_exercises" ADD CONSTRAINT "routine_exercises_routine_id_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_exercises" ADD CONSTRAINT "routine_exercises_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "routine_exercises_routine_position_unique" ON "routine_exercises" USING btree ("routine_id","position");--> statement-breakpoint
CREATE INDEX "routine_exercises_exercise_id_idx" ON "routine_exercises" USING btree ("exercise_id");