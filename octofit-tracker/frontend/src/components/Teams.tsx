import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { name: string; members?: string[] };

function loadTeams() {
  return getJson<{ teams: Team[] }>('/api/teams').then((response) => response.teams);
}

export default function Teams() {
  return <CapabilityCard<Team>
    title="Teams"
    description="Manage teams and members."
    loadItems={loadTeams}
    emptyMessage="No teams yet."
    renderItem={(team) => <>{team.name}{team.members?.length ? ` — ${team.members.join(', ')}` : ''}</>}
  />;
}
