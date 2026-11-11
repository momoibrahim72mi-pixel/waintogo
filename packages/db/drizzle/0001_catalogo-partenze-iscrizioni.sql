-- Migrazione 0001: il viaggio diventa una "scheda" del catalogo e le date, i prezzi e i posti
-- passano nelle partenze. Aggiunge iscrizioni e pagamenti.
-- Generata da drizzle-kit e poi ritoccata a mano (vedi i commenti "A MANO") per non perdere
-- i viaggi già inseriti: ognuno diventa un viaggio + una partenza con le sue vecchie date.
CREATE TYPE "public"."livello_viaggio" AS ENUM('facile', 'medio', 'impegnativo');--> statement-breakpoint
CREATE TYPE "public"."metodo_pagamento" AS ENUM('bonifico', 'revolut', 'contanti', 'altro');--> statement-breakpoint
CREATE TYPE "public"."stato_iscrizione" AS ENUM('richiesta', 'confermata', 'lista_attesa', 'annullata');--> statement-breakpoint
CREATE TABLE "iscrizioni" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creato_il" timestamp with time zone DEFAULT now() NOT NULL,
	"aggiornato_il" timestamp with time zone DEFAULT now() NOT NULL,
	"codice" text NOT NULL,
	"partenza_id" uuid NOT NULL,
	"stato" "stato_iscrizione" DEFAULT 'richiesta' NOT NULL,
	"nome" text NOT NULL,
	"cognome" text NOT NULL,
	"email" text NOT NULL,
	"telefono" text NOT NULL,
	"data_nascita" date,
	"note" text DEFAULT '' NOT NULL,
	CONSTRAINT "iscrizioni_codice_unique" UNIQUE("codice")
);
--> statement-breakpoint
CREATE TABLE "pagamenti" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creato_il" timestamp with time zone DEFAULT now() NOT NULL,
	"aggiornato_il" timestamp with time zone DEFAULT now() NOT NULL,
	"iscrizione_id" uuid NOT NULL,
	"importo_centesimi" integer NOT NULL,
	"data" date NOT NULL,
	"metodo" "metodo_pagamento" NOT NULL,
	"nota" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partenze" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creato_il" timestamp with time zone DEFAULT now() NOT NULL,
	"aggiornato_il" timestamp with time zone DEFAULT now() NOT NULL,
	"viaggio_id" uuid NOT NULL,
	"data_inizio" date NOT NULL,
	"prezzo_centesimi" integer NOT NULL,
	"acconto_centesimi" integer NOT NULL,
	"posti_totali" integer NOT NULL,
	"minimo_partecipanti" integer DEFAULT 1 NOT NULL,
	"coordinatore" text DEFAULT '' NOT NULL,
	"annullata" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "viaggi" ADD COLUMN "sottotitolo" text DEFAULT '' NOT NULL;--> statement-breakpoint
-- A MANO: prima la colonna con un valore provvisorio, poi la durata calcolata dalle vecchie date.
ALTER TABLE "viaggi" ADD COLUMN "durata_giorni" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
UPDATE "viaggi" SET "durata_giorni" = ("data_fine" - "data_inizio") + 1;--> statement-breakpoint
ALTER TABLE "viaggi" ALTER COLUMN "durata_giorni" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "viaggi" ADD COLUMN "stili" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "viaggi" ADD COLUMN "livello" "livello_viaggio" DEFAULT 'medio' NOT NULL;--> statement-breakpoint
ALTER TABLE "viaggi" ADD COLUMN "fascia_eta" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "viaggi" ADD COLUMN "punti_forti" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "viaggi" ADD COLUMN "incluso" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "viaggi" ADD COLUMN "non_incluso" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "viaggi" ADD COLUMN "info_utili" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "viaggi" ADD COLUMN "immagine_url" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "iscrizioni" ADD CONSTRAINT "iscrizioni_partenza_id_partenze_id_fk" FOREIGN KEY ("partenza_id") REFERENCES "public"."partenze"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pagamenti" ADD CONSTRAINT "pagamenti_iscrizione_id_iscrizioni_id_fk" FOREIGN KEY ("iscrizione_id") REFERENCES "public"."iscrizioni"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partenze" ADD CONSTRAINT "partenze_viaggio_id_viaggi_id_fk" FOREIGN KEY ("viaggio_id") REFERENCES "public"."viaggi"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "iscrizioni_partenza_idx" ON "iscrizioni" USING btree ("partenza_id");--> statement-breakpoint
CREATE INDEX "partenze_data_inizio_idx" ON "partenze" USING btree ("data_inizio");--> statement-breakpoint
-- A MANO: copia date, prezzi e posti di ogni viaggio in una partenza, prima di cancellare le colonne.
INSERT INTO "partenze" ("viaggio_id", "data_inizio", "prezzo_centesimi", "acconto_centesimi", "posti_totali")
  SELECT "id", "data_inizio", "prezzo_centesimi", "acconto_centesimi", "posti_totali" FROM "viaggi";--> statement-breakpoint
ALTER TABLE "viaggi" DROP COLUMN "data_inizio";--> statement-breakpoint
ALTER TABLE "viaggi" DROP COLUMN "data_fine";--> statement-breakpoint
ALTER TABLE "viaggi" DROP COLUMN "prezzo_centesimi";--> statement-breakpoint
ALTER TABLE "viaggi" DROP COLUMN "acconto_centesimi";--> statement-breakpoint
ALTER TABLE "viaggi" DROP COLUMN "posti_totali";