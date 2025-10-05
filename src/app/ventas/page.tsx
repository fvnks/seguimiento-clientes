'use client';

import { useState, useEffect } from 'react';
import { Container, Table, Alert, Spinner, Card, Button } from 'react-bootstrap';
import Link from 'next/link';

// Define types
interface Venta {
  id: number;
  fecha: string;
  total: number;
  cliente: {
    nombre: string; // legacy
    razonSocial: string | null;
  };
  productosVendidos: {
    cantidad: number;
    producto: {
      nombre: string;
    };
  }[];
}

export default function VentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVentas = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/ventas');
        if (!res.ok) {
          throw new Error('Error al obtener las ventas');
        }
        const data = await res.json();
        setVentas(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVentas();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(value);
  }

  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center"><Spinner animation="border" /></div>;
    }

    if (error) {
      return <Alert variant="danger">{error}</Alert>;
    }

    if (ventas.length === 0) {
      return <Alert variant="info">No se han registrado ventas todavía.</Alert>;
    }

    return (
      <Card className="shadow-sm">
        <Table striped hover responsive className="responsive-table mb-0">
          <thead className="table-light">
            <tr>
              <th className="py-3 px-3">Fecha</th>
              <th className="py-3 px-3">Cliente</th>
              <th className="py-3 px-3">Productos</th>
              <th className="py-3 px-3">Monto Total</th>
              <th className="py-3 px-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map((venta) => (
              <tr key={venta.id}>
                <td data-label="Fecha" className="py-3 px-3">{new Date(venta.fecha).toLocaleDateString()}</td>
                <td data-label="Cliente" className="py-3 px-3">{venta.cliente.razonSocial || venta.cliente.nombre}</td>
                <td data-label="Productos" className="py-3 px-3">
                  {venta.productosVendidos.length} item(s)
                </td>
                <td data-label="Monto Total" className="py-3 px-3">{formatCurrency(venta.total)}</td>
                <td data-label="Acciones" className="py-3 px-3">
                  <Link href={`/ventas/${venta.id}`} passHref>
                    <Button variant="outline-primary" size="sm">Ver Nota</Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    );
  };

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Historial de Ventas</h1>
        <Link href="/ventas/nuevo" passHref>
          <Button variant="primary">Nueva Venta Detallada</Button>
        </Link>
      </div>
      {renderContent()}
    </Container>
  );
}
