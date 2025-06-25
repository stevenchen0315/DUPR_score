import { type Metadata } from 'next'
import PlayerPage from '@/components/PlayerPage'
//import ScorePage from '@/components/ScorePage'

type Props = {
  params: {
    username: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `DUPR Score - ${params.username}`,
  }
}

export default function UserPage({ params }: Props) {
  return (
    <div>
      <PlayerPage username={params.username} />
//      <ScorePage username={params.username} />
    </div>
  )
}
