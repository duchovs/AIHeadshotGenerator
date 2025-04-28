import { apiRequest } from '@/lib/queryClient';

interface TrainModelParams {
  photoIds: number[];
}

interface GenerateHeadshotParams {
  modelId: number;
  style: string;
  prompt?: string;
}

export const trainModel = async (params: TrainModelParams) => {
  try {
    const response = await apiRequest('POST', '/api/models/train', params);
    return response.json();
  } catch (error) {
    console.error('Error training model:', error);
    throw error;
  }
};

export const getModelStatus = async (modelId: number) => {
  try {
    const response = await apiRequest('GET', `/api/models/${modelId}`, undefined);
    return response.json();
  } catch (error) {
    console.error('Error getting model status:', error);
    throw error;
  }
};

export const generateHeadshot = async (params: GenerateHeadshotParams) => {
  try {
    const response = await apiRequest('POST', '/api/headshots/generate', params);
    return response.json();
  } catch (error) {
    console.error('Error generating headshot:', error);
    throw error;
  }
};

export const getHeadshots = async (limit?: number) => {
  try {
    const url = limit ? `/api/headshots?limit=${limit}` : '/api/headshots';
    const response = await apiRequest('GET', url, undefined);
    return response.json();
  } catch (error) {
    console.error('Error getting headshots:', error);
    throw error;
  }
};

export const getHeadshot = async (id: number) => {
  try {
    const response = await apiRequest('GET', `/api/headshots/${id}`, undefined);
    return response.json();
  } catch (error) {
    console.error('Error getting headshot:', error);
    throw error;
  }
};

export const toggleFavorite = async (id: number) => {
  try {
    const response = await apiRequest('PATCH', `/api/headshots/${id}/favorite`, undefined);
    return response.json();
  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }
};
