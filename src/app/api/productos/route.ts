import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

// GET /api/productos?search=...
export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get('search');
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(request.nextUrl.searchParams.get('pageSize') || '20', 10);

    const whereClause = search
      ? {
          OR: [
            { codigo: { contains: search } },
            { nombre: { contains: search } },
          ],
        }
      : {};

    const [productos, totalCount] = await prisma.$transaction([
      prisma.producto.findMany({
        where: whereClause,
        include: {
          categoria: true, // Include category information
        },
        orderBy: {
          nombre: 'asc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.producto.count({ where: whereClause }),
    ]);

    return NextResponse.json({ productos, totalCount });
  } catch (error) {
    console.error("Error fetching productos:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST /api/productos
export async function POST(request: Request) {
  try {
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

    // Calculate precioTotal by adding 19%
    const precioTotal = precioNetoFloat * 1.19;

    const nuevoProducto = await prisma.producto.create({
      data: {
        codigo,
        nombre,
        categoriaId: categoriaId ? parseInt(categoriaId, 10) : null,
        precioNeto: precioNetoFloat,
        precioTotal,
        precioKilo: precioKiloFloat,
      },
    });

    return NextResponse.json(nuevoProducto, { status: 201 });
  } catch (error) {
    console.error("Error creating producto:", error);
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2002') {
        return NextResponse.json({ message: 'El código del producto ya existe' }, { status: 409 });
    }
    
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
