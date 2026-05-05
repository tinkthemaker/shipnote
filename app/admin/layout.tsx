"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

type Post = {
  id: string;
  title: string;
  slug: string;
  is_draft: boolean;
  published_at: number | null;
  created_at: number;
  updated_at: number;
  category_name: string | null;
  category_color: string | null;
};

function formatDate(ts: number | null): string {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const isEditor = pathname.startsWith("/admin/posts/");

  const loadPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/posts");
      if (res.ok) {
        const data = (await res.json()) as Post[];
        setPosts(data);
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts, pathname]);

  const drafts = posts.filter((p) => p.is_draft);
  const published = posts.filter((p) => !p.is_draft);

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this post?")) return;
    const res = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin");
      loadPosts();
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="flex w-72 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <Link href="/admin" className="text-lg font-semibold tracking-tight">
            Shipnote
          </Link>
          <form action="/api/admin/logout" method="POST">
            <button
              type="submit"
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Sign out
            </button>
          </form>
        </div>

        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <Link
            href="/admin/posts/new"
            className="block w-full rounded-md bg-zinc-900 px-3 py-2 text-center text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            New Post
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-2">
          {drafts.length > 0 && (
            <>
              <p className="px-2 pb-1 text-xs font-medium uppercase tracking-wider text-zinc-400">
                Drafts
              </p>
              {drafts.map((post) => (
                <PostItem
                  key={post.id}
                  post={post}
                  active={pathname === `/admin/posts/${post.id}`}
                  onDelete={handleDelete}
                />
              ))}
            </>
          )}
          {published.length > 0 && (
            <>
              <p className="mt-4 px-2 pb-1 text-xs font-medium uppercase tracking-wider text-zinc-400">
                Published
              </p>
              {published.map((post) => (
                <PostItem
                  key={post.id}
                  post={post}
                  active={pathname === `/admin/posts/${post.id}`}
                  onDelete={handleDelete}
                />
              ))}
            </>
          )}
          {posts.length === 0 && (
            <p className="px-2 py-4 text-sm text-zinc-400">No posts yet.</p>
          )}
        </nav>

        <div className="border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <Link
            href="/"
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            View changelog &rarr;
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {isEditor ? (
          children
        ) : (
          <div className="mx-auto max-w-2xl px-6 py-16">
            {children}
          </div>
        )}
      </main>
    </div>
  );
}

function PostItem({
  post,
  active,
  onDelete,
}: {
  post: Post;
  active: boolean;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className={`group flex items-center justify-between rounded-md px-2 py-1.5 text-sm ${
        active
          ? "bg-zinc-200 dark:bg-zinc-800"
          : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
      }`}
    >
      <Link
        href={`/admin/posts/${post.id}`}
        className="flex-1 truncate text-zinc-700 dark:text-zinc-300"
      >
        {post.title}
        <span className="ml-2 text-xs text-zinc-400">
          {formatDate(post.published_at || post.created_at)}
        </span>
      </Link>
      <button
        onClick={() => onDelete(post.id)}
        className="ml-2 hidden text-xs text-red-500 hover:text-red-700 group-hover:block"
      >
        Delete
      </button>
    </div>
  );
}
