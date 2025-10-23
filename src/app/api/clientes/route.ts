import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { PaymentStatus } from "@prisma/client";

// GET /api/clientes?search=...
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = parseInt(session.user.id, 10);

  try {
    const search = request.nextUrl.searchParams.get('search');

    const userWhereClause = {
      userId: userId,
    };

    const searchWhereClause = search
      ? {
          OR: [
            { nombre: { contains: search } },
            { razonSocial: { contains: search } },
            { email: { contains: search } },
            { rut: { contains: search } },
          ],
        }
      : {};

    const clientes = await prisma.cliente.findMany({
      where: { ...userWhereClause, ...searchWhereClause },
      orderBy: [
        { razonSocial: 'asc' },
        { nombre: 'asc' },
      ]
    });

    return NextResponse.json(clientes);
  } catch (error) {
    console.error("Error fetching clientes:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST /api/clientes
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = parseInt(session.user.id, 10);

  try {
    const body = await request.json();
    const { razonSocial, rut, email, telefono, direccion, latitud, longitud, mediosDePago, paymentStatus } = body;

    if (!razonSocial || !email) {
      return NextResponse.json(
        { message: "Razón Social y email son requeridos" },
        { status: 400 }
      );
    }

    const nuevoCliente = await prisma.cliente.create({
      data: {
        nombre: razonSocial, // Keep legacy field in sync
        razonSocial,
        rut,
        email,
        telefono,
        direccion,
        latitud,
        longitud,
        mediosDePago,
        paymentStatus: paymentStatus as PaymentStatus, // Cast to enum type
        userId: userId,
      },
    });

    return NextResponse.json(nuevoCliente, { status: 201 });
  } catch (error) {
    console.error("Error creating cliente:", error);
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2002') {
        const target = (error as any).meta?.target;
        if (target.includes('email')) {
            return NextResponse.json({ message: 'El email ya está en uso' }, { status: 409 });
        }
        if (target.includes('rut')) {
            return NextResponse.json({ message: 'El RUT ya está en uso' }, { status: 409 });
        }
    }
    
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}