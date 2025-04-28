import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export const useHeadshots = (limit?: number) => {
  return useQuery({
    queryKey: ['/api/headshots', limit],
    queryFn: async () => {
      const url = limit ? `/api/headshots?limit=${limit}` : '/api/headshots';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch headshots');
      return response.json();
    }
  });
};

export const useHeadshot = (id: number) => {
  return useQuery({
    queryKey: ['/api/headshots', id],
    queryFn: async () => {
      const response = await fetch(`/api/headshots/${id}`);
      if (!response.ok) throw new Error('Failed to fetch headshot');
      return response.json();
    },
    enabled: !!id
  });
};

export const useToggleFavorite = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/headshots/${id}/favorite`, {
        method: 'PATCH',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle favorite status');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/headshots'] });
      
      toast({
        title: data.favorite ? 'Added to favorites' : 'Removed from favorites',
        description: `Headshot has been ${data.favorite ? 'added to' : 'removed from'} your favorites.`
      });
    },
    onError: (error) => {
      toast({
        title: 'Action failed',
        description: error instanceof Error ? error.message : 'Failed to update favorite status',
        variant: 'destructive'
      });
    }
  });
};

export const useDeleteHeadshot = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/headshots/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete headshot');
      }
      
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['/api/headshots'] });
      
      toast({
        title: 'Headshot deleted',
        description: 'The headshot has been successfully deleted.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Failed to delete headshot',
        variant: 'destructive'
      });
    }
  });
};
