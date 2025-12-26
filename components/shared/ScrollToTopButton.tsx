import { scrollToTop } from '@/lib/constants'

interface ScrollToTopButtonProps {
  show: boolean
}

export default function ScrollToTopButton({ show }: ScrollToTopButtonProps) {
  if (!show) return null
  
  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white p-3 rounded-full shadow-lg transition-all duration-300 z-50 border border-white/20"
      aria-label="回到頂部"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    </button>
  )
}