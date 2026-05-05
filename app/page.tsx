// Public changelog page — fully implemented in Slice 3.
// This placeholder exists so the app boots before that slice lands.

export default function HomePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Shipnote</h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">
        The public changelog page lands in Slice 3. For now, head to{" "}
        <a href="/admin" className="underline underline-offset-4">
          /admin
        </a>{" "}
        to log in.
      </p>
    </main>
  );
}
