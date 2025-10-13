import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import xlsx = require('xlsx');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ message: "No se encontró ningún archivo." }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    if (data.length === 0) {
        return NextResponse.json({ message: "El archivo de Excel está vacío o tiene un formato incorrecto." }, { status: 400 });
    }

    // --- Column Mapping --- 
    const columnMapping = {
        codigo: 'Código',
        nombre: 'Descripción del artículo',
        categoria: 'Categoria',
        precioNeto: 'Precio Neto',
        precioKilo: 'Precio Kilo',
    };

    // For efficient category lookup, fetch all categories once
    const allCategorias = await prisma.categoria.findMany();
    const categoriaMap = new Map(allCategorias.map(cat => [cat.nombre.toLowerCase(), cat.id]));

    let createdCount = 0;
    let updatedCount = 0;

    const upsertPromises = data.map(async (row: any) => {
        const codigo = row[columnMapping.codigo];
        const nombre = row[columnMapping.nombre];
        const precioNeto = parseFloat(row[columnMapping.precioNeto]);
        const precioKilo = row[columnMapping.precioKilo] ? parseFloat(row[columnMapping.precioKilo]) : null;
        const categoriaNombre = row[columnMapping.categoria];

        if (!codigo || !nombre || isNaN(precioNeto)) {
            console.warn('Saltando fila por datos inválidos o faltantes:', row);
            return;
        }

        const categoriaId = categoriaNombre ? categoriaMap.get(String(categoriaNombre).toLowerCase()) : null;

        const precioTotal = precioNeto * 1.19;

        const productData = {
            codigo: String(codigo),
            nombre: String(nombre),
            categoriaId: categoriaId || null,
            precioNeto: precioNeto,
            precioTotal: precioTotal,
            precioKilo: !isNaN(precioKilo as number) ? precioKilo : null,
        };

        const result = await prisma.producto.upsert({
            where: { codigo: productData.codigo },
            update: productData,
            create: productData,
        });

        if (result.createdAt.getTime() === result.updatedAt.getTime()) {
            createdCount++;
        } else {
            updatedCount++;
        }
    });

    await Promise.all(upsertPromises);

    return NextResponse.json({
      message: `Importación completada. Productos creados: ${createdCount}. Productos actualizados: ${updatedCount}.`,
    });

  } catch (error) {
    console.error("Error al importar productos:", error);
    return NextResponse.json(
      { message: "Ocurrió un error en el servidor durante la importación." },
      { status: 500 }
    );
  }
}
