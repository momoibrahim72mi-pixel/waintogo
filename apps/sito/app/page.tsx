// Home page: è tutto il sito in una pagina, pensata prima per il telefono.
// Le sezioni, nell'ordine (ognuna ha un id: il menu ci porta con "/#id"):
//   apertura           "Scopri il nostro prossimo viaggio"
//   #prossimo-viaggio  il viaggio che si può prenotare adesso
//   #cosa-facciamo     viaggi, weekend, day trip, retreat
//   #viaggi-passati    i viaggi già fatti
//   #chi-siamo, #faq, #contatti
// È un "Server Component": viene generata sul server a ogni visita (SSR), quindi Google
// e chi condivide il link su WhatsApp ricevono già l'HTML completo.
import { disponibilita, type ViaggioPassato, type ViaggioPubblico } from "@waintogo/shared";
import Link from "next/link";
import { Contatti } from "../components/Contatti";
import { Copertina } from "../components/Copertina";
import { Domande } from "../components/Domande";
import { catalogo, viaggiPassati } from "../lib/api";
import { dataBreve, intervallo, nomeMese, prezzo } from "../lib/formato";

// Le cose che facciamo. Testi in BOZZA: da adattare quando sarà chiaro il programma.
const ATTIVITA = [
  { nome: "Viaggi", durata: "una settimana o più", testo: "Il viaggio vero: un posto lontano, un gruppo piccolo, un coordinatore che parte con voi." },
  { nome: "Weekend trip", durata: "2–3 giorni", testo: "Ponti e fine settimana in Italia e in Europa: si parte il venerdì, si torna con amici nuovi." },
  { nome: "Day trip", durata: "una giornata", testo: "Partenza la mattina, rientro la sera: un'escursione, un borgo, un lago. Il modo più facile per conoscerci." },
  { nome: "Retreat", durata: "qualche giorno", testo: "Per staccare davvero: natura, ritmi lenti, attività insieme e il telefono in tasca." },
];

