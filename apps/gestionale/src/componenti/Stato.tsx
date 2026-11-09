import type { StatoViaggio } from "@waintogo/shared";

const etichette: Record<StatoViaggio, string> = {
  bozza: "Bozza",
  pubblicato: "Pubblicato",
  chiuso: "Chiuso",
};

/** Etichetta colorata con lo stato del viaggio. */
export function Stato({ stato }: { stato: StatoViaggio }) {
  return <span className={`stato stato-${stato}`}>{etichette[stato]}</span>;
}
