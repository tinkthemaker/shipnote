"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { EditorForm } from "@/components/EditorForm";

type Category = {
  id: string;
  name: string;
  color: string;
};

export default function NewPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [bodyMarkdown, setBodyMarkdown] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  const generateSlug = useCallback((t: string) => {
    return t
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }, []);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugManuallyEdited) {
      setSlug(generateSlug(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlug(value);
    setSlugManuallyEdited(true);
  }

  async function save(draft: boolean) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body_markdown: bodyMarkdown,
          category_id: categoryId,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        alert(data.error ?? "Failed to create post.");
        return;
      }
      const post = (await res.json()) as { id: string };

      if (!draft) {
        const pubRes = await fetch(`/api/admin/posts/${post.id}/publish`, {
          method: "POST",
        });
        if (!pubRes.ok) {
          alert("Post saved as draft but publish failed.");
          router.push(`/admin/posts/${post.id}`);
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

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <EditorForm
        title={title}
        slug={slug}
        categoryId={categoryId}
        categories={categories}
        bodyMarkdown={bodyMarkdown}
        saving={saving}
        isNew
        onTitleChange={handleTitleChange}
        onSlugChange={handleSlugChange}
        onCategoryIdChange={setCategoryId}
        onBodyChange={setBodyMarkdown}
        onSaveDraft={() => save(true)}
        onPublish={() => save(false)}
      />
    </div>
  );
}
