// Le domande frequenti, nella sezione "FAQ" della home. I testi sono nei dizionari
// (lib/dizionari/*.ts, chiave "domande").
// <details> apre e chiude la risposta senza bisogno di JavaScript.
import { dizionario } from "../lib/dizionari";
import type { Lingua } from "../lib/lingue";

export function Domande({ lingua }: { lingua: Lingua }) {
  return (
    <div className="domande">
      {dizionario(lingua).domande.map((x) => (
        <details key={x.d}>
          <summary>{x.d}</summary>
          <p>{x.r}</p>
        </details>
      ))}
    </div>
  );
}
