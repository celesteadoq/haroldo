import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { AdminAuditService } from './admin/adminAudit.service';

export class HelpService {
  constructor(private readonly auditService = new AdminAuditService()) {}

  async listPublicArticles(search?: string, category?: string) {
    return prisma.helpArticle.findMany({
      where: {
        isActive: true,
        ...(category ? { category } : {}),
        ...(search
          ? { OR: [{ question: { contains: search } }, { answer: { contains: search } }] }
          : {}),
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async getPublicArticleById(id: string) {
    const article = await prisma.helpArticle.findFirst({
      where: { id, isActive: true },
    });
    if (!article) {
      throw new AppError('Artigo de ajuda não encontrado.', 404);
    }
    return article;
  }

  async listAdminArticles() {
    return prisma.helpArticle.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async createArticle(
    adminUserId: string,
    data: {
      category: string;
      question: string;
      answer: string;
      displayOrder: number;
      isActive: boolean;
    }
  ) {
    const article = await prisma.helpArticle.create({ data });
    await this.auditService.record({
      adminUserId,
      action: 'HELP_ARTICLE_CREATE',
      entityType: 'HelpArticle',
      entityId: article.id,
      details: { category: article.category },
    });
    return article;
  }

  async updateArticle(
    adminUserId: string,
    id: string,
    data: {
      category?: string;
      question?: string;
      answer?: string;
      displayOrder?: number;
      isActive?: boolean;
    }
  ) {
    const existing = await prisma.helpArticle.findUnique({ where: { id } });
    if (!existing) throw new AppError('Artigo de ajuda não encontrado.', 404);

    const article = await prisma.helpArticle.update({ where: { id }, data });
    await this.auditService.record({
      adminUserId,
      action: 'HELP_ARTICLE_UPDATE',
      entityType: 'HelpArticle',
      entityId: id,
      details: { isActive: article.isActive },
    });
    return article;
  }

  async deleteArticle(adminUserId: string, id: string) {
    const existing = await prisma.helpArticle.findUnique({ where: { id } });
    if (!existing) throw new AppError('Artigo de ajuda não encontrado.', 404);

    await prisma.helpArticle.delete({ where: { id } });
    await this.auditService.record({
      adminUserId,
      action: 'HELP_ARTICLE_DELETE',
      entityType: 'HelpArticle',
      entityId: id,
    });
  }
}
