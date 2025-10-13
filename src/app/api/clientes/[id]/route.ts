import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = parseInt(session.user.id, 10);
  const clienteId = parseInt(params.id, 10);

  try {
    const cliente = await prisma.cliente.findUnique({
      where: {
        id: clienteId,
        userId: userId, // Ensure user can only access their own clients
      },
    });

    if (!cliente) {
      return NextResponse.json({ message: "Cliente no encontrado" }, { status: 404 });
    };

    return NextResponse.json(cliente);
  } catch (error) {
    console.error("Error fetching cliente:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = parseInt(session.user.id, 10);
    const clienteId = parseInt(params.id, 10);

    try {
        const deleteResult = await prisma.cliente.deleteMany({
            where: {
                id: clienteId,
                userId: userId, // Ensure user can only delete their own clients
            },
        });

        if (deleteResult.count === 0) {
            return NextResponse.json({ message: "Cliente no encontrado o no tienes permiso para eliminarlo" }, { status: 404 });
        }

        return new NextResponse(null, { status: 204 }); // No content
    } catch (error) {
        console.error("Error deleting cliente:", error);
        return NextResponse.json(
            { message: "Error interno del servidor" },
            { status: 500 }
        );
    }
}