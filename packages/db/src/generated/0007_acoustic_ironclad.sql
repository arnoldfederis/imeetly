ALTER TABLE "app"."meetings" ADD COLUMN "provider" text;
--> statement-breakpoint
UPDATE "app"."meetings"
SET "provider" = CASE
	WHEN "title" LIKE '% (Google Meet)' THEN 'google'
	WHEN "title" LIKE '% (Zoom)' THEN 'zoom'
	WHEN "title" LIKE '% (Teams)' THEN 'microsoft'
	ELSE NULL
END
WHERE "provider" IS NULL;
--> statement-breakpoint
UPDATE "app"."meetings"
SET "title" = regexp_replace("title", ' \\((Google Meet|Zoom|Teams)\\)$', '')
WHERE "provider" IS NOT NULL;
