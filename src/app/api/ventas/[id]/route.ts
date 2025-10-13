import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

interface Params {
  params: { id: string };
}

// Helper function to check ownership
async function checkOwnership(userId: number, ventaId: number) {
  const venta = await prisma.venta.findUnique({
    where: { id: ventaId },
  });
  // Allow admins to see any sale note
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role === 'ADMIN') {
    return true;
  }
  return venta?.userId === userId;
}

// GET /api/ventas/[id]
export async function GET(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = parseInt(session.user.id, 10);
  const ventaId = parseInt(params.id, 10);

  if (isNaN(ventaId)) {
    return NextResponse.json({ message: "ID de venta inválido" }, { status: 400 });
  }

  if (!await checkOwnership(userId, ventaId)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const venta = await prisma.venta.findUnique({
      where: { id: ventaId },
      include: {
        cliente: true, 
        productosVendidos: {
          include: {
            producto: true,
          },
        },
        user: { // Include the user who made the sale
          select: {
            nombre: true,
            apellido: true,
            rut: true,
            zona: true,
            username: true,
          }
        }
      },
    });

    if (!venta) {
      return NextResponse.json({ message: "Venta no encontrada" }, { status: 404 });
    }

    // Calculate total for the sale
    const total = venta.productosVendidos.reduce((acc, item) => {
      return acc + (item.cantidad * item.precioAlMomento);
    }, 0);

    const ventaConTotal = { ...venta, total };

    return NextResponse.json(ventaConTotal);
  } catch (error) {
    console.error(`Error fetching venta ${params.id}:`, error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE /api/ventas/[id]
export async function DELETE(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = parseInt(session.user.id, 10);
  const ventaId = parseInt(params.id, 10);

  if (isNaN(ventaId)) {
    return NextResponse.json({ message: "ID de venta inválido" }, { status: 400 });
  }

  // Admin can delete any sale, so we check ownership differently or skip
  const isAdmin = (session.user as any).role === 'ADMIN';
  if (!isAdmin && !await checkOwnership(userId, ventaId)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.ventaProducto.deleteMany({ where: { ventaId: ventaId } });
      await tx.venta.delete({ where: { id: ventaId } });
    });

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error(`Error deleting venta ${params.id}:`, error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}