import { api } from './api';
import type { FavoriteListItem, LibraryResponse, ReadingStatus } from '../types/library';

export const libraryService = {
  async getLibrary(status?: ReadingStatus): Promise<LibraryResponse> {
    const { data } = await api.get<LibraryResponse>('/library', {
      params: status ? { status } : undefined,
    });
    return data;
  },

  async addToLibrary(bookId: string, status: ReadingStatus = 'WANT_TO_READ'): Promise<void> {
    await api.post(`/library/${bookId}`, { status });
  },

  async updateStatus(bookId: string, status: ReadingStatus): Promise<void> {
    await api.patch(`/library/${bookId}`, { status });
  },

  async removeFromLibrary(bookId: string): Promise<void> {
    await api.delete(`/library/${bookId}`);
  },

  async getFavorites(): Promise<FavoriteListItem[]> {
    const { data } = await api.get<{ items: FavoriteListItem[] }>('/favorites');
    return data.items;
  },

  async getFavoriteIds(): Promise<string[]> {
    const { data } = await api.get<{ bookIds: string[] }>('/favorites/ids');
    return data.bookIds;
  },
};
