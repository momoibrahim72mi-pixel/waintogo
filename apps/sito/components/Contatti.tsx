// I pulsanti per contattarci (WhatsApp, Instagram, email). Se un contatto non è ancora
// stato scritto in lib/contatti.ts si vede un segnaposto, così si nota che manca.
import { dizionario } from "../lib/dizionari";
import { CONTATTI } from "../lib/contatti";
import type { Lingua } from "../lib/lingue";

export function Contatti({ lingua }: { lingua: Lingua }) {
  const { whatsapp, email, instagram } = CONTATTI;
  const t = dizionario(lingua).contatti;
  return (
    <ul className="contatti">
      <li>
        {whatsapp ? (
          <a className="pulsante" href={`https://wa.me/${whatsapp}`}>
            {t.whatsapp}
          </a>
        ) : (
          <span className="segnaposto">{t.segnapostoWhatsapp}</span>
        )}
      </li>
      <li>
        {instagram ? (
          <a className="pulsante pulsante-secondario" href={`https://instagram.com/${instagram}`}>
            {/* <bdi>: il nome dell'account resta "@waintogo" anche dentro una frase araba. */}
            <bdi>{t.instagram(instagram)}</bdi>
          </a>
        ) : (
          <span className="segnaposto">{t.segnapostoInstagram}</span>
        )}
      </li>
      <li>
        {email ? (
          <a className="pulsante pulsante-secondario" href={`mailto:${email}`} dir="ltr">
            {email}
          </a>
        ) : (
          <span className="segnaposto">{t.segnapostoEmail}</span>
        )}
      </li>
    </ul>
  );
}
