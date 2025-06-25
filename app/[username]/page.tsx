import PlayerPage from '@/components/PlayerPage'
import ScorePage from '@/components/ScorePage'

type PageProps = {
  params: {
    username: string
  }
}

export default function UserPage({ params }: PageProps) {
  return (
    <div>
      <PlayerPage username={params.username} />
      <ScorePage username={params.username} />
    </div>
  )
}
