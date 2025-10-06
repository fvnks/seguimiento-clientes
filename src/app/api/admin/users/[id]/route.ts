import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';

// GET /api/admin/users/[id]
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(params.id, 10) },
      select: { id: true, username: true, role: true },
    });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching user' }, { status: 500 });
  }
}

// PUT /api/admin/users/[id]
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { username, role, password } = await request.json();
    if (!username || !role) {
      return NextResponse.json({ message: 'Username and role are required' }, { status: 400 });
    }

    let dataToUpdate: any = { username, role };

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      dataToUpdate.password = hashedPassword;
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(params.id, 10) },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    if ((error as any).code === 'P2002') {
      return NextResponse.json({ message: 'Username already exists' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Error updating user' }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id]
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const userIdToDelete = parseInt(params.id, 10);
  if ((session?.user as any)?.id === userIdToDelete) {
    return NextResponse.json({ message: 'Cannot delete yourself' }, { status: 400 });
  }

  try {
    await prisma.user.delete({ where: { id: userIdToDelete } });
    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    return NextResponse.json({ message: 'Error deleting user' }, { status: 500 });
  }
}
