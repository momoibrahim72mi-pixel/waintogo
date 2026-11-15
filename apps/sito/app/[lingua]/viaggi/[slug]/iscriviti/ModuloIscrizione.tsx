"use client";
// Il modulo di iscrizione. È un "Client Component" ("use client") perché deve reagire
// mentre la persona lo usa: mostrare "Invio in corso…", gli errori e poi la conferma.
//
// useActionState collega il modulo alla Server Action: quando si preme Invia, chiama
// richiediPosto() sul server e mette il risultato in `esito`.
//
// I testi arrivano già tradotti in `testi` (dal dizionario della lingua, sul server).
// Le risposte dell'API invece sono in italiano: in inglese e in arabo, al posto dei
// messaggi dell'API, mostriamo quelli del dizionario per lo stesso campo.
import { Fragment, useActionState, type ReactNode } from "react";
import type { TestiModulo } from "../../../../../lib/dizionari";
import { intervallo, prezzo } from "../../../../../lib/formato";
import type { Lingua } from "../../../../../lib/lingue";
import { richiediPosto, type Stato } from "./azioni";

type Props = {
  lingua: Lingua;
  testi: TestiModulo;
  partenze: { id: string; testo: string }[];
  partenzaScelta: string;
};

/**
 * Mette dei pezzi (anche in grassetto) al posto delle {graffe} di un testo del dizionario:
 * riempi("Versa {acconto} entro...", { acconto: <strong>300 €</strong> }).
 * Così ogni lingua decide l'ordine delle parole, che in arabo è diverso.
 */
function riempi(testo: string, pezzi: Record<string, ReactNode>) {
  return testo.split(/\{(\w+)\}/).map((parte, i) => (
    // Le parti dispari sono i nomi tra graffe, le pari il testo intorno.
    <Fragment key={i}>{i % 2 === 1 ? pezzi[parte] : parte}</Fragment>
  ));
}

export function ModuloIscrizione({ lingua, testi, partenze, partenzaScelta }: Props) {
  const [esito, invia, inCorso] = useActionState<Stato, FormData>(richiediPosto, null);

  if (esito?.ok) {
    const r = esito.ricevuta;
    const inAttesa = r.stato === "lista_attesa";
    return (
      <div className="conferma" role="status">
        <p className="occhiello">{inAttesa ? testi.inAttesaOcchiello : testi.ricevutaOcchiello}</p>
        <h2>{inAttesa ? testi.inAttesaTitolo : testi.ricevutaTitolo}</h2>
        <p>
          {/* Il nome del viaggio è in italiano: <bdi> lo isola, così in arabo non si mescola alle date. */}
          <bdi lang={lingua === "it" ? undefined : "it"}>{r.viaggio}</bdi> · {intervallo(lingua, r.dataInizio, r.dataFine)}
        </p>
        <p>{testi.tuoCodice}</p>
        <p className="codice" dir="ltr">
          {r.codice}
        </p>
        {inAttesa ? (
          <p>{testi.inAttesaTesto}</p>
        ) : (
          <>
            <p>
              {riempi(testi.versaAcconto, {
                acconto: <strong>{prezzo(lingua, r.accontoCentesimi)}</strong>,
                prezzo: prezzo(lingua, r.prezzoCentesimi),
                codice: (
                  <strong className="senza-a-capo">
                    <bdi>{r.codice}</bdi>
                  </strong>
                ),
              })}
            </p>
            {/* I dati per il pagamento (IBAN, Revolut) si leggono da sinistra a destra in ogni lingua. */}
            <div className="istruzioni" dir="ltr">
              {r.istruzioniPagamento}
            </div>
            <p>{testi.dopoAcconto}</p>
          </>
        )}
        <p>{testi.salva}</p>
      </div>
    );
  }

  const errori = esito && !esito.ok ? esito.campi : {};
  // In italiano il messaggio preciso dell'API; nelle altre lingue quello del dizionario.
  const messaggio = (nome: string) =>
    lingua === "it" ? errori[nome] : (testi.errori[nome as keyof TestiModulo["errori"]] ?? testi.erroreGenerico);
  // Collega a ogni campo il suo eventuale messaggio d'errore (per i lettori di schermo).
  const campo = (nome: string) => ({
    id: nome,
    name: nome,
    "aria-invalid": errori[nome] ? true : undefined,
    "aria-describedby": errori[nome] ? `${nome}-errore` : undefined,
  });
  const errore = (nome: string) =>
    errori[nome] && (
      <span className="errore" id={`${nome}-errore`}>
        {messaggio(nome)}
      </span>
    );
  const avviso = () => {
    if (!esito || esito.ok) return null;
    if (esito.errore === "Dati non validi") return testi.controllaCampi;
    return lingua === "it" ? esito.errore : testi.erroreGenerico;
  };

  return (
    <form action={invia} className="modulo" noValidate>
      {esito && !esito.ok && (
        <p className="avviso largo" role="alert">
          {avviso()}
        </p>
      )}
      <div className="campo largo">
        <label htmlFor="partenzaId">{testi.partenza}</label>
        <select {...campo("partenzaId")} defaultValue={partenzaScelta}>
          {partenze.map((p) => (
            <option key={p.id} value={p.id}>
              {p.testo}
            </option>
          ))}
        </select>
        {errore("partenzaId")}
      </div>
      <div className="campo">
        <label htmlFor="nome">{testi.nome}</label>
        <input {...campo("nome")} autoComplete="given-name" required />
        {errore("nome")}
      </div>
      <div className="campo">
        <label htmlFor="cognome">{testi.cognome}</label>
        <input {...campo("cognome")} autoComplete="family-name" required />
        {errore("cognome")}
      </div>
      <div className="campo">
        <label htmlFor="email">{testi.email}</label>
        {/* dir="ltr" su email e telefono: si scrivono sempre da sinistra a destra, anche in arabo. */}
        <input {...campo("email")} type="email" autoComplete="email" dir="ltr" required />
        {errore("email")}
      </div>
      <div className="campo">
        <label htmlFor="telefono">{testi.telefono}</label>
        <input {...campo("telefono")} type="tel" autoComplete="tel" dir="ltr" placeholder="+39 333 1234567" required />
        {errore("telefono")}
      </div>
      <div className="campo">
        <label htmlFor="dataNascita">{testi.dataNascita}</label>
        <input {...campo("dataNascita")} type="date" autoComplete="bday" />
        {errore("dataNascita")}
      </div>
      <div className="campo largo">
        <label htmlFor="note">{testi.note}</label>
        {/* dir="auto": il browser sceglie il verso in base a quello che si scrive. */}
        <textarea {...campo("note")} rows={3} dir="auto" />
        {errore("note")}
      </div>
      <div className="campo largo">
        <div className="consenso">
          <input {...campo("privacy")} type="checkbox" />
          <label htmlFor="privacy">
            {testi.privacy} {/* TODO: link all'informativa privacy */}
          </label>
        </div>
        {errore("privacy")}
      </div>
      <div className="largo">
        <button type="submit" className="pulsante" disabled={inCorso}>
          {inCorso ? testi.invioInCorso : testi.invia}
        </button>
      </div>
    </form>
  );
}
