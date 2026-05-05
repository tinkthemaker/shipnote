"use client";

import PostEditor from "@/components/PostEditor";

type Category = {
  id: string;
  name: string;
  color: string;
};

export function EditorForm({
  title,
  slug,
  categoryId,
  categories,
  bodyMarkdown,
  saving,
  isNew,
  onTitleChange,
  onSlugChange,
  onCategoryIdChange,
  onBodyChange,
  onSaveDraft,
  onPublish,
}: {
  title: string;
  slug: string;
  categoryId: string | null;
  categories: Category[];
  bodyMarkdown: string;
  saving: boolean;
  isNew: boolean;
  onTitleChange: (v: string) => void;
  onSlugChange: (v: string) => void;
  onCategoryIdChange: (v: string | null) => void;
  onBodyChange: (v: string) => void;
  onSaveDraft: () => void;
  onPublish: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {isNew ? "New Post" : "Edit Post"}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={onSaveDraft}
            disabled={saving}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Save Draft
          </button>
          <button
            onClick={onPublish}
            disabled={saving}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            Publish
          </button>
        </div>
      </div>

      <input
        type="text"
        placeholder="Post title"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        className="w-full rounded-md border border-zinc-300 px-3 py-2 text-lg font-medium focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
      />

      <div className="flex items-center gap-2">
        <span className="text-sm text-zinc-500">Slug:</span>
        <input
          type="text"
          placeholder="post-slug"
          value={slug}
          onChange={(e) => onSlugChange(e.target.value)}
          className="flex-1 rounded-md border border-zinc-200 px-2 py-1 text-sm text-zinc-600 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400"
        />
      </div>

      <select
        value={categoryId ?? ""}
        onChange={(e) =>
          onCategoryIdChange(e.target.value === "" ? null : e.target.value)
        }
        className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
      >
        <option value="">No category</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>

      <PostEditor initialContent={bodyMarkdown} onChange={onBodyChange} />
    </div>
  );
}
