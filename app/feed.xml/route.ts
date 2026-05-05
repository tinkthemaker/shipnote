import { getPublishedPosts } from "@/lib/queries";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const posts = getPublishedPosts();
  const baseUrl = env.BASE_URL;

  const items = posts
    .map((post) => {
      const pubDate = new Date(post.published_at).toUTCString();
      const link = `${baseUrl}/changelog/${post.slug}`;
      const category = post.category_name
        ? `<category>${escapeXml(post.category_name)}</category>`
        : "";
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      ${category}
      <description><![CDATA[${post.body_html}]]></description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Shipnote Changelog</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>The latest updates and improvements.</description>
    <language>en</language>
    <atom:link href="${escapeXml(baseUrl)}/feed.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
