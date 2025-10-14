import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Player } from "@/types/database";
import { Loader2, Key } from "lucide-react";

const KeyHolderCard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: keyHolder, isLoading: isLoadingKeyHolder } = useQuery({
    queryKey: ["keyHolder"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("key_holder")
        .select("player_id")
        .eq("id", 1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: players, isLoading: isLoadingPlayers } = useQuery({
    queryKey: ["players"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Player[];
    },
  });

  const { data: currentPlayer } = useQuery({
    queryKey: ["keyHolderPlayer", keyHolder?.player_id],
    queryFn: async () => {
      if (!keyHolder?.player_id) return null;
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("id", keyHolder.player_id)
        .single();
      if (error) throw error;
      return data as Player;
    },
    enabled: !!keyHolder?.player_id,
  });

  const updateKeyHolderMutation = useMutation({
    mutationFn: async (playerId: number) => {
      const { error } = await supabase
        .from("key_holder")
        .upsert({ id: 1, player_id: playerId }, { onConflict: "id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keyHolder"] });
      queryClient.invalidateQueries({ queryKey: ["keyHolderPlayer"] });
      toast({
        title: "Sleutelbeheerder gewijzigd",
        description: "De nieuwe sleutelbeheerder is opgeslagen.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het wijzigen van de sleutelbeheerder.",
        variant: "destructive",
      });
      console.error("Error updating key holder:", error);
    },
  });

  if (isLoadingKeyHolder || isLoadingPlayers) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Sleutelbeheerder
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Sleutelbeheerder
        </CardTitle>
        <CardDescription>
          Wie heeft momenteel de sleutel van de ballencontainer?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Select
          value={keyHolder?.player_id?.toString() || ""}
          onValueChange={(value) => updateKeyHolderMutation.mutate(parseInt(value))}
          disabled={updateKeyHolderMutation.isPending}
        >
          <SelectTrigger className="w-full">
            <SelectValue>
              {currentPlayer?.name || "Selecteer een speler"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {players?.map((player) => (
              <SelectItem key={player.id} value={player.id.toString()}>
                {player.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
};

export default KeyHolderCard;
