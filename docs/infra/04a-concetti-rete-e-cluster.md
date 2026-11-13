# 04a · I concetti: cosa costruiamo e perché (spiegato semplice)

> Corso "team infrastruttura", lezione 1 (2026-11-12). Obiettivo: alla fine sai **disegnare a memoria** lo schema qui sotto e spiegare a cosa serve ogni pezzo.

## La metafora: un condominio privato nel cloud

Immagina che Oracle ti dia un terreno vuoto. Sopra ci costruisci un condominio dove abiteranno le tue app.

| Pezzo OCI | Nel condominio è... | A cosa serve davvero |
|---|---|---|
| **Compartment** | L'intestazione catastale | Una "cartella" che raccoglie tutte le risorse del progetto, con permessi e costi separati |
| **VCN** (Virtual Cloud Network) | Il recinto con dentro i suoi indirizzi interni | La tua rete privata. Niente entra o esce se non lo decidi tu. Ha un intervallo di indirizzi IP (CIDR), per esempio `10.0.0.0/16`, cioè circa 65.000 indirizzi |
| **Subnet** | I piani del palazzo | Una fetta degli indirizzi della VCN. Si separano le cose per ruolo e per livello di esposizione: **pubblica** (raggiungibile da internet) o **privata** (no) |
| **Internet Gateway** | Il portone sulla strada | Collega le subnet pubbliche a internet, in entrambe le direzioni |
| **NAT Gateway** | Una porta che si apre solo dall'interno | Le macchine private possono **uscire** (scaricare aggiornamenti, immagini Docker), ma nessuno da fuori può **entrare** |
| **Service Gateway** | Un corridoio interno verso gli uffici Oracle | Raggiunge Object Storage e il registry OCIR senza passare da internet |
| **Route Table** | I cartelli nei corridoi | Per ogni subnet dicono "per andare verso X, passa dal gateway Y" |
| **Security List / NSG** | Il portiere a ogni piano | Regole firewall: chi può entrare e uscire, da dove e su quali porte |
| **Cluster OKE (control plane)** | L'amministratore del condominio | È il "cervello" di Kubernetes: decide dove gira ogni app e la riavvia se cade. Lo gestisce Oracle, e nel cluster *basic* è gratuito |
| **Node pool / nodi** | Gli operai che fanno il lavoro | Sono VM vere (Ampere A1, ARM) su cui girano i container. Ne usiamo 2 da 2 OCPU e 12 GB |
| **Load Balancer** | La reception all'ingresso | Un solo IP pubblico che riceve le visite e le smista verso i nodi |
| **Pod** | Un appartamento | La più piccola unità di Kubernetes: uno o più container che vivono insieme (sito, API, Postgres...) |

## Lo schema che costruiremo

```
                         INTERNET
                            │
                     [Internet Gateway]
                            │
┌──────────────────── VCN 10.0.0.0/16 ───────────────────────────┐
│                                                                │
│  Subnet pubblica "api"      10.0.0.0/28  → endpoint Kubernetes │  ← tu ci parli con kubectl
│  Subnet pubblica "lb"       10.0.20.0/24 → Load Balancer       │  ← i visitatori entrano qui
│                                                                │
│  Subnet PRIVATA "nodi"      10.0.10.0/24 → 2 VM A1 (worker)    │  ← le app girano qui
│        │                                     │                 │
│   [NAT Gateway] (solo uscita)        [Service Gateway] → OCIR, Object Storage
└────────────────────────────────────────────────────────────────┘
```

## Perché è fatto così (le domande da saper rispondere)

1. **Perché i nodi stanno in una subnet privata?** Perché nessuno da internet deve poter bussare direttamente alle macchine. Si entra solo dalla reception (il load balancer), che inoltra le visite solo verso le porte giuste. Se domani esce una vulnerabilità sui nodi, da fuori non sono nemmeno raggiungibili.
2. **Allora come scaricano gli aggiornamenti?** Dal NAT Gateway, che lascia uscire ma non entrare.
3. **Perché tre subnet e non una sola?** Ognuna ha regole firewall diverse. La reception accetta tutti sulle porte 80 e 443. L'endpoint Kubernetes accetta **solo il tuo IP** sulla porta 6443. I nodi accettano traffico solo dall'interno della VCN.
4. **Perché `/16`, `/24`, `/28`?** Il numero dice quanti bit sono "fissi". `/16` corrisponde a circa 65.000 indirizzi, `/24` a 256 e `/28` a 16. All'endpoint ne bastano pochi, mentre ai nodi lasciamo spazio per crescere.
5. **Quanto costa?** VCN, subnet, gateway e route table su OCI sono **gratuiti**. I costi possono arrivare solo da calcolo, dischi e load balancer, ed è lì che rispettiamo i limiti Always Free.

## Esercizio per verificare di aver capito

Senza guardare, rispondi a queste tre domande:

- Cosa succede se metto i nodi in una subnet pubblica?
- Cosa succede se tolgo il NAT Gateway?
- Quale pezzo decide **su quale nodo** gira il sito?

Le risposte sono più in alto, nelle tabelle e nelle domande.
