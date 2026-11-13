# 04b · Terraform: come si lavora, da solo

> Corso "team infrastruttura", lezione 2 (2026-11-12). Obiettivo: saper **trovare, scrivere, formattare e verificare** qualsiasi risorsa Terraform senza aiuto.

## 1. I 5 mattoncini del linguaggio (HCL)

```hcl
# commento
terraform { ... }                         # impostazioni: versioni, provider richiesti
provider "oci" { ... }                    # COME collegarsi a OCI
variable "nome" { ... }                   # un valore che cambia (es. l'OCID del compartment)
resource "TIPO" "NOME_TUO" { ... }        # una cosa da CREARE (es. una VCN)
data "TIPO" "NOME_TUO" { ... }            # una cosa ESISTENTE da LEGGERE
output "nome" { value = ... }             # un valore da mostrare a fine lavoro
```

Regole di scrittura:

- `chiave = valore`, sempre con il segno uguale.
- Le stringhe vanno tra `"virgolette"`, i numeri e i `true`/`false` senza.
- Le liste si scrivono `["a", "b"]`, i blocchi annidati `nome_blocco { ... }` senza uguale.
- Per **riferirsi** a un'altra risorsa si scrive `TIPO.NOME_TUO.attributo`, per esempio `oci_core_vcn.principale.id`. Terraform capisce da solo l'ordine: prima crea la VCN, poi le cose che la usano.
- Per le variabili si scrive `var.nome`.
- I nomi tuoi sono in minuscolo con il trattino basso: `subnet_nodi`, non `SubnetNodi`.

## 2. Come trovare il pezzo giusto (il metodo)

1. Vai su **https://registry.terraform.io/providers/oracle/oci/latest/docs**.
2. Nel campo "Filter" in alto a sinistra scrivi quello che cerchi, per esempio `vcn`. Le risorse si chiamano `oci_<servizio>_<cosa>`:
   - `oci_core_*` per rete e VM (`oci_core_vcn`, `oci_core_subnet`, `oci_core_internet_gateway`, ...);
   - `oci_containerengine_*` per OKE (`oci_containerengine_cluster`, `oci_containerengine_node_pool`);
   - `oci_identity_*` per compartment, utenti e policy;
   - `oci_objectstorage_*` per i bucket.
3. Apri la pagina della risorsa (sezione **Resources**, non **Data Sources**) e leggila **sempre in questo ordine**:
   - **Example Usage:** un esempio completo. Contiene *tutti* gli argomenti possibili, quindi **non copiarlo tutto**.
   - **Argument Reference:** l'elenco degli argomenti. Ognuno è marcato **(Required)** o **(Optional)**. Si parte scrivendo **solo i Required**, poi si aggiungono gli Optional che servono davvero, sapendo perché.
   - **Attributes Reference:** cosa puoi *leggere* dalla risorsa dopo averla creata (per esempio `id`) e usare altrove.
   - **Import:** come "adottare" una risorsa creata a mano dalla console.
4. Se un argomento non è chiaro, la stessa parola si trova nella **documentazione OCI** (docs.oracle.com). Il registry descrive *come si scrive*, la documentazione OCI descrive *cosa fa*.
5. Seconda fonte di esempi: la cartella `examples/` del repo GitHub `oracle/terraform-provider-oci` (per esempio `examples/container_engine/`).

**Regola d'oro:** ogni riga che scrivi deve avere un motivo. Se non sai spiegare perché c'è, toglila o chiedi.

## 3. Il ciclo di lavoro (da ripetere sempre, in quest'ordine)

| Comando | Cosa fa | Quando |
|---|---|---|
| `terraform fmt` | Sistema rientri e allineamenti, come un correttore automatico | Dopo ogni modifica |
| `terraform init` | Scarica i provider e prepara la cartella | La prima volta e quando cambi provider o backend |
| `terraform validate` | Controlla la grammatica: argomenti mancanti, nomi sbagliati | Dopo `fmt` |
| `terraform plan` | **Mostra cosa farebbe**, senza toccare nulla. `+` crea, `~` modifica, `-` distrugge, `-/+` ricrea | Sempre prima di apply, e **va letto tutto** |
| `terraform apply` | Esegue il piano. Chiede `yes` | Solo se il plan è quello che ti aspetti |
| `terraform state list` | Elenca cosa Terraform sta gestendo | Per orientarti |
| `terraform destroy` | Distrugge tutto quello che gestisce | Con molta attenzione |

**Il campanello d'allarme:** se nel `plan` vedi un `-` o un `-/+` che non ti aspettavi, **fermati**. Ricreare una risorsa può voler dire perdere dati o cambiare IP.

## 4. Come organizziamo i file

Nel repo `waintogo`, cartella `infra/terraform/`:

| File | Contenuto |
|---|---|
| `versions.tf` | Blocco `terraform {}` con la versione minima di Terraform e del provider |
| `provider.tf` | Blocco `provider "oci" {}` |
| `variables.tf` | Tutte le `variable` con `description` e `type` |
| `terraform.tfvars` | I **valori** delle variabili. **Non va su Git** |
| `rete.tf` | VCN, subnet, gateway, route table, security list |
| `oke.tf` | Cluster e node pool |
| `outputs.tf` | Gli `output` |
| `.gitignore` | `.terraform/`, `*.tfstate*`, `*.tfvars`, `*.pem` |

Terraform legge **tutti** i `.tf` della cartella insieme, quindi la divisione in file serve solo a noi umani per orientarci.

## 5. Strumenti consigliati

- **VS Code** con le estensioni **WSL** e **HashiCorp Terraform**: colori, completamento automatico e formattazione al salvataggio. Lo apri da WSL con `code .` dentro la cartella.
- Il repo va tenuto in WSL, in `~/progetti/waintogo`.
