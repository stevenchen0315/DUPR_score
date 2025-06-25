import PlayerPage from '@/components/PlayerPage'
import ScorePage from '@/components/ScorePage'

export default function UserPage({ params }: { params: { username: string } }) {
  return (
    <div>
      <PlayerPage username={params.username} />      
    </div>
  )
}
