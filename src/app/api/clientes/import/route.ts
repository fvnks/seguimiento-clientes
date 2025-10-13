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
    const data = xlsx.utils.sheet_to_json(sheet, { blankrows: true });
    console.log(`Number of rows read from Excel: ${data.length}`);

    if (data.length === 0) {
        return NextResponse.json({ message: "El archivo de Excel está vacío o tiene un formato incorrecto." }, { status: 400 });
    }

    // --- Mapeo de Columnas ---
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

    for (const [index, row] of (data as any[]).entries()) {
        try {
            const razonSocial = row[columnMapping.razonSocial] || row[columnMapping.nombreAlias];
            const email = row[columnMapping.email];

            if (!razonSocial || !email) {
                // Skip blank rows silently
                continue;
            }

            const clientData = {
                nombre: String(razonSocial),
                razonSocial: String(razonSocial),
                email: String(email),
                rut: row[columnMapping.rut] ? String(row[columnMapping.rut]) : null,
                telefono: row[columnMapping.telefono] ? String(row[columnMapping.telefono]) : null,
                direccion: row[columnMapping.direccion] ? String(row[columnMapping.direccion]) : null,
                mediosDePago: row[columnMapping.condicionVenta] ? String(row[columnMapping.condicionVenta]) : null,
                paymentStatus: "PENDIENTE" as PaymentStatus,
                userId: userId,
                empresa: row[columnMapping.empresa] ? String(row[columnMapping.empresa]) : null,
                codigoCliente: row[columnMapping.codigoCliente] ? String(row[columnMapping.codigoCliente]) : null,
                nombreAlias: row[columnMapping.nombreAlias] ? String(row[columnMapping.nombreAlias]) : null,
                tipoDespacho: row[columnMapping.tipoDespacho] ? String(row[columnMapping.tipoDespacho]) : null,
                canalCliente: row[columnMapping.canalCliente] ? String(row[columnMapping.canalCliente]) : null,
                subCanal: row[columnMapping.subCanal] ? String(row[columnMapping.subCanal]) : null,
                giroComercial: row[columnMapping.giroComercial] ? String(row[columnMapping.giroComercial]) : null,
                contacto: row[columnMapping.contacto] ? String(row[columnMapping.contacto]) : null,
                listaPrecios: row[columnMapping.listaPrecios] ? String(row[columnMapping.listaPrecios]) : null,
                ejecutivaComercial: row[columnMapping.ejecutivaComercial] ? String(row[columnMapping.ejecutivaComercial]) : null,
                tipoDireccion: row[columnMapping.tipoDireccion] ? String(row[columnMapping.tipoDireccion]) : null,
                ciudad: row[columnMapping.ciudad] ? String(row[columnMapping.ciudad]) : null,
                comuna: row[columnMapping.comuna] ? String(row[columnMapping.comuna]) : null,
            };

            const existingClient = await prisma.cliente.findUnique({
                where: { email: clientData.email },
            });

            if (existingClient) {
                if (existingClient.userId === userId) {
                    await prisma.cliente.update({
                        where: { id: existingClient.id },
                        data: clientData,
                    });
                    updatedCount++;
                } else {
                    errors.push(`Fila ${index + 2}: El cliente con email ${clientData.email} ya existe y pertenece a otro usuario.`);
                }
            } else {
                await prisma.cliente.create({
                    data: clientData,
                });
                createdCount++;
            }
        } catch (error: any) {
            if (error.code === 'P2002') {
                errors.push(`Fila ${index + 2}: El email '${row[columnMapping.email]}' ya existe en la base de datos (o está duplicado en el archivo) y no se pudo procesar.`);
            } else {
                errors.push(`Fila ${index + 2}: Error inesperado - ${error.message}`);
            }
        }
    }

    return NextResponse.json({
      message: `Importación completada. Clientes creados: ${createdCount}. Clientes actualizados: ${updatedCount}.`,
      errors: errors,
    });

  } catch (error) {
    console.error("Error al importar clientes:", error);
    return NextResponse.json({ message: "Ocurrió un error en el servidor durante la importación." }, { status: 500 });
  }
}