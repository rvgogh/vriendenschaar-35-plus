
import { PlayerWithStatus, PlayerStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PlayerCardProps {
  player: PlayerWithStatus;
  onStatusChange: (id: number, status: PlayerStatus) => void;
}

const PlayerCard = ({ player, onStatusChange }: PlayerCardProps) => {
  return (
    <Card className="bg-secondary/50 flex items-center justify-between p-3">
      <div className="flex items-center gap-2 mr-2">
        <CardTitle className="text-xl truncate">
          {player.name}
        </CardTitle>
        {player.knvb_member && (
          <div className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full font-medium">
            KNVB
          </div>
        )}
      </div>
      <div className="flex gap-2 flex-shrink-0">
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
      </div>
    </Card>
  );
};

export default PlayerCard;
