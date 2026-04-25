// Force dynamic rendering for each unique room ID on Vercel
export const dynamic = 'force-dynamic';

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
