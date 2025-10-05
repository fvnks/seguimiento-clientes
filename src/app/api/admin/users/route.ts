import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';

// GET /api/admin/users
export async function GET() {
  const session = await getServerSession(authOptions);

  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, role: true, createdAt: true },
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching users' }, { status: 500 });
  }
}

// POST /api/admin/users
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { username, password, role } = await request.json();

    if (!username || !password || !role) {
      return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role,
      },
    });

    return NextResponse.json({ id: newUser.id, username: newUser.username, role: newUser.role }, { status: 201 });
  } catch (error) {
    if ((error as any).code === 'P2002') {
      return NextResponse.json({ message: 'Username already exists' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Error creating user' }, { status: 500 });
  }
}
