import Link from "next/link";

export default function AdminHome() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Changelog</h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">
        Create and manage your changelog posts.
      </p>
      <div className="mt-8">
        <Link
          href="/admin/posts/new"
          className="inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          Create your first post
        </Link>
      </div>
    </>
  );
}
