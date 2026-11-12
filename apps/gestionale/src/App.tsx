// Struttura del gestionale: intestazione con il menu e, sotto, la pagina giusta per l'indirizzo.
//   /                  cruscotto (prossime partenze e cose da fare)
//   /viaggi            elenco dei viaggi
//   /viaggi/nuovo      modulo per un viaggio nuovo
//   /viaggi/:id        modulo per modificare un viaggio, con le sue partenze
//   /partenze/:id      iscritti e pagamenti di una partenza
import { BrowserRouter, Link, NavLink, Route, Routes } from "react-router";
import { Cruscotto } from "./pagine/Cruscotto";
import { ElencoViaggi } from "./pagine/ElencoViaggi";
import { ModuloViaggio } from "./pagine/ModuloViaggio";
import { PaginaPartenza } from "./pagine/PaginaPartenza";

export function App() {
  return (
    <BrowserRouter>
      <header className="intestazione">
        <Link to="/" className="marchio">
          Waintogo <span>gestionale</span>
        </Link>
        <nav className="menu" aria-label="Menu">
          <NavLink to="/" end>
            Cruscotto
          </NavLink>
          <NavLink to="/viaggi">Viaggi</NavLink>
        </nav>
      </header>
      <main className="contenuto">
        <Routes>
          <Route path="/" element={<Cruscotto />} />
          <Route path="/viaggi" element={<ElencoViaggi />} />
          <Route path="/viaggi/nuovo" element={<ModuloViaggio />} />
          <Route path="/viaggi/:id" element={<ModuloViaggio />} />
          <Route path="/partenze/:id" element={<PaginaPartenza />} />
          <Route path="*" element={<p>Pagina non trovata.</p>} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
