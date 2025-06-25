import PlayerPage from '@/components/PlayerPage'
import ScorePage from '@/components/ScorePage'

export default function UserPage({ params }: any) {
  return (
    <div>
      <PlayerPage username={params.username} />
      <ScorePage username={params.username} />
    </div>
  )
}
