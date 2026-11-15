// La lingua della richiesta in corso, letta sul server dall'intestazione x-percorso che
// mette il proxy (proxy.ts). Serve ai file che non ricevono i parametri della pagina:
// il layout principale (che scrive <html lang dir>) e la pagina "non trovato".
import "server-only";
import { headers } from "next/headers";
import { eLingua, LINGUA_PREDEFINITA, type Lingua } from "./lingue";

export async function linguaRichiesta(): Promise<Lingua> {
  const primo = ((await headers()).get("x-percorso") ?? "").split("/")[1];
  return eLingua(primo) ? primo : LINGUA_PREDEFINITA;
}
