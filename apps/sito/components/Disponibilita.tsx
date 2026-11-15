// L'etichetta colorata di una partenza: "Partenza garantita", "Ultimi 3 posti", "Completo".
// La regola (quando un posto è "ultimo", quando è "completo") resta quella di
// disponibilita() in packages/shared, uguale per sito e gestionale; qui scegliamo solo
// il testo nella lingua della pagina.
import { disponibilita, type PartenzaPubblica } from "@waintogo/shared";
import { dizionario } from "../lib/dizionari";
import type { Lingua } from "../lib/lingue";

type Partenza = Pick<PartenzaPubblica, "postiLiberi" | "garantita">;

export function testoDisponibilita(p: Partenza, lingua: Lingua) {
  const t = dizionario(lingua).disponibilita;
  const { tipo } = disponibilita(p);
  if (tipo === "completo") return t.completo;
  if (tipo === "ultimi") return t.ultimi(p.postiLiberi);
  if (tipo === "garantita") return t.garantita;
  return t.disponibili(p.postiLiberi);
}

export function Disponibilita({ partenza, lingua }: { partenza: Partenza; lingua: Lingua }) {
  return <span className={`etichetta e-${disponibilita(partenza).tipo}`}>{testoDisponibilita(partenza, lingua)}</span>;
}
