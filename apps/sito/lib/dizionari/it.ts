// I testi del sito in ITALIANO. È il dizionario "modello": inglese e arabo devono avere
// esattamente le stesse chiavi (TypeScript dà errore se ne manca una o ce n'è una in più).
//
// Come si aggiunge un testo nuovo:
//   1. lo scrivi qui con una chiave che dica dove si usa (es. home.chiSiamo.titolo);
//   2. lo scrivi anche in en.ts e ar.ts (finché manca, `pnpm typecheck` fallisce: è voluto);
//   3. nella pagina lo usi come t.home.chiSiamo.titolo.
// I testi che cambiano con un numero (1 giorno, 2 giorni) sono funzioni: ogni lingua ha le
// sue regole sui plurali, e l'arabo ne ha sei (vedi ar.ts).
// I testi segnati BOZZA vanno ancora decisi (vedi la tappa 3c in docs/roadmap.md).

export const it = {
  meta: {
    titolo: "Waintogo · Scopri il nostro prossimo viaggio",
    descrizione:
      "Viaggi di gruppo, weekend, day trip e retreat: piccoli gruppi, persone nuove e un coordinatore sempre con voi. Scopri il nostro prossimo viaggio.",
  },
  menu: {
    principale: "Menu principale",
    piede: "Menu del piè di pagina",
    apri: "Apri il menu",
    chiudi: "Chiudi il menu",
    lingua: "Lingua",
    voci: {
      prossimo: "Prossimo viaggio",
      cosaFacciamo: "Cosa facciamo",
      passati: "Viaggi passati",
      chiSiamo: "Chi siamo",
      faq: "FAQ",
      contatti: "Contatti",
    },
  },
  piede: { slogan: "Viaggi di gruppo, weekend, day trip e retreat. Un viaggio alla volta, fatto bene." },
  home: {
    occhiello: "Viaggi · weekend · day trip · retreat",
    // Il titolo grande: la parte "evidenza" è colorata.
    titolo: { prima: "Scopri il nostro ", evidenza: "prossimo viaggio", dopo: "" },
    sotto: "Piccoli gruppi, persone nuove e un coordinatore sempre con voi. Un viaggio alla volta, fatto bene.",
    doveAndiamo: (destinazione: string) => `Dove andiamo? ${destinazione}`,
    scopri: "Scopri il prossimo viaggio",
    prossimo: "Prossimo viaggio",
    piuAvanti: "Più avanti",
    cosaFacciamo: {
      occhiello: "Cosa facciamo",
      titolo: "Non solo viaggi",
      sotto: "Un giorno, un weekend o una settimana: cambia la durata, non lo spirito.",
      // BOZZA: da adattare quando sarà chiaro il programma.
      attivita: [
        { nome: "Viaggi", durata: "una settimana o più", testo: "Il viaggio vero: un posto lontano, un gruppo piccolo, un coordinatore che parte con voi." },
        { nome: "Weekend trip", durata: "2–3 giorni", testo: "Ponti e fine settimana in Italia e in Europa: si parte il venerdì, si torna con amici nuovi." },
        { nome: "Day trip", durata: "una giornata", testo: "Partenza la mattina, rientro la sera: un'escursione, un borgo, un lago. Il modo più facile per conoscerci." },
        { nome: "Retreat", durata: "qualche giorno", testo: "Per staccare davvero: natura, ritmi lenti, attività insieme e il telefono in tasca." },
      ],
    },
    passati: {
      occhiello: "Viaggi passati",
      titolo: "Dove siamo già stati",
      vuoto: "Il primo viaggio deve ancora partire: le foto dei nostri viaggi finiranno qui.",
    },
    chiSiamo: {
      occhiello: "Chi siamo",
      titolo: "Un gruppo di amici che organizza viaggi",
      // BOZZA: da sostituire con la vostra storia (e magari una foto del gruppo).
      paragrafi: [
        "Abbiamo iniziato organizzando viaggi per noi e per gli amici degli amici. Ci piace partire in pochi, scegliere posti da vivere e non solo da vedere, e tornare a casa con persone nuove nella rubrica.",
        "Ogni viaggio ha un coordinatore che parte con il gruppo: pensa all'organizzazione, così voi pensate solo a godervelo.",
      ],
    },
    faq: { occhiello: "FAQ", titolo: "Domande frequenti" },
    contatti: {
      occhiello: "Contatti",
      titolo: "Scrivici",
      sotto: "Hai una domanda sul viaggio o vuoi solo conoscerci prima? Rispondiamo noi, non un bot.",
    },
    chiusura: "Pronto a partire?",
    inPreparazione: {
      titolo: "Stiamo preparando il prossimo viaggio",
      testo: "Scrivici per saperlo per primo, o guarda dove siamo già stati.",
      pulsante: "Contattaci",
    },
  },
  viaggio: {
    giorni: (n: number) => (n === 1 ? "1 giorno" : `${n} giorni`),
    con: (coordinatore: string) => `con ${coordinatore}`,
    accontoPerPosto: (acconto: string) => `acconto ${acconto} per tenere il posto`,
    acconto: (acconto: string) => `acconto ${acconto}`,
    prenota: "Prenota il tuo posto",
    prenotaBreve: "Prenota",
    listaAttesa: "Mettiti in lista d'attesa",
    listaAttesaBreve: "Mettiti in lista",
    richiedi: "Richiedi il posto",
    programma: "Vedi il programma",
    nonPaghi: "Non paghi niente adesso: ti teniamo il posto e ti mandiamo i dati per l'acconto (bonifico o Revolut).",
    altreDate: (n: number) => (n === 1 ? "C'è anche un'altra data" : `Ci sono altre ${n} date`),
    il: "Il viaggio",
    puntiForti: "Punti forti",
    giornoPerGiorno: "Giorno per giorno",
    giorno: (n: number) => `Giorno ${n}`,
    incluso: "Cosa è incluso",
    nonIncluso: "Non è incluso",
    partenze: "Partenze e prezzi",
    nuoveDate: "Nuove date in arrivo: torna a trovarci presto.",
    coordinatore: (nome: string) => `Coordinatore: ${nome}`,
    coordinatoreInArrivo: "Coordinatore in arrivo",
    infoUtili: "Info utili",
    inBreve: "In breve",
    destinazione: "Destinazione",
    durata: "Durata",
    prezzo: "Prezzo",
    da: (prezzo: string) => `da ${prezzo}`,
    eta: "Età",
    impegno: "Impegno fisico",
    prossimaPartenza: "Prossima partenza",
    inArrivo: "In arrivo",
    scegliData: "Scegli la data",
    foto: (destinazione: string) => `Foto: ${destinazione}`,
    // Mostrato in inglese e arabo finché i testi del viaggio esistono solo in italiano.
    soloItaliano: "",
    livelli: { facile: "Facile", medio: "Medio", impegnativo: "Impegnativo" },
    stili: { avventura: "Avventura", natura: "Natura", citta: "Città", mare: "Mare", cultura: "Cultura", "on-the-road": "On the road" },
  },
  disponibilita: {
    completo: "Completo · lista d'attesa",
    ultimi: (n: number) => (n === 1 ? "Ultimo posto" : `Ultimi ${n} posti`),
    garantita: "Partenza garantita",
    disponibili: (n: number) => (n === 1 ? "1 posto disponibile" : `${n} posti disponibili`),
  },
  // FAQ. BOZZA: le risposte vanno controllate e adattate alle condizioni vere.
  domande: [
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
  ],
  contatti: {
    whatsapp: "Scrivici su WhatsApp",
    instagram: (account: string) => `Instagram @${account}`,
    segnapostoWhatsapp: "[NUMERO WHATSAPP]",
    segnapostoInstagram: "[ACCOUNT INSTAGRAM]",
    segnapostoEmail: "[EMAIL DI CONTATTO]",
  },
  iscrizione: {
    titolo: "Richiedi il tuo posto",
    sotto: "Non paghi niente adesso. Ti teniamo il posto e ti diamo subito il codice e i dati per versare l'acconto.",
    nessunaPartenza: "Al momento non ci sono partenze disponibili per questo viaggio.",
    opzioneListaAttesa: "lista d'attesa",
  },
  // Solo testi semplici (niente funzioni): finiscono nel modulo, che gira nel browser,
  // e a un componente del browser si possono passare solo dati, non funzioni.
  // Le parti tra {graffe} vengono sostituite dal modulo (vedi riempi() in ModuloIscrizione).
  modulo: {
    partenza: "Partenza",
    nome: "Nome",
    cognome: "Cognome",
    email: "Email",
    telefono: "Telefono (meglio se con WhatsApp)",
    dataNascita: "Data di nascita",
    note: "Note (allergie, con chi vorresti dividere la camera...)",
    privacy: "Acconsento al trattamento dei miei dati per gestire la prenotazione.",
    invia: "Richiedi il posto",
    invioInCorso: "Invio in corso…",
    controllaCampi: "Controlla i campi evidenziati.",
    // Messaggi d'errore per campo. In italiano il modulo mostra quelli precisi dell'API
    // ("Scrivi il nome"); nelle altre lingue usa questi, perché l'API risponde in italiano.
    errori: {
      partenzaId: "Scegli una partenza",
      nome: "Scrivi il nome",
      cognome: "Scrivi il cognome",
      email: "Email non valida",
      telefono: "Telefono non valido",
      dataNascita: "Data non valida",
      note: "Testo troppo lungo",
      privacy: "Serve il consenso per gestire la tua richiesta",
    },
    erroreGenerico: "Qualcosa è andato storto, riprova",
    // Ricevuta (dopo l'invio)
    inAttesaOcchiello: "Sei in lista d'attesa",
    inAttesaTitolo: "Ti avvisiamo appena si libera un posto",
    ricevutaOcchiello: "Richiesta ricevuta",
    ricevutaTitolo: "Il tuo posto è tenuto per te!",
    tuoCodice: "Il tuo codice di prenotazione:",
    inAttesaTesto:
      "La partenza è al completo. Non devi pagare niente per ora: se si libera un posto ti contattiamo noi, seguendo l'ordine delle richieste.",
    versaAcconto: "Per confermare versa l'acconto di {acconto} (prezzo totale {prezzo}). Scrivi il codice {codice} nella causale.",
    dopoAcconto: "Appena riceviamo l'acconto la tua iscrizione è confermata. Il saldo va versato entro 30 giorni dalla partenza.",
    salva: "Salva questa pagina o fai uno screenshot: il codice ti servirà.",
  },
  nonTrovato: {
    titolo: "Pagina non trovata",
    testo: "Forse il viaggio non è più disponibile, o l'indirizzo è sbagliato.",
  },
};

export type Dizionario = typeof it;
export type TestiModulo = Dizionario["modulo"];
