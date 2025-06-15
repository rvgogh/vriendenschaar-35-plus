import { PlayerWithTrainingStatus, TrainingAttendanceStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PlayerTrainingCardProps {
  player: PlayerWithTrainingStatus;
  onStatusChange: (id: number, status: TrainingAttendanceStatus) => void;
}

const PlayerTrainingCard = ({ player, onStatusChange }: PlayerTrainingCardProps) => {
  return (
    <Card className="bg-secondary/50 flex flex-col justify-between">
      <CardHeader className="p-4">
        <CardTitle className="text-xl">
          {player.name}
        </CardTitle>
      </CardHeader>
      <CardFooter className="flex justify-end gap-2 p-4 pt-0">
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
      </CardFooter>
    </Card>
  );
};

export default PlayerTrainingCard;
