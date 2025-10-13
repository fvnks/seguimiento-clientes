import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const newsArticles = await prisma.newsArticle.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { username: true },
        },
      },
    });

    return NextResponse.json(newsArticles);
  } catch (error) {
    console.error("Error fetching news articles:", error);
    return new NextResponse(
      JSON.stringify({ error: 'Error al obtener las noticias' }),
      { status: 500 }
    );
  }
}
