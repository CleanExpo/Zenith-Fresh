import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page');
    const element = searchParams.get('element');

    if (!page) {
      return NextResponse.json({ error: 'Page parameter is required' }, { status: 400 });
    }

    // Find contextual help articles for this page/element
    const contextualHelp = await prisma.contextualHelp.findMany({
      where: {
        page: page,
        element: element || undefined,
        isActive: true,
        article: {
          isPublished: true
        }
      },
      include: {
        article: true
      },
      orderBy: {
        priority: 'desc'
      }
    });

    // Transform the data
    const articles = contextualHelp
      .map(ch => ch.article)
      .filter(article => article !== null)
      .map(article => ({
        id: article.id,
        title: article.title,
        content: article.content,
        summary: article.summary,
        category: article.category,
        difficulty: article.difficulty,
        estimatedReadTime: article.estimatedReadTime
      }));

    // If no specific contextual help found, get general articles for the page
    if (articles.length === 0) {
      const fallbackArticles = await prisma.helpArticle.findMany({
        where: {
          isPublished: true,
          OR: [
            { category: getPageCategory(page) },
            { tags: { has: page } }
          ]
        },
        orderBy: [
          { isFeatured: 'desc' },
          { viewCount: 'desc' }
        ],
        take: 5
      });

      const fallbackData = fallbackArticles.map(article => ({
        id: article.id,
        title: article.title,
        content: article.content,
        summary: article.summary,
        category: article.category,
        difficulty: article.difficulty,
        estimatedReadTime: article.estimatedReadTime
      }));

      return NextResponse.json({ articles: fallbackData });
    }

    // Track article views
    const articleIds = articles.map(a => a.id);
    if (articleIds.length > 0) {
      await prisma.helpArticle.updateMany({
        where: {
          id: { in: articleIds }
        },
        data: {
          viewCount: { increment: 1 },
          lastViewed: new Date()
        }
      });
    }

    return NextResponse.json({ articles });

  } catch (error) {
    console.error('Error fetching contextual help:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contextual help' },
      { status: 500 }
    );
  }
}

function getPageCategory(page: string): string {
  // Map pages to help categories
  const pageCategories: Record<string, string> = {
    '/dashboard': 'getting-started',
    '/tools/website-analyzer': 'features',
    '/competitive-intelligence': 'features',
    '/teams': 'features',
    '/billing': 'billing',
    '/settings': 'features',
    '/projects': 'getting-started',
    '/monitoring': 'features',
    '/integrations': 'features',
    '/ai-orchestration': 'features'
  };

  return pageCategories[page] || 'getting-started';
}