import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';

type User = {
  id: number;
  username: string;
  email?: string;
  displayName?: string;
  profilePicture?: string;
};

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

export const LoginButton = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null
  });
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  const fetchAuthStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/user');
      const data = await response.json();
      setAuthState(data);
    } catch (error) {
      console.error('Error fetching auth status:', error);
      toast({
        title: 'Error',
        description: 'Failed to check authentication status.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthStatus();
  }, []);

  const handleLogin = () => {
    window.location.href = '/auth/google';
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout');
      setAuthState({
        isAuthenticated: false,
        user: null
      });
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.'
      });
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: 'Error',
        description: 'Failed to log out.',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return <Button disabled>Loading...</Button>;
  }

  if (authState.isAuthenticated) {
    return (
      <div className="flex items-center gap-3">
        {authState.user?.profilePicture && (
          <img 
            src={authState.user.profilePicture} 
            alt="Profile" 
            className="w-8 h-8 rounded-full"
          />
        )}
        <span className="text-sm font-medium mr-2">
          {authState.user?.displayName || authState.user?.username}
        </span>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={handleLogin}>
      Login with Google
    </Button>
  );
};

export default LoginButton;