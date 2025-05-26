import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { generateFormSchema, GenerateFormValues } from '@shared/schema';
import { type UseFormReturn } from 'react-hook-form';

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

export const useGenerateHeadshot = (form: UseFormReturn<GenerateFormValues>) => {
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
    queryKey: ['/api/models', 'checkCompleted'], // More specific query key
    queryFn: async () => {
      const response = await fetch('/api/models');
      
      if (!response.ok) {
        // If the API returns 404, it might mean no models exist or none are completed.
        // Treat this as "no completed model found" rather than an error for this specific hook's purpose.
        if (response.status === 404) {
          return null;
        }
        // For other errors, throw to let React Query handle it.
        throw new Error(`Failed to fetch completed models, status: ${response.status}`);
      }
      
      const data = await response.json();

      // Expecting data to be an array of models
      if (Array.isArray(data) && data.length > 0) {
        // Check if any model in the array has status 'completed'
        // This assumes the API might return multiple models, and we're looking for the first completed one.
        // If the API is guaranteed to return only one relevant model or an empty array, this logic might simplify.
        const completed = data.find(model => model.status === 'completed');
        if (completed && completed.id) {
          return completed.id as string; // Assuming ID is a string
        }
      }
      return null; // No completed model found
    },
    // Optional: Configure staleTime or refetchOnWindowFocus if needed
    // staleTime: 5 * 60 * 1000, // e.g., data is fresh for 5 minutes
    // refetchOnWindowFocus: false,
  });
};

