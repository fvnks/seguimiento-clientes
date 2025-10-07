
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return new NextResponse(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    const { id } = params;
    const article = await prisma.newsArticle.findUnique({
      where: { id: parseInt(id) },
    });

    if (!article) {
      return new NextResponse(JSON.stringify({ error: 'Noticia no encontrada' }), { status: 404 });
    }

    return NextResponse.json(article, { status: 200 });
  } catch (error) {
    console.error("Error fetching news article:", error);
    return new NextResponse(JSON.stringify({ error: 'Error al obtener la noticia' }), { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return new NextResponse(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    const { title, content } = await req.json();
    const { id } = params;

    if (!title || !content) {
      return new NextResponse(JSON.stringify({ error: 'Título y contenido son requeridos' }), { status: 400 });
    }

    const updatedArticle = await prisma.newsArticle.update({
      where: { id: parseInt(id) },
      data: {
        title,
        content,
      },
    });

    return NextResponse.json(updatedArticle, { status: 200 });
  } catch (error) {
    console.error("Error updating news article:", error);
    return new NextResponse(JSON.stringify({ error: 'Error al actualizar la noticia' }), { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return new NextResponse(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    const { id } = params;

    await prisma.newsArticle.delete({
      where: { id: parseInt(id) },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting news article:", error);
    return new NextResponse(JSON.stringify({ error: 'Error al eliminar la noticia' }), { status: 500 });
  }
}
