import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/configuracion
export async function GET() {
  try {
    const settings = await prisma.setting.findMany();
    
    // Transform the array of settings into a single object
    const settingsObject = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json(settingsObject);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST /api/configuracion
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Use a transaction to update all settings
    const updatePromises = Object.entries(body).map(([key, value]) => {
      return prisma.setting.upsert({
        where: { key },
        update: { value: value as string },
        create: { key, value: value as string },
      });
    });

    await prisma.$transaction(updatePromises);

    return NextResponse.json({ message: "Configuración guardada exitosamente" });

  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json(
      { message: "Error interno del servidor al guardar la configuración" },
      { status: 500 }
    );
  }
}
