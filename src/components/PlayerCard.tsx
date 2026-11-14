
import { PlayerWithStatus, PlayerStatus } from "@/types";
import { Card, CardTitle } from "@/components/ui/card";
import { AttendanceButtons } from "./AttendanceButtons";

interface PlayerCardProps {
  player: PlayerWithStatus;
  onStatusChange: (id: number, status: PlayerStatus) => void;
  canPlay?: boolean;
}

const PlayerCard = ({ player, onStatusChange, canPlay = true }: PlayerCardProps) => {
  return (
    <Card className="bg-secondary/50 flex flex-wrap gap-2 items-center justify-between p-3">
      <CardTitle className="text-xl break-words min-w-0">
        {player.name}
      </CardTitle>
      <AttendanceButtons variant="match" currentStatus={player.status} canPlay={canPlay}
        onStatusChange={status => onStatusChange(player.id, status as PlayerStatus)} />
    </Card>
  );
};

export default PlayerCard;
