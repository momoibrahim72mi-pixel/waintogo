// La sezione "Traduzioni" nella scheda di un viaggio: inglese e arabo per il sito.
//
// Il giro normale (vedi D31 e docs/lingue.md):
//   1. "Copia il testo per la traduzione": copia i testi italiani, pronti da mandare a Claude;
//   2. Claude risponde con un blocco { "en": {...}, "ar": {...} };
//   3. "Incolla la traduzione": si incolla il blocco, le due lingue diventano BOZZE;
//   4. si rilegge accanto all'italiano, si corregge se serve, e si preme "Approva".
// Solo le traduzioni approvate vanno sul sito. Se si cambia l'italiano, tornano "da rivedere".
// Se l'API ha un traduttore automatico (DeepL...), c'è anche "Traduci automaticamente".
import {
  ETICHETTE_STATI_TRADUZIONE,
  LINGUE_TRADUZIONE,
  type LinguaTraduzione,
  NOMI_LINGUE_TRADUZIONE,
  type TestiTradotti,
  testiDaTradurre,
  testiTradottiSchema,
  type Traduzione,
  type Viaggio,
} from "@waintogo/shared";
import { useEffect, useState } from "react";
import { api, ErroreApi, type StatoTraduzioni } from "../api";
import { RiquadroAvviso, useAzioni } from "./azioni";

