# Infrastruttura: guide passo passo

L'infrastruttura la costruisce Mohamed di persona, con Terraform su Oracle Cloud (OCI) e Kubernetes (OKE).
Queste guide spiegano per ogni passo **cosa** si fa, **perché**, **come**, come **verificare** e come **tornare indietro**.
Il codice Terraform è in [`infra/terraform/`](../../infra/terraform/).

| Guida | Di cosa parla | Stato |
|---|---|---|
| [00-architettura.md](00-architettura.md) | Architettura, costi, roadmap, decisioni su dominio, GitHub e backup | Aggiornata a ogni decisione |
| [01-account-oci.md](01-account-oci.md) | MFA, compartment, budget, Pay As You Go | In corso |
| [03-terraform-e-credenziali.md](03-terraform-e-credenziali.md) | Terraform in WSL, chiave API, `~/.oci/config` | Fatta |
| [04a-concetti-rete-e-cluster.md](04a-concetti-rete-e-cluster.md) | Lezione 1: VCN, subnet, gateway, cluster e nodi spiegati semplice | Fatta |
| [04b-terraform-come-si-lavora.md](04b-terraform-come-si-lavora.md) | Lezione 2: linguaggio, registry, ciclo fmt/validate/plan/apply | Fatta |
| [04c-primo-progetto-terraform.md](04c-primo-progetto-terraform.md) | Lezione 3: provider, variabili e lettura di prova | Fatta |

La guida 02 (dominio e DNS) verrà scritta quando si comprerà il dominio, a infrastruttura finita.

**Regola fissa:** in queste guide e nel repo non si scrivono mai chiavi, password, OCID veri o contenuti di `terraform.tfvars`. Il repo è pubblico.
