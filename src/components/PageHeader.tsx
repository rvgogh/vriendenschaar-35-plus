import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  backTo?: string;
  backLabel?: string;
  actions?: React.ReactNode;
}

export const PageHeader = ({ 
  title, 
  subtitle, 
  showBackButton = true, 
  backTo = "/", 
  backLabel = "Terug",
  actions 
}: PageHeaderProps) => {
  return (
    <header className="mb-8 flex justify-between items-start">
      <div className="flex flex-col gap-4">
        {showBackButton && (
          <Button asChild variant="outline" className="w-fit">
            <Link to={backTo} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </Link>
          </Button>
        )}
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
};
