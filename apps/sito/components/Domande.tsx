// Le domande frequenti, nella sezione "FAQ" della home.
// <details> apre e chiude la risposta senza bisogno di JavaScript.
// Le risposte sono una BOZZA: vanno controllate e adattate alle condizioni vere.
const DOMANDE = [
  {
    d: "Come si prenota?",
    r: "Apri il prossimo viaggio e premi \"Prenota il tuo posto\": lasci nome, email e telefono, non paghi niente online. Ti teniamo il posto e ricevi subito un codice di prenotazione con i dati per l'acconto. Quando l'acconto arriva sei ufficialmente nel gruppo.",
  },
  {
    d: "Posso partire da solo/a?",
    r: "Certo, è il modo più comune! La maggior parte delle persone parte da sola: il gruppo diventa la tua compagnia di viaggio.",
  },
  {
    d: "Chi è il coordinatore?",
    r: "Un viaggiatore esperto che parte con il gruppo: organizza le giornate, risolve gli imprevisti e fa da collante. Non è una guida turistica: nei luoghi dove serve ci affidiamo a guide locali.",
  },
  {
    d: "Come si paga?",
    r: "Dopo la richiesta ricevi il codice di prenotazione e i dati per il bonifico o Revolut. Prima si versa l'acconto per confermare il posto, poi il saldo entro 30 giorni dalla partenza.",
  },
  {
    d: "Cosa vuol dire \"partenza garantita\"?",
    r: "Che è stato raggiunto il numero minimo di partecipanti: il viaggio si farà di sicuro e puoi prenotare voli e ferie con tranquillità.",
  },
  {
    d: "E se la partenza è al completo?",
    r: "Puoi comunque inviare la richiesta: entri in lista d'attesa e ti contattiamo appena si libera un posto.",
  },
  {
    d: "Il volo è incluso?",
    r: "Dipende dal viaggio: nella pagina di ciascuno trovi sempre cosa è incluso e cosa no.",
  },
];

export function Domande() {
  return (
    <div className="domande">
      {DOMANDE.map((x) => (
        <details key={x.d}>
          <summary>{x.d}</summary>
          <p>{x.r}</p>
        </details>
      ))}
    </div>
  );
}
