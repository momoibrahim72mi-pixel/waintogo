# 04c · Il primo progetto Terraform: collegarsi a OCI

> Corso "team infrastruttura", lezione 3 (2026-11-13). Obiettivo: scrivere a mano i primi file, collegarsi a OCI e leggere un dato dall'account. **Non viene creato nulla.**

## Cosa

Dentro il repo creiamo la cartella `infra/terraform/` con cinque file:

| File | Cosa contiene | Va su Git? |
|---|---|---|
| `.gitignore` | L'elenco dei file da non pubblicare mai | Sì |
| `versions.tf` | Quale Terraform e quale provider usiamo | Sì |
| `provider.tf` | Come collegarsi a OCI | Sì |
| `variables.tf` | La dichiarazione delle variabili | Sì |
| `terraform.tfvars` | I **valori** delle variabili (i tuoi OCID) | **No** |

Aggiungiamo poi una lettura di prova (`data`) con un `output`, per verificare che la chiave API funzioni.

## Perché

- **Provider:** Terraform da solo non conosce nessun cloud. Il *provider* `oracle/oci` è il traduttore che trasforma i tuoi file in chiamate alle API di Oracle.
- **Versioni bloccate:** se domani esce una versione del provider che cambia comportamento, il tuo codice continua a funzionare come oggi. `~> 9.13` significa "dalla 9.13 in su, ma non la 10".
- **Variabili:** gli OCID cambiano da account ad account. Tenendoli fuori dal codice, lo stesso codice si può pubblicare e riusare.
- **Lettura di prova:** un blocco `data` legge senza creare. È il modo più sicuro per controllare che credenziali e permessi funzionino.

## Come

### 1. Cartella e `.gitignore`

```bash
cd ~/<cartella-del-repo-waintogo>
mkdir -p infra/terraform && cd infra/terraform
code .        # apre VS Code; in alternativa usa nano
```

File `.gitignore`:

```gitignore
.terraform/
*.tfstate
*.tfstate.*
*.tfvars
*.pem
```

Il file `.terraform.lock.hcl`, che nascerà dopo `init`, **va** su Git: registra le versioni esatte dei provider usate.

### 2. `versions.tf` (da trovare da solo)

1. Apri https://registry.terraform.io/providers/oracle/oci/latest.
2. Clicca il pulsante **Use Provider** in alto a destra: mostra il blocco `terraform { required_providers { ... } }` con la versione più recente.
3. Scrivilo nel file e modifica la versione così: se il sito mostra `9.13.0`, scrivi `"~> 9.13"`.
4. Dentro `terraform { }` aggiungi anche `required_version = ">= 1.9"`.

### 3. `provider.tf`

Nella documentazione del provider (pagina **Documentation**, sezione *Authentication*) cerca "config file". Servono due argomenti:

- `config_file_profile`: il nome del profilo tra parentesi quadre in `~/.oci/config`;
- `region`: la regione, presa da una variabile.

### 4. `variables.tf`

Dichiara tre variabili, ognuna con `description` e `type = string`:

- `tenancy_ocid`
- `compartment_ocid`
- `region`, con `default = "eu-milan-1"`

Forma di una variabile:

```hcl
variable "nome" {
  description = "A cosa serve"
  type        = string
}
```

### 5. `terraform.tfvars`

```hcl
tenancy_ocid     = "ocid1.tenancy.oc1..xxxx"
compartment_ocid = "ocid1.compartment.oc1..xxxx"
```

Dove si trovano i valori:

- **tenancy:** `grep ^tenancy ~/.oci/config`
- **compartment:** in console, Identity & Security → Compartments → `waintogo` → campo OCID → **Copy**

### 6. La lettura di prova, nel file `prova.tf`

Nel registry cerca il **data source** `oci_identity_availability_domains` (sezione *Data Sources*). Leggi l'*Argument Reference*: ha un solo argomento Required. Scrivi il blocco `data` e un `output` che mostri i nomi trovati.

### 7. Il ciclo

```bash
terraform fmt
terraform init
terraform validate
terraform plan
```

## Verifica

- `terraform fmt` non stampa errori. Se stampa nomi di file, vuol dire che li ha riformattati.
- `terraform init` termina con "Terraform has been successfully initialized!".
- `terraform validate` risponde "Success! The configuration is valid."
- `terraform plan` mostra `Changes to Outputs` con un nome simile a `xxxx:EU-MILAN-1-AD-1` e **nessuna** risorsa da creare.
- `git status` **non** elenca `terraform.tfvars` né la cartella `.terraform/`.

## Errori tipici

| Messaggio | Causa |
|---|---|
| `401-NotAuthenticated` | Il fingerprint o la chiave non corrispondono, oppure il percorso in `key_file` è sbagliato |
| `did not find a proper configuration for private key` | Il file `~/.oci/config` non viene trovato o il nome del profilo è sbagliato |
| `404-NotAuthorizedOrNotFound` | L'OCID è sbagliato o è stato incollato male |
| `Unsupported argument` | Il nome di un argomento è scritto male: ricontrolla l'Argument Reference |

## Tornare indietro

Non è stato creato nulla su OCI. Per ripartire da zero basta cancellare `infra/terraform/.terraform/`.

## Note

- **Esito (2026-11-13):** `terraform plan` riuscito. Availability domain letto: `dlTk:EU-MILAN-1-AD-1`. Milano ha un solo AD.
- Provider `oracle/oci` versione `~> 9.13`, Terraform v1.17.2, repo in `~/waintogo`.
- Errori fatti e cosa insegnano:
  - `config_file_profile = [DEFAULT]`: le quadre in HCL sono una lista. Il testo fisso va tra virgolette: `"DEFAULT"`.
  - `default` con l'OCID vero in `variables.tf`: i valori veri vanno solo in `terraform.tfvars`, che non va su Git.
  - `default = "waintogo"` per il compartment: Oracle vuole l'OCID, non il nome.
  - `data "prod_domains" ...`: la prima parola è il **TIPO** del catalogo del provider e non si inventa. Solo la seconda è un nome libero.
- Decisione di Mohamed (2026-11-13): niente `terraform.tfvars.example` per ora, perché lavora da solo. I due OCID si recuperano comunque dalla console e da `~/.oci/config`.
