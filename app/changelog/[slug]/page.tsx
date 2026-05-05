import { notFound } from "next/navigation";
import { getPublishedPostBySlug } from "@/lib/queries";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPublishedPostBySlug(params.slug);
  if (!post) return { title: "Not Found" };
  return {
    title: post.title,
    description: post.title,
  };
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function PostPage({ params }: Props) {
  const post = getPublishedPostBySlug(params.slug);
  if (!post) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <a
        href="/"
        className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        &larr; Back to changelog
      </a>

      <article className="mt-8">
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
        <h1 className="text-3xl font-semibold tracking-tight">{post.title}</h1>
        <div
          className="prose prose-zinc mt-6 dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: post.body_html }}
        />
      </article>

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
