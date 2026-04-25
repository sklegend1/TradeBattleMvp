// Force Server-Side Rendering - prevents static generation for dynamic routes
// This ensures each room ID is rendered on-demand
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
