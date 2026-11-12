// Etichette colorate per stati di viaggi, partenze, iscrizioni e pagamenti.
import {
  ETICHETTE_STATI_ISCRIZIONE,
  ETICHETTE_STATI_PAGAMENTO,
  type Partenza,
  type StatoIscrizione,
  type StatoPagamento,
  type StatoViaggio,
} from "@waintogo/shared";

const etichetteViaggio: Record<StatoViaggio, string> = { bozza: "Bozza", pubblicato: "Pubblicato", chiuso: "Chiuso" };

export function Stato({ stato }: { stato: StatoViaggio }) {
  return <span className={`stato stato-${stato}`}>{etichetteViaggio[stato]}</span>;
}

export function StatoIscritto({ stato }: { stato: StatoIscrizione }) {
  return <span className={`stato iscr-${stato}`}>{ETICHETTE_STATI_ISCRIZIONE[stato]}</span>;
}

export function StatoPagato({ stato }: { stato: StatoPagamento }) {
  return <span className={`stato pag-${stato}`}>{ETICHETTE_STATI_PAGAMENTO[stato]}</span>;
}

export function StatoPartenza({ p }: { p: Pick<Partenza, "annullata" | "garantita" | "postiLiberi"> }) {
  if (p.annullata) return <span className="stato iscr-annullata">Annullata</span>;
  if (p.postiLiberi <= 0) return <span className="stato pag-acconto_versato">Completa</span>;
  if (p.garantita) return <span className="stato pag-saldato">Garantita</span>;
  return <span className="stato stato-bozza">Non ancora garantita</span>;
}
