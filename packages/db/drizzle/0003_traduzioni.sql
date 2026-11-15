-- Traduzioni dei viaggi in inglese e arabo (vedi D31 in docs/decisioni.md):
-- una riga per viaggio e lingua, con i testi in jsonb, lo stato e l'impronta dell'italiano.
CREATE TYPE "public"."lingua_traduzione" AS ENUM('en', 'ar');--> statement-breakpoint
CREATE TYPE "public"."stato_traduzione" AS ENUM('da_rivedere', 'approvata');--> statement-breakpoint
CREATE TABLE "traduzioni_viaggi" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creato_il" timestamp with time zone DEFAULT now() NOT NULL,
	"aggiornato_il" timestamp with time zone DEFAULT now() NOT NULL,
	"viaggio_id" uuid NOT NULL,
	"lingua" "lingua_traduzione" NOT NULL,
	"testi" jsonb NOT NULL,
	"stato" "stato_traduzione" DEFAULT 'da_rivedere' NOT NULL,
	"impronta_originale" text NOT NULL,
	"approvata_il" timestamp with time zone,
	CONSTRAINT "traduzione_viaggio_lingua" UNIQUE("viaggio_id","lingua")
);
--> statement-breakpoint
ALTER TABLE "traduzioni_viaggi" ADD CONSTRAINT "traduzioni_viaggi_viaggio_id_viaggi_id_fk" FOREIGN KEY ("viaggio_id") REFERENCES "public"."viaggi"("id") ON DELETE cascade ON UPDATE no action;