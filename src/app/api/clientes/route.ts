import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { PaymentStatus } from "@/generated/prisma";

// GET /api/clientes?search=...&page=...&pageSize=...
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = parseInt(session.user.id, 10);

  try {
    const search = request.nextUrl.searchParams.get('search');
    const pageParam = request.nextUrl.searchParams.get('page');
    const pageSizeParam = request.nextUrl.searchParams.get('pageSize');

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

    const where = { ...userWhereClause, ...searchWhereClause };

    if (pageParam || pageSizeParam) {
      // Paginated response
      const page = parseInt(pageParam || '1', 10);
      const pageSize = parseInt(pageSizeParam || '15', 10);

      const [clientes, total] = await prisma.$transaction([
        prisma.cliente.findMany({
          where,
          orderBy: [{ razonSocial: 'asc' }, { nombre: 'asc' }],
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.cliente.count({ where }),
      ]);

      return NextResponse.json({
        data: clientes,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      });
    } else {
      // Unpaginated response
      const clientes = await prisma.cliente.findMany({
        where,
        orderBy: [{ razonSocial: 'asc' }, { nombre: 'asc' }],
      });
      return NextResponse.json(clientes); // Return array directly
    }
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
    const { 
      razonSocial, rut, email, telefono, direccion, latitud, longitud, mediosDePago, paymentStatus,
      empresa, codigoCliente, nombreAlias, tipoDespacho, canalCliente, subCanal, giroComercial,
      contacto, listaPrecios, ejecutivaComercial, tipoDireccion, ciudad, comuna
    } = body;

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
        // New fields
        empresa,
        codigoCliente,
        nombreAlias,
        tipoDespacho,
        canalCliente,
        subCanal,
        giroComercial,
        contacto,
        listaPrecios,
        ejecutivaComercial,
        tipoDireccion,
        ciudad,
        comuna,
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

// DELETE /api/clientes
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = parseInt(session.user.id, 10);

  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { message: "Se requiere un arreglo de IDs de cliente" },
        { status: 400 }
      );
    }

    const deleteResult = await prisma.cliente.deleteMany({
      where: {
        id: {
          in: ids,
        },
        userId: userId, // Ensure users can only delete their own clients
      },
    });

    return NextResponse.json({
      message: `Se eliminaron ${deleteResult.count} clientes.`,
      count: deleteResult.count,
    });
  } catch (error) {
    console.error("Error deleting clientes:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}