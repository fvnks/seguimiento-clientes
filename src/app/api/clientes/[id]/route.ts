import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

interface Params {
  params: { id: string };
}

// Helper function to check ownership
async function checkOwnership(userId: number, clienteId: number) {
  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId },
  });
  return cliente?.userId === userId;
}

export async function GET(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = parseInt((session.user as any).id, 10);
  const clienteId = parseInt(params.id, 10);

  if (isNaN(clienteId)) {
    return NextResponse.json({ message: "ID de cliente inválido" }, { status: 400 });
  }

  if (!await checkOwnership(userId, clienteId)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      include: {
        ventas: {
          include: {
            productosVendidos: {
              include: {
                producto: true,
              },
            },
          },
          orderBy: {
            fecha: 'desc',
          },
        },
      },
    });

    if (!cliente) {
      return NextResponse.json({ message: "Cliente no encontrado" }, { status: 404 });
    }

    // Calculate total for each sale
    const clienteConVentasTotales = {
      ...cliente,
      ventas: cliente.ventas.map(venta => {
        const total = venta.productosVendidos.reduce((acc, item) => {
          return acc + (item.cantidad * item.precioAlMomento);
        }, 0);
        return { ...venta, total };
      })
    };

    return NextResponse.json(clienteConVentasTotales);
  } catch (error) {
    console.error(`Error fetching cliente con id ${params.id}:`, error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = parseInt((session.user as any).id, 10);
  const clienteId = parseInt(params.id, 10);

  if (isNaN(clienteId)) {
    return NextResponse.json({ message: "ID de cliente inválido" }, { status: 400 });
  }

  if (!await checkOwnership(userId, clienteId)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { razonSocial, rut, email, telefono, direccion, latitud, longitud } = body;

    if (!razonSocial || !email) {
      return NextResponse.json(
        { message: "Razón Social y email son requeridos" },
        { status: 400 }
      );
    }

    const updatedCliente = await prisma.cliente.update({
      where: { id: clienteId },
      data: {
        nombre: razonSocial, // Keep legacy field in sync
        razonSocial,
        rut,
        email,
        telefono,
        direccion,
        latitud,
        longitud,
      },
    });

    return NextResponse.json(updatedCliente);

  } catch (error: any) {
    console.error(`Error updating cliente con id ${params.id}:`, error);
    if (error.code === 'P2002') {
      const target = (error as any).meta?.target;
        if (target.includes('email')) {
            return NextResponse.json({ message: 'El email ya está en uso por otro cliente' }, { status: 409 });
        }
        if (target.includes('rut')) {
            return NextResponse.json({ message: 'El RUT ya está en uso por otro cliente' }, { status: 409 });
        }
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ message: "Cliente no encontrado" }, { status: 404 });
    }
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = parseInt((session.user as any).id, 10);
  const clienteId = parseInt(params.id, 10);

  if (isNaN(clienteId)) {
    return NextResponse.json({ message: "ID de cliente inválido" }, { status: 400 });
  }

  if (!await checkOwnership(userId, clienteId)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    // Use a transaction to delete all related data correctly
    await prisma.$transaction(async (tx) => {
      // Find all sales for the client
      const ventas = await tx.venta.findMany({ where: { clienteId: clienteId } });
      const ventaIds = ventas.map(v => v.id);

      if (ventaIds.length > 0) {
        // Delete all line items for those sales
        await tx.ventaProducto.deleteMany({
          where: { ventaId: { in: ventaIds } },
        });

        // Delete all sales for the client
        await tx.venta.deleteMany({
          where: { clienteId: clienteId },
        });
      }

      // Finally, delete the client
      await tx.cliente.delete({
        where: { id: clienteId },
      });
    });

    return new NextResponse(null, { status: 204 }); // No Content

  } catch (error) {
    console.error(`Error deleting cliente con id ${params.id}:`, error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}