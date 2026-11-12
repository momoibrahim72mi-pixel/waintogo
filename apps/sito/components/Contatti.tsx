// I pulsanti per contattarci (WhatsApp, Instagram, email). Se un contatto non è ancora
// stato scritto in lib/contatti.ts si vede un segnaposto, così si nota che manca.
import { CONTATTI } from "../lib/contatti";

export function Contatti() {
  const { whatsapp, email, instagram } = CONTATTI;
  return (
    <ul className="contatti">
      <li>
        {whatsapp ? (
          <a className="pulsante" href={`https://wa.me/${whatsapp}`}>
            Scrivici su WhatsApp
          </a>
        ) : (
          <span className="segnaposto">[NUMERO WHATSAPP]</span>
        )}
      </li>
      <li>
        {instagram ? (
          <a className="pulsante pulsante-secondario" href={`https://instagram.com/${instagram}`}>
            Instagram @{instagram}
          </a>
        ) : (
          <span className="segnaposto">[ACCOUNT INSTAGRAM]</span>
        )}
      </li>
      <li>
        {email ? (
          <a className="pulsante pulsante-secondario" href={`mailto:${email}`}>
            {email}
          </a>
        ) : (
          <span className="segnaposto">[EMAIL DI CONTATTO]</span>
        )}
      </li>
    </ul>
  );
}
