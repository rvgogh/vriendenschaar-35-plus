
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/sonner';

const UserMenu = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Succesvol uitgelogd');
    } catch (error) {
      toast.error('Uitloggen mislukt');
    }
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <User className="h-4 w-4 mr-2" />
          {user.email}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Uitloggen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
