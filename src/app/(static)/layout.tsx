export default function StaticLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-background pb-10">{children}</div>;
}
