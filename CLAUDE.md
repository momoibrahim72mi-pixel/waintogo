# Note per Claude

- Lingua del progetto, dei commenti e della documentazione: **italiano**.
- Mohamed vuole capire tutto: ogni scelta va spiegata, e il codice va commentato dove non è ovvio.
- **Tutto va documentato.** Ogni PR aggiorna `docs/` (roadmap, decisioni, modello dati, sviluppo, procedure) e il README quando serve. Le regole sono in `docs/procedure.md`.
- Vincolo: costo zero su OCI Always Free (ARM64). Le immagini devono essere multi-architettura e leggere.
- L'infrastruttura (cluster, DNS, registry) la crea Mohamed di persona: qui si scrive solo il codice dell'applicazione.
