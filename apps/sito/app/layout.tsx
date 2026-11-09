// Il layout avvolge tutte le pagine del sito: qui vanno <html>, <body> e, più avanti, menu e footer.
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Waintogo – viaggi di gruppo",
  description: "Scopri i prossimi viaggi e iscriviti.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="it">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, padding: "2rem" }}>
        {children}
      </body>
    </html>
  );
}
