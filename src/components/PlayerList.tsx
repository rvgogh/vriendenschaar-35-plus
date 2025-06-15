
import { useState } from "react";
import { initialPlayers, Player, PlayerStatus } from "@/data/players";
import PlayerCard from "./PlayerCard";

const PlayerList = () => {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);

  const handleStatusChange = (id: number, status: PlayerStatus) => {
    setPlayers(
      players.map((p) => (p.id === id ? { ...p, status } : p))
    );
  };

  const inCount = players.filter(p => p.status === 'IN').length;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold text-primary">Team Roster</h2>
        <div className="text-right">
            <p className="text-2xl font-bold text-green-500">{inCount}</p>
            <p className="text-sm text-muted-foreground">Players Confirmed</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {players.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>
    </div>
  );
};

export default PlayerList;
