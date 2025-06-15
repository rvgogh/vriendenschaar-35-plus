
import { PlayerWithStatus, PlayerStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check, HelpCircle, X } from "lucide-react";

interface PlayerCardProps {
  player: PlayerWithStatus;
  onStatusChange: (id: number, status: PlayerStatus) => void;
}

const statusConfig: Record<PlayerStatus, { icon: JSX.Element; color: string; text: string }> = {
  IN: {
    icon: <Check className="h-5 w-5" />,
    color: "bg-green-500",
    text: "IN",
  },
  OUT: {
    icon: <X className="h-5 w-5" />,
    color: "bg-red-500",
    text: "OUT",
  },
  MAYBE: {
    icon: <HelpCircle className="h-5 w-5" />,
    color: "bg-yellow-500",
    text: "MAYBE",
  },
  UNKNOWN: {
    icon: <HelpCircle className="h-5 w-5" />,
    color: "bg-gray-500",
    text: "???",
  },
};

const PlayerCard = ({ player, onStatusChange }: PlayerCardProps) => {
  const currentStatus = statusConfig[player.status];

  return (
    <Card className="bg-secondary/50 flex flex-col justify-between">
      <CardHeader>
        <CardTitle className="text-xl flex items-center justify-between">
          <span>{player.name}</span>
          <span className={cn("text-sm font-bold text-white px-2 py-1 rounded-full flex items-center gap-1", currentStatus.color)}>
            {currentStatus.icon}
            {currentStatus.text}
          </span>
        </CardTitle>
      </CardHeader>
      <CardFooter className="flex justify-end gap-2">
        <Button variant={player.status === 'IN' ? 'default' : 'outline'} size="sm" onClick={() => onStatusChange(player.id, "IN")}>IN</Button>
        <Button variant={player.status === 'MAYBE' ? 'default' : 'outline'} size="sm" onClick={() => onStatusChange(player.id, "MAYBE")}>MAYBE</Button>
        <Button variant={player.status === 'OUT' ? 'destructive' : 'outline'} size="sm" onClick={() => onStatusChange(player.id, "OUT")}>OUT</Button>
      </CardFooter>
    </Card>
  );
};

export default PlayerCard;
