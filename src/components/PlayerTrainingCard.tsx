
import { PlayerWithTrainingStatus, TrainingAttendanceStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PlayerTrainingCardProps {
  player: PlayerWithTrainingStatus;
  onStatusChange: (id: number, status: TrainingAttendanceStatus) => void;
}

const PlayerTrainingCard = ({ player, onStatusChange }: PlayerTrainingCardProps) => {
  return (
    <Card className="bg-secondary/50 flex items-center justify-between p-3">
      <CardTitle className="text-xl truncate mr-2">
        {player.name}
      </Title>
      <div className="flex gap-2 flex-shrink-0">
        <Button 
          variant='outline'
          size="sm" 
          onClick={() => onStatusChange(player.id, player.status === 'YES' ? 'UNKNOWN' : 'YES')}
          className={cn("text-2xl w-12", player.status === 'YES' && "ring-2 ring-primary")}
        >
          🍆
        </Button>
        <Button 
          variant='outline'
          size="sm" 
          onClick={() => onStatusChange(player.id, player.status === 'NO' ? 'UNKNOWN' : 'NO')}
          className={cn("text-2xl w-12", player.status === 'NO' && "ring-2 ring-destructive")}
        >
          ❌
        </Button>
      </div>
    </Card>
  );
};

export default PlayerTrainingCard;
