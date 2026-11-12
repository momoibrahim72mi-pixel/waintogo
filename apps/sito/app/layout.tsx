// Il layout avvolge tutte le pagine del sito: intestazione con il menu, contenuto, piè di pagina.
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Contatti } from "../components/Contatti";
import { Menu, type VoceMenu } from "../components/Menu";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Waintogo · Scopri il nostro prossimo viaggio", template: "%s · Waintogo" },
  description:
    "Viaggi di gruppo, weekend, day trip e retreat: piccoli gruppi, persone nuove e un coordinatore sempre con voi. Scopri il nostro prossimo viaggio.",
};

// Il colore della barra del browser sul telefono, uguale all'intestazione.
export const viewport: Viewport = { themeColor: "#fbf7f1" };

// Le voci del menu: tutte portano a una sezione della home ("/#..."), così funzionano
// anche dalla pagina di un viaggio.
const VOCI: VoceMenu[] = [
  { href: "/#prossimo-viaggio", testo: "Prossimo viaggio" },
  { href: "/#cosa-facciamo", testo: "Cosa facciamo" },
  { href: "/#viaggi-passati", testo: "Viaggi passati" },
  { href: "/#chi-siamo", testo: "Chi siamo" },
  { href: "/#faq", testo: "FAQ" },
  { href: "/#contatti", testo: "Contatti" },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="it">
      <body>
        <header className="testata">
          <div className="contenitore testata-riga">
            <Link href="/" className="logo">
              wain<span>to</span>go
            </Link>
            <Menu voci={VOCI} />
          </div>
        </header>
        <main>{children}</main>
        <footer className="piede">
          <div className="contenitore">
            <p className="logo">
              wain<span>to</span>go
            </p>
            <p>Viaggi di gruppo, weekend, day trip e retreat. Un viaggio alla volta, fatto bene.</p>
            <nav aria-label="Menu del piè di pagina" className="piede-menu">
              {VOCI.map((v) => (
                <Link key={v.href} href={v.href}>
                  {v.testo}
                </Link>
              ))}
            </nav>
            <Contatti />
          </div>
        </footer>
      </body>
    </html>
  );
}
