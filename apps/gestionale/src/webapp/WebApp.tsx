// La WEBAPP del gestionale: la versione per il telefono, sotto /webapp.
// Usa la stessa API e gli stessi dati della versione completa, ma mostra solo
// quello che serve in giro (in ufficio, in aeroporto, durante il viaggio):
//   /webapp                 Oggi: le cose da fare
//   /webapp/partenze        le prossime partenze
//   /webapp/partenze/:id    gli iscritti di una partenza: chiamare, scrivere, registrare un pagamento
//   /webapp/conti           saldo, spese da pagare, registrare una spesa al volo
// Creare e modificare i viaggi resta nella versione completa: sul telefono sarebbe scomodo.
import { useEffect } from "react";
import { NavLink, Route, Routes } from "react-router";
import { Conti } from "./Conti";
import { Oggi } from "./Oggi";
import { Partenza } from "./Partenza";
import { Partenze } from "./Partenze";
import { registraServiceWorker } from "./installazione";
import "./webapp.css";

export function WebApp() {
  useEffect(() => {
    registraServiceWorker();
  }, []);

  return (
    <div className="wa">
      <div className="wa-pagina">
        <Routes>
          <Route index element={<Oggi />} />
          <Route path="partenze" element={<Partenze />} />
          <Route path="partenze/:id" element={<Partenza />} />
          <Route path="conti" element={<Conti />} />
          <Route path="*" element={<p className="wa-vuoto">Pagina non trovata.</p>} />
        </Routes>
      </div>

      {/* La barra in basso: sul telefono si raggiunge con il pollice. */}
      <nav className="wa-barra" aria-label="Menu">
        <NavLink to="/webapp" end>
          <span aria-hidden="true">✓</span>
          Oggi
        </NavLink>
        <NavLink to="/webapp/partenze">
          <span aria-hidden="true">✈</span>
          Partenze
        </NavLink>
        <NavLink to="/webapp/conti">
          <span aria-hidden="true">€</span>
          Conti
        </NavLink>
        {/* Link normale (non NavLink): esce dalla webapp e apre la versione completa. */}
        <a href="/">
          <span aria-hidden="true">🖥</span>
          Completa
        </a>
      </nav>
    </div>
  );
}
