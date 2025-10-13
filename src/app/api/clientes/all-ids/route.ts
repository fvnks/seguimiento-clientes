import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = parseInt(session.user.id, 10);

  try {
    const clientes = await prisma.cliente.findMany({
      where: {
        userId: userId,
      },
      select: {
        id: true,
      },
    });

    const ids = clientes.map(c => c.id);
    return NextResponse.json(ids);
  } catch (error) {
    console.error("Error fetching all client IDs:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
