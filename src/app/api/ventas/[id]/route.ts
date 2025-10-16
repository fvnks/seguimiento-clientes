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
        const descuento = (item as any).descuento || 0;
        const precioNeto = item.producto?.precioNeto || 0;
        const precioConDescuento = (precioNeto * (1 - descuento / 100)) * 1.19;
        return acc + (item.cantidad * precioConDescuento);
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

// PUT /api/ventas/[id]
export async function PUT(request: Request, { params }: Params) {
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
    const body = await request.json();
    const { clienteId, fecha, descripcion, productos } = body;

    if (!clienteId || !fecha || !productos || !Array.isArray(productos) || productos.length === 0) {
      return NextResponse.json({ message: 'Datos de venta inválidos' }, { status: 400 });
    }

    const updatedVenta = await prisma.$transaction(async (tx) => {
      // 1. Update the Venta itself
      const venta = await tx.venta.update({
        where: { id: ventaId },
        data: {
          clienteId: parseInt(clienteId, 10),
          fecha: new Date(fecha),
          descripcion,
        },
      });

      // 2. Delete old VentaProducto records
      await tx.ventaProducto.deleteMany({ where: { ventaId: ventaId } });

      // 3. Create new VentaProducto records
      const productosData = await Promise.all(productos.map(async (p: { productoId: number; cantidad: number; descuento: number; }) => {
        const producto = await tx.producto.findUnique({ where: { id: p.productoId } });
        if (!producto) {
          throw new Error(`Producto con ID ${p.productoId} no encontrado`);
        }
        return {
          ventaId: ventaId,
          productoId: p.productoId,
          cantidad: p.cantidad,
          precioAlMomento: producto.precioTotal, // Use current price
          descuento: p.descuento || 0,
        };
      }));

      await tx.ventaProducto.createMany({
        data: productosData,
      });

      return venta;
    });

    return NextResponse.json(updatedVenta);

  } catch (error) {
    console.error(`Error updating venta ${params.id}:`, error);
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