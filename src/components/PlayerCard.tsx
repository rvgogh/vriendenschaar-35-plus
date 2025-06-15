
import { PlayerWithStatus, PlayerStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface PlayerCardProps {
  player: PlayerWithStatus;
  onStatusChange: (id: number, status: PlayerStatus) => void;
}

const PlayerCard = ({ player, onStatusChange }: PlayerCardProps) => {
  return (
    <Card className="bg-secondary/50 flex flex-col justify-between">
      <CardHeader>
        <CardTitle className="text-xl">
          {player.name}
        </CardTitle>
      </CardHeader>
      <CardFooter className="flex justify-end gap-2">
        <Button 
          variant={player.status === 'IN' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => onStatusChange(player.id, player.status === 'IN' ? 'UNKNOWN' : 'IN')}
          className="text-2xl w-12"
        >
          🍆
        </Button>
        <Button 
          variant={player.status === 'MAYBE' ? 'secondary' : 'outline'} 
          size="sm" 
          onClick={() => onStatusChange(player.id, player.status === 'MAYBE' ? 'UNKNOWN' : 'MAYBE')}
          className="text-2xl w-12"
        >
          ❓
        </Button>
        <Button 
          variant={player.status === 'OUT' ? 'destructive' : 'outline'} 
          size="sm" 
          onClick={() => onStatusChange(player.id, player.status === 'OUT' ? 'UNKNOWN' : 'OUT')}
          className="text-2xl w-12"
        >
          ❌
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PlayerCard;
