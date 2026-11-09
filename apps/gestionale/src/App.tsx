import { useEffect, useState } from "react";

// Primo componente: chiede all'API /health e mostra se risponde.
// Serve a verificare che gestionale e API si parlino.
export function App() {
  const [statoApi, setStatoApi] = useState("controllo in corso…");

  useEffect(() => {
    fetch("/api/health")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((dati: { stato: string }) => setStatoApi(dati.stato))
      .catch(() => setStatoApi("non raggiungibile"));
  }, []);

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
      <h1>Gestionale Waintogo</h1>
      <p>Stato API: {statoApi}</p>
    </main>
  );
}
