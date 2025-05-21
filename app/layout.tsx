export const metadata = {
  title: 'DUPR Score App',
  description: 'DUPR Score with Supabase + Next.js 13',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
