// Riempie il database di SVILUPPO con viaggi di esempio, così sito e gestionale non sono vuoti.
//   pnpm --filter @waintogo/api esempi
// Non fa niente se ci sono già dei viaggi. I testi sono esempi da sostituire con quelli veri.
//
// Passa dall'API (app.inject) invece di scrivere nel database: così i dati di esempio
// rispettano le stesse regole dei dati veri.
import { applicaMigrazioni, creaDb } from "@waintogo/db";
import { aggiungiGiorni } from "@waintogo/shared";
import { creaApp } from "./app.js";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("Manca DATABASE_URL (vedi .env.example)");

const { db, chiudi } = creaDb(url);
await applicaMigrazioni(db);
const app = creaApp({ db });

async function chiedi(metodo: "GET" | "POST", percorso: string, corpo?: object) {
  const r = await app.inject({ method: metodo, url: percorso, payload: corpo });
  if (r.statusCode >= 400) throw new Error(`${metodo} ${percorso}: ${r.body}`);
  return r.json();
}

const esistenti = await chiedi("GET", "/viaggi");
if (esistenti.length > 0) {
  console.log(`Ci sono già ${esistenti.length} viaggi: non aggiungo niente.`);
} else {
  const oggi = new Date().toISOString().slice(0, 10);
  const pagamento =
    "Bonifico a: Waintogo (ESEMPIO)\nIBAN: IT00 X000 0000 0000 0000 0000 000\nCausale: il tuo codice di prenotazione\n\nOppure con Revolut: @waintogo-esempio";

  const viaggi = [
    {
      titolo: "Islanda on the road",
      sottotitolo: "Ghiacciai, cascate e aurore in 4x4, dormendo in guesthouse",
      destinazione: "Islanda",
      durataGiorni: 8,
      stili: ["on-the-road", "natura"],
      livello: "medio",
      fasciaEta: "25–40 anni",
      descrizione:
        "Otto giorni lungo la costa sud dell'Islanda, guidando a turno tra campi di lava, spiagge nere e lingue di ghiaccio. Si dorme in guesthouse, si cucina insieme e la sera si cerca l'aurora.",
      puntiForti: ["La laguna glaciale di Jökulsárlón", "Bagno nelle sorgenti calde", "Trekking sul ghiacciaio con guida"],
      incluso: ["7 notti in guesthouse, camere doppie", "Noleggio 4x4 con assicurazione", "Trekking sul ghiacciaio", "Coordinatore per tutto il viaggio"],
      nonIncluso: ["Volo per Reykjavik", "Pasti", "Carburante (cassa comune)"],
      infoUtili: "Serve la carta d'identità valida per l'espatrio. Porta scarponi impermeabili e abbigliamento a strati: anche d'estate la temperatura scende sotto i 10 °C.",
      tappe: [
        { giorno: 1, titolo: "Arrivo a Reykjavik", descrizione: "Ritiro delle auto e cena di benvenuto." },
        { giorno: 2, titolo: "Circolo d'oro", descrizione: "Thingvellir, Geysir e la cascata di Gullfoss." },
        { giorno: 3, titolo: "Costa sud", descrizione: "Seljalandsfoss, Skógafoss e la spiaggia nera di Reynisfjara." },
        { giorno: 4, titolo: "Sul ghiacciaio", descrizione: "Trekking con ramponi e guida." },
        { giorno: 5, titolo: "Jökulsárlón", descrizione: "La laguna degli iceberg e la Diamond Beach." },
        { giorno: 6, titolo: "Ritorno verso ovest", descrizione: "Canyon di Fjaðrárgljúfur." },
        { giorno: 7, titolo: "Sorgenti calde", descrizione: "Bagno e ultima sera a Reykjavik." },
        { giorno: 8, titolo: "Partenza", descrizione: "Riconsegna delle auto e volo di rientro." },
      ],
      partenze: [
        { tra: 45, prezzo: 129000, acconto: 30000, posti: 14, minimo: 6, coordinatore: "Giulia" },
        { tra: 120, prezzo: 139000, acconto: 30000, posti: 14, minimo: 6, coordinatore: "Marco" },
      ],
    },
    {
      titolo: "Marocco: dal deserto alle medine",
      sottotitolo: "Una notte nel Sahara, i souk di Marrakech e le kasbah dell'Atlante",
      destinazione: "Marocco",
      durataGiorni: 7,
      stili: ["avventura", "cultura"],
      livello: "facile",
      fasciaEta: "22–35 anni",
      descrizione:
        "Da Marrakech attraversiamo l'Atlante fino alle dune di Merzouga, dove si dorme in un campo tendato sotto le stelle. Ritorno tra gole, kasbah e tè alla menta.",
      puntiForti: ["Notte nel deserto in campo tendato", "Cammellata al tramonto", "La medina di Marrakech con una guida locale"],
      incluso: ["6 notti tra riad e campo tendato", "Trasporti in minibus con autista", "Colazioni e 3 cene", "Coordinatore"],
      nonIncluso: ["Volo per Marrakech", "Pranzi", "Mance"],
      infoUtili: "Serve il passaporto con almeno 6 mesi di validità. Nel deserto di notte fa freddo: porta una felpa pesante.",
      tappe: [
        { giorno: 1, titolo: "Marrakech", descrizione: "Arrivo e prima passeggiata in piazza Jemaa el-Fna." },
        { giorno: 2, titolo: "Atlante e Aït-Ben-Haddou", descrizione: "Il passo del Tizi n'Tichka e la kasbah più famosa." },
        { giorno: 3, titolo: "Gole del Dadès", descrizione: "Strade spettacolari e notte in kasbah." },
        { giorno: 4, titolo: "Merzouga", descrizione: "Cammellata al tramonto e notte nel deserto." },
        { giorno: 5, titolo: "Alba sulle dune", descrizione: "Rientro verso ovest." },
        { giorno: 6, titolo: "Marrakech", descrizione: "Souk, giardini e hammam." },
        { giorno: 7, titolo: "Partenza", descrizione: "Volo di rientro." },
      ],
      partenze: [
        { tra: 25, prezzo: 89000, acconto: 20000, posti: 12, minimo: 6, coordinatore: "Sara" },
        { tra: 80, prezzo: 89000, acconto: 20000, posti: 12, minimo: 6, coordinatore: "Youssef" },
      ],
    },
    {
      titolo: "Giappone tra templi e neon",
      sottotitolo: "Tokyo, Kyoto e Osaka in treno veloce, con una notte in ryokan",
      destinazione: "Giappone",
      durataGiorni: 12,
      stili: ["citta", "cultura"],
      livello: "facile",
      fasciaEta: "25–40 anni",
      descrizione:
        "Dodici giorni tra la Tokyo dei grattacieli e dei vicoli, i templi di Kyoto e il cibo di strada di Osaka. Ci si sposta in shinkansen e si dorme una notte in un ryokan tradizionale.",
      puntiForti: ["Japan Rail Pass incluso", "Notte in ryokan con cena kaiseki", "Alba al santuario di Fushimi Inari"],
      incluso: ["11 notti in hotel e ryokan", "Japan Rail Pass 7 giorni", "Cena kaiseki", "Coordinatore"],
      nonIncluso: ["Volo per Tokyo", "Pasti non indicati", "Ingressi a musei e templi"],
      infoUtili: "Serve il passaporto. Per soggiorni brevi i cittadini italiani non hanno bisogno di visto.",
      tappe: [
        { giorno: 1, titolo: "Arrivo a Tokyo" },
        { giorno: 2, titolo: "Tokyo moderna", descrizione: "Shibuya, Shinjuku e la vista dall'alto." },
        { giorno: 3, titolo: "Tokyo tradizionale", descrizione: "Asakusa e Yanaka." },
        { giorno: 5, titolo: "Hakone", descrizione: "Notte in ryokan con vista sul Fuji, se il cielo vuole." },
        { giorno: 6, titolo: "Kyoto", descrizione: "Shinkansen e Gion al tramonto." },
        { giorno: 9, titolo: "Nara", descrizione: "Il grande Buddha e i cervi." },
        { giorno: 10, titolo: "Osaka", descrizione: "Dotonbori e cibo di strada." },
        { giorno: 12, titolo: "Partenza" },
      ],
      partenze: [{ tra: 150, prezzo: 249000, acconto: 50000, posti: 12, minimo: 8, coordinatore: "" }],
    },
    {
      titolo: "Algarve: surf e scogliere",
      sottotitolo: "Una settimana di lezioni di surf, spiagge nascoste e tramonti a Sagres",
      destinazione: "Portogallo",
      durataGiorni: 7,
      stili: ["mare", "avventura"],
      livello: "medio",
      fasciaEta: "20–35 anni",
      descrizione:
        "Base in una surf house vicino a Lagos: la mattina lezioni di surf per tutti i livelli, il pomeriggio kayak tra le grotte e calette raggiungibili solo a piedi.",
      puntiForti: ["5 lezioni di surf con istruttori", "Kayak nelle grotte di Ponta da Piedade", "Tramonto a Cabo de São Vicente"],
      incluso: ["6 notti in surf house", "5 lezioni di surf con attrezzatura", "Escursione in kayak", "Coordinatore"],
      nonIncluso: ["Volo per Faro", "Pasti", "Transfer dall'aeroporto"],
      infoUtili: "Basta la carta d'identità. Porta la crema solare: il sole dell'Algarve è forte anche a giugno.",
      tappe: [
        { giorno: 1, titolo: "Arrivo a Lagos" },
        { giorno: 2, titolo: "Prima lezione di surf" },
        { giorno: 4, titolo: "Kayak nelle grotte" },
        { giorno: 6, titolo: "Sagres", descrizione: "Il punto più a sud-ovest d'Europa." },
        { giorno: 7, titolo: "Partenza" },
      ],
      partenze: [
        { tra: 200, prezzo: 74000, acconto: 15000, posti: 16, minimo: 8, coordinatore: "Luca" },
        { tra: 230, prezzo: 79000, acconto: 15000, posti: 16, minimo: 8, coordinatore: "Luca" },
      ],
    },
  ];

  for (const { partenze, ...v } of viaggi) {
    const creato = await chiedi("POST", "/viaggi", { ...v, istruzioniPagamento: pagamento });
    await chiedi("POST", `/viaggi/${creato.id}/pubblica`);
    for (const p of partenze) {
      await chiedi("POST", `/viaggi/${creato.id}/partenze`, {
        dataInizio: aggiungiGiorni(oggi, p.tra),
        prezzoCentesimi: p.prezzo,
        accontoCentesimi: p.acconto,
        postiTotali: p.posti,
        minimoPartecipanti: p.minimo,
        coordinatore: p.coordinatore,
      });
    }
    console.log(`✓ ${v.titolo}`);
  }

  // Qualche iscritto di esempio sulla prima partenza del Marocco, per vedere il gestionale "vivo".
  const catalogo = await chiedi("GET", "/pubblico/viaggi");
  const marocco = catalogo.find((v: { destinazione: string }) => v.destinazione === "Marocco");
  const nomi = ["Anna Bianchi", "Luca Verdi", "Chiara Esposito", "Davide Russo", "Elena Romano", "Paolo Gallo", "Sofia Conti", "Matteo Greco", "Giorgia Bruno", "Andrea Costa", "Marta Ricci"];
  for (const [i, nomeCompleto] of nomi.entries()) {
    const [nome, cognome] = nomeCompleto.split(" ");
    await chiedi("POST", "/pubblico/iscrizioni", {
      partenzaId: marocco.partenze[0].id,
      nome,
      cognome,
      email: `${nome!.toLowerCase()}.${cognome!.toLowerCase()}@esempio.it`,
      telefono: `+39 333 00000${String(i).padStart(2, "0")}`,
      privacy: true,
    });
  }
  const dettaglio = await chiedi("GET", `/partenze/${marocco.partenze[0].id}`);
  for (const [i, isc] of dettaglio.iscrizioni.slice(0, 7).entries()) {
    const importo = i < 2 ? 89000 : 20000;
    await chiedi("POST", `/iscrizioni/${isc.id}/pagamenti`, { importoCentesimi: importo, data: oggi, metodo: i % 2 ? "revolut" : "bonifico" });
  }
  console.log("✓ 11 iscritti di esempio sul Marocco");

  // Qualche spesa di esempio: costi della partenza del Marocco e una spesa generale.
  const partenzaMarocco = marocco.partenze[0];
  const spese = [
    { descrizione: "Voli Milano–Marrakech A/R", categoria: "volo", importoCentesimi: 312000, pagata: true, data: oggi, fornitore: "Compagnia aerea (esempio)" },
    { descrizione: "Riad a Marrakech, 3 notti", categoria: "alloggio", importoCentesimi: 180000, pagata: false, data: aggiungiGiorni(partenzaMarocco.dataInizio, -15), fornitore: "Riad (esempio)" },
    { descrizione: "Campo tendato nel deserto", categoria: "alloggio", importoCentesimi: 96000, pagata: false, data: aggiungiGiorni(partenzaMarocco.dataInizio, -15) },
    { descrizione: "Fuoristrada con autista", categoria: "trasporto", importoCentesimi: 140000, pagata: false, data: partenzaMarocco.dataInizio },
    { descrizione: "Compenso coordinatrice", categoria: "coordinatore", importoCentesimi: 70000, pagata: false, data: aggiungiGiorni(partenzaMarocco.dataInizio, 7) },
  ];
  for (const spesa of spese) await chiedi("POST", "/spese", { ...spesa, partenzaId: partenzaMarocco.id });
  await chiedi("POST", "/spese", { descrizione: "Pubblicità sui social", categoria: "pubblicita", importoCentesimi: 15000, pagata: true, data: oggi });
  console.log("✓ 6 spese di esempio");
}

await app.close();
await chiudi();
