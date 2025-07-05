
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EventAttendanceStatus, PlayerWithEventStatus } from "@/types";

interface EventPlayerCardProps {
  player: PlayerWithEventStatus;
  onStatusChange: (id: number, status: EventAttendanceStatus) => void;
}

const EventPlayerCard = ({ player, onStatusChange }: EventPlayerCardProps) => {
  const getStatusColor = (status: EventAttendanceStatus) => {
    switch (status) {
      case "YES": return "bg-green-100 text-green-800 border-green-300";
      case "MAYBE": return "bg-orange-100 text-orange-800 border-orange-300";
      case "NO": return "bg-red-100 text-red-800 border-red-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusText = (status: EventAttendanceStatus) => {
    switch (status) {
      case "YES": return "🍆 Ja";
      case "MAYBE": return "❓ Misschien";
      case "NO": return "❌ Nee";
      default: return "➖ Onbekend";
    }
  };

  return (
    <Card className={`transition-all duration-200 ${getStatusColor(player.status)} border-2`}>
      <CardContent className="p-4">
        <div className="flex flex-col items-center space-y-3">
          <h3 className="text-lg font-semibold text-center">{player.name}</h3>
          
          <div className="text-sm font-medium">
            {getStatusText(player.status)}
          </div>
          
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              size="sm"
              variant={player.status === "YES" ? "default" : "outline"}
              onClick={() => onStatusChange(player.id, "YES")}
              className="text-xs"
            >
              🍆 Ja
            </Button>
            <Button
              size="sm"
              variant={player.status === "MAYBE" ? "default" : "outline"}
              onClick={() => onStatusChange(player.id, "MAYBE")}
              className="text-xs"
            >
              ❓ Misschien
            </Button>
            <Button
              size="sm"
              variant={player.status === "NO" ? "default" : "outline"}
              onClick={() => onStatusChange(player.id, "NO")}
              className="text-xs"
            >
              ❌ Nee
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventPlayerCard;
