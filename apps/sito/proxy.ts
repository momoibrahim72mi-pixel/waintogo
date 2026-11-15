// Il proxy gira sul server PRIMA di ogni pagina e decide in che lingua mostrarla.
// (In Next 16 si chiama "proxy"; nelle versioni precedenti era il "middleware".)
//
// Tutte le pagine stanno in app/[lingua]/..., quindi l'app vuole sempre la lingua come
// prima parte del percorso. Il proxy fa in modo che sia così:
//
//   /en/...  e  /ar/...  → passano così come sono.
//   /it/...              → reindirizza alla versione senza prefisso (un solo indirizzo per pagina).
//   tutto il resto       → è italiano: lo "riscrive" in /it/... di nascosto. La rewrite cambia
//                          solo cosa vede l'app: nella barra del browser resta /viaggi/x.
//
// Prima di scegliere l'italiano guarda se il visitatore preferisce un'altra lingua:
//   1. il cookie "lingua", scritto quando si usa il selettore delle lingue;
//   2. se il cookie non c'è, la lingua del telefono o del browser (intestazione Accept-Language).
// Se è inglese o arabo, lo manda alla stessa pagina con /en o /ar davanti.
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_LINGUA, eLingua, LINGUA_PREDEFINITA, type Lingua } from "./lib/lingue";

export function proxy(richiesta: NextRequest) {
  const { pathname, search } = richiesta.nextUrl;
  const primo = pathname.split("/")[1];

  // L'indirizzo originale passa alle pagine in un'intestazione: serve alla pagina
  // "non trovato", che non riceve i parametri e deve comunque sapere la lingua.
  const intestazioni = new Headers(richiesta.headers);
  intestazioni.set("x-percorso", pathname);

  if (primo === "en" || primo === "ar") return NextResponse.next({ request: { headers: intestazioni } });

  if (primo === LINGUA_PREDEFINITA) {
    const url = richiesta.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url);
  }

  const preferita = linguaPreferita(richiesta);
  if (preferita !== LINGUA_PREDEFINITA) {
    const url = richiesta.nextUrl.clone();
    url.pathname = pathname === "/" ? `/${preferita}` : `/${preferita}${pathname}`;
    // 307: reindirizzamento temporaneo, perché dipende da chi visita (il browser non lo ricorda).
    return NextResponse.redirect(url, 307);
  }

  const url = richiesta.nextUrl.clone();
  url.pathname = `/${LINGUA_PREDEFINITA}${pathname}`;
  url.search = search;
  return NextResponse.rewrite(url, { request: { headers: intestazioni } });
}

function linguaPreferita(richiesta: NextRequest): Lingua {
  const cookie = richiesta.cookies.get(COOKIE_LINGUA)?.value;
  if (eLingua(cookie)) return cookie;
  return daAcceptLanguage(richiesta.headers.get("accept-language"));
}

/**
 * Legge l'intestazione Accept-Language, per esempio "ar-EG,ar;q=0.9,en;q=0.8,it;q=0.6",
 * e restituisce la prima lingua del sito che il visitatore accetta, in ordine di preferenza.
 * Se non ce n'è nessuna (o l'intestazione manca, come per Google), l'italiano.
 * Sono poche righe: non serve una libreria apposta.
 */
export function daAcceptLanguage(intestazione: string | null): Lingua {
  if (!intestazione) return LINGUA_PREDEFINITA;
  const preferenze = intestazione
    .split(",")
    .map((parte) => {
      const [tag = "", ...parametri] = parte.trim().split(";");
      const q = parametri.find((x) => x.trim().startsWith("q="));
      return { lingua: tag.split("-")[0]!.toLowerCase(), peso: q ? Number(q.trim().slice(2)) : 1 };
    })
    .filter((x) => x.peso > 0)
    .sort((a, b) => b.peso - a.peso); // sort è stabile: a parità di peso conta l'ordine scritto
  return preferenze.map((x) => x.lingua).find(eLingua) ?? LINGUA_PREDEFINITA;
}

export const config = {
  // Il proxy NON deve toccare: la rotta /api/health (la usa Kubernetes), i file interni di
  // Next (/_next) e i file con un'estensione (favicon.ico, robots.txt, immagini...).
  matcher: ["/((?!api/|_next/|.*\\.[a-zA-Z0-9]+$).*)"],
};
