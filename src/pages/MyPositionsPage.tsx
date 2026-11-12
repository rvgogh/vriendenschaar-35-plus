import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { PageLoading } from "@/components/PageLoading";
import { EmptyState } from "@/components/EmptyState";
import { PositionPreferences } from "@/components/PositionPreferences";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/hooks/useAuth";
import { useMyPlayer } from "@/hooks/useData";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { fetchMyLevel, fetchMyPositions, saveMyLevel, saveMyPositions } from "@/lib/trainingDb";
import { LEVELS, type Level, type Position } from "@/lib/teamBuilder";

export default function MyPositionsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: myPlayer, isLoading: playerLoading } = useMyPlayer(user?.id);
  const { data: saved, isLoading, error } = useQuery({
    queryKey: ['myPositions', myPlayer?.id], queryFn: () => fetchMyPositions(myPlayer!.id), enabled: !!myPlayer, retry: false,
  });
  const { data: savedLevel, isLoading: levelLoading, error: levelError } = useQuery({
    queryKey: ['myLevel', myPlayer?.id], queryFn: fetchMyLevel, enabled: !!myPlayer, retry: false,
  });
  const [positions, setPositions] = useState<Position[] | null>(null);
  const [level, setLevel] = useState<Level | null>(null);
  useEffect(() => { if (saved && positions === null) setPositions(saved); }, [saved, positions]);
  useEffect(() => { if (savedLevel && level === null) setLevel(savedLevel); }, [savedLevel, level]);

  const current = positions ?? [];
  const positionsChanged = (saved ?? []).join() !== current.join();
  const levelChanged = level !== null && level !== savedLevel;

  const mutation = useMutation({
    mutationFn: async () => {
      if (positionsChanged) await saveMyPositions(current);
      if (levelChanged) await saveMyLevel(level!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPositions'] });
      queryClient.invalidateQueries({ queryKey: ['myLevel'] });
      queryClient.invalidateQueries({ queryKey: ['trainingPlayerInfo'] });
      toast.success("Je voorkeur is opgeslagen.");
    },
    onError: (e: Error) => toast.error(e.message || "Opslaan is niet gelukt."),
  });

  const header = <PageHeader title="Mijn voorkeur" subtitle="Je posities en je niveau. Daar houdt de trainer rekening mee bij het maken van de teams." />;
  if (playerLoading || (myPlayer && (isLoading || levelLoading))) return <PageLoading />;
  if (!myPlayer) return <div className="container mx-auto max-w-[800px] px-4 py-8">{header}<EmptyState message="Er is geen speler gekoppeld aan jouw account. Neem contact op met de beheerder." /></div>;
  if (error || levelError) return <div className="container mx-auto max-w-[800px] px-4 py-8">{header}<EmptyState message="Posities kunnen nog niet worden ingesteld. De trainingsmodule is nog niet helemaal klaar." /></div>;

  return (
    <div className="container mx-auto max-w-[800px] px-4 py-8">
      {header}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">Posities</CardTitle>
          <p className="text-sm text-muted-foreground">Opstelling 1-2-3-1: keeper, twee verdedigers, mid-mid, twee vleugels en een spits.</p>
        </CardHeader>
        <CardContent>
          <PositionPreferences value={current} onChange={setPositions} disabled={mutation.isPending} />
        </CardContent>
      </Card>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">Niveau</CardTitle>
          <p className="text-sm text-muted-foreground">Alleen jij en de trainers zien je niveau. Een trainer kan het aanpassen.</p>
        </CardHeader>
        <CardContent>
          <RadioGroup value={level ?? 'talent'} onValueChange={(v) => setLevel(v as Level)} disabled={mutation.isPending} className="divide-y border-y">
            {LEVELS.map((l) => (
              <div key={l.value} className="flex items-center gap-3 py-3">
                <RadioGroupItem id={`level-${l.value}`} value={l.value} />
                <Label htmlFor={`level-${l.value}`} className="flex-1 cursor-pointer">{l.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
      <Button className="w-full sm:w-auto" disabled={!(positionsChanged || levelChanged) || mutation.isPending} onClick={() => mutation.mutate()}>Opslaan</Button>
    </div>
  );
}
