import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Ranking = { teamName: string; totalPoints: number; rank: number };

function loadLeaderboard() {
  return getJson<{ leaderboard: Ranking[] }>('/api/leaderboard').then((response) => response.leaderboard);
}

export default function Leaderboard() {
  return <CapabilityCard<Ranking>
    title="Leaderboard"
    description="Compare team point totals."
    loadItems={loadLeaderboard}
    emptyMessage="No rankings yet."
    renderItem={(ranking) => <>#{ranking.rank} {ranking.teamName} — {ranking.totalPoints} points</>}
  />;
}
