// Pagina "Richiedi il tuo posto": riepilogo della partenza scelta + modulo.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { viaggio as caricaViaggio } from "../../../../lib/api";
import { intervallo, prezzo } from "../../../../lib/formato";
import { ModuloIscrizione } from "./ModuloIscrizione";

export const metadata: Metadata = { title: "Richiedi il tuo posto", robots: { index: false } };

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ partenza?: string }> };

export default async function Iscriviti({ params, searchParams }: Props) {
  const [{ slug }, { partenza: partenzaId }] = await Promise.all([params, searchParams]);
  const v = await caricaViaggio(slug);
  if (!v) notFound();
  // Se la partenza nell'indirizzo non c'è (o non è più disponibile) si sceglie la prima.
  const scelta = v.partenze.find((p) => p.id === partenzaId) ?? v.partenze[0];

  return (
    <section className="sezione">
      <div className="contenitore" style={{ maxWidth: 820 }}>
        <p>
          <Link href={`/viaggi/${v.slug}`}>← {v.titolo}</Link>
        </p>
        <h1>Richiedi il tuo posto</h1>
        {scelta ? (
          <>
            <p className="introduzione">
              Non paghi niente adesso. Ti teniamo il posto e ti diamo subito il codice e i dati per versare l&apos;acconto.
            </p>
            <ModuloIscrizione
              partenze={v.partenze.map((p) => ({
                id: p.id,
                testo: `${intervallo(p.dataInizio, p.dataFine)} · ${prezzo(p.prezzoCentesimi)}${p.postiLiberi <= 0 ? " · lista d'attesa" : ""}`,
              }))}
              partenzaScelta={scelta.id}
            />
          </>
        ) : (
          <p className="vuoto">Al momento non ci sono partenze disponibili per questo viaggio.</p>
        )}
      </div>
    </section>
  );
}
