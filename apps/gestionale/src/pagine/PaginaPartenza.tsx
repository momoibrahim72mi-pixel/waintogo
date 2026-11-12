// Una partenza vista dall'organizzatore: chi è iscritto, chi ha pagato quanto, chi è in lista d'attesa.
// Da qui si confermano o annullano le iscrizioni, si registrano i pagamenti ricevuti
// (bonifico, Revolut...) e si aggiunge a mano chi si è iscritto per telefono o WhatsApp.
import {
  euroInCentesimi,
  type Iscrizione,
  type IscrizioneInput,
  iscrizioneInputSchema,
  METODI_PAGAMENTO,
  type MetodoPagamento,
  pagamentoInputSchema,
  percentualeMargine,
  ricaviAttesi,
  type StatoIscrizione,
} from "@waintogo/shared";
import { type FormEvent, Fragment, useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { api, type DettaglioPartenza } from "../api";
import { RiquadroAvviso, useAzioni } from "../componenti/azioni";
import { Campo } from "../componenti/Campo";
import { Importo } from "../componenti/Importo";
import { SezioneSpese } from "../componenti/SezioneSpese";
import { StatoPagato, StatoPartenza, StatoIscritto } from "../componenti/Stato";
import { euroPerCampo, formattaData, formattaEuro, oggi } from "../formato";

const etichetteMetodi: Record<MetodoPagamento, string> = {
  bonifico: "Bonifico",
  revolut: "Revolut",
  contanti: "Contanti",
  altro: "Altro",
};

export function PaginaPartenza() {
  const { id } = useParams();
  // undefined = caricamento; null = non trovata o API spenta.
  const [p, setP] = useState<DettaglioPartenza | null>();
  // L'iscrizione di cui sono aperti i dettagli (pagamenti, note, modulo di pagamento).
  const [aperta, setAperta] = useState<string | null>(null);
  const [nuovoIscritto, setNuovoIscritto] = useState(false);
  const azioni = useAzioni();

  const ricarica = useCallback(() => api.partenza(id!).then(setP, () => setP(null)), [id]);
  useEffect(() => {
    ricarica();
  }, [ricarica]);

  if (p === undefined) return <p>Caricamento…</p>;
  if (p === null) return <p className="avviso errore">Partenza non trovata (o API non raggiungibile).</p>;

  // Ogni operazione dell'API restituisce la partenza aggiornata: la mettiamo subito nella pagina.
  const fai = (op: () => Promise<DettaglioPartenza>, ok: string) =>
    azioni.esegui(async () => setP(await op()), ok);

  const cambiaStato = (i: Iscrizione, stato: StatoIscrizione, ok: string) =>
    fai(() => api.cambiaStatoIscrizione(i.id, stato), ok);

  // Il totale che ci aspettiamo: il prezzo per chi occupa un posto, più quanto hanno già
  // versato gli altri (annullati, in attesa). Stessa regola della pagina Conti.
  const attesoCentesimi = ricaviAttesi(p.iscrizioni, p.prezzoCentesimi, p.annullata);
  const margine = attesoCentesimi - p.costiCentesimi;
  const percentuale = percentualeMargine(margine, attesoCentesimi);

  return (
    <>
      <p className="briciole">
        <Link to={`/viaggi/${p.viaggio.id}`}>← {p.viaggio.titolo}</Link>
      </p>
      <div className="titolo-pagina">
        <h1>
          {formattaData(p.dataInizio)} – {formattaData(p.dataFine)}
        </h1>
        <StatoPartenza p={p} />
      </div>

      <div className="numeri">
        <Numero etichetta="Posti occupati" valore={`${p.postiOccupati}/${p.postiTotali}`} />
        <Numero etichetta="Confermati" valore={`${p.confermate}`} sotto={`minimo per partire: ${p.minimoPartecipanti}`} />
        <Numero etichetta="In lista d'attesa" valore={`${p.inAttesa}`} />
        <Numero
          etichetta="Incassato"
          valore={formattaEuro(p.incassatoCentesimi)}
          sotto={`su ${formattaEuro(attesoCentesimi)} attesi`}
        />
      </div>
      <p className="sotto">
        Prezzo {formattaEuro(p.prezzoCentesimi)} · acconto {formattaEuro(p.accontoCentesimi)}
        {p.coordinatore && <> · coordinatore {p.coordinatore}</>}
        {p.annullata && <> · <strong>partenza annullata</strong></>}
      </p>

      <RiquadroAvviso avviso={azioni.avviso} />

      <section className="riquadro">
        <div className="titolo-pagina">
          <h2>Iscritti</h2>
          <div className="azioni">
            {p.iscrizioni.length > 0 && (
              <button type="button" className="pulsante" onClick={() => scaricaCsv(p)}>
                Esporta CSV
              </button>
            )}
            {!nuovoIscritto && (
              <button type="button" className="pulsante primario" onClick={() => setNuovoIscritto(true)}>
                Aggiungi iscritto
              </button>
            )}
          </div>
        </div>

        {nuovoIscritto && (
          <ModuloIscritto
            occupato={azioni.occupato}
            errori={azioni.errori}
            setErrori={azioni.setErrori}
            chiudi={() => setNuovoIscritto(false)}
            salva={async (dati) => {
              const ok = await fai(() => api.aggiungiIscritto(p.id, dati), "Iscritto aggiunto");
              if (ok) setNuovoIscritto(false);
            }}
          />
        )}

        {p.iscrizioni.length === 0 ? (
          <p className="vuoto">Ancora nessun iscritto.</p>
        ) : (
          <div className="tabella-contenitore">
            <table className="tabella">
              <thead>
                <tr>
                  <th>Persona</th>
                  <th>Stato</th>
                  <th className="numero">Pagato</th>
                  <th>Pagamento</th>
                  <th>
                    <span className="solo-lettori">Azioni</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {p.iscrizioni.map((i) => (
                  <Fragment key={i.id}>
                    <tr className={i.stato === "annullata" ? "spenta" : undefined}>
                      <td className="persona">
                        <strong>
                          {i.nome} {i.cognome}
                        </strong>
                        <div className="sotto">
                          {i.codice} · {i.telefono}
                        </div>
                        <div className="sotto">
                          <a href={`mailto:${i.email}`}>{i.email}</a>
                        </div>
                      </td>
                      <td>
                        <StatoIscritto stato={i.stato} />
                      </td>
                      <td className="numero">
                        {formattaEuro(i.pagatoCentesimi)}
                        <div className="sotto">su {formattaEuro(p.prezzoCentesimi)}</div>
                      </td>
                      <td>
                        <StatoPagato stato={i.statoPagamento} />
                      </td>
                      <td className="azioni-riga">
                        <button
                          type="button"
                          className="pulsante piccolo"
                          aria-expanded={aperta === i.id}
                          onClick={() => setAperta(aperta === i.id ? null : i.id)}
                        >
                          {aperta === i.id ? "Chiudi" : "Pagamenti"}
                        </button>
                        {(i.stato === "richiesta" || i.stato === "lista_attesa") && (
                          <button
                            type="button"
                            className="pulsante piccolo"
                            disabled={azioni.occupato}
                            onClick={() => cambiaStato(i, "confermata", `${i.nome} confermato/a`)}
                          >
                            Conferma
                          </button>
                        )}
                        {i.stato === "richiesta" && (
                          <button
                            type="button"
                            className="pulsante piccolo leggero"
                            disabled={azioni.occupato}
                            onClick={() => cambiaStato(i, "lista_attesa", `${i.nome} spostato/a in lista d'attesa`)}
                          >
                            In attesa
                          </button>
                        )}
                        {i.stato === "annullata" ? (
                          <button
                            type="button"
                            className="pulsante piccolo"
                            disabled={azioni.occupato}
                            // Se la partenza è piena, chi viene ripristinato torna in lista d'attesa invece che al posto.
                            onClick={() =>
                              p.postiLiberi > 0
                                ? cambiaStato(i, "richiesta", `Iscrizione di ${i.nome} ripristinata`)
                                : cambiaStato(i, "lista_attesa", `Partenza piena: ${i.nome} ripristinato/a in lista d'attesa`)
                            }
                          >
                            Ripristina
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="pulsante piccolo pericolo"
                            disabled={azioni.occupato}
                            onClick={() =>
                              window.confirm(`Annullare l'iscrizione di ${i.nome} ${i.cognome}? Il posto si libera.`) &&
                              cambiaStato(i, "annullata", `Iscrizione di ${i.nome} annullata`)
                            }
                          >
                            Annulla
                          </button>
                        )}
                      </td>
                    </tr>
                    {aperta === i.id && (
                      <tr className="dettaglio">
                        <td colSpan={5}>
                          <DettaglioIscritto
                            // La chiave cambia quando cambia il pagato: il modulo si azzera e propone il nuovo residuo.
                            key={`${i.id}-${i.pagatoCentesimi}`}
                            i={i}
                            residuo={Math.max(p.prezzoCentesimi - i.pagatoCentesimi, 0)}
                            occupato={azioni.occupato}
                            errori={azioni.errori}
                            setErrori={azioni.setErrori}
                            registra={(dati) => fai(() => api.registraPagamento(i.id, dati), "Pagamento registrato")}
                            elimina={(pagamentoId) =>
                              window.confirm("Eliminare questo pagamento?") &&
                              fai(() => api.eliminaPagamento(pagamentoId), "Pagamento eliminato")
                            }
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="riquadro">
        <h2>Margine della partenza</h2>
        <div className="numeri numeri-3">
          <Numero
            etichetta="Ricavi attesi"
            valore={formattaEuro(attesoCentesimi)}
            sotto={`incassati ${formattaEuro(p.incassatoCentesimi)}`}
          />
          <Numero etichetta="Costi" valore={formattaEuro(p.costiCentesimi)} sotto="tutte le spese qui sotto" />
          <div className="numero-grande">
            <span className="sotto">Margine</span>
            <strong>
              <Importo valore={margine} />
            </strong>
            <span className="sotto">{percentuale !== null ? `${percentuale}% dei ricavi` : "nessun ricavo ancora"}</span>
          </div>
        </div>
      </section>

      <SezioneSpese titolo="Spese della partenza" spese={p.spese} partenzaFissa={p.id} quandoCambia={ricarica} />

      {p.viaggio.istruzioniPagamento && (
        <section className="riquadro">
          <h2>Istruzioni di pagamento mostrate agli iscritti</h2>
          <p className="testo-lungo">{p.viaggio.istruzioniPagamento}</p>
        </section>
      )}
    </>
  );
}

function Numero({ etichetta, valore, sotto }: { etichetta: string; valore: string; sotto?: string }) {
  return (
    <div className="numero-grande">
      <span className="sotto">{etichetta}</span>
      <strong>{valore}</strong>
      {sotto && <span className="sotto">{sotto}</span>}
    </div>
  );
}

type PropsErrori = {
  occupato: boolean;
  errori: Record<string, string>;
  setErrori: (e: Record<string, string>) => void;
};

/** I dettagli di un'iscrizione: note, pagamenti ricevuti e il modulo per registrarne uno nuovo. */
function DettaglioIscritto(
  props: PropsErrori & {
    i: Iscrizione;
    residuo: number;
    registra: (dati: ReturnType<typeof pagamentoInputSchema.parse>) => Promise<boolean>;
    elimina: (pagamentoId: string) => unknown;
  },
) {
  const { i } = props;
  // Proponiamo già quello che manca e la data di oggi: di solito basta premere "Registra".
  const [importo, setImporto] = useState(euroPerCampo(props.residuo));
  const [data, setData] = useState(oggi());
  const [metodo, setMetodo] = useState<MetodoPagamento>("bonifico");
  const [nota, setNota] = useState("");

  async function invia(e: FormEvent) {
    e.preventDefault();
    const centesimi = euroInCentesimi(importo);
    const r = pagamentoInputSchema.safeParse({ importoCentesimi: centesimi ?? 0, data, metodo, nota });
    if (centesimi === null || !r.success) {
      const errori: Record<string, string> = {};
      if (centesimi === null) errori.importoCentesimi = "Scrivi un importo, per esempio 300 o 300,50";
      if (!r.success) for (const x of r.error.issues) errori[x.path.join(".")] ??= x.message;
      return props.setErrori(errori);
    }
    if (await props.registra(r.data)) setNota("");
  }

  return (
    <div className="dettaglio-iscritto">
      <div className="sotto">
        Iscritto/a il {formattaData(i.creatoIl.slice(0, 10))}
        {i.dataNascita && <> · nato/a il {formattaData(i.dataNascita)}</>}
      </div>
      {i.note && <p className="testo-lungo">“{i.note}”</p>}

      <h3>Pagamenti ricevuti</h3>
      {i.pagamenti.length === 0 ? (
        <p className="vuoto">Nessun pagamento registrato.</p>
      ) : (
        <ul className="elenco-pagamenti">
          {i.pagamenti.map((pg) => (
            <li key={pg.id}>
              <span>
                {formattaData(pg.data)} · <strong>{formattaEuro(pg.importoCentesimi)}</strong> · {etichetteMetodi[pg.metodo]}
                {pg.nota && <span className="sotto"> · {pg.nota}</span>}
              </span>
              <button
                type="button"
                className="pulsante piccolo leggero"
                disabled={props.occupato}
                onClick={() => props.elimina(pg.id)}
              >
                Elimina
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Si registrano pagamenti solo per chi occupa un posto: l'API rifiuterebbe gli altri. */}
      {i.stato === "annullata" || i.stato === "lista_attesa" ? (
        <p className="sotto">Per registrare un pagamento, prima conferma l'iscrizione.</p>
      ) : (
        <form className="sotto-modulo" onSubmit={invia} noValidate>
          <h3>Registra un pagamento</h3>
          <div className="griglia griglia-4">
            <Campo etichetta="Importo (€)" errore={props.errori.importoCentesimi}>
              <input value={importo} onChange={(e) => setImporto(e.target.value)} inputMode="decimal" />
            </Campo>
            <Campo etichetta="Data" errore={props.errori.data}>
              <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </Campo>
            <Campo etichetta="Metodo" errore={props.errori.metodo}>
              <select value={metodo} onChange={(e) => setMetodo(e.target.value as MetodoPagamento)}>
                {METODI_PAGAMENTO.map((m) => (
                  <option key={m} value={m}>
                    {etichetteMetodi[m]}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo etichetta="Nota" aiuto="Es. riferimento del bonifico" errore={props.errori.nota}>
              <input value={nota} onChange={(e) => setNota(e.target.value)} />
            </Campo>
          </div>
          <div className="azioni">
            <button type="submit" className="pulsante primario" disabled={props.occupato}>
              Registra pagamento
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/** Modulo per aggiungere a mano chi si è iscritto fuori dal sito (telefono, WhatsApp, di persona). */
function ModuloIscritto(
  props: PropsErrori & { chiudi: () => void; salva: (dati: IscrizioneInput) => Promise<void> },
) {
  const [m, setM] = useState({ nome: "", cognome: "", email: "", telefono: "", dataNascita: "", note: "" });
  const cambia = (campo: keyof typeof m) => (e: { target: { value: string } }) =>
    setM((x) => ({ ...x, [campo]: e.target.value }));

  function invia(e: FormEvent) {
    e.preventDefault();
    const r = iscrizioneInputSchema.safeParse(m);
    if (!r.success) {
      const errori: Record<string, string> = {};
      for (const x of r.error.issues) errori[x.path.join(".")] ??= x.message;
      return props.setErrori(errori);
    }
    props.salva(r.data);
  }

  return (
    <form className="sotto-modulo" onSubmit={invia} noValidate>
      <h3>Nuovo iscritto</h3>
      <p className="sotto">
        Se la partenza è piena finisce in lista d'attesa. Quando registri il primo pagamento l'iscrizione si conferma da sola.
      </p>
      <div className="griglia griglia-3">
        <Campo etichetta="Nome" errore={props.errori.nome}>
          <input value={m.nome} onChange={cambia("nome")} autoComplete="off" />
        </Campo>
        <Campo etichetta="Cognome" errore={props.errori.cognome}>
          <input value={m.cognome} onChange={cambia("cognome")} autoComplete="off" />
        </Campo>
        <Campo etichetta="Email" errore={props.errori.email}>
          <input type="email" value={m.email} onChange={cambia("email")} autoComplete="off" />
        </Campo>
        <Campo etichetta="Telefono" errore={props.errori.telefono}>
          <input type="tel" value={m.telefono} onChange={cambia("telefono")} autoComplete="off" />
        </Campo>
        <Campo etichetta="Data di nascita" aiuto="Facoltativa" errore={props.errori.dataNascita}>
          <input type="date" value={m.dataNascita} onChange={cambia("dataNascita")} />
        </Campo>
        <Campo etichetta="Note" errore={props.errori.note}>
          <input value={m.note} onChange={cambia("note")} />
        </Campo>
      </div>
      <div className="azioni">
        <button type="submit" className="pulsante primario" disabled={props.occupato}>
          Aggiungi
        </button>
        <button type="button" className="pulsante leggero" onClick={props.chiudi}>
          Annulla
        </button>
      </div>
    </form>
  );
}

/**
 * Scarica gli iscritti in un file CSV da aprire con Excel o Google Fogli.
 * Usiamo il punto e virgola come separatore e mettiamo il "BOM" all'inizio del file:
 * è quello che si aspetta Excel in italiano per leggere bene colonne e lettere accentate.
 */
function scaricaCsv(p: DettaglioPartenza) {
  const intestazione = ["Codice", "Nome", "Cognome", "Email", "Telefono", "Data di nascita", "Stato", "Pagato €", "Mancante €", "Note"];
  const euro = (c: number) => (c / 100).toFixed(2).replace(".", ",");
  const righe = p.iscrizioni.map((i) => [
    i.codice,
    i.nome,
    i.cognome,
    i.email,
    i.telefono,
    i.dataNascita,
    i.stato,
    euro(i.pagatoCentesimi),
    euro(Math.max(p.prezzoCentesimi - i.pagatoCentesimi, 0)),
    i.note,
  ]);
  // Ogni valore va tra virgolette (raddoppiando quelle interne), così note con ";" o a capo non rompono le colonne.
  const csv = [intestazione, ...righe].map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `iscritti-${p.viaggio.titolo.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${p.dataInizio}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
