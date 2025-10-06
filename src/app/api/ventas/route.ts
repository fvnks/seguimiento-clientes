import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

// GET /api/ventas
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = parseInt(session.user.id, 10);

  try {
    const ventas = await prisma.venta.findMany({
      where: { userId: userId },
      include: {
        cliente: {
          select: {
            nombre: true,
            razonSocial: true,
          },
        },
        productosVendidos: {
          include: {
            producto: true,
          },
        },
      },
      orderBy: {
        fecha: 'desc',
      }
    });

    // Calculate the total for each sale and prepare it for the calendar view
    const ventasParaCalendario = ventas.map(venta => {
      const totalNeto = venta.productosVendidos.reduce((acc, item) => {
        // Ensure precioNeto is a number, default to 0 if not
        const precioNeto = typeof item.producto.precioNeto === 'number' ? item.producto.precioNeto : 0;
        return acc + (item.cantidad * precioNeto);
      }, 0);
      const monto = totalNeto * 1.19; // Add 19% IVA

      return {
        id: venta.id,
        fecha: venta.fecha.toISOString(),
        monto: monto,
        descripcion: venta.descripcion,
        cliente: {
          nombre: venta.cliente.razonSocial || venta.cliente.nombre,
        },
      };
    });

    return NextResponse.json(ventasParaCalendario);
  } catch (error) {
    console.error("Error fetching ventas:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// The POST handler for creating detailed sales.
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = parseInt(session.user.id, 10);

  try {
    const body = await request.json();
    const { clienteId, productos, fecha, descripcion } = body;

    if (!clienteId || !productos || productos.length === 0) {
      return NextResponse.json(
        { message: "Se requiere un cliente y al menos un producto para crear una venta." },
        { status: 400 }
      );
    }

    const newVenta = await prisma.$transaction(async (tx) => {
      // 1. Create the parent Venta record
      const venta = await tx.venta.create({
        data: {
          clienteId: parseInt(clienteId, 10),
          fecha: new Date(fecha),
          descripcion: descripcion || null,
          userId: userId,
        },
      });

      // 2. For each product, find its price and create a VentaProducto line item
      for (const item of productos) {
        const producto = await tx.producto.findUnique({
          where: { id: item.productoId },
        });

        if (!producto) {
          throw new Error(`Producto con ID ${item.productoId} no encontrado.`);
        }

        await tx.ventaProducto.create({
          data: {
            ventaId: venta.id,
            productoId: item.productoId,
            cantidad: item.cantidad,
            precioAlMomento: producto.precioTotal, // Save the price at the time of sale
          },
        });
      }

      return venta;
    });

    return NextResponse.json(newVenta, { status: 201 });

  } catch (error) {
    console.error("Error creating venta:", error);
    return NextResponse.json(
      { message: "Error interno del servidor al crear la venta." },
      { status: 500 }
    );
  }
}
