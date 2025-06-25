import PlayerPage from '@/components/PlayerPage'Add commentMore actions
import ScorePage from '@/components/ScorePage'

export default function UserPage({ params }: { params: { username: string } }) {
  return (
    <div>
      <PlayerPage username={params.username} />
      <ScorePage username={params.username} />
    </div>
  )
}
