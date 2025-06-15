import { PlayerWithStatus, PlayerStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PlayerCardProps {
  player: PlayerWithStatus;
  onStatusChange: (id: number, status: PlayerStatus) => void;
}

const PlayerCard = ({ player, onStatusChange }: PlayerCardProps) => {
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
          onClick={() => onStatusChange(player.id, player.status === 'IN' ? 'UNKNOWN' : 'IN')}
          className={cn("text-2xl w-12", player.status === 'IN' && "ring-2 ring-primary")}
        >
          🍆
        </Button>
        <Button 
          variant='outline'
          size="sm" 
          onClick={() => onStatusChange(player.id, player.status === 'MAYBE' ? 'UNKNOWN' : 'MAYBE')}
          className={cn("text-2xl w-12", player.status === 'MAYBE' && "ring-2 ring-yellow-400")}
        >
          ❓
        </Button>
        <Button 
          variant='outline'
          size="sm" 
          onClick={() => onStatusChange(player.id, player.status === 'OUT' ? 'UNKNOWN' : 'OUT')}
          className={cn("text-2xl w-12", player.status === 'OUT' && "ring-2 ring-destructive")}
        >
          ❌
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PlayerCard;
