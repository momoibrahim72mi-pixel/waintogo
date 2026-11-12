// Una partenza sul telefono: gli iscritti come schede. Toccando una scheda si apre con
// i pulsanti per chiamare, scrivere su WhatsApp, registrare un pagamento o cambiare stato.
import {
  euroInCentesimi,
  type Iscrizione,
  METODI_PAGAMENTO,
  type MetodoPagamento,
  pagamentoInputSchema,
  type StatoIscrizione,
} from "@waintogo/shared";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { api, type DettaglioPartenza } from "../api";
import { RiquadroAvviso, useAzioni } from "../componenti/azioni";
import { StatoIscritto, StatoPagato, StatoPartenza } from "../componenti/Stato";
import { euroPerCampo, formattaData, formattaEuro, oggi } from "../formato";
import { Barra, numeroWhatsApp, Stato, Testata, useDati } from "./comuni";

// I filtri in alto: ognuno dice quali iscrizioni mostrare.
const FILTRI = {
  tutti: { etichetta: "Tutti", vale: (i: Iscrizione) => i.stato !== "annullata" },
  confermare: { etichetta: "Da confermare", vale: (i: Iscrizione) => i.stato === "richiesta" },
  saldare: {
    etichetta: "Da saldare",
    vale: (i: Iscrizione) => i.stato === "confermata" && i.statoPagamento !== "saldato",
  },
  attesa: { etichetta: "In attesa", vale: (i: Iscrizione) => i.stato === "lista_attesa" },
  annullati: { etichetta: "Annullati", vale: (i: Iscrizione) => i.stato === "annullata" },
} as const;
type Filtro = keyof typeof FILTRI;

const etichetteMetodi: Record<MetodoPagamento, string> = {
  bonifico: "Bonifico",
  revolut: "Revolut",
  contanti: "Contanti",
  altro: "Altro",
};

export function Partenza() {
  const { id } = useParams();
  const [cerca] = useSearchParams();
  const carica = useCallback(() => api.partenza(id!), [id]);
  const { dati: p, setDati, ricarica } = useDati(carica);
  const [filtro, setFiltro] = useState<Filtro>("tutti");
  // La scheda aperta: all'inizio quella indicata nell'indirizzo (?iscritto=...), se c'è.
  const [aperta, setAperta] = useState<string | null>(cerca.get("iscritto"));
  const [pagaPer, setPagaPer] = useState<Iscrizione | null>(null);
  const azioni = useAzioni();

  // Ogni operazione restituisce la partenza aggiornata: la mettiamo subito sullo schermo.
  const fai = (op: () => Promise<DettaglioPartenza>, ok: string) => azioni.esegui(async () => setDati(await op()), ok);
  const cambiaStato = (i: Iscrizione, stato: StatoIscrizione, ok: string) =>
    fai(() => api.cambiaStatoIscrizione(i.id, stato), ok);

  const visibili = p ? p.iscrizioni.filter(FILTRI[filtro].vale) : [];

  return (
    <>
      <Testata
        titolo={p ? p.viaggio.titolo : "Partenza"}
        sotto={p ? `${formattaData(p.dataInizio)} – ${formattaData(p.dataFine)}` : undefined}
        indietro="/webapp/partenze"
        aggiorna={ricarica}
      />
      <Stato dati={p}>
        {p && (
          <>
            <div className="wa-scheda wa-riassunto">
              <span className="wa-riga-info">
                <strong>
                  {p.postiOccupati}/{p.postiTotali} posti
                </strong>
                <StatoPartenza p={p} />
              </span>
              <Barra valore={p.postiOccupati} totale={p.postiTotali} etichetta="Posti occupati" />
              <span className="wa-piccolo">
                {p.confermate} confermati (minimo {p.minimoPartecipanti}) · incassati {formattaEuro(p.incassatoCentesimi)}
              </span>
            </div>

            {/* Il messaggio dell'ultima operazione resta in alto, sotto la testata. */}
            <div className="wa-avviso">
              <RiquadroAvviso avviso={azioni.avviso} />
            </div>

            <div className="wa-filtri" role="group" aria-label="Filtra gli iscritti">
              {(Object.keys(FILTRI) as Filtro[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={filtro === f}
                  onClick={() => setFiltro(f)}
                >
                  {FILTRI[f].etichetta} <span>{p.iscrizioni.filter(FILTRI[f].vale).length}</span>
                </button>
              ))}
            </div>

            {visibili.length === 0 && <p className="wa-vuoto">Nessuno qui.</p>}
            <ul className="wa-elenco-schede">
              {visibili.map((i) => (
                <SchedaIscritto
                  key={i.id}
                  i={i}
                  prezzo={p.prezzoCentesimi}
                  aperta={aperta === i.id}
                  apriChiudi={() => setAperta(aperta === i.id ? null : i.id)}
                  occupato={azioni.occupato}
                  partenzaPiena={p.postiLiberi <= 0}
                  cambiaStato={cambiaStato}
                  paga={() => {
                    azioni.setAvviso(null);
                    setPagaPer(i);
                  }}
                />
              ))}
            </ul>

            {pagaPer && (
              <FoglioPagamento
                i={pagaPer}
                prezzo={p.prezzoCentesimi}
                acconto={p.accontoCentesimi}
                occupato={azioni.occupato}
                chiudi={() => setPagaPer(null)}
                registra={async (dati) => {
                  const ok = await fai(
                    () => api.registraPagamento(pagaPer.id, dati),
                    `Pagamento di ${formattaEuro(dati.importoCentesimi)} registrato`,
                  );
                  if (ok) setPagaPer(null);
                  return ok;
                }}
                errore={azioni.avviso?.tipo === "errore" ? azioni.avviso.testo : undefined}
              />
            )}
          </>
        )}
      </Stato>
    </>
  );
}

