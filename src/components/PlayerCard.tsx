
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
      <CardHeader>
        <CardTitle className="text-xl">
          {player.name}
        </CardTitle>
      </CardHeader>
      <CardFooter className="flex justify-end gap-2">
        <Button variant={player.status === 'IN' ? 'default' : 'outline'} size="sm" onClick={() => onStatusChange(player.id, "IN")}>IN</Button>
        <Button 
          variant={player.status === 'MAYBE' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => onStatusChange(player.id, "MAYBE")}
          className={cn(
            player.status === 'MAYBE' && "bg-orange-500 hover:bg-orange-600 text-primary-foreground"
          )}
        >
          MAYBE
        </Button>
        <Button variant={player.status === 'OUT' ? 'destructive' : 'outline'} size="sm" onClick={() => onStatusChange(player.id, "OUT")}>OUT</Button>
      </CardFooter>
    </Card>
  );
};

export default PlayerCard;
