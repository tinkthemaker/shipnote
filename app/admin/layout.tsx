// All /admin routes share this layout. Slice 2 turns this into a real sidebar.

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen">{children}</div>;
}
