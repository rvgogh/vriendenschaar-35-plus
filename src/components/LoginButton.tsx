
import React from 'react';
import { Button } from '@/components/ui/button';
import { LogIn, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import UserMenu from './UserMenu';

const LoginButton = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <User className="h-4 w-4 mr-2" />
        Laden...
      </Button>
    );
  }

  if (user) {
    return <UserMenu />;
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={() => navigate('/auth')}
    >
      <LogIn className="h-4 w-4 mr-2" />
      Inloggen
    </Button>
  );
};

export default LoginButton;
