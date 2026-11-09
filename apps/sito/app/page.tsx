// Home page. Questo è un "Server Component": viene generato sul server (SSR),
// quindi Google riceve già l'HTML completo. Nella tappa 3 qui leggeremo i viaggi dall'API.
export default function Home() {
  return (
    <main>
      <h1>Waintogo</h1>
      <p>Presto qui troverai i prossimi viaggi di gruppo.</p>
    </main>
  );
}
