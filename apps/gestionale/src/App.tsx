// Struttura del gestionale. Ci sono due interfacce sullo stesso indirizzo, con gli stessi dati:
//
// VERSIONE COMPLETA, per computer e portatile (intestazione con il menu in alto):
//   /                  cruscotto (prossime partenze e cose da fare)
//   /viaggi            elenco dei viaggi
//   /viaggi/nuovo      modulo per un viaggio nuovo
//   /viaggi/:id        modulo per modificare un viaggio, con le sue partenze
//   /partenze/:id      iscritti e pagamenti di una partenza, spese e margine
//   /conti             saldo, entrate e uscite, margini, tutte le spese
//
// WEBAPP, per il telefono (barra in basso, installabile sulla schermata home):
//   /webapp/...        vedi webapp/WebApp.tsx
import { BrowserRouter, Link, NavLink, Route, Routes } from "react-router";
import { Conti } from "./pagine/Conti";
import { Cruscotto } from "./pagine/Cruscotto";
import { ElencoViaggi } from "./pagine/ElencoViaggi";
import { ModuloViaggio } from "./pagine/ModuloViaggio";
import { PaginaPartenza } from "./pagine/PaginaPartenza";
import { WebApp } from "./webapp/WebApp";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* "/*" vuol dire "questo indirizzo e tutto quello che c'è sotto". */}
        <Route path="/webapp/*" element={<WebApp />} />
        <Route path="/*" element={<VersioneCompleta />} />
      </Routes>
    </BrowserRouter>
  );
}

function VersioneCompleta() {
  return (
    <>
      <header className="intestazione">
        <Link to="/" className="marchio">
          Waintogo <span>gestionale</span>
        </Link>
        <nav className="menu" aria-label="Menu">
          <NavLink to="/" end>
            Cruscotto
          </NavLink>
          <NavLink to="/viaggi">Viaggi</NavLink>
          <NavLink to="/conti">Conti</NavLink>
        </nav>
        <Link to="/webapp" className="link-webapp">
          📱 App per telefono
        </Link>
      </header>
      <main className="contenuto">
        <Routes>
          <Route path="/" element={<Cruscotto />} />
          <Route path="/viaggi" element={<ElencoViaggi />} />
          <Route path="/viaggi/nuovo" element={<ModuloViaggio />} />
          <Route path="/viaggi/:id" element={<ModuloViaggio />} />
          <Route path="/partenze/:id" element={<PaginaPartenza />} />
          <Route path="/conti" element={<Conti />} />
          <Route path="*" element={<p>Pagina non trovata.</p>} />
        </Routes>
      </main>
    </>
  );
}
