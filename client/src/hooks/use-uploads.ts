import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export const useUploads = () => {
  return useQuery({
    queryKey: ['/api/uploads'],
    queryFn: async () => {
      const response = await fetch('/api/uploads');
      if (!response.ok) throw new Error('Failed to fetch uploads');
      return response.json();
    }
  });
};

export const useDeleteUpload = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/uploads/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete upload');
      }
      
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['/api/uploads'] });
      
      toast({
        title: 'Photo deleted',
        description: 'The photo has been successfully deleted.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Failed to delete photo',
        variant: 'destructive'
      });
    }
  });
};

export const useUploadPhotos = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('photos', file);
      });
      
      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload photos');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/uploads'] });
      
      toast({
        title: 'Upload successful',
        description: `${data.length} photos uploaded successfully.`
      });
    },
    onError: (error) => {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload photos',
        variant: 'destructive'
      });
    }
  });
};
