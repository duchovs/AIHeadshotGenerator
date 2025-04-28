import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export interface TrainModelData {
  photoIds: number[];
}

export const useTrainModel = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: TrainModelData) => {
      const response = await fetch('/api/models/train', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start training');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Training started',
        description: 'Your AI model is now being trained. This may take 15-20 minutes.'
      });
      
      return data;
    },
    onError: (error) => {
      toast({
        title: 'Training failed',
        description: error instanceof Error ? error.message : 'Failed to start training',
        variant: 'destructive'
      });
    }
  });
};

export const useModelStatus = (modelId?: number) => {
  return useQuery({
    queryKey: ['/api/models', modelId],
    queryFn: async () => {
      if (!modelId) return null;
      
      const response = await fetch(`/api/models/${modelId}`);
      if (!response.ok) throw new Error('Failed to fetch model status');
      return response.json();
    },
    enabled: !!modelId,
    refetchInterval: (data) => {
      // Refetch every 5 seconds until training is complete
      return data?.status === 'completed' ? false : 5000;
    }
  });
};

export const useModels = () => {
  return useQuery({
    queryKey: ['/api/models'],
    queryFn: async () => {
      const response = await fetch('/api/models');
      if (!response.ok) throw new Error('Failed to fetch models');
      return response.json();
    }
  });
};
