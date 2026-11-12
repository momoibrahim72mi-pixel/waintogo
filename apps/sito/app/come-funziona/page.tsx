import type { Metadata } from "next";
import Link from "next/link";
import { Domande } from "./Domande";

export const metadata: Metadata = { title: "Come funziona" };

export default function ComeFunziona() {
  return (
    <section className="sezione">
      <div className="contenitore">
        <p className="occhiello">Come funziona</p>
        <h1>Viaggiare in gruppo, senza pensieri</h1>
        <p className="introduzione">
          Scegli un viaggio e una data, richiedi il tuo posto e paga l&apos;acconto con bonifico o Revolut. Al resto pensiamo noi e il tuo coordinatore.
        </p>

        <ol className="passi" style={{ margin: "32px 0 56px" }}>
          <li>
            <h3>Scegli viaggio e data</h3>
            <p>Nella pagina di ogni viaggio trovi l&apos;itinerario giorno per giorno, cosa è incluso e tutte le partenze con prezzo e posti rimasti.</p>
          </li>
          <li>
            <h3>Richiedi il tuo posto</h3>
            <p>Compili un modulo con i tuoi dati. Non paghi niente online: il posto viene tenuto per te e ricevi un codice di prenotazione.</p>
          </li>
          <li>
            <h3>Conferma con l&apos;acconto</h3>
            <p>Fai il bonifico o il pagamento Revolut dell&apos;acconto con il codice come causale. Appena arriva, sei ufficialmente nel gruppo.</p>
          </li>
          <li>
            <h3>Saldo e partenza</h3>
            <p>Il saldo va versato entro 30 giorni dalla partenza. Prima di partire il coordinatore crea il gruppo per conoscervi.</p>
          </li>
        </ol>

        <h2 id="domande">Domande frequenti</h2>
        <Domande />
        <p style={{ marginTop: 32 }}>
          <Link href="/viaggi" className="pulsante">
            Scopri i viaggi
          </Link>
        </p>
      </div>
    </section>
  );
}
