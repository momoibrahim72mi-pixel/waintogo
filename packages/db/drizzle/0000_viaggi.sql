CREATE TYPE "public"."stato_viaggio" AS ENUM('bozza', 'pubblicato', 'chiuso');--> statement-breakpoint
CREATE TABLE "tappe_itinerario" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creato_il" timestamp with time zone DEFAULT now() NOT NULL,
	"aggiornato_il" timestamp with time zone DEFAULT now() NOT NULL,
	"viaggio_id" uuid NOT NULL,
	"giorno" integer NOT NULL,
	"titolo" text NOT NULL,
	"descrizione" text DEFAULT '' NOT NULL,
	CONSTRAINT "tappa_giorno_unico" UNIQUE("viaggio_id","giorno")
);
--> statement-breakpoint
CREATE TABLE "viaggi" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creato_il" timestamp with time zone DEFAULT now() NOT NULL,
	"aggiornato_il" timestamp with time zone DEFAULT now() NOT NULL,
	"slug" text NOT NULL,
	"titolo" text NOT NULL,
	"destinazione" text NOT NULL,
	"descrizione" text DEFAULT '' NOT NULL,
	"data_inizio" date NOT NULL,
	"data_fine" date NOT NULL,
	"prezzo_centesimi" integer NOT NULL,
	"acconto_centesimi" integer NOT NULL,
	"posti_totali" integer NOT NULL,
	"stato" "stato_viaggio" DEFAULT 'bozza' NOT NULL,
	"istruzioni_pagamento" text DEFAULT '' NOT NULL,
	CONSTRAINT "viaggi_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "tappe_itinerario" ADD CONSTRAINT "tappe_itinerario_viaggio_id_viaggi_id_fk" FOREIGN KEY ("viaggio_id") REFERENCES "public"."viaggi"("id") ON DELETE cascade ON UPDATE no action;