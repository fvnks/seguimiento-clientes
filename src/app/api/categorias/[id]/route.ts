import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: { id: string };
}

// DELETE /api/categorias/[id]
export async function DELETE(request: Request, { params }: Params) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ message: "ID de categoría inválido" }, { status: 400 });
    }

    // Before deleting the category, we must disconnect all products from it.
    // This sets their categoriaId to null.
    await prisma.$transaction(async (tx) => {
      await tx.producto.updateMany({
        where: {
          categoriaId: id,
        },
        data: {
          categoriaId: null,
        },
      });

      await tx.categoria.delete({
        where: { id },
      });
    });

    return new NextResponse(null, { status: 204 }); // No Content

  } catch (error) {
    console.error(`Error deleting categoria ${params.id}:`, error);
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2025') {
      return NextResponse.json({ message: "Categoría no encontrada" }, { status: 404 });
    }
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
