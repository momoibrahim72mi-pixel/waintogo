// La pagina di un viaggio. [slug] nel nome della cartella = parte variabile dell'indirizzo:
// /viaggi/islanda-on-the-road → slug = "islanda-on-the-road".
import { disponibilita, ETICHETTE_STILI } from "@waintogo/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Copertina } from "../../../components/Copertina";
import { viaggio as caricaViaggio } from "../../../lib/api";
import { dataBreve, intervallo, prezzo } from "../../../lib/formato";

type Props = { params: Promise<{ slug: string }> };

const LIVELLI = { facile: "Facile", medio: "Medio", impegnativo: "Impegnativo" };

// Titolo e descrizione della pagina (quelli che compaiono su Google e su WhatsApp).
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const v = await caricaViaggio((await params).slug);
  return v ? { title: v.titolo, description: v.sottotitolo || v.descrizione.slice(0, 160) } : {};
}

export default async function PaginaViaggio({ params }: Props) {
  const v = await caricaViaggio((await params).slug);
  if (!v) notFound(); // mostra la pagina "non trovato" (app/not-found.tsx)

  const prossima = v.partenze[0];

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
                {ETICHETTE_STILI[s]}
              </span>
            ))}
            {v.fasciaEta && <span className="etichetta e-stile">{v.fasciaEta}</span>}
          </div>
          <h1>{v.titolo}</h1>
          {v.sottotitolo && <p>{v.sottotitolo}</p>}
        </div>
      </section>

      <div className="contenitore layout-viaggio">
        <div>
          <section className="blocco">
            <h2>Il viaggio</h2>
            <p className="testo-lungo">{v.descrizione}</p>
          </section>

          {v.puntiForti.length > 0 && (
            <section className="blocco">
              <h2>Punti forti</h2>
              <ul className="punti-forti">
                {v.puntiForti.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="blocco">
            <h2>Giorno per giorno</h2>
            <ol className="itinerario">
              {v.tappe.map((t) => (
                <li key={t.giorno}>
                  <span className="giorno">Giorno {t.giorno}</span>
                  <h3>{t.titolo}</h3>
                  {t.descrizione && <p>{t.descrizione}</p>}
                </li>
              ))}
            </ol>
          </section>

          <section className="blocco inclusi">
            <div className="si">
              <h2>Cosa è incluso</h2>
              <ul>
                {v.incluso.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            {v.nonIncluso.length > 0 && (
              <div className="no">
                <h2>Non è incluso</h2>
                <ul>
                  {v.nonIncluso.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="blocco" id="partenze">
            <h2>Partenze e prezzi</h2>
            {v.partenze.length === 0 && <p className="vuoto">Nuove date in arrivo: torna a trovarci presto.</p>}
            <div className="partenze">
              {v.partenze.map((p) => {
                const stato = disponibilita(p);
                return (
                  <div className="partenza" key={p.id}>
                    <div className="partenza-date">
                      {intervallo(p.dataInizio, p.dataFine)}
                      <small>{p.coordinatore ? `Coordinatore: ${p.coordinatore}` : "Coordinatore in arrivo"}</small>
                    </div>
                    <span className={`etichetta e-${stato.tipo}`}>{stato.testo}</span>
                    <div className="partenza-prezzo">
                      {prezzo(p.prezzoCentesimi)}
                      <small>acconto {prezzo(p.accontoCentesimi)}</small>
                    </div>
                    <Link className="pulsante" href={`/viaggi/${v.slug}/iscriviti?partenza=${p.id}`}>
                      {stato.tipo === "completo" ? "Mettiti in lista" : "Richiedi il posto"}
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>

          {v.infoUtili && (
            <section className="blocco">
              <h2>Info utili</h2>
              <p className="testo-lungo">{v.infoUtili}</p>
            </section>
          )}
        </div>

        <aside className="in-breve" aria-label="In breve">
          <div className="copertina" style={{ borderRadius: 10, marginBottom: 16 }}>
            <Copertina viaggio={v} />
          </div>
          <h2 style={{ fontSize: "1.2rem" }}>In breve</h2>
          <dl>
            <dt>Destinazione</dt>
            <dd>{v.destinazione}</dd>
            <dt>Durata</dt>
            <dd>{v.durataGiorni} giorni</dd>
            {v.prezzoDaCentesimi !== null && (
              <>
                <dt>Prezzo</dt>
                <dd>da {prezzo(v.prezzoDaCentesimi)}</dd>
              </>
            )}
            {v.fasciaEta && (
              <>
                <dt>Età</dt>
                <dd>{v.fasciaEta}</dd>
              </>
            )}
            <dt>Impegno fisico</dt>
            <dd>{LIVELLI[v.livello]}</dd>
            <dt>Prossima partenza</dt>
            <dd>{prossima ? dataBreve(prossima.dataInizio, true) : "In arrivo"}</dd>
          </dl>
          {v.partenze.length > 0 && (
            <a className="pulsante" href="#partenze">
              Scegli la data
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
            <small>{dataBreve(prossima.dataInizio, true)}</small>
            {prezzo(prossima.prezzoCentesimi)}
          </span>
          <a className="pulsante" href="#partenze">
            Prenota
          </a>
        </div>
      )}
    </>
  );
}
