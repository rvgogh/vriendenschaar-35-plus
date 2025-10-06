import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

export type StatusCount = {
  status: string;
  count: number;
  players: Array<{ id: number; name: string }>;
  emoji: string;
  label: string;
  color: string;
};

interface StatusOverviewProps {
  statusCounts: StatusCount[];
  selectedStatus?: string;
  onStatusSelect?: (status: string) => void;
  className?: string;
}

export const StatusOverview = ({ 
  statusCounts, 
  selectedStatus, 
  onStatusSelect,
  className 
}: StatusOverviewProps) => {
  const isMobile = useIsMobile();
  const [localSelectedStatus, setLocalSelectedStatus] = useState(statusCounts[0]?.status || '');
  
  const currentSelectedStatus = selectedStatus ?? localSelectedStatus;
  const handleStatusSelect = onStatusSelect ?? setLocalSelectedStatus;
  
  const selectedStatusData = statusCounts.find(s => s.status === currentSelectedStatus);
  
  return (
    <div className={cn("space-y-4", className)}>
      <h4 className="text-sm font-semibold text-muted-foreground">Aanwezigheidsoverzicht</h4>
      
      <div className={`grid gap-2 text-center text-sm ${statusCounts.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
        {statusCounts.map(({ status, count, players, emoji, label, color }) => (
          <div 
            key={status}
            className={cn(
              "space-y-0.5 cursor-pointer rounded-lg p-1.5 transition-colors min-w-0",
              isMobile && currentSelectedStatus === status && "bg-muted/50",
              isMobile && "hover:bg-muted/30"
            )}
            onClick={() => isMobile && handleStatusSelect(status)}
          >
            <div className="text-lg">{emoji}</div>
            <div className={cn("font-semibold text-sm", color)}>{count}</div>
            {!isMobile && players.length > 0 && (
              <div className="mt-2 space-y-1">
                {players.map((player) => (
                  <div key={player.id} className="text-xs text-foreground font-medium">
                    {player.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Mobile Player List */}
      {isMobile && selectedStatusData && selectedStatusData.players.length > 0 && (
        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
          <h5 className="text-sm font-medium mb-2">
            {selectedStatusData.label}
          </h5>
          <div className="space-y-1">
            {selectedStatusData.players.map((player) => (
              <div key={player.id} className="text-sm text-foreground">
                {player.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
