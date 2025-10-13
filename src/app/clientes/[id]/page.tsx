'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Container, Row, Col, Card, ListGroup, Spinner, Alert, Button, Table, Badge, Dropdown } from 'react-bootstrap';
import { PaymentStatus } from '@/generated/prisma';

// Define types
interface VentaProducto {
  cantidad: number;
  producto: { nombre: string; };
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
  nombre: string;
  razonSocial: string | null;
  rut: string | null;
  email: string;
  telefono: string | null;
  direccion: string | null;
  latitud: number | null;
  longitud: number | null;
  mediosDePago: string | null;
  paymentStatus: PaymentStatus;
  ventas: Venta[];
}

// Dynamic imports
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <p>Cargando mapa...</p>,
});

// Helper function for badge
const getPaymentStatusBadge = (status: PaymentStatus) => {
  switch (status) {
    case 'PAGADO': return <Badge bg="success">Pagado</Badge>;
    case 'DEUDOR': return <Badge bg="danger">Deudor</Badge>;
    case 'PENDIENTE':
    default: return <Badge bg="warning">Pendiente</Badge>;
  }
};

export default function ClienteDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isClient, setIsClient] = useState(false);

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
      console.log("Cliente data:", data);
      setCliente(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCliente();
    setIsClient(true);
  }, [fetchCliente]);

  const handleStatusChange = async (newStatus: PaymentStatus) => {
    if (!cliente) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/clientes/${cliente.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: newStatus }),
      });
      if (!res.ok) throw new Error('Error al actualizar el estado');
      const updatedCliente = await res.json();
      setCliente(updatedCliente);
    } catch (error) {
      console.error("Failed to update status", error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const renderSales = () => (
    <Card className="mt-4 shadow-sm">
      <Card.Header><h4 className="mb-0">Historial de Ventas</h4></Card.Header>
      {cliente && cliente.ventas.length > 0 ? (
        <Table striped hover responsive className="mb-0 responsive-table">
          <thead className="table-light">
            <tr>
              <th>Fecha</th><th>Productos</th><th>Monto Total</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cliente.ventas.map((venta) => (
              <tr key={venta.id}>
                <td data-label="Fecha">{new Date(venta.fecha).toLocaleDateString()}</td>
                <td data-label="Productos">{venta.productosVendidos.map(vp => `${vp.cantidad}x ${vp.producto.nombre}`).join(', ')}</td>
                <td data-label="Monto Total">{new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(venta.total)}</td>
                <td data-label="Acciones">
                  <Link href={`/ventas/${venta.id}`} passHref><Button variant="outline-primary" size="sm">Ver Nota</Button></Link>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <Card.Body><p className="mb-0">No hay ventas registradas.</p></Card.Body>
      )}
    </Card>
  );

  if (isLoading && !cliente) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
  if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;
  if (!cliente) return null;

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="mb-0">{cliente.razonSocial || cliente.nombre}</h1>
        <Link href="/clientes" passHref><Button variant="secondary">&larr; Volver</Button></Link>
      </div>

      <Row className="g-4">
        <Col lg={4}>
          <Card className="shadow-sm mb-4">
            <Card.Header><h4>Información de Contacto</h4></Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item><b>RUT:</b> {cliente.rut || 'N/A'}</ListGroup.Item>
              <ListGroup.Item><b>Email:</b> {cliente.email}</ListGroup.Item>
              <ListGroup.Item><b>Teléfono:</b> {cliente.telefono || 'N/A'}</ListGroup.Item>
              <ListGroup.Item><b>Dirección:</b> {cliente.direccion || 'N/A'}</ListGroup.Item>
               {cliente.latitud != null && cliente.longitud != null && (
                <ListGroup.Item>
                  <Button as="a" href={`https://www.google.com/maps/search/?api=1&query=${cliente.latitud},${cliente.longitud}`} target="_blank" rel="noopener noreferrer" variant="outline-primary" size="sm" className="me-2">Google Maps</Button>
                  <Button as="a" href={`https://waze.com/ul?ll=${cliente.latitud},${cliente.longitud}&navigate=yes`} target="_blank" rel="noopener noreferrer" variant="outline-info" size="sm">Waze</Button>
                </ListGroup.Item>
              )}
            </ListGroup>
          </Card>
          <Card className="shadow-sm">
            <Card.Header><h4>Información de Pagos</h4></Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item><b>Estado:</b> {getPaymentStatusBadge(cliente.paymentStatus)}</ListGroup.Item>
              <ListGroup.Item><b>Medios de Pago:</b> {cliente.mediosDePago || 'N/A'}</ListGroup.Item>
              <ListGroup.Item>
                <Dropdown onSelect={(key) => handleStatusChange(key as PaymentStatus)}>
                  <Dropdown.Toggle variant="outline-primary" size="sm" id="dropdown-status" disabled={isUpdatingStatus}>
                    {isUpdatingStatus ? <Spinner size="sm" /> : 'Cambiar Estado'}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item eventKey="PAGADO">Pagado</Dropdown.Item>
                    <Dropdown.Item eventKey="DEUDOR">Deudor</Dropdown.Item>
                    <Dropdown.Item eventKey="PENDIENTE">Pendiente</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
        <Col lg={8}>
          <Card className="shadow-sm" style={{ minHeight: '450px' }}>
            <Card.Header><h4>Ubicación</h4></Card.Header>
            <Card.Body className="p-0 h-100">
              {isClient && cliente.latitud != null && cliente.longitud != null ? (
                <div style={{ height: "400px" }}>
                  <MapView position={[cliente.latitud, cliente.longitud]} />
                </div>
              ) : (
                <div className="d-flex align-items-center justify-content-center h-100"><p>Ubicación no disponible.</p></div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {renderSales()}

    </Container>
  );
}
