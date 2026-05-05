"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { EditorForm } from "@/components/EditorForm";

type Category = {
  id: string;
  name: string;
  color: string;
};

type Post = {
  id: string;
  title: string;
  slug: string;
  body_markdown: string;
  category_id: string | null;
  is_draft: boolean;
};

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [bodyMarkdown, setBodyMarkdown] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDraft, setIsDraft] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`/api/admin/posts/${postId}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((post: Post) => {
        setTitle(post.title);
        setSlug(post.slug);
        setBodyMarkdown(post.body_markdown);
        setCategoryId(post.category_id);
        setIsDraft(post.is_draft);
        setLoaded(true);
      })
      .catch(() => {
        setNotFound(true);
      });
  }, [postId]);

  const handleTitleChange = useCallback((value: string) => {
    setTitle(value);
  }, []);

  async function save(draft: boolean) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          body_markdown: bodyMarkdown,
          category_id: categoryId,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        alert(data.error ?? "Failed to update post.");
        return;
      }

      if (!draft && isDraft) {
        const pubRes = await fetch(`/api/admin/posts/${postId}/publish`, {
          method: "POST",
        });
        if (!pubRes.ok) {
          alert("Post saved but publish failed.");
          return;
        }
      }

      router.push("/admin");
    } catch {
      alert("Network error.");
    } finally {
      setSaving(false);
    }
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <p className="text-zinc-500">Post not found.</p>
        <button
          onClick={() => router.push("/admin")}
          className="mt-4 text-sm text-zinc-900 underline dark:text-zinc-100"
        >
          Back to admin
        </button>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <EditorForm
        title={title}
        slug={slug}
        categoryId={categoryId}
        categories={categories}
        bodyMarkdown={bodyMarkdown}
        saving={saving}
        isNew={false}
        contentKey={postId}
        onTitleChange={handleTitleChange}
        onSlugChange={setSlug}
        onCategoryIdChange={setCategoryId}
        onBodyChange={setBodyMarkdown}
        onSaveDraft={() => save(true)}
        onPublish={() => save(false)}
      />
    </div>
  );
}
