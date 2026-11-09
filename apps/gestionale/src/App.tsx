// Struttura del gestionale: intestazione fissa e, sotto, la pagina giusta per l'indirizzo.
//   /                  elenco dei viaggi
//   /viaggi/nuovo      modulo per un viaggio nuovo
//   /viaggi/:id        modulo per modificare un viaggio esistente
import { BrowserRouter, Link, Route, Routes } from "react-router";
import { ElencoViaggi } from "./pagine/ElencoViaggi";
import { ModuloViaggio } from "./pagine/ModuloViaggio";

export function App() {
  return (
    <BrowserRouter>
      <header className="intestazione">
        <Link to="/" className="marchio">
          Waintogo <span>gestionale</span>
        </Link>
      </header>
      <main className="contenuto">
        <Routes>
          <Route path="/" element={<ElencoViaggi />} />
          <Route path="/viaggi/nuovo" element={<ModuloViaggio />} />
          <Route path="/viaggi/:id" element={<ModuloViaggio />} />
          <Route path="*" element={<p>Pagina non trovata.</p>} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
