import Link from "next/link";

export default function NonTrovato() {
  return (
    <section className="sezione">
      <div className="contenitore centrato">
        <h1>Pagina non trovata</h1>
        <p className="introduzione">Forse il viaggio non è più disponibile, o l&apos;indirizzo è sbagliato.</p>
        <Link href="/#prossimo-viaggio" className="pulsante">
          Scopri il prossimo viaggio
        </Link>
      </div>
    </section>
  );
}
