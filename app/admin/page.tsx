// Admin dashboard placeholder. Slice 2 replaces this with a real post list.
//
// Auth is enforced by middleware.ts — if the request gets here, the session
// cookie was valid.

import Link from "next/link";

export default function AdminHome() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Hello, admin</h1>
        <form action="/api/admin/logout" method="POST">
          <button
            type="submit"
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Sign out
          </button>
        </form>
      </header>
      <p className="mt-6 text-zinc-600 dark:text-zinc-400">
        Slice 1 scaffold is in place. Post CRUD lands in Slice 2.
      </p>
      <ul className="mt-8 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
        <li>
          <Link href="/" className="underline underline-offset-4">
            Public changelog (placeholder)
          </Link>
        </li>
      </ul>
    </main>
  );
}
