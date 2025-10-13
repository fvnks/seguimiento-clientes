import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return new NextResponse(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    const { title, content } = await req.json();

    if (!title || !content) {
      return new NextResponse(JSON.stringify({ error: 'Título y contenido son requeridos' }), { status: 400 });
    }

    const newArticle = await prisma.newsArticle.create({
      data: {
        title,
        content,
        authorId: parseInt((session.user as any).id),
      },
    });

    return NextResponse.json(newArticle, { status: 201 });
  } catch (error) {
    console.error("Error creating news article:", error);
    return new NextResponse(JSON.stringify({ error: 'Error al crear la noticia' }), { status: 500 });
  }
}
