import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { generateFormSchema, GenerateFormValues } from '@shared/schema';

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

export const useGenerateHeadshot = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: GenerateFormValues) => {
      const response = await fetch('/api/headshots/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate headshot');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Headshot generated',
        description: 'Your new headshot has been generated successfully.',
      });
      
      // Invalidate headshots query to refresh the gallery
      queryClient.invalidateQueries({ queryKey: ['/api/headshots'] });
      
      // Reset the form
      form.reset();
    },
    onError: (error) => {
      toast({
        title: 'Headshot generation failed',
        description: error instanceof Error ? error.message : 'Failed to generate headshot',
        variant: 'destructive'
      });
    }
  });
}

export const useModelStatus = (modelId?: number) => {
  return useQuery({
    queryKey: ['/api/models', modelId],
    queryFn: async () => {
      if (!modelId) return null;
      const response = await fetch(`/api/models/${modelId}`);
      if (!response.ok) throw new Error('Failed to fetch model');
      return response.json();
    },
    enabled: !!modelId,
  });
}

export const useCompletedModel = () => {
  return useQuery({
    queryKey: ['/api/models'],
    queryFn: async () => {
      const response = await fetch('/api/models');
      if (!response.ok) throw new Error('Failed to fetch completed models');
      const data = await response.json();
      console.log('model data:', data);
      if (data.status === 'completed') {
        console.log('completed model:', data.id);
        return data.id;
      }
      return null;
    },
  });
};

