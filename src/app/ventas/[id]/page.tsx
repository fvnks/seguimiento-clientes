'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container, Row, Col, Card, Spinner, Alert, Button, Table } from 'react-bootstrap';
import '../nota-venta.css'; // Import the new CSS file

// --- Interfaces ---
interface Cliente {
  razonSocial: string | null;
  nombre: string;
  rut: string | null;
  direccion: string | null;
  email: string;
}

interface VentaProducto {
  cantidad: number;
  precioAlMomento: number; // This is the total price, kept for historical reasons
  descuento: number; // Percentage
  producto: {
    nombre: string;
    codigo: string;
    precioNeto: number;
  };
}

interface UserProfile {
  nombre: string | null;
  apellido: string | null;
  rut: string | null;
  zona: string | null;
  username: string;
}

interface Venta {
  id: number;
  fecha: string;
  total: number; // This is the final total including IVA
  cliente: Cliente;
  productosVendidos: VentaProducto[];
  user: UserProfile;
}

interface SettingsData {
  empresaNombre?: string;
  empresaRut?: string;
  empresaDireccion?: string;
  empresaEmail?: string;
  empresaTelefono?: string;
}

export default function NotaVentaPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [venta, setVenta] = useState<Venta | null>(null);
  const [config, setConfig] = useState<SettingsData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const [ventaRes, configRes] = await Promise.all([
          fetch(`/api/ventas/${id}`),
          fetch('/api/configuracion'),
        ]);

        if (!ventaRes.ok) throw new Error('Error al obtener los datos de la venta');
        if (!configRes.ok) throw new Error('Error al cargar la configuración');

        const ventaData = await ventaRes.json();
        const configData = await configRes.json();

        setVenta(ventaData);
        setConfig(configData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(value);
  };

  const handlePrint = () => {
    if (!venta) return;
    const originalTitle = document.title;
    document.title = `Nota de Venta #${venta.id}`;
    window.print();
    document.title = originalTitle;
  };

  // --- Render Logic ---
  if (isLoading) {
    return <Container className="text-center mt-5"><Spinner /></Container>;
  }

  if (error) {
    return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;
  }

  if (!venta) {
    return <Container className="mt-5"><Alert variant="warning">No se encontró la venta.</Alert></Container>;
  }

  const vendedor = venta.user;

  // Calculate totals
  const totalNeto = venta.productosVendidos.reduce((acc, item) => {
    const precioConDescuento = item.producto.precioNeto * (1 - (item.descuento || 0) / 100);
    return acc + (item.cantidad * precioConDescuento);
  }, 0);
  const iva = totalNeto * 0.19;
  const totalFinal = totalNeto + iva;

  return (
    <>
      <Container className="mt-4 printable-container">
        <div className="d-flex justify-content-between align-items-center mb-4 no-print">
          <h1>Nota de Venta</h1>
          <div>
            <Button variant="outline-secondary" onClick={() => router.back()} className="me-2">
              &larr; Volver
            </Button>
            <Button variant="primary" onClick={handlePrint}>Imprimir / Guardar PDF</Button>
          </div>
        </div>

        <Card className="printable-area">
          <Card.Body>
            <header className="sales-note-header">
              <Row className="align-items-center">
                <Col xs={7}>
                  <h2>Nota de Venta #{venta.id}</h2>
                  <p className="mb-0">Fecha: {new Date(venta.fecha).toLocaleDateString()}</p>
                </Col>
                <Col xs={5} className="text-end company-details">
                  <h4>{config.empresaNombre || 'Nombre de tu Empresa'}</h4>
                  <p>{config.empresaRut || 'Tu RUT'}</p>
                  <p>{config.empresaDireccion || 'Tu Dirección, Ciudad'}</p>
                  <p>{config.empresaEmail || 'tu-email@tuempresa.com'}</p>
                  <p>{config.empresaTelefono || 'Tu Teléfono'}</p>
                </Col>
              </Row>
            </header>

            <Row className="my-4">
              <Col xs={6} className="client-details">
                <h5>Cliente</h5>
                <p><strong>Razón Social:</strong> {venta.cliente.razonSocial || venta.cliente.nombre}</p>
                <p><strong>RUT:</strong> {venta.cliente.rut || '-'}</p>
                <p><strong>Dirección:</strong> {venta.cliente.direccion || '-'}</p>
              </Col>
              <Col xs={6} className="seller-details">
                <h5>Vendedor</h5>
                <p><strong>Nombre:</strong> {vendedor.nombre ? `${vendedor.nombre} ${vendedor.apellido || ''}` : vendedor.username}</p>
                <p><strong>RUT:</strong> {vendedor.rut || '-'}</p>
                <p><strong>Zona:</strong> {vendedor.zona || '-'}</p>
              </Col>
            </Row>

            <Table bordered responsive className="sales-note-table">
              <thead className="table-light">
                <tr>
                  <th>Código</th>
                  <th>Producto</th>
                  <th className="text-end">Cantidad</th>
                  <th className="text-end">Precio Neto</th>
                  <th className="text-end">Descuento</th>
                  <th className="text-end">Precio Final</th>
                  <th className="text-end">Total Línea</th>
                </tr>
              </thead>
              <tbody>
                {venta.productosVendidos.map((item, index) => (
                  <tr key={index}>
                    <td>{item.producto.codigo}</td>
                    <td className="product-name-cell">{item.producto.nombre}</td>
                    <td className="text-end">{item.cantidad}</td>
                    <td className="text-end">{formatCurrency(item.producto.precioNeto)}</td>
                    <td className="text-end">{item.descuento || 0}%</td>
                    <td className="text-end">{formatCurrency(item.producto.precioNeto * (1 - (item.descuento || 0) / 100))}</td>
                    <td className="text-end">{formatCurrency(item.cantidad * (item.producto.precioNeto * (1 - (item.descuento || 0) / 100)))}</td>
                  </tr>
                ))}
              </tbody>
            </Table>

            <footer className="sales-note-footer">
                <Row>
                    <Col xs={{ span: 4, offset: 8 }}>
                        <div className="total-row d-flex justify-content-between">
                            <span>Neto:</span>
                            <span>{formatCurrency(totalNeto)}</span>
                        </div>
                        <div className="total-row d-flex justify-content-between">
                            <span>IVA (19%):</span>
                            <span>{formatCurrency(iva)}</span>
                        </div>
                        <div className="total-row d-flex justify-content-between fw-bold">
                            <span>Total:</span>
                            <span>{formatCurrency(totalFinal)}</span>
                        </div>
                    </Col>
                </Row>
            </footer>

          </Card.Body>
        </Card>
      </Container>
    </>
  );
}