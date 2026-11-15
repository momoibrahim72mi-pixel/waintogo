// Home page: è tutto il sito in una pagina, pensata prima per il telefono.
// Le sezioni, nell'ordine (ognuna ha un id: il menu ci porta con "/#id"):
//   apertura           "Scopri il nostro prossimo viaggio"
//   #prossimo-viaggio  il viaggio che si può prenotare adesso
//   #cosa-facciamo     viaggi, weekend, day trip, retreat
//   #viaggi-passati    i viaggi già fatti
//   #chi-siamo, #faq, #contatti
// È un "Server Component": viene generata sul server a ogni visita (SSR), quindi Google
// e chi condivide il link su WhatsApp ricevono già l'HTML completo.
//
// Tutti i testi fissi arrivano dal dizionario della lingua (t = dizionario(lingua)); i testi
// dei viaggi arrivano dal database e portano gli attributi di contenutoViaggio (vedi lib/contenuti.ts).
import type { ViaggioPassato, ViaggioPubblico } from "@waintogo/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { Contatti } from "../../components/Contatti";
import { Copertina } from "../../components/Copertina";
import { Domande } from "../../components/Domande";
import { Disponibilita } from "../../components/Disponibilita";
import { catalogo, viaggiPassati } from "../../lib/api";
import { attributiContenuto, nellaLingua } from "../../lib/contenuti";
import { dizionario } from "../../lib/dizionari";
import { dataBreve, intervallo, nomeMese, prezzo } from "../../lib/formato";
import { alternative, direzione, linguaDa, percorso, type Lingua } from "../../lib/lingue";

