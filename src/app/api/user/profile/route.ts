import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

// GET /api/user/profile
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return new NextResponse(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    const userProfile = await prisma.user.findUnique({
      where: { id: parseInt((session.user as any).id) },
      select: { // Select specific fields to avoid sending the password
        id: true,
        username: true,
        email: true, // Assuming email is on the user model, let's add it if not
        nombre: true,
        apellido: true,
        rut: true,
        zona: true,
        role: true,
      },
    });

    if (!userProfile) {
      return new NextResponse(JSON.stringify({ error: 'Usuario no encontrado' }), { status: 404 });
    }

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return new NextResponse(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
}

// PUT /api/user/profile
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return new NextResponse(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    const body = await req.json();
    const { nombre, apellido, rut, zona } = body;

    const updatedUser = await prisma.user.update({
      where: { id: parseInt((session.user as any).id) },
      data: {
        nombre,
        apellido,
        rut,
        zona,
      },
      select: { // Return the updated data securely
        id: true,
        username: true,
        email: true,
        nombre: true,
        apellido: true,
        rut: true,
        zona: true,
        role: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
     console.error("Error updating user profile:", error);
    if (error.code === 'P2002' && error.meta?.target.includes('rut')) {
        return new NextResponse(JSON.stringify({ error: 'El RUT ya está en uso por otro usuario' }), { status: 409 });
    }
    return new NextResponse(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
}
