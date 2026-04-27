import './globals.css'
import { LanguageProvider } from '@/lib/i18n'

export const metadata = {
  title: 'DUPLA',
  description: 'DUPR Match Scoring & Player Management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  )
}
