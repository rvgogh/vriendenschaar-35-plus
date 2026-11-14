import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { MapPin } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type StatusCount = {
  status: string;
  count: number;
  players: Array<{ id: number; name: string; verified_at?: string | null }>;
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

const GpsIcon = ({ verifiedAt }: { verifiedAt: string }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger>
        <MapPin className="h-3 w-3 text-green-600 inline ml-1" />
      </TooltipTrigger>
      <TooltipContent>
        <p>GPS geverifieerd op {new Date(verifiedAt).toLocaleString('nl-NL')}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

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
      
      <div className={`grid gap-2 text-center text-sm ${statusCounts.length === 3 ? 'grid-cols-3' : statusCounts.length === 5 ? 'grid-cols-3 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'}`}>
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
            <div className="text-lg" title={label} aria-label={label}>{emoji}</div>
            <div className={cn("font-semibold text-sm", color)}>{count}</div>
            {!isMobile && players.length > 0 && (
              <div className="mt-2 space-y-1">
                {players.map((player) => (
                  <div key={player.id} className="text-xs text-foreground font-medium flex items-center justify-center">
                    {player.name}
                    {player.verified_at && <GpsIcon verifiedAt={player.verified_at} />}
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
              <div key={player.id} className="text-sm text-foreground flex items-center">
                {player.name}
                {player.verified_at && <GpsIcon verifiedAt={player.verified_at} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
