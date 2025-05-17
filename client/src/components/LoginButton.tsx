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

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

interface LoginButtonProps {
  onAuthState?: (authState: AuthState) => void;
}

export const LoginButton = ({ onAuthState }: LoginButtonProps) => {
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
      if (onAuthState) onAuthState(data);
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
      window.location.href = '/';
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
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700 text-white font-medium transition"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      type="button"
      style={{
        display: 'flex',
        alignItems: 'center',
        background: '#4285f4',
        color: 'white',
        border: 'none',
        borderRadius: 4,
        boxShadow: '0 2px 4px 0 rgba(60,64,67,.30)',
        padding: '0',
        fontSize: 16,
        fontWeight: 500,
        height: 40,
        minWidth: 220,
        cursor: 'pointer',
        outline: 'none',
      }}
    >
      <span style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'white',
        height: '100%',
        width: 40,
        borderTopLeftRadius: 4,
        borderBottomLeftRadius: 4,
        marginRight: 10,
      }}>
        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
          <g>
            <path d="M17.64 9.2045c0-.638-.0573-1.2527-.1636-1.8409H9v3.4818h4.8445c-.2082 1.1236-.8345 2.0754-1.7763 2.719v2.2582h2.8736C16.9782 14.091 17.64 11.8627 17.64 9.2045z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.47-.8064 5.96-2.1882l-2.8736-2.2582c-.7976.5353-1.8145.8527-3.0864.8527-2.3746 0-4.3855-1.6036-5.1063-3.7646H.8477v2.3364C2.3291 16.4327 5.4073 18 9 18z" fill="#34A853"/>
            <path d="M3.8937 10.6418c-.1818-.5353-.2863-1.1064-.2863-1.6418s.1045-1.1064.2863-1.6418V5.0218H.8477C.3055 6.1064 0 7.5 0 9c0 1.5.3055 2.8936.8477 3.9782l3.046-2.3364z" fill="#FBBC05"/>
            <path d="M9 3.5791c1.3218 0 2.5045.4546 3.4373 1.3455l2.5782-2.5782C13.4655.8055 11.4255 0 9 0 5.4073 0 2.3291 1.5673.8477 4.0218l3.046 2.3364C4.6145 5.1827 6.6255 3.5791 9 3.5791z" fill="#EA4335"/>
          </g>
        </svg>
      </span>
      <span style={{ flex: 1, textAlign: 'center', fontWeight: 500, letterSpacing: 0.2 }}>
        Sign in with Google
      </span>
    </button>
  );
};

// Export as default for backward compatibility
export default LoginButton;