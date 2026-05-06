import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-60px)] w-full max-w-5xl flex-col justify-center px-6 py-12">
      <h1 className="text-4xl font-bold">Lootopia</h1>
      <p className="mt-3 max-w-2xl text-gray-600">
        MVP front en cours. Tu peux deja tester le flux d authentification, puis passer aux pages de chasse.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/login" className="rounded bg-black px-4 py-2 text-white hover:bg-black/85">
          Aller au login
        </Link>
        <Link href="/register" className="rounded border border-black/20 px-4 py-2 hover:bg-black/5">
          Creer un compte
        </Link>
        <Link href="/test-map" className="rounded border border-black/20 px-4 py-2 hover:bg-black/5">
          Test map joueur
        </Link>
        <Link href="/test-map-admin" className="rounded border border-black/20 px-4 py-2 hover:bg-black/5">
          Test map admin
        </Link>
      </div>
    </main>
  );
}
