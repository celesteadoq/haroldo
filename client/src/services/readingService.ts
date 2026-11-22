import { api } from './api';
import type {
  ReadingHistoryItem,
  ReadingStatisticsData,
  SavedReadingProgress,
} from '../types/library';

export const readingService = {
  async getHistory(): Promise<ReadingHistoryItem[]> {
    const { data } = await api.get<{ items: ReadingHistoryItem[] }>('/reading-history');
    return data.items;
  },

  async removeHistoryEntry(bookId: string): Promise<void> {
    await api.delete(`/reading-history/${bookId}`);
  },

  async listProgress(): Promise<{
    items: SavedReadingProgress[];
    stats: ReadingStatisticsData;
  }> {
    const { data } = await api.get<{
      items: SavedReadingProgress[];
      stats: ReadingStatisticsData;
    }>('/reading-progress');
    return data;
  },

  async getProgress(bookId: string): Promise<SavedReadingProgress | null> {
    const { data } = await api.get<{ progress: SavedReadingProgress | null }>(
      `/reading-progress/${bookId}`
    );
    return data.progress;
  },

  async saveProgress(
    bookId: string,
    payload: {
      currentPage: number;
      readingSecondsDelta?: number;
      clientTimestamp?: string;
    }
  ): Promise<{ conflictResolved: boolean; progress: SavedReadingProgress }> {
    const { data } = await api.put<{
      conflictResolved: boolean;
      progress: SavedReadingProgress;
    }>(`/reading-progress/${bookId}`, payload);
    return data;
  },
};
