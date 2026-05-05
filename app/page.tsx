import { getPublishedPosts, getCategories } from "@/lib/queries";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function HomePage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const allPosts = getPublishedPosts();
  const categories = getCategories();

  const activeCategory = searchParams.category?.toLowerCase() ?? null;

  const posts = activeCategory
    ? allPosts.filter(
        (p) => p.category_name?.toLowerCase() === activeCategory
      )
    : allPosts;

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <header className="mb-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">Changelog</h1>
          <a
            href="/feed.xml"
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            title="RSS Feed"
          >
            RSS
          </a>
        </div>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          The latest updates and improvements.
        </p>
      </header>

      <nav className="mb-8 flex flex-wrap gap-2">
        <Link
          href="/"
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            !activeCategory
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          }`}
        >
          All
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/?category=${encodeURIComponent(cat.name.toLowerCase())}`}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              activeCategory === cat.name.toLowerCase()
                ? "text-white"
                : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
            style={
              activeCategory === cat.name.toLowerCase()
                ? { backgroundColor: cat.color }
                : undefined
            }
          >
            {cat.name}
          </Link>
        ))}
      </nav>

      {posts.length === 0 && (
        <p className="text-zinc-500">No posts yet. Check back soon.</p>
      )}

      <div className="space-y-12">
        {posts.map((post) => (
          <article key={post.id}>
            <div className="mb-3 flex items-center gap-3">
              {post.category_name && (
                <span
                  className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                  style={{
                    backgroundColor: post.category_color ?? "#6b7280",
                  }}
                >
                  {post.category_name}
                </span>
              )}
              <time
                dateTime={new Date(post.published_at).toISOString()}
                className="text-sm text-zinc-500"
              >
                {formatDate(post.published_at)}
              </time>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">
              <Link
                href={`/changelog/${post.slug}`}
                className="hover:underline"
              >
                {post.title}
              </Link>
            </h2>
            <div
              className="prose prose-zinc mt-4 dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: post.body_html }}
            />
          </article>
        ))}
      </div>

      <footer className="mt-16 border-t border-zinc-200 pt-6 text-center text-sm text-zinc-400 dark:border-zinc-800">
        <a
          href="https://github.com/anomalyco/shipnote"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          Powered by Shipnote
        </a>
      </footer>
    </main>
  );
}
