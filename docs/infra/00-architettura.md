# 00 · Architettura dell'infrastruttura

> Stato: proposta, 2026-11-09. Aggiornata il 2026-11-11: l'infrastruttura si crea con Terraform. Va aggiornata a ogni decisione presa.

## Obiettivo

Mettere in rete due applicazioni:

- il **sito pubblico**, dove si pubblicano le gite e ci si iscrive;
- il **gestionale**, per chi segue iscrizioni, pagamenti e organizzazione.

I vincoli sono tre: costo il più vicino possibile a zero, infrastruttura costruita a mano da Mohamed per imparare, e tutto documentato.

## Schema

```
Utente ──► Cloudflare (DNS) ──► OCI Network Load Balancer
                                     │
                          ┌──────────▼───────────┐
                          │ Cluster OKE (2 nodi A1)│
                          │  Ingress/Gateway + TLS │
                          │  ├─ sito    (Next.js)  │
                          │  ├─ gestionale (nginx) │
                          │  ├─ api     (Fastify)  │
                          │  └─ Postgres (CNPG)    │
                          └──────────┬───────────┘
                                     ▼
                          OCI Object Storage (immagini + backup)
```

## Componenti e perché

| Componente | Scelta | Perché |
|---|---|---|
| Cloud | Oracle Cloud (OCI) | Il piano Always Free è il più generoso: 4 OCPU ARM e 24 GB di RAM |
| Regione | Milano o Francoforte (da decidere) | Dati in UE per il GDPR. È la "home region": **non si cambia più**, e le risorse A1 gratuite esistono solo lì |
| Kubernetes | OKE, cluster *basic* | Il control plane è gratuito. I nodi sono 2 A1 da 2 OCPU e 12 GB, cioè esattamente il limite gratuito |
| Ingresso | Network Load Balancer + Traefik o Gateway API | Il NLB è gratuito. ingress-nginx è dismesso, quindi lo evitiamo |
| HTTPS | cert-manager + Let's Encrypt | Certificati gratuiti che si rinnovano da soli |
| DNS | Cloudflare | Gratuito, veloce e con protezione inclusa |
| Database | PostgreSQL con l'operatore CloudNativePG | Il Postgres gestito da OCI è a pagamento. CNPG fa repliche e backup |
| File | OCI Object Storage | 20 GB gratuiti, usati per le foto delle gite e per i backup |
| Registry | OCIR | Il registry di immagini di OCI |
| CI/CD | GitHub Actions + Argo CD | Le Actions compilano le immagini, Argo CD applica in modo dichiarativo quello che c'è su Git |
| Email | OCI Email Delivery oppure Brevo | Per conferme e dati di pagamento agli iscritti |
| Pagamenti | Bonifico o Revolut manuali, registrati nel gestionale | Decisione del 2026-11-09. I pagamenti online sono rimandati a più avanti |

## Costi stimati

| Voce | Costo |
|---|---|
| Infrastruttura OCI | 0 €/mese se restiamo nei limiti Always Free |
| Dominio | circa 10-15 €/anno |
| Cloudflare, GitHub, Let's Encrypt | 0 € |

L'account va passato a **Pay As You Go** con un avviso di budget a 1 €. Resta gratuito, ma Oracle non recupera le VM inattive e di solito si trova più facilmente posto sulle macchine A1.

## OKE o VM semplice

- **Pro di OKE:** tutto è dichiarativo e versionato, gli aggiornamenti non hanno interruzioni, si cresce aggiungendo nodi ed è utile per imparare.
- **Contro di OKE:** è più complesso. I componenti di sistema consumano una parte della RAM. Postgres in Kubernetes richiede attenzione. Il debug ha più livelli da controllare.
- **Alternativa di riserva:** k3s su una VM A1. Usa gli stessi file Kubernetes, quindi passarci non fa perdere il lavoro fatto.

## Roadmap

