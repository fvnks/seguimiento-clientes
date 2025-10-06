import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const latestAnnouncement = await prisma.announcement.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(latestAnnouncement);
  } catch (error) {
    console.error("Error fetching latest announcement:", error);
    return new NextResponse(
      JSON.stringify({ error: 'Error al obtener el último anuncio' }),
      { status: 500 }
    );
  }
}
