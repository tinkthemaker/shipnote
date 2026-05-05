// Markdown -> sanitized HTML rendering.
// Used when saving/publishing posts to pre-render body_html from body_markdown.

import { marked } from "marked";
import dompurify from "isomorphic-dompurify";

export function renderMarkdown(md: string): string {
  const raw = marked.parse(md, { async: false });
  return typeof raw === "string" ? dompurify.sanitize(raw) : "";
}
