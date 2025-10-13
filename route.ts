import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import * as xlsx from 'xlsx';
import { PaymentStatus } from "@/generated/prisma";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = parseInt(session.user.id, 10);

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

    // --- Mapeo de Columnas ---
    // Asegúrate de que los nombres de las columnas en tu Excel coincidan con estos valores.
    // El orden es: Empresa, Cód.Cliente, R.U.T., Razón Social, Nombre Alias, Tipo Despacho, Canal Cliente, Sub-Canal, Giro Comercial, Contacto, Teléfono, Correo, Condición de Venta, Lista Precios, Ejecutiva Comercial, Tipo Dirección, Dirección, Ciudad, Comuna
    const columnMapping = {
        empresa: 'Empresa',
        codigoCliente: 'Cód.Cliente',
        rut: 'R.U.T.',
        razonSocial: 'Razón Social',
        nombreAlias: 'Nombre Alias',
        tipoDespacho: 'Tipo Despacho',
        canalCliente: 'Canal Cliente',
        subCanal: 'Sub-Canal',
        giroComercial: 'Giro Comercial',
        contacto: 'Contacto',
        telefono: 'Teléfono',
        email: 'Correo',
        condicionVenta: 'Condición de Venta',
        listaPrecios: 'Lista Precios',
        ejecutivaComercial: 'Ejecutiva Comercial',
        tipoDireccion: 'Tipo Dirección',
        direccion: 'Dirección',
        ciudad: 'Ciudad',
        comuna: 'Comuna',
    };

    let createdCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    const upsertPromises = data.map(async (row: any, index: number) => {
        const razonSocial = row[columnMapping.razonSocial] || row[columnMapping.nombreAlias];
        const email = row[columnMapping.email];

        // Validar datos mínimos
        if (!razonSocial || !email) {
            errors.push(`Fila ${index + 2}: Faltan 'Razón Social' (o 'Nombre Alias') o 'Correo'.`);
            return;
        }

        const clientData = {
            nombre: String(razonSocial), // Usamos razonSocial o alias como nombre principal
            razonSocial: String(razonSocial),
            email: String(email),
            rut: row[columnMapping.rut] ? String(row[columnMapping.rut]) : null,
            telefono: row[columnMapping.telefono] ? String(row[columnMapping.telefono]) : null, // Actualizado a 'Teléfono'
            direccion: row[columnMapping.direccion] ? String(row[columnMapping.direccion]) : null, // Actualizado a 'Dirección'
            mediosDePago: row[columnMapping.condicionVenta] ? String(row[columnMapping.condicionVenta]) : null, // Usamos 'Condición de Venta'
            paymentStatus: "PENDIENTE" as PaymentStatus,
            userId: userId,
        };

        // Usamos el email como identificador único para actualizar o crear
        const result = await prisma.cliente.upsert({
            where: { email_userId: { email: clientData.email, userId: userId } }, // Asume que tienes un unique constraint en (email, userId)
            update: clientData,
            create: clientData,
        });

        if (result.createdAt.getTime() === result.updatedAt.getTime()) {
            createdCount++;
        } else {
            updatedCount++;
        }
    });

    await Promise.all(upsertPromises);

    return NextResponse.json({
      message: `Importación completada. Clientes creados: ${createdCount}. Clientes actualizados: ${updatedCount}.`,
      errors: errors,
    });

  } catch (error) {
    console.error("Error al importar clientes:", error);
    return NextResponse.json({ message: "Ocurrió un error en el servidor durante la importación." }, { status: 500 });
  }
}