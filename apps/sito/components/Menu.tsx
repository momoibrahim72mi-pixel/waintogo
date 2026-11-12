"use client";
// Il menu in alto a destra. Sul telefono è un pulsante ☰ che apre l'elenco delle voci;
// sullo schermo largo le voci sono già in fila e il pulsante sparisce (lo decide il CSS).
// È un "Client Component" ("use client") perché deve ricordare se il menu è aperto o chiuso.
import Link from "next/link";
import { useEffect, useState } from "react";

export type VoceMenu = { href: string; testo: string };

export function Menu({ voci }: { voci: VoceMenu[] }) {
  const [aperto, setAperto] = useState(false);

  // Esc chiude il menu, come ci si aspetta da un pannello che si apre.
  useEffect(() => {
    if (!aperto) return;
    const tasto = (e: KeyboardEvent) => e.key === "Escape" && setAperto(false);
    window.addEventListener("keydown", tasto);
    return () => window.removeEventListener("keydown", tasto);
  }, [aperto]);

  return (
    <nav aria-label="Menu principale" className="menu">
      <button
        type="button"
        className="menu-pulsante"
        aria-expanded={aperto}
        aria-controls="menu-voci"
        onClick={() => setAperto(!aperto)}
      >
        <span className="menu-icona" aria-hidden="true" />
        <span className="solo-lettori">{aperto ? "Chiudi il menu" : "Apri il menu"}</span>
      </button>
      <ul id="menu-voci" className={aperto ? "menu-voci aperto" : "menu-voci"}>
        {voci.map((v) => (
          <li key={v.href}>
            {/* Toccare una voce chiude il menu: le voci portano a sezioni della stessa pagina. */}
            <Link href={v.href} onClick={() => setAperto(false)}>
              {v.testo}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
