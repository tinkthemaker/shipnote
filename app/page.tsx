import { getPublishedPosts } from "@/lib/queries";

export const dynamic = "force-dynamic";

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function HomePage() {
  const posts = getPublishedPosts();

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <header className="mb-12">
        <h1 className="text-3xl font-semibold tracking-tight">Changelog</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          The latest updates and improvements.
        </p>
      </header>

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
                  style={{ backgroundColor: post.category_color ?? "#6b7280" }}
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
              {post.title}
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
