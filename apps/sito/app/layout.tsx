// Il layout avvolge tutte le pagine del sito: intestazione, contenuto, piè di pagina.
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Waintogo · Viaggi di gruppo con coordinatore", template: "%s · Waintogo" },
  description: "Piccoli gruppi, un coordinatore sempre con voi, persone della tua età. Scegli la partenza e richiedi il tuo posto.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="it">
      <body>
        <header className="testata">
          <div className="contenitore testata-riga">
            <Link href="/" className="logo">
              wain<span>to</span>go
            </Link>
            <nav aria-label="Menu principale" className="menu">
              <Link href="/viaggi">Viaggi</Link>
              <Link href="/come-funziona">Come funziona</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="piede">
          <div className="contenitore piede-griglia">
            <div>
              <p className="logo">
                wain<span>to</span>go
              </p>
              <p>Viaggi di gruppo con coordinatore. Piccoli gruppi, nuove amicizie, zero pensieri.</p>
            </div>
            <div>
              <p className="piede-titolo">Esplora</p>
              <Link href="/viaggi">Tutti i viaggi</Link>
              <Link href="/come-funziona">Come funziona</Link>
              <Link href="/come-funziona#domande">Domande frequenti</Link>
            </div>
            <div>
              <p className="piede-titolo">Contatti</p>
              {/* Da sostituire con i contatti veri. */}
              <p>[EMAIL DI CONTATTO]</p>
              <p>[NUMERO WHATSAPP]</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
