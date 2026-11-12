// Rende la webapp "installabile": sul telefono si può aggiungere alla schermata home
// e si apre a tutto schermo come un'app, senza la barra del browser.
//
// Servono tre cose, tutte nella cartella public/:
//  - webapp.webmanifest: nome, colori e icone dell'app, e da quale indirizzo parte (/webapp);
//  - le icone in public/icone/;
//  - webapp-sw.js: il "service worker", un piccolo programma che il browser tiene accanto
//    all'app. Il nostro salva i file dell'app, così si apre subito anche con poca rete.
//    I DATI (iscritti, pagamenti) invece li chiede sempre al server: non li salva mai,
//    così non si vedono dati vecchi e non restano dati personali sul telefono.
//
// Il collegamento al manifest lo aggiunge index.html solo per gli indirizzi /webapp,
// così la versione completa per computer non chiede di essere installata.

export function registraServiceWorker() {
  // In sviluppo (pnpm dev) niente service worker: terrebbe in memoria file vecchi mentre li modifichiamo.
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/webapp-sw.js", { scope: "/webapp" }).catch(() => {
    // Se non si registra (browser vecchio, modalità privata) la webapp funziona lo stesso.
  });
}
