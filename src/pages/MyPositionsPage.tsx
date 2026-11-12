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
import { fetchMyPositions, saveMyPositions } from "@/lib/trainingDb";
import type { Position } from "@/lib/teamBuilder";

export default function MyPositionsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: myPlayer, isLoading: playerLoading } = useMyPlayer(user?.id);
  const { data: saved, isLoading, error } = useQuery({
    queryKey: ['myPositions', myPlayer?.id], queryFn: () => fetchMyPositions(myPlayer!.id), enabled: !!myPlayer, retry: false,
  });
  const [positions, setPositions] = useState<Position[] | null>(null);
  useEffect(() => { if (saved && positions === null) setPositions(saved); }, [saved, positions]);

  const mutation = useMutation({
    mutationFn: () => saveMyPositions(positions ?? []),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPositions'] });
      queryClient.invalidateQueries({ queryKey: ['trainingPlayerInfo'] });
      toast.success("Je voorkeur is opgeslagen.");
    },
    onError: (e: Error) => toast.error(e.message || "Opslaan is niet gelukt."),
  });

  const header = <PageHeader title="Mijn posities" subtitle="Zet de posities op volgorde van voorkeur. Daar houdt de trainer rekening mee bij het maken van de teams." />;
  if (playerLoading || (myPlayer && isLoading)) return <PageLoading />;
  if (!myPlayer) return <div className="container mx-auto max-w-[800px] px-4 py-8">{header}<EmptyState message="Er is geen speler gekoppeld aan jouw account. Neem contact op met de beheerder." /></div>;
  if (error) return <div className="container mx-auto max-w-[800px] px-4 py-8">{header}<EmptyState message="Posities kunnen nog niet worden ingesteld. De trainingsmodule is nog niet helemaal klaar." /></div>;

  const current = positions ?? [];
  const changed = (saved ?? []).join() !== current.join();

  return (
    <div className="container mx-auto max-w-[800px] px-4 py-8">
      {header}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Opstelling 1-2-3-1</CardTitle>
          <p className="text-sm text-muted-foreground">Keeper, twee verdedigers, mid-mid, twee vleugels en een spits.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <PositionPreferences value={current} onChange={setPositions} disabled={mutation.isPending} />
          <Button className="w-full sm:w-auto" disabled={!changed || mutation.isPending} onClick={() => mutation.mutate()}>Opslaan</Button>
        </CardContent>
      </Card>
    </div>
  );
}
