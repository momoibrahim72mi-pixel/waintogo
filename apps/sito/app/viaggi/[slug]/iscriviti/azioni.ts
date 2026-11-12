"use server";
// Una "Server Action": una funzione che gira sul server del sito ma si può chiamare
// direttamente da un modulo nel browser. Riceve i campi del modulo (FormData), li manda
// all'API e restituisce l'esito, che il modulo mostra (errori o pagina di conferma).
import { inviaIscrizione, type EsitoIscrizione } from "../../../../lib/api";

export type Stato = EsitoIscrizione | null;

export async function richiediPosto(_precedente: Stato, modulo: FormData): Promise<Stato> {
  const testo = (nome: string) => String(modulo.get(nome) ?? "");
  return inviaIscrizione({
    partenzaId: testo("partenzaId"),
    nome: testo("nome"),
    cognome: testo("cognome"),
    email: testo("email"),
    telefono: testo("telefono"),
    dataNascita: testo("dataNascita"),
    note: testo("note"),
    // Una casella spuntata arriva come "on"; non spuntata non arriva affatto.
    privacy: modulo.get("privacy") === "on",
  });
}
