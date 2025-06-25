import PlayerPage from '@/components/PlayerPage'
import ScorePage from '@/components/ScorePage'

interface UserPageProps {
  params: {
    username: string
  }
}

export default function UserPage({ params }: UserPageProps) {
  return (
    <div>
      <PlayerPage username={params.username} />
      <ScorePage username={params.username} />
    </div>
  )
}
