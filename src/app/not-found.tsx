import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-zinc-400">Diese Seite gibt es nicht (mehr).</p>
      <Link href="/" className="btn-primary mt-6">
        Zur Serverliste
      </Link>
    </div>
  );
}
