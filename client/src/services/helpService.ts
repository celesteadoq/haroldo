import { api } from './api';
import type { HelpArticleItem } from '../types/subscription';

export const helpService = {
  async listPublic(params?: { search?: string; category?: string }): Promise<HelpArticleItem[]> {
    const { data } = await api.get<{ items: HelpArticleItem[] }>('/help', { params });
    return data.items;
  },

  async getPublicById(id: string): Promise<HelpArticleItem> {
    const { data } = await api.get<{ article: HelpArticleItem }>(`/help/${id}`);
    return data.article;
  },
};
