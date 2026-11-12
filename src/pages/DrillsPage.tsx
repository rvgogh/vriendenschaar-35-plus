import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { PageLoading } from "@/components/PageLoading";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpcomingTrainings } from "@/hooks/useData";
import { CATEGORY_LABELS, fitsPlayerCount, type DrillCategory } from "@/lib/trainingPlan";
import { fetchDrills, fetchPlanHistory, fetchPresentPlayerIds, formatShortDate, lastDoneByDrill } from "@/lib/trainingDb";

export default function DrillsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<DrillCategory | 'alle'>('alle');
  const [onlyFitting, setOnlyFitting] = useState(false);

  const { data: drills, isLoading, error } = useQuery({ queryKey: ['drills'], queryFn: fetchDrills, retry: false });
  const { data: history } = useQuery({ queryKey: ['trainingPlanHistory'], queryFn: fetchPlanHistory, retry: false });
  const { data: trainings = [] } = useUpcomingTrainings();
  const next = trainings[0];
  const { data: presentIds } = useQuery({
    queryKey: ['trainingPresent', next?.id], queryFn: () => fetchPresentPlayerIds(next!.id), enabled: !!next,
  });
  const playerCount = presentIds?.length ?? 0;
  const lastDone = lastDoneByDrill(history ?? []);

  if (isLoading) return <PageLoading />;
  if (error || !drills || drills.length === 0) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <PageHeader title="Oefeningen" />
        <EmptyState message="De oefeningen staan nog niet in de database." />
      </div>
    );
  }

  const query = search.trim().toLowerCase();
  const visible = drills
    .filter((d) => category === 'alle' || d.category === category)
    .filter((d) => !query || d.name.toLowerCase().includes(query) || d.explanation.toLowerCase().includes(query))
    .filter((d) => !onlyFitting || fitsPlayerCount(d, playerCount));

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <PageHeader title="Oefeningen" subtitle={`${drills.length} oefeningen · elk met een variant per spelersaantal`} />
      <div className="mb-6 flex flex-col gap-3">
        <Input type="search" aria-label="Zoek oefening" placeholder="Zoek oefening" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={category} onValueChange={(v) => setCategory(v as DrillCategory | 'alle')}>
          <SelectTrigger aria-label="Categorie"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle categorieën</SelectItem>
            {(Object.keys(CATEGORY_LABELS) as DrillCategory[]).map((c) => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>)}
          </SelectContent>
        </Select>
        {next && playerCount > 0 && (
          <div className="flex h-10 items-center gap-2">
            <Switch id="only-fitting" checked={onlyFitting} onCheckedChange={setOnlyFitting} />
            <Label htmlFor="only-fitting">Past bij {playerCount} spelers ({formatShortDate(next.training_at)})</Label>
          </div>
        )}
      </div>
      <div className="divide-y border-y">
        {visible.length === 0 && <p className="py-8 text-muted-foreground">Geen oefeningen gevonden.</p>}
        {visible.map((drill) => {
          const last = lastDone.get(drill.id);
          return (
            <Link key={drill.id} to={`/drills/${drill.id}`} className="flex items-center justify-between gap-3 py-4 hover:bg-muted/50">
              <div className="min-w-0">
                <p className="font-semibold break-words">
                  {drill.name}
                  {drill.tactical && <Badge variant="outline" className="ml-2">Tactisch</Badge>}
                </p>
                <p className="text-sm text-muted-foreground">
                  {CATEGORY_LABELS[drill.category]} · {drill.duration} min · {last ? `laatst ${formatShortDate(last)}` : 'nog niet gedaan'}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
