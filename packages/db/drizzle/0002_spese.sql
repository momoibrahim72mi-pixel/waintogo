CREATE TYPE "public"."categoria_spesa" AS ENUM('volo', 'alloggio', 'trasporto', 'attivita', 'guida', 'coordinatore', 'assicurazione', 'pubblicita', 'software', 'rimborso', 'altro');--> statement-breakpoint
CREATE TABLE "spese" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creato_il" timestamp with time zone DEFAULT now() NOT NULL,
	"aggiornato_il" timestamp with time zone DEFAULT now() NOT NULL,
	"partenza_id" uuid,
	"descrizione" text NOT NULL,
	"categoria" "categoria_spesa" NOT NULL,
	"importo_centesimi" integer NOT NULL,
	"data" date NOT NULL,
	"pagata" boolean DEFAULT false NOT NULL,
	"fornitore" text DEFAULT '' NOT NULL,
	"nota" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "spese" ADD CONSTRAINT "spese_partenza_id_partenze_id_fk" FOREIGN KEY ("partenza_id") REFERENCES "public"."partenze"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "spese_partenza_idx" ON "spese" USING btree ("partenza_id");--> statement-breakpoint
CREATE INDEX "spese_data_idx" ON "spese" USING btree ("data");