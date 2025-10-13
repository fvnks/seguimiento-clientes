import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return new NextResponse(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(announcements, { status: 200 });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return new NextResponse(JSON.stringify({ error: 'Error al obtener los anuncios' }), { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return new NextResponse(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    const { content } = await req.json();

    if (!content) {
      return new NextResponse(JSON.stringify({ error: 'El contenido es requerido' }), { status: 400 });
    }

    // Deactivate all previous announcements
    await prisma.announcement.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    const newAnnouncement = await prisma.announcement.create({
      data: {
        content,
        authorId: parseInt((session.user as any).id),
        isActive: true,
      },
    });

    return NextResponse.json(newAnnouncement, { status: 201 });
  } catch (error) {
    console.error("Error creating announcement:", error);
    return new NextResponse(JSON.stringify({ error: 'Error al crear el anuncio' }), { status: 500 });
  }
}
