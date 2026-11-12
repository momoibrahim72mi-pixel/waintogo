// Home page. È un "Server Component": viene generata sul server a ogni visita (SSR),
// quindi Google e chi condivide il link ricevono già l'HTML completo con i viaggi.
import { ETICHETTE_STILI, STILI, type Stile } from "@waintogo/shared";
import Link from "next/link";
import { SchedaViaggio } from "../components/SchedaViaggio";
import { catalogo } from "../lib/api";
import { nomeMese } from "../lib/formato";
import { Domande } from "./come-funziona/Domande";

const DESCRIZIONI_STILI: Record<Stile, string> = {
  avventura: "Trekking, dune e adrenalina",
  natura: "Parchi, vulcani, aurore",
  citta: "Capitali e quartieri da vivere",
  mare: "Isole, surf e tramonti",
  cultura: "Templi, medine, storia",
  "on-the-road": "Si guida a turno, si va lontano",
};

export default async function Home() {
  const viaggi = await catalogo();
  // I viaggi con la partenza più vicina vengono per primi.
  const inPartenza = viaggi
    .filter((v) => v.partenze.length > 0)
    .sort((a, b) => a.partenze[0]!.dataInizio.localeCompare(b.partenze[0]!.dataInizio))
    .slice(0, 6);
  const mesi = [...new Set(viaggi.flatMap((v) => v.partenze.map((p) => p.dataInizio.slice(0, 7))))].sort();

  return (
    <>
      <section className="apertura">
        <div className="contenitore">
          <p className="occhiello">Viaggi di gruppo con coordinatore</p>
          <h1>
            Parti con persone nuove, <em>torna con amici veri.</em>
          </h1>
          <p>Piccoli gruppi di persone della tua età, un coordinatore sempre con voi e itinerari pensati per vivere il posto, non solo per vederlo.</p>
          {/* Un normale modulo GET: porta al catalogo con i filtri nell'indirizzo, funziona anche senza JavaScript. */}
          <form className="ricerca" action="/viaggi">
            <label>
              Che viaggio cerchi?
              <select name="stile" defaultValue="">
                <option value="">Tutti gli stili</option>
                {STILI.map((s) => (
                  <option key={s} value={s}>
                    {ETICHETTE_STILI[s]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Quando vuoi partire?
              <select name="mese" defaultValue="">
                <option value="">Qualsiasi mese</option>
                {mesi.map((m) => (
                  <option key={m} value={m}>
                    {nomeMese(m)}
                  </option>
                ))}
              </select>
            </label>
            <button className="pulsante" type="submit">
              Cerca viaggi
            </button>
          </form>
          <ul className="vantaggi">
            <li>Gruppi da 10–16 persone</li>
            <li>Coordinatore sempre con voi</li>
            <li>Richiesta gratuita, acconto solo dopo</li>
          </ul>
        </div>
      </section>

      <section className="sezione">
        <div className="contenitore">
          <p className="occhiello">In partenza</p>
          <h2>Le prossime partenze</h2>
          {inPartenza.length > 0 ? (
            <div className="griglia-viaggi">
              {inPartenza.map((v) => (
                <SchedaViaggio key={v.id} viaggio={v} />
              ))}
            </div>
          ) : (
            <p className="vuoto">Stiamo preparando le prossime date. Torna a trovarci presto!</p>
          )}
          <p style={{ marginTop: 24 }}>
            <Link href="/viaggi" className="pulsante pulsante-secondario">
              Vedi tutti i viaggi
            </Link>
          </p>
        </div>
      </section>

      <section className="sezione sezione-chiara">
        <div className="contenitore">
          <p className="occhiello">Stili di viaggio</p>
          <h2>Che viaggiatore sei?</h2>
          <div className="stili">
            {STILI.map((s) => (
              <Link key={s} href={`/viaggi?stile=${s}`} className={`stile c-${s}`}>
                {ETICHETTE_STILI[s]}
                <small>{DESCRIZIONI_STILI[s]}</small>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="sezione">
        <div className="contenitore">
          <p className="occhiello">Come funziona</p>
          <h2>Prenotare è semplice</h2>
          <ol className="passi">
            <li>
              <h3>Scegli viaggio e data</h3>
              <p>Ogni viaggio ha più partenze: guarda prezzo, posti rimasti e chi sarà il tuo coordinatore.</p>
            </li>
            <li>
              <h3>Richiedi il tuo posto</h3>
              <p>Bastano i tuoi dati, non paghi niente online. Il posto resta tenuto per te e ricevi subito il codice di prenotazione.</p>
            </li>
            <li>
              <h3>Paga l&apos;acconto</h3>
              <p>Con bonifico o Revolut, usando il codice come causale. Quando arriva, la tua iscrizione è confermata.</p>
            </li>
          </ol>
        </div>
      </section>

      <section className="sezione sezione-chiara">
        <div className="contenitore">
          <p className="occhiello">Domande frequenti</p>
          <h2>Prima di partire</h2>
          <Domande limite={4} />
          <p>
            <Link href="/come-funziona#domande">Tutte le domande →</Link>
          </p>
        </div>
      </section>
    </>
  );
}
