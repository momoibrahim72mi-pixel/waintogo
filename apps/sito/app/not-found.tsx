import Link from "next/link";

export default function NonTrovato() {
  return (
    <section className="sezione">
      <div className="contenitore">
        <h1>Pagina non trovata</h1>
        <p className="introduzione">Forse il viaggio non è più disponibile, o l&apos;indirizzo è sbagliato.</p>
        <Link href="/viaggi" className="pulsante">
          Guarda tutti i viaggi
        </Link>
      </div>
    </section>
  );
}