function SchedaIscritto(props: {
  i: Iscrizione;
  prezzo: number;
  aperta: boolean;
  apriChiudi: () => void;
  occupato: boolean;
  partenzaPiena: boolean;
  cambiaStato: (i: Iscrizione, stato: StatoIscrizione, ok: string) => unknown;
  paga: () => void;
}) {
  const { i } = props;
  const rif = useRef<HTMLLIElement>(null);

  // Se la scheda è aperta quando arriviamo (link da "Oggi"), la portiamo in vista.
  useEffect(() => {
    if (props.aperta) rif.current?.scrollIntoView({ block: "center" });
    // Solo al primo disegno: non vogliamo che la pagina salti ogni volta che si apre una scheda.
  }, []);

  const puoPagare = i.stato === "richiesta" || i.stato === "confermata";

  return (
    <li ref={rif} className={`wa-scheda wa-iscritto ${props.aperta ? "aperta" : ""}`}>
      <button type="button" className="wa-iscritto-testa" aria-expanded={props.aperta} onClick={props.apriChiudi}>
        <span className="wa-riga-testo">
          <strong>
            {i.nome} {i.cognome}
          </strong>
          <span className="wa-stati">
            <StatoIscritto stato={i.stato} />
            <StatoPagato stato={i.statoPagamento} />
          </span>
        </span>
        <span className="wa-importo">
          {formattaEuro(i.pagatoCentesimi)}
          <small>su {formattaEuro(props.prezzo)}</small>
        </span>
      </button>

      {props.aperta && (
        <div className="wa-iscritto-corpo">
          {/* tel:, https://wa.me/ e mailto: aprono le app del telefono già pronte. */}
          <div className="wa-contatti">
            <a href={`tel:${i.telefono.replace(/\s/g, "")}`}>📞 Chiama</a>
            <a href={`https://wa.me/${numeroWhatsApp(i.telefono)}`} target="_blank" rel="noreferrer">
              💬 WhatsApp
            </a>
            <a href={`mailto:${i.email}?subject=${encodeURIComponent(`Il tuo viaggio · ${i.codice}`)}`}>✉️ Email</a>
          </div>

          <p className="wa-piccolo">
            Codice <strong>{i.codice}</strong> · {i.telefono}
            <br />
            {i.email}
          </p>
          {i.note && <p className="wa-nota">“{i.note}”</p>}

          {i.pagamenti.length > 0 && (
            <ul className="wa-pagamenti">
              {i.pagamenti.map((pg) => (
                <li key={pg.id}>
                  <span>
                    {formattaData(pg.data)} · {etichetteMetodi[pg.metodo]}
                    {pg.nota && <span className="wa-piccolo"> · {pg.nota}</span>}
                  </span>
                  <strong>{formattaEuro(pg.importoCentesimi)}</strong>
                </li>
              ))}
            </ul>
          )}

          <div className="wa-azioni">
            {puoPagare && i.statoPagamento !== "saldato" && (
              <button type="button" className="wa-pulsante primario" disabled={props.occupato} onClick={props.paga}>
                Registra pagamento
              </button>
            )}
            {(i.stato === "richiesta" || i.stato === "lista_attesa") && (
              <button
                type="button"
                className="wa-pulsante"
                disabled={props.occupato}
                onClick={() => props.cambiaStato(i, "confermata", `${i.nome} confermato/a`)}
              >
                Conferma
              </button>
            )}
            {i.stato === "annullata" ? (
              <button
                type="button"
                className="wa-pulsante"
                disabled={props.occupato}
                onClick={() =>
                  props.partenzaPiena
                    ? props.cambiaStato(i, "lista_attesa", `Partenza piena: ${i.nome} è in lista d'attesa`)
                    : props.cambiaStato(i, "richiesta", `Iscrizione di ${i.nome} ripristinata`)
                }
              >
                Ripristina
              </button>
            ) : (
              <button
                type="button"
                className="wa-pulsante pericolo"
                disabled={props.occupato}
                onClick={() =>
                  window.confirm(`Annullare l'iscrizione di ${i.nome} ${i.cognome}? Il posto si libera.`) &&
                  props.cambiaStato(i, "annullata", `Iscrizione di ${i.nome} annullata`)
                }
              >
                Annulla iscrizione
              </button>
            )}
          </div>
          <p className="wa-piccolo">Per correggere un pagamento sbagliato usa la versione completa.</p>
        </div>
      )}
    </li>
  );
}

