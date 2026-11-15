# Il sito in più lingue: italiano, inglese, arabo

Il sito pubblico si legge in **italiano**, **inglese** e **arabo**. Il gestionale resta in italiano.
Qui c'è come funziona, come si cambia un testo e come si aggiungerebbe un'altra lingua.
Le scelte e i motivi sono in [decisioni.md](decisioni.md) (D28, D29, D30).

## Cosa vede il visitatore

- In alto, accanto al menu, c'è sempre il selettore **IT · EN · عربي**, anche sul telefono (non è nascosto dentro il menu ☰).
- Toccando una lingua si resta **sulla stessa pagina**: dalla pagina del Marocco in italiano si va alla pagina del Marocco in inglese.
- La scelta viene **ricordata** (un cookie, per un anno): se poi apre un link senza lingua, il sito usa quella scelta.
- Alla **prima visita**, se il telefono è in inglese o in arabo, il sito apre direttamente quella lingua. Se è in un'altra lingua (tedesco, francese...) si guarda la seconda preferenza; se nessuna corrisponde, italiano.
- In **arabo** tutta la pagina va da destra a sinistra: menu, testi, elenchi, frecce.

## Gli indirizzi

| Lingua | Home | Pagina di un viaggio |
|---|---|---|
| Italiano | `/` | `/viaggi/marocco-dal-deserto-alle-medine` |
| Inglese | `/en` | `/en/viaggi/marocco-dal-deserto-alle-medine` |
| Arabo | `/ar` | `/ar/viaggi/marocco-dal-deserto-alle-medine` |

L'italiano non ha prefisso, così tutti i link già condivisi continuano a funzionare. `/it/...` porta alla versione senza prefisso.
La parola `viaggi` resta uguale in tutte le lingue: tradurre anche gli indirizzi complicherebbe il codice senza un vero vantaggio.

## Come funziona, in breve

```
richiesta del browser
        │
        ▼
 proxy.ts  ── decide la lingua ──►  /en/... e /ar/...  passano così
        │                            /viaggi/x  diventa /it/viaggi/x (di nascosto, "rewrite")
        │                            se il visitatore preferisce en/ar: redirect a /en/viaggi/x
        ▼
 app/layout.tsx           <html lang="ar" dir="rtl">, menu e selettore nella lingua giusta
 app/[lingua]/page.tsx    le pagine ricevono la lingua come parametro e prendono i testi
                          dal dizionario: t = dizionario(lingua)
```

I file:

| File | Cosa contiene |
|---|---|
| `apps/sito/lib/lingue.ts` | L'elenco delle lingue, la direzione (rtl per l'arabo), come si formano gli indirizzi |
| `apps/sito/proxy.ts` | La scelta della lingua per ogni richiesta (cookie, poi lingua del telefono) |
| `apps/sito/lib/dizionari/it.ts` | Tutti i testi fissi in italiano: è il modello |
| `apps/sito/lib/dizionari/en.ts`, `ar.ts` | Gli stessi testi in inglese e in arabo |
| `apps/sito/lib/formato.ts` | Date e prezzi nella lingua della pagina (usa le funzioni `Intl`, già dentro Node e i browser) |
| `apps/sito/lib/contenuti.ts` | Come trattare i testi dei viaggi, che arrivano dal database (vedi sotto) |
| `apps/sito/components/SceltaLingua.tsx` | Il selettore IT · EN · عربي |
| `apps/sito/app/globals.css` | Le regole per l'arabo sono in fondo; in tutto il file si usano proprietà "logiche" (D29) |

Non c'è nessuna libreria di traduzione: tre file di testi e qualche funzione bastano, e il sito resta leggero.

## Cambiare o aggiungere un testo

1. Apri `apps/sito/lib/dizionari/it.ts` e cerca il testo (per esempio `"Domande frequenti"`).
2. Cambialo, e cambia la stessa chiave in `en.ts` e `ar.ts`.
3. Per un testo **nuovo**: aggiungi la chiave in tutti e tre i file e usala nella pagina come `t.home.miaChiave`.
   Se dimentichi una lingua, `pnpm typecheck` dà errore e dice quale chiave manca: è voluto.
4. Controlla con `pnpm dev` aprendo `/`, `/en` e `/ar`.

**Testi con un numero** ("1 giorno", "3 giorni") sono funzioni, perché ogni lingua ha le sue regole. L'arabo ha sei forme di plurale (singolare, duale, 3-10, 11-99...): in `ar.ts` la funzione `conta()` sceglie quella giusta con `Intl.PluralRules`.

