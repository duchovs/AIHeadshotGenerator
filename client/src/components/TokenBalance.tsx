import { useQuery } from '@tanstack/react-query';
import { Coins } from 'lucide-react';

const TokenBalance = () => {
  const { data: balanceData } = useQuery({
    queryKey: ['/api/stripe/balance'],
    queryFn: async () => {
      const res = await fetch('/api/stripe/balance');
      if (!res.ok) throw new Error('Failed to fetch balance');
      return res.json();
    }
  });

  return (
    <div className="flex items-center space-x-1 text-gray-600">
      <Coins size={16} className="text-yellow-500" />
      <span className="font-medium">{balanceData?.balance ?? 0}</span>
    </div>
  );
};

export default TokenBalance;