export function SezioneTraduzioni({ viaggio }: { viaggio: Viaggio }) {
  const [stato, setStato] = useState<StatoTraduzioni | null>(null);
  const [incolla, setIncolla] = useState<string | null>(null);
  const { occupato, avviso, setAvviso, esegui } = useAzioni();

  // Si ricarica quando cambia il viaggio salvato: dopo una modifica all'italiano lo stato cambia.
  useEffect(() => {
    api.traduzioni(viaggio.id).then(setStato, () => setAvviso({ tipo: "errore", testo: "Non riesco a caricare le traduzioni" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viaggio.id, viaggio.aggiornatoIl]);

  const italiano = testiDaTradurre(viaggio);

  async function copia() {
    // Il testo da mandare a Claude: una riga di istruzioni e i testi italiani in JSON.
    const testo =
      `Traduci in inglese (en) e in arabo (ar) questo viaggio di waintogo per il sito. ` +
      `Rispondi con un solo blocco JSON {"en": {...}, "ar": {...}} con gli stessi campi e gli stessi giorni.\n\n` +
      JSON.stringify(italiano, null, 2);
    try {
      await navigator.clipboard.writeText(testo);
      setAvviso({ tipo: "ok", testo: "Testo copiato: incollalo a Claude nella chat del progetto" });
    } catch {
      // Alcuni browser non permettono di copiare: mostriamo il testo da copiare a mano.
      setIncolla(testo);
      setAvviso({ tipo: "errore", testo: "Il browser non ha permesso di copiare: copia tu il testo qui sotto" });
    }
  }

  function salvaIncollato() {
    const letto = leggiBlocco(incolla ?? "");
    if (typeof letto === "string") {
      setAvviso({ tipo: "errore", testo: letto });
      return;
    }
    esegui(async () => {
      let ultimo: StatoTraduzioni | null = null;
      for (const [lingua, testi] of letto) ultimo = await api.salvaTraduzione(viaggio.id, lingua, testi);
      if (ultimo) setStato(ultimo);
      setIncolla(null);
    }, "Traduzione salvata come bozza: rileggila e premi Approva");
  }

  if (!stato) return <section className="riquadro">{avviso ? <RiquadroAvviso avviso={avviso} /> : "Caricamento traduzioni…"}</section>;

  return (
    <section className="riquadro" id="traduzioni">
      <h2>Traduzioni per il sito</h2>
      <p className="sotto">
        Il sito si legge anche in inglese e in arabo. Una traduzione va sul sito solo dopo che l&apos;hai approvata; se
        poi cambi il testo italiano, torna da rivedere e intanto il sito mostra l&apos;italiano.
      </p>
      <RiquadroAvviso avviso={avviso} />
      <div className="azioni">
        <button type="button" className="pulsante" onClick={copia} disabled={occupato}>
          Copia il testo per la traduzione
        </button>
        <button type="button" className="pulsante" onClick={() => setIncolla(incolla === null ? "" : null)} disabled={occupato}>
          Incolla la traduzione
        </button>
      </div>

      {incolla !== null && (
        <div className="sotto-modulo" style={{ marginTop: "1rem" }}>
          <h3>Incolla la traduzione</h3>
          <p className="sotto">Incolla qui il blocco che ti ha mandato Claude, così com&apos;è (anche con le righe ```).</p>
          <textarea
            className="incolla"
            value={incolla}
            onChange={(e) => setIncolla(e.target.value)}
            rows={10}
            aria-label="Blocco della traduzione"
            spellCheck={false}
          />
          <div className="azioni">
            <button type="button" className="pulsante primario" onClick={salvaIncollato} disabled={occupato || !incolla.trim()}>
              Salva come bozza
            </button>
            <button type="button" className="pulsante leggero" onClick={() => setIncolla(null)}>
              Annulla
            </button>
          </div>
        </div>
      )}

      {stato.traduzioni.map((t) => (
        <SchedaLingua
          key={t.lingua}
          traduzione={t}
          italiano={italiano}
          automatica={stato.automatica}
          occupato={occupato}
          esegui={esegui}
          aggiorna={setStato}
          viaggioId={viaggio.id}
        />
      ))}
    </section>
  );
}

type PropsLingua = {
  traduzione: Traduzione;
  italiano: TestiTradotti;
  automatica: string | null;
  occupato: boolean;
  esegui: ReturnType<typeof useAzioni>["esegui"];
  aggiorna: (s: StatoTraduzioni) => void;
  viaggioId: string;
};

/** Una lingua: stato, pulsanti e i testi tradotti accanto all'italiano, da correggere. */
function SchedaLingua({ traduzione: t, italiano, automatica, occupato, esegui, aggiorna, viaggioId }: PropsLingua) {
  const [bozza, setBozza] = useState<TestiTradotti | null>(t.testi);
  const [aperta, setAperta] = useState(t.stato === "da_rivedere" || t.stato === "superata");
  useEffect(() => setBozza(t.testi), [t.testi]);

  const nome = NOMI_LINGUE_TRADUZIONE[t.lingua];
  const modificata = JSON.stringify(bozza) !== JSON.stringify(t.testi);
  const dir = t.lingua === "ar" ? "rtl" : "ltr";

  const cambia = (campo: keyof TestiTradotti, valore: string | string[]) => setBozza((b) => (b ? { ...b, [campo]: valore } : b));
  const cambiaTappa = (giorno: number, campo: "titolo" | "descrizione", valore: string) =>
    setBozza((b) => (b ? { ...b, tappe: b.tappe.map((x) => (x.giorno === giorno ? { ...x, [campo]: valore } : x)) } : b));

  const salva = () =>
    esegui(async () => {
      const controllo = testiTradottiSchema.safeParse(bozza);
      if (!controllo.success) {
        const p = controllo.error.issues[0]!;
        throw new ErroreApi(400, `${p.message} (campo ${p.path.join(".")})`);
      }
      aggiorna(await api.salvaTraduzione(viaggioId, t.lingua, controllo.data));
    }, `Correzioni salvate: la traduzione in ${nome.toLowerCase()} è da approvare`);

  const approva = () =>
    esegui(async () => aggiorna(await api.approvaTraduzione(viaggioId, t.lingua)), `${nome}: approvata, ora è sul sito`);

  const traduci = () => {
    if (t.testi && !window.confirm(`Sostituire la traduzione in ${nome.toLowerCase()} con una nuova traduzione automatica?`)) return;
    esegui(async () => {
      aggiorna(await api.traduciAutomaticamente(viaggioId, t.lingua));
      setAperta(true);
    }, `Traduzione automatica pronta: rileggila e premi Approva`);
  };

  return (
    <div className="lingua-traduzione">
      <div className="titolo-pagina">
        <h3>{nome}</h3>
        <span className={`stato trad-${t.stato}`}>{ETICHETTE_STATI_TRADUZIONE[t.stato]}</span>
      </div>
      {t.stato === "superata" && (
        <p className="sotto">
          Hai cambiato il testo italiano dopo questa traduzione. Controlla che dica le stesse cose (o incolla una traduzione
          nuova), poi approva di nuovo.
        </p>
      )}
      <div className="azioni">
        {automatica && (
          <button type="button" className="pulsante" onClick={traduci} disabled={occupato}>
            Traduci automaticamente ({automatica})
          </button>
        )}
        {t.testi && (
          <button type="button" className="pulsante" onClick={() => setAperta(!aperta)}>
            {aperta ? "Nascondi i testi" : "Rileggi e correggi"}
          </button>
        )}
        {t.testi && t.stato !== "approvata" && (
          <button
            type="button"
            className="pulsante primario"
            onClick={approva}
            disabled={occupato || modificata}
            title={modificata ? "Prima salva le correzioni" : undefined}
          >
            Approva e pubblica sul sito
          </button>
        )}
      </div>

      {aperta && bozza && (
        <div className="confronto">
          <p className="sotto">A sinistra l&apos;italiano, a destra la traduzione: correggi direttamente nei campi.</p>
          <Riga etichetta="Titolo" it={italiano.titolo} valore={bozza.titolo} dir={dir} cambia={(v) => cambia("titolo", v)} />
          <Riga etichetta="Sottotitolo" it={italiano.sottotitolo} valore={bozza.sottotitolo} dir={dir} cambia={(v) => cambia("sottotitolo", v)} />
          <Riga etichetta="Destinazione" it={italiano.destinazione} valore={bozza.destinazione} dir={dir} cambia={(v) => cambia("destinazione", v)} />
          <Riga etichetta="Fascia d'età" it={italiano.fasciaEta} valore={bozza.fasciaEta} dir={dir} cambia={(v) => cambia("fasciaEta", v)} />
          <Riga etichetta="Descrizione" it={italiano.descrizione} valore={bozza.descrizione} dir={dir} cambia={(v) => cambia("descrizione", v)} lungo />
          {(["puntiForti", "incluso", "nonIncluso"] as const).map((campo) => (
            <Riga
              key={campo}
              etichetta={{ puntiForti: "Punti forti", incluso: "Cosa è incluso", nonIncluso: "Cosa non è incluso" }[campo]}
              aiuto="Uno per riga"
              it={italiano[campo].join("\n")}
              valore={bozza[campo].join("\n")}
              dir={dir}
              cambia={(v) => cambia(campo, v.split("\n"))}
              lungo
            />
          ))}
          <Riga etichetta="Info utili" it={italiano.infoUtili} valore={bozza.infoUtili} dir={dir} cambia={(v) => cambia("infoUtili", v)} lungo />
          <Riga
            etichetta="Istruzioni per il pagamento"
            aiuto="Controlla che IBAN e nomi siano identici all'italiano"
            it={italiano.istruzioniPagamento}
            valore={bozza.istruzioniPagamento}
            dir={dir}
            cambia={(v) => cambia("istruzioniPagamento", v)}
            lungo
          />
          {bozza.tappe.map((x) => {
            const orig = italiano.tappe.find((y) => y.giorno === x.giorno);
            return (
              <div key={x.giorno}>
                <Riga etichetta={`Giorno ${x.giorno}: titolo`} it={orig?.titolo ?? "—"} valore={x.titolo} dir={dir} cambia={(v) => cambiaTappa(x.giorno, "titolo", v)} />
                <Riga
                  etichetta={`Giorno ${x.giorno}: cosa si fa`}
                  it={orig?.descrizione ?? "—"}
                  valore={x.descrizione}
                  dir={dir}
                  cambia={(v) => cambiaTappa(x.giorno, "descrizione", v)}
                  lungo
                />
              </div>
            );
          })}
          <div className="azioni">
            <button type="button" className="pulsante primario" onClick={salva} disabled={occupato || !modificata}>
              Salva le correzioni
            </button>
            {modificata && (
              <button type="button" className="pulsante leggero" onClick={() => setBozza(t.testi)}>
                Annulla le correzioni
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type PropsRiga = {
  etichetta: string;
  aiuto?: string;
  it: string;
  valore: string;
  dir: "ltr" | "rtl";
  cambia: (v: string) => void;
  lungo?: boolean;
};

/** Una riga del confronto: l'italiano (solo lettura) e la traduzione (modificabile). */
function Riga({ etichetta, aiuto, it, valore, dir, cambia, lungo }: PropsRiga) {
  // Una riga vuota in italiano resta vuota anche tradotta: non la mostriamo.
  if (!it.trim() && !valore.trim()) return null;
  return (
    <div className="riga-confronto">
      <span className="etichetta">
        {etichetta}
        {aiuto && <span className="aiuto"> · {aiuto}</span>}
      </span>
      <div className="originale">{it}</div>
      {lungo ? (
        <textarea value={valore} onChange={(e) => cambia(e.target.value)} dir={dir} rows={Math.min(8, Math.max(2, valore.split("\n").length + 1))} aria-label={`${etichetta} tradotto`} />
      ) : (
        <input value={valore} onChange={(e) => cambia(e.target.value)} dir={dir} aria-label={`${etichetta} tradotto`} />
      )}
    </div>
  );
}

/**
 * Legge il blocco incollato: toglie le eventuali righe ``` e il testo intorno, prende
 * il JSON e controlla ogni lingua con le regole condivise.
 * Restituisce le lingue trovate, oppure un messaggio d'errore da mostrare.
 */
function leggiBlocco(testo: string): [LinguaTraduzione, TestiTradotti][] | string {
  const inizio = testo.indexOf("{");
  const fine = testo.lastIndexOf("}");
  if (inizio < 0 || fine < inizio) return "Non trovo il blocco della traduzione: deve iniziare con { e finire con }";
  let dati: Record<string, unknown>;
  try {
    dati = JSON.parse(testo.slice(inizio, fine + 1));
  } catch {
    return "Il blocco non è completo o è stato modificato: copialo di nuovo per intero";
  }
  const trovate: [LinguaTraduzione, TestiTradotti][] = [];
  for (const lingua of LINGUE_TRADUZIONE) {
    if (!(lingua in dati)) continue;
    const controllo = testiTradottiSchema.safeParse(dati[lingua]);
    if (!controllo.success) {
      const p = controllo.error.issues[0]!;
      return `${NOMI_LINGUE_TRADUZIONE[lingua]}: ${p.message} (campo ${p.path.join(".")})`;
    }
    trovate.push([lingua, controllo.data]);
  }
  return trovate.length > 0 ? trovate : 'Nel blocco non c\'è né "en" né "ar"';
}
