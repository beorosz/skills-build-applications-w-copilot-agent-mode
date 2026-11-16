import { CapabilityCard } from './CapabilityCard.js';

type Ranking = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  return <CapabilityCard<Ranking>
    title="Leaderboard"
    description="Compare team point totals."
    path="/api/leaderboard"
    itemsKey="leaderboard"
    emptyMessage="No rankings yet."
    renderItem={(ranking) => <>#{ranking.rank} {ranking.teamName} — {ranking.totalPoints} points</>}
  />;
}
