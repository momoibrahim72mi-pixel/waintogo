// Controllo di salute per Kubernetes: risponde se il sito è vivo.
export function GET() {
  return Response.json({ stato: "ok" });
}
