// Il layout avvolge tutte le pagine del sito: intestazione con il menu, contenuto, piè di pagina.
// È qui che si decide la lingua di tutta la pagina:
//   <html lang="ar" dir="rtl">  dice al browser che il testo è arabo e va da destra a sinistra.
// Il layout non riceve [lingua] (sta sopra quella cartella): la legge dall'indirizzo, che il
// proxy gli passa (vedi lib/lingua-richiesta.ts). Sta qui e non in app/[lingua]/ perché
// solo così la pagina "non trovato" (app/not-found.tsx) ha il layout completo.
// Con dir="rtl" il browser rovescia da solo l'impaginazione (menu, elenchi, allineamenti),
// purché il CSS usi le proprietà "logiche" (vedi l'inizio di globals.css).
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Contatti } from "../components/Contatti";
import { Menu, type VoceMenu } from "../components/Menu";
import { SceltaLingua } from "../components/SceltaLingua";
import { dizionario } from "../lib/dizionari";
import { linguaRichiesta } from "../lib/lingua-richiesta";
import { alternative, direzione, percorso, type Lingua } from "../lib/lingue";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const lingua = await linguaRichiesta();
  const t = dizionario(lingua);
  return {
    // L'indirizzo pubblico del sito, per i link assoluti (hreflang, anteprime su WhatsApp).
    // Si imposta con la variabile SITO_URL quando ci sarà il dominio (vedi docs/sviluppo.md).
    metadataBase: new URL(process.env.SITO_URL ?? "http://localhost:3000"),
    title: { default: t.meta.titolo, template: "%s · Waintogo" },
    description: t.meta.descrizione,
    alternates: alternative(lingua, "/"),
  };
}

// Il colore della barra del browser sul telefono, uguale all'intestazione.
export const viewport: Viewport = { themeColor: "#fbf7f1" };

// Le voci del menu: tutte portano a una sezione della home ("/#..."), così funzionano
// anche dalla pagina di un viaggio.
function vociMenu(lingua: Lingua): VoceMenu[] {
  const v = dizionario(lingua).menu.voci;
  return [
    { href: percorso(lingua, "/#prossimo-viaggio"), testo: v.prossimo },
    { href: percorso(lingua, "/#cosa-facciamo"), testo: v.cosaFacciamo },
    { href: percorso(lingua, "/#viaggi-passati"), testo: v.passati },
    { href: percorso(lingua, "/#chi-siamo"), testo: v.chiSiamo },
    { href: percorso(lingua, "/#faq"), testo: v.faq },
    { href: percorso(lingua, "/#contatti"), testo: v.contatti },
  ];
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const lingua = await linguaRichiesta();
  const t = dizionario(lingua);
  const voci = vociMenu(lingua);
  return (
    <html lang={lingua} dir={direzione(lingua)}>
      <body>
        <header className="testata">
          <div className="contenitore testata-riga">
            {/* dir="ltr": il logo è un nome, si scrive sempre da sinistra a destra. */}
            <Link href={percorso(lingua, "/")} className="logo" dir="ltr">
              wain<span>to</span>go
            </Link>
            <div className="testata-destra">
              <SceltaLingua lingua={lingua} etichetta={t.menu.lingua} />
              <Menu voci={voci} testi={{ principale: t.menu.principale, apri: t.menu.apri, chiudi: t.menu.chiudi }} />
            </div>
          </div>
        </header>
        <main>{children}</main>
        <footer className="piede">
          <div className="contenitore">
            <p className="logo" dir="ltr">
              wain<span>to</span>go
            </p>
            <p>{t.piede.slogan}</p>
            <nav aria-label={t.menu.piede} className="piede-menu">
              {voci.map((v) => (
                <Link key={v.href} href={v.href}>
                  {v.testo}
                </Link>
              ))}
            </nav>
            <Contatti lingua={lingua} />
          </div>
        </footer>
      </body>
    </html>
  );
}
