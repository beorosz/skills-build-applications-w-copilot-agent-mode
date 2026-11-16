import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Suggestion = { title: string; reason: string };
const userEmail = 'mona@example.com';

function loadSuggestions() {
  return getJson<{ suggestions: Suggestion[] }>(
    `/api/workouts/suggestions/${encodeURIComponent(userEmail)}`,
  ).then((response) => response.suggestions);
}

export default function Workouts() {
  return <CapabilityCard<Suggestion>
    title="Workout suggestions"
    description="Recommend workouts from activity patterns."
    loadItems={loadSuggestions}
    emptyMessage="No workout suggestions yet."
    renderItem={(suggestion) => <>{suggestion.title} — {suggestion.reason}</>}
  />;
}
