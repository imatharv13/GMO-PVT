import { ApiResponse } from '../types';

const API_BASE_URL = 'https://api.artic.edu/api/v1/artworks';

export const fetchArtworks = async (page: number): Promise<ApiResponse> => {
  const response = await fetch(`${API_BASE_URL}?page=${page}`);
  if (!response.ok) {
    throw new Error('Failed to fetch artworks');
  }
  return response.json();
};
