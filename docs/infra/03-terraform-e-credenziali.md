# 03 · Terraform e credenziali API OCI

> Stato: in corso, iniziata il 2026-11-11. Fatto: 3a (Terraform v1.17.2 su Ubuntu 26.04 in WSL, verificato il 2026-11-13).
> PC di lavoro: Windows con **WSL** (Ubuntu). Tutti i comandi si lanciano nel terminale WSL, non in PowerShell.

## Cosa

Prepariamo il PC a creare l'infrastruttura **come codice**:

1. installiamo Terraform;
2. creiamo una chiave API per il tuo utente OCI e il file di configurazione `~/.oci/config`;
3. lanciamo un piccolo Terraform di prova che legge dati dal tuo account, senza creare nulla.

## Perché

- **Terraform:** invece di cliccare nella console descriviamo rete, cluster e nodi in file `.tf` versionati su Git. Così l'infrastruttura si può rileggere, rivedere in una PR, ricreare da zero e distruggere con un comando. Tutto quello che abbiamo fatto resta documentato da solo.
- **Perché Terraform e non OpenTofu:** sono quasi identici. Scegliamo Terraform perché la documentazione Oracle e il Resource Manager di OCI usano quello. Se un giorno vorrai passare a OpenTofu, i file restano gli stessi.
- **Chiave API:** Terraform parla con le API di OCI a nome tuo. Ogni richiesta è firmata con una chiave privata che **resta solo sul tuo PC**, mentre OCI conosce solo la chiave pubblica. Non si usano password, e la chiave si può revocare in qualsiasi momento dalla console.

## Come

### 3a · Installare Terraform in WSL

Apri il terminale **Ubuntu (WSL)** e aggiungi il repository ufficiale di HashiCorp, così Terraform si aggiorna con `apt`:

```bash
sudo apt-get update && sudo apt-get install -y gnupg software-properties-common curl
curl -fsSL https://apt.releases.hashicorp.com/gpg | gpg --dearmor | sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg > /dev/null
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt-get update && sudo apt-get install -y terraform
terraform -version
```

**Perché il repository ufficiale:** il pacchetto è firmato da HashiCorp, la riga `signed-by` impedisce che altri repository lo sostituiscano, e gli aggiornamenti arrivano con `sudo apt upgrade`.

**Consiglio:** tieni i progetti nel filesystem di Linux, ad esempio `~/progetti/waintogo`, e non in `/mnt/c/...`. È molto più veloce e i permessi dei file funzionano bene.

### 3b · Chiave API e file di configurazione

1. Nella console OCI apri il profilo in alto a destra, poi **My profile → Tokens and keys** (in alcune versioni si chiama **API keys**).
2. Clicca **Add API key → Generate API key pair**.
3. Clicca **Download private key** e poi **Add**.
4. OCI mostra una **Configuration file preview**. Copiane il contenuto:
   ```ini
   [DEFAULT]
   user=ocid1.user.oc1..xxxx
   fingerprint=aa:bb:...
   tenancy=ocid1.tenancy.oc1..xxxx
   region=eu-milan-1
   key_file=<path to your private keyfile>
   ```
5. In WSL sposta la chiave scaricata da Windows dentro la home di Linux. Sostituisci `<tuo-utente-windows>` con il tuo nome utente Windows e il nome del file con quello scaricato:
   ```bash
   mkdir -p ~/.oci && chmod 700 ~/.oci
   mv /mnt/c/Users/<tuo-utente-windows>/Downloads/<nome-chiave>.pem ~/.oci/oci_api_key.pem
   chmod 600 ~/.oci/oci_api_key.pem
   nano ~/.oci/config
   ```
6. In `nano` incolla la preview (con il tasto destro del mouse) e cambia l'ultima riga in:
   ```ini
   key_file=~/.oci/oci_api_key.pem
   ```
   Salva con `Ctrl+O`, poi `Invio`, ed esci con `Ctrl+X`. Infine lancia `chmod 600 ~/.oci/config`.

**Perché i `chmod`:** solo il tuo utente deve poter leggere la chiave privata. Gli strumenti OCI, inoltre, segnalano un errore se il file è leggibile da altri.

### 3c · Prova di connessione (non crea nulla)

> Questa prova è stata fatta direttamente nel repo, in `infra/terraform/`: vedi [04c-primo-progetto-terraform.md](04c-primo-progetto-terraform.md). I passi qui sotto restano come versione rapida.

```bash
mkdir -p ~/progetti/waintogo-prova && cd ~/progetti/waintogo-prova
nano main.tf
```

Incolla questo contenuto:

```hcl
terraform {
  required_providers {
    oci = { source = "oracle/oci" }
  }
}

provider "oci" {
  config_file_profile = "DEFAULT"
  region              = "eu-milan-1"
}

variable "tenancy_ocid" {}

data "oci_identity_availability_domains" "ads" {
  compartment_id = var.tenancy_ocid
}

output "availability_domains" {
  value = data.oci_identity_availability_domains.ads.availability_domains[*].name
}
```

Poi lancia:

```bash
terraform init
terraform plan -var "tenancy_ocid=$(grep ^tenancy ~/.oci/config | cut -d= -f2)"
```

## Verifica

- `terraform -version` mostra la versione, ad esempio `Terraform v1.x`.
- In console, sotto **Tokens and keys**, compare una chiave con lo stesso fingerprint del file `config`.
- `terraform plan` termina **senza errori** e mostra `availability_domains` con un nome simile a `xxxx:EU-MILAN-1-AD-1`. "No changes" è normale, perché leggiamo soltanto.

## Tornare indietro

- **Terraform:** si disinstalla con `sudo apt-get remove terraform`. Il repository si toglie cancellando `/etc/apt/sources.list.d/hashicorp.list`.
- **Chiave API:** dalla console, Tokens and keys → ⋮ → **Delete**. La chiave smette di funzionare subito. Poi lancia `rm -rf ~/.oci` in WSL.
- **Prova:** basta lanciare `rm -rf ~/progetti/waintogo-prova`. Non è stato creato nulla su OCI.

## Sicurezza (regole fisse)

- `oci_api_key.pem` e `config` **non vanno mai** su Git, in chat o negli screenshot.
- Il repo avrà un `.gitignore` con `*.pem`, `*.tfstate*`, `.terraform/` e `*.tfvars`.
- Gli OCID non sono segreti, ma è meglio non incollarli in posti pubblici.
- Ogni utente può avere al massimo 3 chiavi API. Quelle inutili vanno cancellate.

## Vincoli Always Free da rispettare nel codice Terraform (tappe successive)

| Risorsa | Limite gratuito | Uso previsto |
|---|---|---|
| Calcolo Ampere A1 | 4 OCPU + 24 GB RAM in totale | 2 nodi `VM.Standard.A1.Flex` da 2 OCPU e 12 GB |
| Block volume (boot inclusi) | 200 GB in totale | 2 boot volume da 50 GB, e il resto per i dati di Postgres |
| Load balancer | 1 flexible (10 Mbps) + 1 Network LB | Network LB davanti al cluster |
| Cluster OKE | Basic: control plane gratuito | `cluster_type = "BASIC_CLUSTER"` |
| Object Storage | 20 GB | Immagini, backup e stato di Terraform |

Su un account solo gratuito, OKE e la capacità A1 sono spesso limitati. Se la creazione del cluster fallisce per limiti o capacità, si risolve con il passaggio a Pay As You Go (tappa 1d), protetto dal budget.

## Note

- _(da compilare durante l'esecuzione)_