| # | Tappa | Guida |
|---|---|---|
| 0 | Decisioni: stack, regione, nome del dominio | — |
| 1 | Account OCI messo in sicurezza: MFA, compartment, budget, Pay As You Go | `01-account-oci.md` |
| 2 | Dominio e DNS su Cloudflare | `02-dominio-dns.md` |
| 3 | Terraform e credenziali API OCI | `03-terraform-e-credenziali.md` |
| 4 | Rete VCN e cluster OKE con Terraform, `kubectl` dal PC | `04a`, `04b`, `04c` e successive |
| 5 | Ingress, cert-manager, hello world in HTTPS | `05-ingress-tls.md` |
| 6 | Postgres con CNPG e backup su Object Storage | `06-database.md` |
| 7 | OCIR e CI/CD con GitHub Actions e Argo CD | `07-cicd.md` |
| 8 | Deploy di sito, gestionale, API ed email | `08-applicazioni.md` |
| 9 | Monitoraggio, prova di ripristino, go-live | `09-go-live.md` |

Ogni guida ha sempre le stesse sezioni: **Cosa**, **Perché**, **Come** (passi e comandi), **Verifica**, **Tornare indietro** e **Note** (problemi incontrati, valori scelti). Credenziali e segreti non vanno mai scritti nelle guide.

## Dominio rimandato (decisione del 2026-11-11)

Il dominio si compra **a infrastruttura e sito finiti**. Fino ad allora:

- si accede tramite l'IP pubblico del Network Load Balancer, oppure con un nome gratuito come `<ip>.sslip.io` per provare Ingress e HTTPS;
- l'IP è un **IP pubblico riservato**, così non cambia quando il cluster o il load balancer vengono ricreati;
- il nome a dominio non compare mai scritto a mano nei file: è **una sola variabile** usata da Terraform, dai manifest Kubernetes (host dell'Ingress e certificato) e dalle app (URL del sito, URL dell'API, CORS, link nelle email).

Quando il dominio sarà comprato:

1. si aggiunge il dominio su Cloudflare e si cambiano i nameserver presso il registrar;
2. si creano i record `A` verso l'IP riservato;
3. si cambia la variabile del dominio e si fa il deploy;
4. cert-manager chiede da solo il certificato a Let's Encrypt.

Tempo stimato: circa un'ora, più l'attesa della propagazione DNS.

## Costo zero: strategia

1. Si resta sull'account **solo gratuito** finché funziona. Su questo tipo di account le risorse a pagamento non si possono proprio creare, quindi è la protezione più forte.
2. Si attiva comunque un budget da 1 € con avviso all'1% della spesa reale, cioè a qualsiasi spesa.
3. Si passa a Pay As You Go **solo se** OKE o le macchine A1 risultano bloccati sull'account gratuito. In quel caso il codice Terraform limita forme e dimensioni ai valori Always Free.

## Cosa va su GitHub e cosa no (2026-11-11)

| Su GitHub (repo `waintogo`) | Fuori da GitHub |
|---|---|
| Codice delle app, Dockerfile | Backup del database, su OCI Object Storage (Milano) |
| Codice Terraform e manifest Kubernetes (GitOps con Argo CD) | Stato di Terraform (`*.tfstate`), su Object Storage, perché contiene segreti in chiaro |
| Documentazione `docs/` | Chiavi API, password, `.tfvars` con segreti |
| CI con GitHub Actions | Immagini dei container, su OCIR: GHCR per i repo privati ha poco spazio e banda gratuiti |

Perché i backup restano fuori da GitHub:

- contengono dati personali degli iscritti (GDPR);
- la storia di Git non si cancella davvero;
- GitHub ha limiti di dimensione (100 MB per file) e non è fatto per conservare backup.

Facoltativo: una seconda copia **cifrata** fuori da OCI, ad esempio su Cloudflare R2 (10 GB gratuiti).

### Backup: politica decisa (2026-11-11)

- **Pulizia automatica:** CloudNativePG tiene solo gli ultimi **30 giorni** (`retentionPolicy: "30d"`) e cancella da solo i backup più vecchi. Lo spazio occupato resta stabile.
- **Allarme:** un allarme di OCI Monitoring sulla dimensione dei bucket scatta a **16 GB (80%)** e manda un'email tramite OCI Notifications. Entrambi i servizi sono nei limiti gratuiti.
- **Copia sull'hard disk esterno:** una volta al mese, e quando scatta l'allarme, si scarica da WSL un backup completo (con `rclone` o `oci os object bulk-download`) su un disco **cifrato** con BitLocker o VeraCrypt, perché contiene dati personali.
- **Nel cloud non si svuota mai tutto:** per ripristinare servono il backup base più recente e i WAL che lo seguono.
