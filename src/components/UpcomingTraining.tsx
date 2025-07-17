
import { Training } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UpcomingTrainingProps {
  training: Training;
}

const fetchTrainingStatusCounts = async (trainingId: number) => {
  const { data: statuses, error: statusesError } = await supabase
    .from("training_statuses")
    .select("status")
    .eq("training_id", trainingId);

  if (statusesError) {
    console.error("Error fetching training statuses:", statusesError);
    return { yesCount: 0, noCount: 0, unknownCount: 0 };
  }

  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("id");

  if (playersError) {
    console.error("Error fetching players:", playersError);
    return { yesCount: 0, noCount: 0, unknownCount: 0 };
  }

  const totalPlayers = players?.length || 0;
  const yesCount = (statuses || []).filter(s => s.status === 'YES').length;
  const noCount = (statuses || []).filter(s => s.status === 'NO').length;
  const respondedCount = yesCount + noCount;
  const unknownCount = totalPlayers - respondedCount;

  return { yesCount, noCount, unknownCount };
};

const UpcomingTraining = ({ training }: UpcomingTrainingProps) => {
  const { data: statusCounts } = useQuery({
    queryKey: ["trainingStatusCounts", training?.id],
    queryFn: () => fetchTrainingStatusCounts(training!.id),
    enabled: !!training?.id,
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('nl-NL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Europe/Amsterdam'
    }).format(date);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('nl-NL', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Amsterdam'
    }).format(date);
  };

  const isPast = new Date(training.training_at) < new Date();
  const { yesCount = 0, noCount = 0, unknownCount = 0 } = statusCounts || {};

  return (
    <Card className="mb-8 bg-secondary border-primary">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold text-primary">
          Trainingsdetails
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
          <div className="flex items-center gap-4">
            <Calendar className="h-8 w-8 text-primary" />
            <div>
              <p className="font-semibold">Datum</p>
              <p className="text-muted-foreground">{formatDate(training.training_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Clock className="h-8 w-8 text-primary" />
            <div>
              <p className="font-semibold">Tijd</p>
              <p className="text-muted-foreground">{formatTime(training.training_at)}</p>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-3 text-primary">Status overzicht</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center text-green-600 font-semibold">
              <span className="mr-2 text-lg">🍆</span>
              <span>{yesCount} Aanwezig</span>
            </div>
            <div className="flex items-center text-red-600 font-semibold">
              <span className="mr-2 text-lg">❌</span>
              <span>{noCount} Afwezig</span>
            </div>
            <div className="flex items-center text-gray-500 font-semibold">
              <span className="mr-2 text-lg">➖</span>
              <span>{unknownCount} Geen reactie</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingTraining;