type Props = { params: Promise<{ lingua: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { alternates: alternative(await linguaDa(params), "/") };
}

export default async function Home({ params }: Props) {
  const lingua = await linguaDa(params);
  const t = dizionario(lingua);
  // La freccia "avanti" punta nel verso della lettura: → in italiano e inglese, ← in arabo.
  const avanti = direzione(lingua) === "rtl" ? "←" : "→";
  const [tutti, tuttiPassati] = await Promise.all([catalogo(), viaggiPassati()]);
  // Ogni viaggio con i testi nella lingua della pagina, se tradotti e approvati (lib/contenuti.ts).
  const viaggi = tutti.map((v) => nellaLingua(v, lingua));
  const passati = tuttiPassati.map((v) => nellaLingua(v, lingua));
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
          <p className="occhiello">{t.home.occhiello}</p>
          <h1>
            {t.home.titolo.prima}
            <em>{t.home.titolo.evidenza}</em>
            {t.home.titolo.dopo}
          </h1>
          <p>{t.home.sotto}</p>
          <a className="pulsante" href="#prossimo-viaggio">
            {/* <bdi> isola la destinazione (che può essere in un'altra lingua) dal resto della frase. */}
            {prossimo ? (
              <span>
                {t.home.doveAndiamo("")}
                <bdi {...attributiContenuto(lingua, prossimo.linguaTesti)}>{prossimo.destinazione}</bdi>
              </span>
            ) : (
              t.home.scopri
            )}{" "}
            ↓
          </a>
        </div>
      </section>

      <section className="sezione" id="prossimo-viaggio">
        <div className="contenitore stretto">
          <p className="occhiello">{t.home.prossimo}</p>
          {prossimo ? <ProssimoViaggio viaggio={prossimo} lingua={lingua} /> : <InPreparazione lingua={lingua} />}

          {altri.length > 0 && (
            <div className="piu-avanti">
              <h3>{t.home.piuAvanti}</h3>
              <ul>
                {altri.map((v) => (
                  <li key={v.id}>
                    <Link href={percorso(lingua, `/viaggi/${v.slug}`)}>
                      <strong {...attributiContenuto(lingua, v.linguaTesti)}>{v.titolo}</strong>
                      <span>
                        {dataBreve(lingua, v.partenze[0]!.dataInizio, true)} {avanti}
                      </span>
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
          <p className="occhiello">{t.home.cosaFacciamo.occhiello}</p>
          <h2>{t.home.cosaFacciamo.titolo}</h2>
          <p className="introduzione">{t.home.cosaFacciamo.sotto}</p>
          <ul className="attivita">
            {t.home.cosaFacciamo.attivita.map((a, i) => (
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
          <p className="occhiello">{t.home.passati.occhiello}</p>
          <h2>{t.home.passati.titolo}</h2>
          {passati.length > 0 ? (
            // Sul telefono le tessere scorrono di lato con il dito; sul computer stanno in griglia.
            <ul className="passati">
              {passati.map((v) => (
                <TesseraPassato key={`${v.slug}-${v.dataInizio}`} viaggio={v} lingua={lingua} />
              ))}
            </ul>
          ) : (
            <p className="vuoto">{t.home.passati.vuoto}</p>
          )}
        </div>
      </section>

      <section className="sezione sezione-chiara" id="chi-siamo">
        <div className="contenitore stretto">
          <p className="occhiello">{t.home.chiSiamo.occhiello}</p>
          <h2>{t.home.chiSiamo.titolo}</h2>
          {t.home.chiSiamo.paragrafi.map((testo) => (
            <p className="introduzione" key={testo}>
              {testo}
            </p>
          ))}
        </div>
      </section>

      <section className="sezione" id="faq">
        <div className="contenitore stretto">
          <p className="occhiello">{t.home.faq.occhiello}</p>
          <h2>{t.home.faq.titolo}</h2>
          <Domande lingua={lingua} />
        </div>
      </section>

      <section className="sezione sezione-chiara" id="contatti">
        <div className="contenitore stretto centrato">
          <p className="occhiello">{t.home.contatti.occhiello}</p>
          <h2>{t.home.contatti.titolo}</h2>
          <p className="introduzione">{t.home.contatti.sotto}</p>
          <Contatti lingua={lingua} />
        </div>
      </section>

      {/* La chiusura: il pulsante al centro riporta al prossimo viaggio. */}
      <section className="sezione chiusura">
        <div className="contenitore centrato">
          <h2>{t.home.chiusura}</h2>
          <a className="pulsante" href="#prossimo-viaggio">
            {t.home.scopri}
          </a>
        </div>
      </section>
    </>
  );
}

/** La scheda grande del viaggio prenotabile: foto, date, prezzo, posti e il pulsante per prenotare. */
function ProssimoViaggio({ viaggio: v, lingua }: { viaggio: ViaggioPubblico & { linguaTesti: Lingua }; lingua: Lingua }) {
  const t = dizionario(lingua).viaggio;
  const c = attributiContenuto(lingua, v.linguaTesti);
  const p = v.partenze[0]!;
  const completo = p.postiLiberi <= 0;
  const altreDate = v.partenze.length - 1;
  const pagina = percorso(lingua, `/viaggi/${v.slug}`);
  return (
    <article className="prossimo">
      <div className="copertina">
        <Copertina viaggio={v} lingua={lingua} />
        <Disponibilita partenza={p} lingua={lingua} />
      </div>
      <div className="prossimo-corpo">
        <p className="prossimo-date">{intervallo(lingua, p.dataInizio, p.dataFine)}</p>
        <h2 {...c}>{v.titolo}</h2>
        {v.sottotitolo && (
          <p className="prossimo-sotto" {...c}>
            {v.sottotitolo}
          </p>
        )}
        <ul className="prossimo-dati">
          <li {...c}>{v.destinazione}</li>
          <li>{t.giorni(v.durataGiorni)}</li>
          {v.fasciaEta && <li {...c}>{v.fasciaEta}</li>}
          {p.coordinatore && <li>{t.con(p.coordinatore)}</li>}
        </ul>
        <p className="prossimo-prezzo">
          {prezzo(lingua, p.prezzoCentesimi)}
          <small>{t.accontoPerPosto(prezzo(lingua, p.accontoCentesimi))}</small>
        </p>
        <div className="prossimo-azioni">
          <Link className="pulsante" href={`${pagina}/iscriviti?partenza=${p.id}`}>
            {completo ? t.listaAttesa : t.prenota}
          </Link>
          <Link className="pulsante pulsante-secondario" href={pagina}>
            {t.programma}
          </Link>
        </div>
        <p className="piccolo">
          {t.nonPaghi}
          {altreDate > 0 && (
            <>
              {" "}
              <Link href={`${pagina}#partenze`}>{t.altreDate(altreDate)}</Link>.
            </>
          )}
        </p>
      </div>
    </article>
  );
}

/** Quando non c'è nessun viaggio prenotabile. */
function InPreparazione({ lingua }: { lingua: Lingua }) {
  const t = dizionario(lingua).home.inPreparazione;
  return (
    <div className="vuoto">
      <h2>{t.titolo}</h2>
      <p>{t.testo}</p>
      <a className="pulsante pulsante-secondario" href="#contatti">
        {t.pulsante}
      </a>
    </div>
  );
}

/** Una tessera della sezione "Viaggi passati": foto (o colore), titolo e quando. */
function TesseraPassato({ viaggio: v, lingua }: { viaggio: ViaggioPassato & { linguaTesti: Lingua }; lingua: Lingua }) {
  return (
    <li className="passato">
      <div className="copertina">
        <Copertina viaggio={v} lingua={lingua} />
      </div>
      <div className="passato-testo">
        <strong {...attributiContenuto(lingua, v.linguaTesti)}>{v.titolo}</strong>
        <span>
          {nomeMese(lingua, v.dataInizio.slice(0, 7))} · {dizionario(lingua).viaggio.giorni(v.durataGiorni)}
        </span>
      </div>
    </li>
  );
}
