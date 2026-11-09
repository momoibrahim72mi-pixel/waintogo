# Procedure

## Come si fa una modifica

1. **Parti da `main` aggiornato**
   ```bash
   git checkout main && git pull
   ```
2. **Crea una branch** con un nome che dica cosa fai:
   ```bash
   git checkout -b tappa-2-viaggi
   ```
3. **Modifica il codice e la documentazione insieme.** Se cambia il comportamento, l'architettura o il database, aggiorna il file giusto in `docs/`. Una nuova scelta tecnica va aggiunta in `decisioni.md`.
4. **Controlla prima di salvare su git:**
   ```bash
   pnpm typecheck && pnpm build
   ```
5. **Fai commit e push**, poi apri una pull request su GitHub.
6. **Aspetta la CI verde**, rileggi le modifiche e fai il merge.

## Regola sulla documentazione

Una pull request è completa solo se:
- `docs/roadmap.md` riporta lo stato aggiornato della tappa;
- ogni scelta nuova è in `docs/decisioni.md`, con il motivo;
- ogni cambiamento al database è in `docs/modello-dati.md`;
- ogni comando nuovo è in `docs/sviluppo.md`.

## Segreti

Password, chiavi e token non vanno **mai** su git.
- In locale stanno in `.env`, che è ignorato da git.
- Nel cluster staranno nei Secret di Kubernetes (lo vediamo nel thread infrastruttura).
- Se un segreto finisce per sbaglio su git, va cambiato subito: cancellarlo dal repo non basta, perché resta nella storia.
