// Catalogo con filtri. I filtri stanno nell'indirizzo (/viaggi?stile=mare&mese=2027-06):
// la pagina si può condividere o salvare già filtrata, e funziona anche senza JavaScript.
import { ETICHETTE_STILI, STILI, type ViaggioPubblico } from "@waintogo/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { SchedaViaggio } from "../../components/SchedaViaggio";
import { catalogo } from "../../lib/api";
import { nomeMese } from "../../lib/formato";

export const metadata: Metadata = { title: "Tutti i viaggi" };

type Filtri = { stile?: string; mese?: string; durata?: string; prezzo?: string };

const DURATE = { breve: "Fino a 7 giorni", media: "8–12 giorni", lunga: "Più di 12 giorni" } as const;
const PREZZI = ["1000", "1500", "2000", "3000"];

/** Tiene i viaggi che rispettano tutti i filtri scelti. */
function filtra(viaggi: ViaggioPubblico[], f: Filtri) {
  return viaggi.filter((v) => {
    if (f.stile && !v.stili.includes(f.stile as never)) return false;
    if (f.mese && !v.partenze.some((p) => p.dataInizio.startsWith(f.mese!))) return false;
    if (f.durata === "breve" && v.durataGiorni > 7) return false;
    if (f.durata === "media" && (v.durataGiorni < 8 || v.durataGiorni > 12)) return false;
    if (f.durata === "lunga" && v.durataGiorni <= 12) return false;
    if (f.prezzo && (v.prezzoDaCentesimi === null || v.prezzoDaCentesimi > Number(f.prezzo) * 100)) return false;
    return true;
  });
}

// In Next.js 16 searchParams arriva come Promise: si legge con await.
export default async function Catalogo({ searchParams }: { searchParams: Promise<Filtri> }) {
  const filtri = await searchParams;
  const tutti = await catalogo();
  const viaggi = filtra(tutti, filtri);
  const mesi = [...new Set(tutti.flatMap((v) => v.partenze.map((p) => p.dataInizio.slice(0, 7))))].sort();
  const filtrato = Object.values(filtri).some(Boolean);

  return (
    <section className="sezione">
      <div className="contenitore">
        <p className="occhiello">Catalogo</p>
        <h1>Tutti i viaggi</h1>
        <p className="introduzione">Scegli lo stile, il periodo e il budget: ti mostriamo i viaggi con le date giuste per te.</p>

        <form className="filtri" action="/viaggi">
          <label>
            Stile
            <select name="stile" defaultValue={filtri.stile ?? ""}>
              <option value="">Tutti</option>
              {STILI.map((s) => (
                <option key={s} value={s}>
                  {ETICHETTE_STILI[s]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Mese di partenza
            <select name="mese" defaultValue={filtri.mese ?? ""}>
              <option value="">Qualsiasi</option>
              {mesi.map((m) => (
                <option key={m} value={m}>
                  {nomeMese(m)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Durata
            <select name="durata" defaultValue={filtri.durata ?? ""}>
              <option value="">Qualsiasi</option>
              {Object.entries(DURATE).map(([k, t]) => (
                <option key={k} value={k}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label>
            Budget
            <select name="prezzo" defaultValue={filtri.prezzo ?? ""}>
              <option value="">Qualsiasi</option>
              {PREZZI.map((p) => (
                <option key={p} value={p}>
                  Fino a {Number(p).toLocaleString("it-IT")} €
                </option>
              ))}
            </select>
          </label>
          <button className="pulsante" type="submit">
            Filtra
          </button>
        </form>

        {viaggi.length > 0 ? (
          <div className="griglia-viaggi">
            {viaggi.map((v) => (
              <SchedaViaggio key={v.id} viaggio={v} />
            ))}
          </div>
        ) : (
          <div className="vuoto">
            <p>Nessun viaggio con questi filtri.</p>
            {filtrato && <Link href="/viaggi">Togli i filtri</Link>}
          </div>
        )}
      </div>
    </section>
  );
}
