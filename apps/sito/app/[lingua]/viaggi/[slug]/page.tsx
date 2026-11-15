// La pagina di un viaggio. [slug] nel nome della cartella = parte variabile dell'indirizzo:
// /viaggi/islanda-on-the-road → slug = "islanda-on-the-road" (e /en/viaggi/... in inglese).
// I testi fissi (titoli delle sezioni, pulsanti) vengono dal dizionario; quelli del viaggio
// dal database, con gli attributi di lingua di lib/contenuti.ts (oggi sono in italiano).
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Copertina } from "../../../../components/Copertina";
import { Disponibilita } from "../../../../components/Disponibilita";
import { viaggio as caricaViaggio } from "../../../../lib/api";
import { attributiContenuto, nellaLingua } from "../../../../lib/contenuti";
import { dizionario } from "../../../../lib/dizionari";
import { dataBreve, intervallo, prezzo } from "../../../../lib/formato";
import { alternative, linguaDa, percorso } from "../../../../lib/lingue";

type Props = { params: Promise<{ lingua: string; slug: string }> };

// Titolo e descrizione della pagina (quelli che compaiono su Google e su WhatsApp).
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [lingua, trovato] = await Promise.all([linguaDa(params), caricaViaggio(slug)]);
  if (!trovato) return {};
  const v = nellaLingua(trovato, lingua);
  return {
    title: v.titolo,
    description: v.sottotitolo || v.descrizione.slice(0, 160),
    alternates: alternative(lingua, `/viaggi/${v.slug}`),
  };
}

export default async function PaginaViaggio({ params }: Props) {
  const { slug } = await params;
  const lingua = await linguaDa(params);
  const trovato = await caricaViaggio(slug);
  if (!trovato) notFound(); // mostra la pagina "non trovato" (app/not-found.tsx)

  // I testi nella lingua della pagina, se la traduzione è approvata; se no l'italiano.
  const v = nellaLingua(trovato, lingua);
  const t = dizionario(lingua).viaggio;
  const c = attributiContenuto(lingua, v.linguaTesti);
  const prossima = v.partenze[0];
  const iscriviti = (id: string) => percorso(lingua, `/viaggi/${v.slug}/iscriviti?partenza=${id}`);

  return (
    <>
      <section className={`testa-viaggio ${v.immagineUrl ? "" : `c-${v.stili[0] ?? "generico"}`}`}>
        {v.immagineUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="sfondo" src={v.immagineUrl} alt="" />
        )}
        <div className="contenitore">
          <div className="etichette">
            {v.stili.map((s) => (
              <span key={s} className="etichetta e-stile">
                {t.stili[s]}
              </span>
            ))}
            {v.fasciaEta && (
              <span className="etichetta e-stile" {...c}>
                {v.fasciaEta}
              </span>
            )}
          </div>
          <h1 {...c}>{v.titolo}</h1>
          {v.sottotitolo && <p {...c}>{v.sottotitolo}</p>}
        </div>
      </section>

      <div className="contenitore layout-viaggio">
        <div>
          {/* Se la traduzione non c'è ancora, un avviso spiega perché i testi sono in italiano. */}
          {v.linguaTesti !== lingua && <p className="avviso-lingua">{t.soloItaliano}</p>}

          <section className="blocco">
            <h2>{t.il}</h2>
            <p className="testo-lungo" {...c}>
              {v.descrizione}
            </p>
          </section>

          {v.puntiForti.length > 0 && (
            <section className="blocco">
              <h2>{t.puntiForti}</h2>
              <ul className="punti-forti" {...c}>
                {v.puntiForti.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="blocco">
            <h2>{t.giornoPerGiorno}</h2>
            <ol className="itinerario">
              {v.tappe.map((tappa) => (
                <li key={tappa.giorno}>
                  <span className="giorno">{t.giorno(tappa.giorno)}</span>
                  <h3 {...c}>{tappa.titolo}</h3>
                  {tappa.descrizione && <p {...c}>{tappa.descrizione}</p>}
                </li>
              ))}
            </ol>
          </section>

          <section className="blocco inclusi">
            <div className="si">
              <h2>{t.incluso}</h2>
              <ul {...c}>
                {v.incluso.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            {v.nonIncluso.length > 0 && (
              <div className="no">
                <h2>{t.nonIncluso}</h2>
                <ul {...c}>
                  {v.nonIncluso.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="blocco" id="partenze">
            <h2>{t.partenze}</h2>
            {v.partenze.length === 0 && <p className="vuoto">{t.nuoveDate}</p>}
            <div className="partenze">
              {v.partenze.map((p) => (
                <div className="partenza" key={p.id}>
                  <div className="partenza-date">
                    {intervallo(lingua, p.dataInizio, p.dataFine)}
                    <small>{p.coordinatore ? t.coordinatore(p.coordinatore) : t.coordinatoreInArrivo}</small>
                  </div>
                  <Disponibilita partenza={p} lingua={lingua} />
                  <div className="partenza-prezzo">
                    {prezzo(lingua, p.prezzoCentesimi)}
                    <small>{t.acconto(prezzo(lingua, p.accontoCentesimi))}</small>
                  </div>
                  <Link className="pulsante" href={iscriviti(p.id)}>
                    {p.postiLiberi <= 0 ? t.listaAttesaBreve : t.richiedi}
                  </Link>
                </div>
              ))}
            </div>
          </section>

          {v.infoUtili && (
            <section className="blocco">
              <h2>{t.infoUtili}</h2>
              <p className="testo-lungo" {...c}>
                {v.infoUtili}
              </p>
            </section>
          )}
        </div>

        <aside className="in-breve" aria-label={t.inBreve}>
          <div className="copertina" style={{ borderRadius: 10, marginBottom: 16 }}>
            <Copertina viaggio={v} lingua={lingua} />
          </div>
          <h2 style={{ fontSize: "1.2rem" }}>{t.inBreve}</h2>
          <dl>
            <dt>{t.destinazione}</dt>
            <dd>
                  <bdi {...c}>{v.destinazione}</bdi>
                </dd>
            <dt>{t.durata}</dt>
            <dd>{t.giorni(v.durataGiorni)}</dd>
            {v.prezzoDaCentesimi !== null && (
              <>
                <dt>{t.prezzo}</dt>
                <dd>{t.da(prezzo(lingua, v.prezzoDaCentesimi))}</dd>
              </>
            )}
            {v.fasciaEta && (
              <>
                <dt>{t.eta}</dt>
                <dd>
                  <bdi {...c}>{v.fasciaEta}</bdi>
                </dd>
              </>
            )}
            <dt>{t.impegno}</dt>
            <dd>{t.livelli[v.livello]}</dd>
            <dt>{t.prossimaPartenza}</dt>
            <dd>{prossima ? dataBreve(lingua, prossima.dataInizio, true) : t.inArrivo}</dd>
          </dl>
          {v.partenze.length > 0 && (
            <a className="pulsante" href="#partenze">
              {t.scegliData}
            </a>
          )}
        </aside>
      </div>

      {/* Sul telefono "In breve" finisce in fondo alla pagina: questa barra fissa in basso
          tiene sempre a portata di pollice il prezzo e il pulsante per prenotare.
          Sullo schermo largo è nascosta dal CSS (c'è già "In breve" a fianco). */}
      {prossima && (
        <div className="barra-prenota">
          <span>
            <small>{dataBreve(lingua, prossima.dataInizio, true)}</small>
            {prezzo(lingua, prossima.prezzoCentesimi)}
          </span>
          <a className="pulsante" href="#partenze">
            {t.prenotaBreve}
          </a>
        </div>
      )}
    </>
  );
}
