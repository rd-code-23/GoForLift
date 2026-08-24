-- Installs the stable built-in exercise catalog required by routine creation.
INSERT INTO "exercises" ("id", "owner_user_id", "name")
VALUES
	('9f4b5a8e-2c3d-4f10-8a11-000000000001', NULL, 'Bicep Curl'),
	('9f4b5a8e-2c3d-4f10-8a11-000000000002', NULL, 'Hammer Curl'),
	('9f4b5a8e-2c3d-4f10-8a11-000000000003', NULL, 'Tricep Extension'),
	('9f4b5a8e-2c3d-4f10-8a11-000000000004', NULL, 'Overhead Press'),
	('9f4b5a8e-2c3d-4f10-8a11-000000000005', NULL, 'Lateral Raise')
ON CONFLICT ("id") DO UPDATE
SET
	"owner_user_id" = EXCLUDED."owner_user_id",
	"name" = EXCLUDED."name",
	"updated_at" = NOW()
WHERE
	"exercises"."owner_user_id" IS DISTINCT FROM EXCLUDED."owner_user_id"
	OR "exercises"."name" IS DISTINCT FROM EXCLUDED."name";
