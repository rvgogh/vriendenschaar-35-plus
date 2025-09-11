import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  message: string;
  className?: string;
}

export const EmptyState = ({ message, className }: EmptyStateProps) => (
  <Card className={className}>
    <CardContent className="p-8 text-center">
      <p className="text-muted-foreground">{message}</p>
    </CardContent>
  </Card>
);
