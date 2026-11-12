// Pezzi usati da più schermate della webapp.
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { Link } from "react-router";

/**
 * Carica dei dati dall'API e li ricarica quando si torna sull'app
 * (per esempio dopo aver risposto a un messaggio su WhatsApp): così non sono mai vecchi.
 * dati: undefined = caricamento, null = errore.
 */
export function useDati<T>(carica: () => Promise<T>) {
  const [dati, setDati] = useState<T | null>();
  const ricarica = useCallback(() => carica().then(setDati, () => setDati(null)), [carica]);

  useEffect(() => {
    ricarica();
    const quandoTorna = () => document.visibilityState === "visible" && ricarica();
    document.addEventListener("visibilitychange", quandoTorna);
    return () => document.removeEventListener("visibilitychange", quandoTorna);
  }, [ricarica]);

  return { dati, setDati, ricarica };
}

/** La testata in alto: titolo, eventuale freccia "indietro" e pulsante per aggiornare. */
export function Testata(props: { titolo: string; sotto?: string; indietro?: string; aggiorna?: () => unknown }) {
  return (
    <header className="wa-testata">
      {props.indietro && (
        <Link to={props.indietro} className="wa-indietro" aria-label="Indietro">
          ‹
        </Link>
      )}
      <div className="wa-titoli">
        <h1>{props.titolo}</h1>
        {props.sotto && <p>{props.sotto}</p>}
      </div>
      {props.aggiorna && (
        <button type="button" className="wa-icona" onClick={() => props.aggiorna?.()} aria-label="Aggiorna">
          ↻
        </button>
      )}
    </header>
  );
}

/** Cosa mostrare mentre si carica o se l'API non risponde. */
export function Stato({ dati, children }: { dati: unknown; children: ReactNode }) {
  if (dati === undefined) return <p className="wa-vuoto">Caricamento…</p>;
  if (dati === null) return <p className="wa-errore">Non riesco a contattare il server. Sei connesso?</p>;
  return children;
}

/** Una barra che si riempie: per i posti occupati di una partenza. */
export function Barra({ valore, totale, etichetta }: { valore: number; totale: number; etichetta: string }) {
  const percentuale = totale > 0 ? Math.min(100, Math.round((valore / totale) * 100)) : 0;
  return (
    <div className="wa-barra-posti" role="img" aria-label={etichetta}>
      <span style={{ width: `${percentuale}%` }} />
    </div>
  );
}

/**
 * Trasforma un numero di telefono nel formato che vuole WhatsApp: solo cifre, con il prefisso del paese.
 * Se manca il "+", diamo per scontato che sia un numero italiano (+39).
 */
export function numeroWhatsApp(telefono: string) {
  const cifre = telefono.replace(/[^0-9]/g, "");
  return telefono.trim().startsWith("+") ? cifre : `39${cifre}`;
}
