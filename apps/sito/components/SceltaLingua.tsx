"use client";
// Il selettore della lingua, in alto accanto al menu: "IT · EN · عربي".
// Sta FUORI dal menu ☰ apposta: sul telefono chi non capisce l'italiano non deve indovinare
// che la lingua si cambia dentro un menu scritto in italiano. Ogni lingua è scritta in sé
// stessa ("عربي", non "Arabo"), così ognuno riconosce la sua.
//
// È un "Client Component" per due motivi:
//  - usePathname() dà l'indirizzo della pagina aperta, così il link porta alla STESSA pagina
//    nell'altra lingua (da /viaggi/islanda a /en/viaggi/islanda), non alla home;
//  - al tocco scrive il cookie "lingua": il proxy lo legge e da quel momento usa la lingua
//    scelta, anche quando il visitatore apre un indirizzo senza prefisso (vedi proxy.ts).
import { usePathname } from "next/navigation";
import { COOKIE_LINGUA, LINGUE, NOMI_LINGUE, percorso, senzaLingua, type Lingua } from "../lib/lingue";

export function SceltaLingua({ lingua, etichetta }: { lingua: Lingua; etichetta: string }) {
  const pagina = senzaLingua(usePathname() ?? "/");

  const ricorda = (scelta: Lingua) => {
    // max-age in secondi: un anno. SameSite=Lax è il valore sicuro per un cookie di preferenza.
    document.cookie = `${COOKIE_LINGUA}=${scelta}; path=/; max-age=31536000; SameSite=Lax`;
  };

  return (
    <nav aria-label={etichetta} className="lingue">
      {LINGUE.map((l) => (
        // <a> e non <Link>: cambiando lingua cambia anche <html lang dir>, quindi carichiamo
        // la pagina da capo invece di sostituirne solo un pezzo.
        <a
          key={l}
          href={percorso(l, pagina)}
          hrefLang={l}
          lang={l}
          aria-current={l === lingua ? "true" : undefined}
          title={NOMI_LINGUE[l].esteso}
          onClick={() => ricorda(l)}
        >
          {NOMI_LINGUE[l].breve}
        </a>
      ))}
    </nav>
  );
}
