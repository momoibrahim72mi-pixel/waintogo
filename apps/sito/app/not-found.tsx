// La pagina "non trovato". Next la mostra quando una pagina chiama notFound() (viaggio che
// non esiste) e per ogni indirizzo che non corrisponde a nulla (/pippo, /en/pippo).
// Non riceve i parametri della pagina: la lingua la ricava dall'indirizzo (lib/lingua-richiesta.ts).
import Link from "next/link";
import { dizionario } from "../lib/dizionari";
import { linguaRichiesta } from "../lib/lingua-richiesta";
import { percorso } from "../lib/lingue";

export default async function NonTrovato() {
  const lingua = await linguaRichiesta();
  const t = dizionario(lingua);
  return (
    <section className="sezione">
      <div className="contenitore centrato">
        <h1>{t.nonTrovato.titolo}</h1>
        <p className="introduzione">{t.nonTrovato.testo}</p>
        <Link href={percorso(lingua, "/#prossimo-viaggio")} className="pulsante">
          {t.home.scopri}
        </Link>
      </div>
    </section>
  );
}
