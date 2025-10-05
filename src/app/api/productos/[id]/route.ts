import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: { id: string };
}

// GET /api/productos/[id]
export async function GET(request: Request, { params }: Params) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ message: "ID de producto inválido" }, { status: 400 });
    }

    const producto = await prisma.producto.findUnique({
      where: { id },
      include: { categoria: true }, // Include category information
    });

    if (!producto) {
      return NextResponse.json({ message: "Producto no encontrado" }, { status: 404 });
    }

    return NextResponse.json(producto);
  } catch (error) {
    console.error(`Error fetching producto ${params.id}:`, error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PUT /api/productos/[id]
export async function PUT(request: Request, { params }: Params) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ message: "ID de producto inválido" }, { status: 400 });
    }

    const body = await request.json();
    const { codigo, nombre, categoriaId, precioNeto, precioKilo } = body;

    if (!codigo || !nombre || precioNeto === undefined) {
      return NextResponse.json(
        { message: "Código, nombre y precio neto son requeridos" },
        { status: 400 }
      );
    }

    const precioNetoFloat = parseFloat(precioNeto);
    if (isNaN(precioNetoFloat)) {
      return NextResponse.json(
        { message: "El precio neto debe ser un número válido" },
        { status: 400 }
      );
    }

    const precioKiloFloat = precioKilo ? parseFloat(precioKilo) : null;
    if (precioKilo && isNaN(precioKiloFloat as number)) {
        return NextResponse.json(
            { message: "El precio por kilo debe ser un número válido" },
            { status: 400 }
        );
    }

    // Recalculate precioTotal
    const precioTotal = precioNetoFloat * 1.19;

    const updatedProducto = await prisma.producto.update({
      where: { id },
      data: {
        codigo,
        nombre,
        categoriaId: categoriaId ? parseInt(categoriaId, 10) : null,
        precioNeto: precioNetoFloat,
        precioTotal,
        precioKilo: precioKiloFloat,
      },
    });

    return NextResponse.json(updatedProducto);
  } catch (error) {
    console.error(`Error updating producto ${params.id}:`, error);
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2002') {
      return NextResponse.json({ message: 'El código del producto ya está en uso por otro producto' }, { status: 409 });
    }
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
