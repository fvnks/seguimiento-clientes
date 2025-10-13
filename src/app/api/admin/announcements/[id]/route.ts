
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
    const announcement = await prisma.announcement.findUnique({
      where: { id: parseInt(id) },
    });

    if (!announcement) {
      return new NextResponse(JSON.stringify({ error: 'Anuncio no encontrado' }), { status: 404 });
    }

    return NextResponse.json(announcement, { status: 200 });
  } catch (error) {
    console.error("Error fetching announcement:", error);
    return new NextResponse(JSON.stringify({ error: 'Error al obtener el anuncio' }), { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return new NextResponse(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    const { content, isActive } = await req.json();
    const { id } = params;

    if (isActive === true) {
      // Desactivar todos los demás anuncios
      await prisma.announcement.updateMany({
        where: {
          NOT: {
            id: parseInt(id),
          },
        },
        data: {
          isActive: false,
        },
      });
    }

    const updatedAnnouncement = await prisma.announcement.update({
      where: { id: parseInt(id) },
      data: {
        content,
        isActive,
      },
    });

    return NextResponse.json(updatedAnnouncement, { status: 200 });
  } catch (error) {
    console.error("Error updating announcement:", error);
    return new NextResponse(JSON.stringify({ error: 'Error al actualizar el anuncio' }), { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return new NextResponse(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    const { id } = params;

    await prisma.announcement.delete({
      where: { id: parseInt(id) },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return new NextResponse(JSON.stringify({ error: 'Error al eliminar el anuncio' }), { status: 500 });
  }
}