**Il modulo di iscrizione** gira nel browser, quindi riceve solo testi semplici (niente funzioni). Le parti variabili si scrivono tra graffe: `"Versa l'acconto di {acconto}"`. Ogni lingua mette le graffe dove serve alla sua frase.

**Le FAQ, "Cosa facciamo" e "Chi siamo"** sono nei dizionari (chiavi `domande`, `home.cosaFacciamo`, `home.chiSiamo`). Sono ancora una BOZZA in tutte e tre le lingue.

> ⚠️ I testi arabi e inglesi li ha scritti Claude. Prima di andare online è bene che li rilegga una persona di madrelingua, soprattutto l'arabo.

## I testi dei viaggi (dal database)

Titolo, descrizione, itinerario, cosa è incluso e istruzioni di pagamento li scrive l'organizzatore nel gestionale, **per ora solo in italiano**. Nelle pagine in inglese e arabo:

- compaiono in italiano, con un avviso in cima alla pagina del viaggio ("i dettagli di questo viaggio per ora sono solo in italiano");
- sono marcati con `lang="it"` e `dir="ltr"`, così dentro una pagina araba si leggono comunque da sinistra a destra e i lettori di schermo li pronunciano in italiano.

Tutto passa da `lib/contenuti.ts`: quando i viaggi avranno anche le versioni inglese e araba (D30) basterà cambiare quel file per scegliere quella giusta.

## L'arabo e la scrittura da destra a sinistra

Cosa abbiamo fatto (dettagli e motivi in D29):

- `<html lang="ar" dir="rtl">`: il browser rovescia da solo righe, griglie, elenchi.
- Nel CSS niente `left`/`right` per spazi e posizioni, ma `inline-start`/`inline-end`: valgono "inizio" e "fine" della riga in qualunque lingua.
- Le frecce seguono il verso della lettura (`→` diventa `←`).
- Niente spaziatura negativa tra le lettere (in arabo staccherebbe le lettere legate) e più interlinea.
- Email, telefono, codice di prenotazione, IBAN e logo restano sempre da sinistra a destra (`dir="ltr"`).
- I numeri sono quelli occidentali (1, 2, 3), uguali al codice di prenotazione. Per usare quelli arabo-indiani (١، ٢، ٣) basta togliere `-u-nu-latn` in `LOCALE` dentro `lib/lingue.ts`.

## Aggiungere un'altra lingua (per esempio il francese)

1. In `lib/lingue.ts`: aggiungi `"fr"` a `LINGUE`, a `NOMI_LINGUE` e a `LOCALE`.
2. Copia `lib/dizionari/en.ts` in `fr.ts`, traduci e registralo in `lib/dizionari/index.ts`.
3. In `proxy.ts`: aggiungi `"fr"` alla riga `if (primo === "en" || primo === "ar")`.
4. In `next.config.ts`: aggiungi `fr` ai redirect `/:lingua(en|ar)/...`.
5. `pnpm typecheck && pnpm build`, poi prova `/fr`.

## Come si verifica

```bash
pnpm dev
# poi nel browser: http://localhost:3000, /en, /ar
```

Prove fatte per questa modifica (con Playwright, su iPhone 13 simulato e computer 1280 px):

- home, pagina del viaggio e modulo di iscrizione nelle tre lingue, senza errori nella console e senza scorrimento orizzontale;
- in arabo: errori del modulo, iscrizione inviata e ricevuta con codice, menu ☰ aperto;
- selettore: da `/ar` tocco IT → `/`; tocco EN → `/en`; poi aprendo `/viaggi/islanda-on-the-road` il sito porta a `/en/viaggi/islanda-on-the-road` (ricorda la scelta);
- con il telefono in arabo (`Accept-Language: ar-EG`) `/` porta a `/ar`; in tedesco con inglese come seconda lingua porta a `/en`; con il cookie `lingua=it` resta in italiano;
- indirizzi inesistenti (`/pippo`, `/en/pippo`) danno 404 con la pagina "non trovato" nella lingua giusta; `/api/health` non passa dal proxy.

Si può provare la scelta automatica anche da terminale:

```bash
curl -I -H "Accept-Language: ar" http://localhost:3000/        # → 307 verso /ar
curl -I -H "Accept-Language: en" -b "lingua=it" http://localhost:3000/   # → 200, resta in italiano
```
