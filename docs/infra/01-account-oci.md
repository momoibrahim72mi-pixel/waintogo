# 01 · Mettere in sicurezza l'account OCI

> Stato: in corso, iniziata il 2026-11-09. Fatto: 1a (MFA) e 1b (compartment `waintogo`). Da fare: 1c (budget). 1d (Pay As You Go) solo se serve.
> Home region: **Italy Northwest (Milan)**, `eu-milan-1`, non modificabile.

## Cosa

Prima di creare qualsiasi risorsa prepariamo l'account:

1. attiviamo l'autenticazione a due fattori (MFA);
2. creiamo un compartment dedicato al progetto;
3. impostiamo un budget con avviso, così sappiamo subito se qualcosa inizia a costare;
4. valutiamo il passaggio a Pay As You Go.

## Perché

- **MFA:** l'account amministratore può creare risorse a pagamento. Se qualcuno ruba la password può farti spendere, quindi serve un secondo fattore.
- **Compartment:** è una "cartella" logica per le risorse. Permette di filtrare costi e permessi solo sul progetto e di cancellare tutto in un colpo se serve.
- **Budget:** OCI non blocca la spesa da solo. L'avviso è la nostra rete di sicurezza.
- **Pay As You Go:** con l'account solo gratuito Oracle può recuperare le istanze A1 inattive, e trovare posto sulle macchine A1 è più difficile. Con Pay As You Go le risorse Always Free restano gratuite.

## Come

### 1a · MFA

1. Dalla console OCI clicca l'icona del profilo in alto a destra e scegli **My profile**.
2. Apri la sezione **2-Step Verification** (o "Verifica in 2 passaggi") e avviala.
3. Scegli un'app di autenticazione: Oracle Mobile Authenticator, Google Authenticator, Microsoft Authenticator o simili.
4. Scansiona il QR code con l'app e inserisci il codice generato.
5. Salva i **codici di recupero** (bypass codes) in un posto sicuro fuori dal PC, per esempio un password manager.

### 1b · Compartment

1. Vai su **Identity & Security → Compartments → Create Compartment**.
2. Compila i campi:
   - Name: `waintogo`
   - Description: `Sito gite e gestionale`
   - Parent: la root
3. Da qui in poi, quando crei una risorsa, seleziona sempre il compartment `waintogo`.

### 1c · Budget e avviso

1. Vai su **Billing & Cost Management → Budgets → Create Budget**.
2. Compila il budget:
   - Target: Compartment `waintogo`. *Facoltativo:* crea un secondo budget su tutta la tenancy.
   - Name: `waintogo-guardia`
   - Schedule: Monthly, Amount: `1` (EUR)
3. Aggiungi la regola di avviso:
   - Threshold metric: **Actual Spend**
   - Threshold type: Percentage, `1`
   - Email: la tua
4. Aggiungi una seconda regola: **Forecast Spend** al 100%.

### 1d · Pay As You Go (da decidere insieme)

1. Vai su **Billing & Cost Management → Upgrade and Manage Payment**.
2. Scegli **Pay As You Go** e inserisci la carta. Oracle fa una preautorizzazione temporanea che poi viene annullata.
3. Le risorse Always Free restano gratuite. Paghi solo se crei risorse fuori dai limiti, e per questo c'è il budget del passo 1c.

## Verifica

- Fai logout e login: la console chiede il codice dell'app.
- Il compartment `waintogo` compare in elenco con stato *Active*.
- Il budget `waintogo-guardia` compare con le due regole di avviso.
- Se hai fatto il passo 1d, in Billing la pagina mostra il tipo di account *Pay As You Go*.

## Tornare indietro

- **MFA:** da My profile si può disattivare o reimpostare. Se perdi il telefono servono i codici di recupero.
- **Compartment:** si può eliminare solo quando è vuoto. L'eliminazione richiede qualche minuto.
- **Budget:** si può modificare o eliminare in qualsiasi momento.
- **Pay As You Go:** non si torna al livello solo gratuito. Si può però chiudere l'account.

## Note

- Credenziali, codici di recupero e OCID sensibili non vanno mai scritti qui.
- _(da compilare durante l'esecuzione: problemi incontrati, schermate diverse da quelle descritte)_
