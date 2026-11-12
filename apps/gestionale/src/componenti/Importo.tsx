// Un importo in euro, verde se positivo e rosso se negativo (saldi, margini, differenze).
import { formattaEuro } from "../formato";

export function Importo({ valore }: { valore: number }) {
  return <span className={valore < 0 ? "negativo" : valore > 0 ? "positivo" : undefined}>{formattaEuro(valore)}</span>;
}
