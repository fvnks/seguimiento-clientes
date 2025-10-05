'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Container, Row, Col, Card, ListGroup, Spinner, Alert, Button, Table } from 'react-bootstrap';

// Updated types for the new data structure
interface VentaProducto {
  cantidad: number;
  producto: {
    nombre: string;
  };
}

interface Venta {
  id: number;
  total: number;
  fecha: string;
  descripcion: string | null;
  productosVendidos: VentaProducto[];
}

interface Cliente {
  id: number;
  nombre: string; // legacy
  razonSocial: string | null;
  rut: string | null;
  email: string;
  telefono: string | null;
  direccion: string | null;
  latitud: number | null;
  longitud: number | null;
  ventas: Venta[];
}

// Dynamically import the MapView component
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <p>Cargando mapa...</p>,
});

export default function ClienteDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCliente = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/clientes/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al obtener los datos del cliente');
      }
      const data = await res.json();
      setCliente(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCliente();
  }, [fetchCliente]);

  const renderSales = () => {
    return (
      <Card className="mt-4 shadow-sm">
        <Card.Header>
          <h4 className="mb-0">Historial de Ventas</h4>
        </Card.Header>
        {cliente && cliente.ventas.length > 0 ? (
          <Table striped hover responsive className="mb-0 responsive-table">
            <thead className="table-light">
              <tr>
                <th className="py-3 px-3">Fecha</th>
                <th className="py-3 px-3">Productos</th>
                <th className="py-3 px-3">Monto Total</th>
                <th className="py-3 px-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cliente.ventas.map((venta) => (
                <tr key={venta.id}>
                  <td data-label="Fecha" className="py-3 px-3">{new Date(venta.fecha).toLocaleDateString()}</td>
                  <td data-label="Productos" className="py-3 px-3">
                    {venta.productosVendidos.map(vp => `${vp.cantidad}x ${vp.producto.nombre}`).join(', ')}
                  </td>
                  <td data-label="Monto Total" className="py-3 px-3">{new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(venta.total)}</td>
                  <td data-label="Acciones" className="py-3 px-3">
                    <Link href={`/ventas/${venta.id}`} passHref>
                      <Button variant="outline-primary" size="sm">Ver Nota</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <Card.Body>
            <p className="mb-0">No hay ventas registradas para este cliente.</p>
          </Card.Body>
        )}
      </Card>
    );
  };

  if (isLoading && !cliente) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
        <Link href="/clientes" passHref>
          <Button variant="secondary">&larr; Volver a la Lista</Button>
        </Link>
      </Container>
    );
  }

  if (!cliente) {
    return null; // Or a not found component
  }

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="mb-0">Detalles de {cliente.razonSocial || cliente.nombre}</h1>
        <Link href="/clientes" passHref>
          <Button variant="secondary">&larr; Volver a la Lista</Button>
        </Link>
      </div>

      <Row>
        <Col md={5} className="mb-3">
          <Card className="shadow-sm" style={{ height: '100%' }}>
            <Card.Header><h4>Información de Contacto</h4></Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item><b>Razón Social:</b> {cliente.razonSocial || cliente.nombre}</ListGroup.Item>
              <ListGroup.Item><b>RUT:</b> {cliente.rut || 'No especificado'}</ListGroup.Item>
              <ListGroup.Item><b>Email:</b> {cliente.email}</ListGroup.Item>
              <ListGroup.Item><b>Teléfono:</b> {cliente.telefono || 'No especificado'}</ListGroup.Item>
              <ListGroup.Item>
                <b>Dirección:</b> {cliente.direccion || 'No especificada'}
              </ListGroup.Item>
              {cliente.latitud && cliente.longitud && (
                <ListGroup.Item>
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    className="me-2"
                    as="a"
                    href={`https://www.google.com/maps/search/?api=1&query=${cliente.latitud},${cliente.longitud}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Abrir en Google Maps
                  </Button>
                  <Button 
                    variant="outline-info" 
                    size="sm"
                    as="a"
                    href={`https://waze.com/ul?ll=${cliente.latitud},${cliente.longitud}&navigate=yes`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Abrir en Waze
                  </Button>
                </ListGroup.Item>
              )}
            </ListGroup>
          </Card>
        </Col>
        <Col md={7} className="mb-3">
          <Card className="shadow-sm" style={{ height: '400px' }}>
            <Card.Header><h4>Ubicación</h4></Card.Header>
            <Card.Body className="p-0">
              {cliente.latitud && cliente.longitud ? (
                <MapView position={[cliente.latitud, cliente.longitud]} />
              ) : (
                <div className="d-flex align-items-center justify-content-center h-100">
                  <p>Ubicación no disponible.</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {renderSales()}

    </Container>
  );
}
