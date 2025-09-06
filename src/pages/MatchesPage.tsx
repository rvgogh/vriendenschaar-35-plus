import MatchList from "@/components/MatchList";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { generateICalForMatches, downloadICalFile } from "@/utils/icalExport";
import { useToast } from "@/hooks/use-toast";

const MatchesPage = () => {
  const { toast } = useToast();

  // Fetch matches for iCal export
  const { data: matches } = useQuery({
    queryKey: ["matches-for-ical"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("id, opponent, match_date, start_time, arrival_time")
        .order('match_date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  const handleICalExport = () => {
    if (!matches || matches.length === 0) {
      toast({
        title: "Geen wedstrijden",
        description: "Er zijn nog geen wedstrijden om te exporteren.",
        variant: "destructive"
      });
      return;
    }

    const iCalContent = generateICalForMatches(matches);
    downloadICalFile(iCalContent, 'wedstrijden.ics');
    
    toast({
      title: "Export gelukt",
      description: "De wedstrijden zijn geëxporteerd naar je agenda.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-primary mb-2">Wedstrijden</h1>
          <p className="text-muted-foreground">Overzicht van alle wedstrijden</p>
        </div>
        <Button onClick={handleICalExport} variant="outline" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Exporteer naar agenda
        </Button>
      </div>
      <MatchList />
    </div>
  );
};

export default MatchesPage;