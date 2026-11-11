// Un "hook" (funzione use...) che gestisce le operazioni verso l'API in ogni pagina:
// mentre l'operazione è in corso disattiva i pulsanti, poi mostra l'esito o l'errore.
import { useState } from "react";
import { ErroreApi } from "../api";

export type Avviso = { tipo: "ok" | "errore"; testo: string; problemi?: string[] };

export function useAzioni() {
  const [occupato, setOccupato] = useState(false);
  const [avviso, setAvviso] = useState<Avviso | null>(null);
  const [errori, setErrori] = useState<Record<string, string>>({});

  /** Esegue l'operazione; se riesce e c'è un messaggio, lo mostra in verde. */
  async function esegui(operazione: () => Promise<void>, messaggioOk?: string) {
    setOccupato(true);
    setAvviso(null);
    try {
      await operazione();
      setErrori({});
      if (messaggioOk) setAvviso({ tipo: "ok", testo: messaggioOk });
      return true;
    } catch (e) {
      const errore = e instanceof ErroreApi ? e : new ErroreApi(0, "Errore inatteso");
      setErrori(errore.campi);
      setAvviso({ tipo: "errore", testo: errore.message, problemi: errore.problemi });
      return false;
    } finally {
      setOccupato(false);
    }
  }

  return { occupato, avviso, setAvviso, errori, setErrori, esegui };
}

/** Il riquadro verde o rosso con l'esito dell'ultima operazione. */
export function RiquadroAvviso({ avviso }: { avviso: Avviso | null }) {
  if (!avviso) return null;
  return (
    <div className={`avviso ${avviso.tipo}`} role={avviso.tipo === "errore" ? "alert" : "status"}>
      {avviso.testo}
      {avviso.problemi && avviso.problemi.length > 0 && (
        <ul>
          {avviso.problemi.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
