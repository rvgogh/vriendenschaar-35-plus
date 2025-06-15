
import { PlayerWithTrainingStatus, TrainingAttendanceStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface PlayerTrainingCardProps {
  player: PlayerWithTrainingStatus;
  onStatusChange: (id: number, status: TrainingAttendanceStatus) => void;
}

const PlayerTrainingCard = ({ player, onStatusChange }: PlayerTrainingCardProps) => {
  return (
    <Card className="bg-secondary/50 flex flex-col justify-between">
      <CardHeader>
        <CardTitle className="text-xl">
          {player.name}
        </CardTitle>
      </CardHeader>
      <CardFooter className="flex justify-end gap-2">
        <Button 
          variant={player.status === 'YES' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => onStatusChange(player.id, player.status === 'YES' ? 'UNKNOWN' : 'YES')}
        >
          JA
        </Button>
        <Button 
          variant={player.status === 'NO' ? 'destructive' : 'outline'} 
          size="sm" 
          onClick={() => onStatusChange(player.id, player.status === 'NO' ? 'UNKNOWN' : 'NO')}
        >
          NEE
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PlayerTrainingCard;