/**
 * Il "foglio" che sale dal basso per registrare un pagamento.
 * Propone già l'importo giusto: l'acconto se non è ancora arrivato, altrimenti il saldo.
 */
function FoglioPagamento(props: {
  i: Iscrizione;
  prezzo: number;
  acconto: number;
  occupato: boolean;
  chiudi: () => void;
  registra: (dati: ReturnType<typeof pagamentoInputSchema.parse>) => Promise<boolean>;
  errore?: string;
}) {
  const { i } = props;
  const mancaAcconto = Math.max(props.acconto - i.pagatoCentesimi, 0);
  const mancaSaldo = Math.max(props.prezzo - i.pagatoCentesimi, 0);
  const [importo, setImporto] = useState(euroPerCampo(mancaAcconto > 0 ? mancaAcconto : mancaSaldo));
  const [metodo, setMetodo] = useState<MetodoPagamento>("bonifico");
  const [data, setData] = useState(oggi());
  const [nota, setNota] = useState("");
  const [errore, setErrore] = useState<string | null>(null);

  // Il tasto "indietro" della tastiera fisica o Esc chiude il foglio.
  useEffect(() => {
    const tasto = (e: KeyboardEvent) => e.key === "Escape" && props.chiudi();
    window.addEventListener("keydown", tasto);
    return () => window.removeEventListener("keydown", tasto);
  }, [props]);

  async function invia(e: FormEvent) {
    e.preventDefault();
    const centesimi = euroInCentesimi(importo);
    const r = pagamentoInputSchema.safeParse({ importoCentesimi: centesimi ?? 0, data, metodo, nota });
    if (centesimi === null) return setErrore("Scrivi un importo, per esempio 200 o 200,50");
    if (!r.success) return setErrore(r.error.issues[0]?.message ?? "Dati non validi");
    setErrore(null);
    await props.registra(r.data);
  }

  return (
    <div className="wa-sfondo-foglio" onClick={props.chiudi}>
      <form
        className="wa-foglio"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titolo-foglio"
        onSubmit={invia}
        onClick={(e) => e.stopPropagation()}
        noValidate
      >
        <h2 id="titolo-foglio">
          Pagamento di {i.nome} {i.cognome}
        </h2>
        <p className="wa-piccolo">
          Ha pagato {formattaEuro(i.pagatoCentesimi)} su {formattaEuro(props.prezzo)}. Causale: {i.codice}
        </p>

        <label className="wa-campo">
          <span>Importo (€)</span>
          <input
            value={importo}
            onChange={(e) => setImporto(e.target.value)}
            inputMode="decimal"
            aria-invalid={errore ? true : undefined}
          />
        </label>
        <div className="wa-scorciatoie">
          {mancaAcconto > 0 && (
            <button type="button" onClick={() => setImporto(euroPerCampo(mancaAcconto))}>
              Acconto {formattaEuro(mancaAcconto)}
            </button>
          )}
          {mancaSaldo > 0 && (
            <button type="button" onClick={() => setImporto(euroPerCampo(mancaSaldo))}>
              Tutto il resto {formattaEuro(mancaSaldo)}
            </button>
          )}
        </div>

        <fieldset className="wa-campo">
          <legend>Metodo</legend>
          <div className="wa-segmenti">
            {METODI_PAGAMENTO.map((m) => (
              <button key={m} type="button" aria-pressed={metodo === m} onClick={() => setMetodo(m)}>
                {etichetteMetodi[m]}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="wa-due">
          <label className="wa-campo">
            <span>Data</span>
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </label>
          <label className="wa-campo">
            <span>Nota</span>
            <input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="facoltativa" />
          </label>
        </div>

        {(errore || props.errore) && (
          <p className="wa-errore" role="alert">
            {errore ?? props.errore}
          </p>
        )}

        <div className="wa-azioni">
          <button type="submit" className="wa-pulsante primario largo" disabled={props.occupato}>
            Registra
          </button>
          <button type="button" className="wa-pulsante leggero" onClick={props.chiudi}>
            Annulla
          </button>
        </div>
      </form>
    </div>
  );
}
