// Pagina "Richiedi il tuo posto": riepilogo della partenza scelta + modulo.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { viaggio as caricaViaggio } from "../../../../../lib/api";
import { attributiContenuto, nellaLingua } from "../../../../../lib/contenuti";
import { dizionario } from "../../../../../lib/dizionari";
import { intervallo, prezzo } from "../../../../../lib/formato";
import { direzione, linguaDa, percorso } from "../../../../../lib/lingue";
import { ModuloIscrizione } from "./ModuloIscrizione";

type Props = {
  params: Promise<{ lingua: string; slug: string }>;
  searchParams: Promise<{ partenza?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = dizionario(await linguaDa(params));
  return { title: t.iscrizione.titolo, robots: { index: false } };
}

export default async function Iscriviti({ params, searchParams }: Props) {
  const [{ slug }, { partenza: partenzaId }, lingua] = await Promise.all([params, searchParams, linguaDa(params)]);
  const trovato = await caricaViaggio(slug);
  if (!trovato) notFound();
  const v = nellaLingua(trovato, lingua);
  const t = dizionario(lingua);
  // Se la partenza nell'indirizzo non c'è (o non è più disponibile) si sceglie la prima.
  const scelta = v.partenze.find((p) => p.id === partenzaId) ?? v.partenze[0];
  // La freccia "indietro" punta verso l'inizio della riga: ← in italiano, → in arabo.
  const indietro = direzione(lingua) === "rtl" ? "→" : "←";

  return (
    <section className="sezione">
      <div className="contenitore" style={{ maxWidth: 820 }}>
        <p>
          <Link href={percorso(lingua, `/viaggi/${v.slug}`)}>
            {indietro} <bdi {...attributiContenuto(lingua, v.linguaTesti)}>{v.titolo}</bdi>
          </Link>
        </p>
        <h1>{t.iscrizione.titolo}</h1>
        {scelta ? (
          <>
            <p className="introduzione">{t.iscrizione.sotto}</p>
            <ModuloIscrizione
              lingua={lingua}
              testi={t.modulo}
              // Titolo e istruzioni di pagamento nella lingua della pagina, se tradotti: la
              // ricevuta dell'API li ha sempre in italiano.
              viaggioTradotto={
                v.linguaTesti === lingua ? { titolo: v.titolo, istruzioniPagamento: v.istruzioniPagamento } : null
              }
              partenze={v.partenze.map((p) => ({
                id: p.id,
                testo: `${intervallo(lingua, p.dataInizio, p.dataFine)} · ${prezzo(lingua, p.prezzoCentesimi)}${p.postiLiberi <= 0 ? ` · ${t.iscrizione.opzioneListaAttesa}` : ""}`,
              }))}
              partenzaScelta={scelta.id}
            />
          </>
        ) : (
          <p className="vuoto">{t.iscrizione.nessunaPartenza}</p>
        )}
      </div>
    </section>
  );
}
