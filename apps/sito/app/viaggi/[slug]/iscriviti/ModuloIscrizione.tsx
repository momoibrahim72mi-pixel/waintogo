"use client";
// Il modulo di iscrizione. È un "Client Component" ("use client") perché deve reagire
// mentre la persona lo usa: mostrare "Invio in corso…", gli errori e poi la conferma.
//
// useActionState collega il modulo alla Server Action: quando si preme Invia, chiama
// richiediPosto() sul server e mette il risultato in `esito`.
import { formattaEuro } from "@waintogo/shared";
import { useActionState } from "react";
import { intervallo } from "../../../../lib/formato";
import { richiediPosto, type Stato } from "./azioni";

type Props = { partenze: { id: string; testo: string }[]; partenzaScelta: string };

export function ModuloIscrizione({ partenze, partenzaScelta }: Props) {
  const [esito, invia, inCorso] = useActionState<Stato, FormData>(richiediPosto, null);

  if (esito?.ok) {
    const r = esito.ricevuta;
    const inAttesa = r.stato === "lista_attesa";
    return (
      <div className="conferma" role="status">
        <p className="occhiello">{inAttesa ? "Sei in lista d'attesa" : "Richiesta ricevuta"}</p>
        <h2>{inAttesa ? "Ti avvisiamo appena si libera un posto" : "Il tuo posto è tenuto per te!"}</h2>
        <p>
          {r.viaggio}, {intervallo(r.dataInizio, r.dataFine)}.
        </p>
        <p>Il tuo codice di prenotazione:</p>
        <p className="codice">{r.codice}</p>
        {inAttesa ? (
          <p>La partenza è al completo. Non devi pagare niente per ora: se si libera un posto ti contattiamo noi, seguendo l&apos;ordine delle richieste.</p>
        ) : (
          <>
            <p>
              Per confermare versa l&apos;acconto di <strong>{formattaEuro(r.accontoCentesimi)}</strong> (prezzo totale{" "}
              {formattaEuro(r.prezzoCentesimi)}). Scrivi il codice <strong>{r.codice}</strong> nella causale.
            </p>
            <div className="istruzioni">{r.istruzioniPagamento}</div>
            <p>Appena riceviamo l&apos;acconto la tua iscrizione è confermata. Il saldo va versato entro 30 giorni dalla partenza.</p>
          </>
        )}
        <p>Salva questa pagina o fai uno screenshot: il codice ti servirà.</p>
      </div>
    );
  }

  const errori = esito && !esito.ok ? esito.campi : {};
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
        {errori[nome]}
      </span>
    );

  return (
    <form action={invia} className="modulo" noValidate>
      {esito && !esito.ok && (
        <p className="avviso largo" role="alert">
          {esito.errore === "Dati non validi" ? "Controlla i campi evidenziati." : esito.errore}
        </p>
      )}
      <div className="campo largo">
        <label htmlFor="partenzaId">Partenza</label>
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
        <label htmlFor="nome">Nome</label>
        <input {...campo("nome")} autoComplete="given-name" required />
        {errore("nome")}
      </div>
      <div className="campo">
        <label htmlFor="cognome">Cognome</label>
        <input {...campo("cognome")} autoComplete="family-name" required />
        {errore("cognome")}
      </div>
      <div className="campo">
        <label htmlFor="email">Email</label>
        <input {...campo("email")} type="email" autoComplete="email" required />
        {errore("email")}
      </div>
      <div className="campo">
        <label htmlFor="telefono">Telefono (meglio se con WhatsApp)</label>
        <input {...campo("telefono")} type="tel" autoComplete="tel" placeholder="+39 333 1234567" required />
        {errore("telefono")}
      </div>
      <div className="campo">
        <label htmlFor="dataNascita">Data di nascita</label>
        <input {...campo("dataNascita")} type="date" autoComplete="bday" />
        {errore("dataNascita")}
      </div>
      <div className="campo largo">
        <label htmlFor="note">Note (allergie, con chi vorresti dividere la camera...)</label>
        <textarea {...campo("note")} rows={3} />
        {errore("note")}
      </div>
      <div className="campo largo">
        <div className="consenso">
          <input {...campo("privacy")} type="checkbox" />
          <label htmlFor="privacy">
            Acconsento al trattamento dei miei dati per gestire la prenotazione. {/* TODO: link all'informativa privacy */}
          </label>
        </div>
        {errore("privacy")}
      </div>
      <div className="largo">
        <button type="submit" className="pulsante" disabled={inCorso}>
          {inCorso ? "Invio in corso…" : "Richiedi il posto"}
        </button>
      </div>
    </form>
  );
}
