// Un'etichetta, il suo campo e l'eventuale aiuto o messaggio d'errore.
// Collega etichetta, aiuto ed errore al campo (id, aria-describedby): così chi usa
// un lettore di schermo sente il nome del campo e, se c'è, l'errore.
import { cloneElement, type InputHTMLAttributes, type ReactElement, useId } from "react";

type Props = {
  etichetta: string;
  errore?: string;
  aiuto?: string;
  largo?: boolean;
  children: ReactElement<InputHTMLAttributes<HTMLInputElement>>;
};

export function Campo(props: Props) {
  const id = useId();
  const descrizioni = [props.aiuto && `${id}-aiuto`, props.errore && `${id}-errore`].filter(Boolean).join(" ");
  return (
    <div className={`campo ${props.largo ? "largo" : ""} ${props.errore ? "con-errore" : ""}`}>
      <label className="etichetta" htmlFor={id}>
        {props.etichetta}
      </label>
      {cloneElement(props.children, {
        id,
        "aria-invalid": props.errore ? true : undefined,
        "aria-describedby": descrizioni || undefined,
      })}
      {props.aiuto && (
        <span className="aiuto" id={`${id}-aiuto`}>
          {props.aiuto}
        </span>
      )}
      {props.errore && (
        <span className="messaggio-errore" id={`${id}-errore`}>
          {props.errore}
        </span>
      )}
    </div>
  );
}