export default async function Home() {
  const [viaggi, passati] = await Promise.all([catalogo(), viaggiPassati()]);
  // Il "prossimo viaggio" è quello con la partenza più vicina. Di solito ce n'è uno solo;
  // se ce ne sono altri si vedono in piccolo sotto ("Più avanti").
  const inProgramma = viaggi
    .filter((v) => v.partenze.length > 0)
    .sort((a, b) => a.partenze[0]!.dataInizio.localeCompare(b.partenze[0]!.dataInizio));
  const [prossimo, ...altri] = inProgramma;

  return (
    <>
      <section className={`apertura ${prossimo?.immagineUrl ? "con-foto" : ""}`}>
        {prossimo?.immagineUrl && (
          // La foto del prossimo viaggio fa da sfondo. alt vuoto: è decorativa, il titolo è sotto.
          // eslint-disable-next-line @next/next/no-img-element
          <img className="sfondo" src={prossimo.immagineUrl} alt="" />
        )}
        <div className="contenitore">
          <p className="occhiello">Viaggi · weekend · day trip · retreat</p>
          <h1>
            Scopri il nostro <em>prossimo viaggio</em>
          </h1>
          <p>Piccoli gruppi, persone nuove e un coordinatore sempre con voi. Un viaggio alla volta, fatto bene.</p>
          <a className="pulsante" href="#prossimo-viaggio">
            {prossimo ? `Dove andiamo? ${prossimo.destinazione}` : "Scopri il prossimo viaggio"} ↓
          </a>
        </div>
      </section>

      <section className="sezione" id="prossimo-viaggio">
        <div className="contenitore stretto">
          <p className="occhiello">Prossimo viaggio</p>
          {prossimo ? <ProssimoViaggio viaggio={prossimo} /> : <InPreparazione />}

          {altri.length > 0 && (
            <div className="piu-avanti">
              <h3>Più avanti</h3>
              <ul>
                {altri.map((v) => (
                  <li key={v.id}>
                    <Link href={`/viaggi/${v.slug}`}>
                      <strong>{v.titolo}</strong>
                      <span>{dataBreve(v.partenze[0]!.dataInizio, true)} →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="sezione sezione-scura" id="cosa-facciamo">
        <div className="contenitore">
          <p className="occhiello">Cosa facciamo</p>
          <h2>Non solo viaggi</h2>
          <p className="introduzione">Un giorno, un weekend o una settimana: cambia la durata, non lo spirito.</p>
          <ul className="attivita">
            {ATTIVITA.map((a, i) => (
              <li key={a.nome} className={`attivita-${i + 1}`}>
                <span className="attivita-durata">{a.durata}</span>
                <h3>{a.nome}</h3>
                <p>{a.testo}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="sezione" id="viaggi-passati">
        <div className="contenitore">
          <p className="occhiello">Viaggi passati</p>
          <h2>Dove siamo già stati</h2>
          {passati.length > 0 ? (
            // Sul telefono le tessere scorrono di lato con il dito; sul computer stanno in griglia.
            <ul className="passati">
              {passati.map((v) => (
                <TesseraPassato key={`${v.slug}-${v.dataInizio}`} viaggio={v} />
              ))}
            </ul>
          ) : (
            <p className="vuoto">Il primo viaggio deve ancora partire: le foto dei nostri viaggi finiranno qui.</p>
          )}
        </div>
      </section>

      <section className="sezione sezione-chiara" id="chi-siamo">
        <div className="contenitore stretto">
          <p className="occhiello">Chi siamo</p>
          <h2>Un gruppo di amici che organizza viaggi</h2>
          {/* BOZZA: da sostituire con la vostra storia (e magari una foto del gruppo). */}
          <p className="introduzione">
            Abbiamo iniziato organizzando viaggi per noi e per gli amici degli amici. Ci piace partire in pochi, scegliere
            posti da vivere e non solo da vedere, e tornare a casa con persone nuove nella rubrica.
          </p>
          <p className="introduzione">
            Ogni viaggio ha un coordinatore che parte con il gruppo: pensa all&apos;organizzazione, così voi pensate solo a
            godervelo.
          </p>
        </div>
      </section>

      <section className="sezione" id="faq">
        <div className="contenitore stretto">
          <p className="occhiello">FAQ</p>
          <h2>Domande frequenti</h2>
          <Domande />
        </div>
      </section>

      <section className="sezione sezione-chiara" id="contatti">
        <div className="contenitore stretto centrato">
          <p className="occhiello">Contatti</p>
          <h2>Scrivici</h2>
          <p className="introduzione">Hai una domanda sul viaggio o vuoi solo conoscerci prima? Rispondiamo noi, non un bot.</p>
          <Contatti />
        </div>
      </section>

      {/* La chiusura: il pulsante al centro riporta al prossimo viaggio. */}
      <section className="sezione chiusura">
        <div className="contenitore centrato">
          <h2>Pronto a partire?</h2>
          <a className="pulsante" href="#prossimo-viaggio">
            Scopri il prossimo viaggio
          </a>
        </div>
      </section>
    </>
  );
}

/** La scheda grande del viaggio prenotabile: foto, date, prezzo, posti e il pulsante per prenotare. */
function ProssimoViaggio({ viaggio: v }: { viaggio: ViaggioPubblico }) {
  const p = v.partenze[0]!;
  const stato = disponibilita(p);
  const altreDate = v.partenze.length - 1;
  return (
    <article className="prossimo">
      <div className="copertina">
        <Copertina viaggio={v} />
        <span className={`etichetta e-${stato.tipo}`}>{stato.testo}</span>
      </div>
      <div className="prossimo-corpo">
        <p className="prossimo-date">{intervallo(p.dataInizio, p.dataFine)}</p>
        <h2>{v.titolo}</h2>
        {v.sottotitolo && <p className="prossimo-sotto">{v.sottotitolo}</p>}
        <ul className="prossimo-dati">
          <li>{v.destinazione}</li>
          <li>{v.durataGiorni} giorni</li>
          {v.fasciaEta && <li>{v.fasciaEta}</li>}
          {p.coordinatore && <li>con {p.coordinatore}</li>}
        </ul>
        <p className="prossimo-prezzo">
          {prezzo(p.prezzoCentesimi)}
          <small>acconto {prezzo(p.accontoCentesimi)} per tenere il posto</small>
        </p>
        <div className="prossimo-azioni">
          <Link className="pulsante" href={`/viaggi/${v.slug}/iscriviti?partenza=${p.id}`}>
            {stato.tipo === "completo" ? "Mettiti in lista d'attesa" : "Prenota il tuo posto"}
          </Link>
          <Link className="pulsante pulsante-secondario" href={`/viaggi/${v.slug}`}>
            Vedi il programma
          </Link>
        </div>
        <p className="piccolo">
          Non paghi niente adesso: ti teniamo il posto e ti mandiamo i dati per l&apos;acconto (bonifico o Revolut).
          {altreDate > 0 && (
            <>
              {" "}
              <Link href={`/viaggi/${v.slug}#partenze`}>
                {altreDate === 1 ? "C'è anche un'altra data" : `Ci sono altre ${altreDate} date`}
              </Link>
              .
            </>
          )}
        </p>
      </div>
    </article>
  );
}

/** Quando non c'è nessun viaggio prenotabile. */
function InPreparazione() {
  return (
    <div className="vuoto">
      <h2>Stiamo preparando il prossimo viaggio</h2>
      <p>Scrivici per saperlo per primo, o guarda dove siamo già stati.</p>
      <a className="pulsante pulsante-secondario" href="#contatti">
        Contattaci
      </a>
    </div>
  );
}

/** Una tessera della sezione "Viaggi passati": foto (o colore), titolo e quando. */
function TesseraPassato({ viaggio: v }: { viaggio: ViaggioPassato }) {
  return (
    <li className="passato">
      <div className="copertina">
        <Copertina viaggio={v} />
      </div>
      <div className="passato-testo">
        <strong>{v.titolo}</strong>
        <span>
          {nomeMese(v.dataInizio.slice(0, 7))} · {v.durataGiorni} {v.durataGiorni === 1 ? "giorno" : "giorni"}
        </span>
      </div>
    </li>
  );
}
