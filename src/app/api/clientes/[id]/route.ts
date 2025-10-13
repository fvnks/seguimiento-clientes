import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { PaymentStatus } from "@/generated/prisma";

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

async function getFullClienteData(clienteId: number) {
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

  if (!cliente) return null;

  // Calculate total for each sale
  const clienteConVentasTotales = {
    ...cliente,
    ventas: cliente.ventas.map(venta => {
      const totalNeto = venta.productosVendidos.reduce((acc, item) => {
        // Ensure precioNeto is a number, default to 0 if not
        const precioNeto = typeof item.producto.precioNeto === 'number' ? item.producto.precioNeto : 0;
        return acc + (item.cantidad * precioNeto);
      }, 0);
      const total = totalNeto * 1.19; // Add 19% IVA
      return { ...venta, total };
    })
  };

  return clienteConVentasTotales;
}

export async function GET(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = parseInt(session.user.id, 10);
  const clienteId = parseInt(params.id, 10);

  if (isNaN(clienteId)) {
    return NextResponse.json({ message: "ID de cliente inválido" }, { status: 400 });
  }

  if (!await checkOwnership(userId, clienteId)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const clienteData = await getFullClienteData(clienteId);
    if (!clienteData) {
      return NextResponse.json({ message: "Cliente no encontrado" }, { status: 404 });
    }
    return NextResponse.json(clienteData);
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
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = parseInt(session.user.id, 10);
  const clienteId = parseInt(params.id, 10);

  if (isNaN(clienteId)) {
    return NextResponse.json({ message: "ID de cliente inválido" }, { status: 400 });
  }

  if (!await checkOwnership(userId, clienteId)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { razonSocial, rut, email, telefono, direccion, latitud, longitud, mediosDePago, paymentStatus } = body;

    const dataToUpdate: any = {};
    if (razonSocial) {
      dataToUpdate.razonSocial = razonSocial;
      dataToUpdate.nombre = razonSocial;
    }
    if (rut) dataToUpdate.rut = rut;
    if (email) dataToUpdate.email = email;
    if (telefono) dataToUpdate.telefono = telefono;
    if (direccion) dataToUpdate.direccion = direccion;
    if (latitud !== undefined) dataToUpdate.latitud = latitud;
    if (longitud !== undefined) dataToUpdate.longitud = longitud;
    if (mediosDePago !== undefined) dataToUpdate.mediosDePago = mediosDePago;
    if (paymentStatus) dataToUpdate.paymentStatus = paymentStatus as PaymentStatus;

    await prisma.cliente.update({
      where: { id: clienteId },
      data: dataToUpdate,
    });

    // After updating, fetch the full data to return to the client
    const updatedClienteData = await getFullClienteData(clienteId);

    return NextResponse.json(updatedClienteData);

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
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = parseInt(session.user.id, 10);
  const clienteId = parseInt(params.id, 10);

  if (isNaN(clienteId)) {
    return NextResponse.json({ message: "ID de cliente inválido" }, { status: 400 });
  }

  if (!await checkOwnership(userId, clienteId)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const ventas = await tx.venta.findMany({ where: { clienteId: clienteId } });
      const ventaIds = ventas.map(v => v.id);

      if (ventaIds.length > 0) {
        await tx.ventaProducto.deleteMany({
          where: { ventaId: { in: ventaIds } },
        });
        await tx.venta.deleteMany({
          where: { clienteId: clienteId },
        });
      }

      await tx.cliente.delete({
        where: { id: clienteId },
      });
    });

    return new NextResponse(null, { status: 204 });

  } catch (error) {
    console.error(`Error deleting cliente con id ${params.id}:`, error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
