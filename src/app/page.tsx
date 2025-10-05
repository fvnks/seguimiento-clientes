'use client';

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Table } from 'react-bootstrap';
import Link from 'next/link';
import { FaDollarSign, FaShoppingCart, FaUsers } from 'react-icons/fa';

// Define types
interface Venta {
  id: number;
  total: number;
  fecha: string;
  cliente: {
    nombre: string; // legacy
    razonSocial: string | null;
  };
}

interface Cliente {
    id: number;
}

export default function DashboardPage() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [ventasRes, clientesRes] = await Promise.all([
          fetch('/api/ventas'),
          fetch('/api/clientes'),
        ]);

        if (!ventasRes.ok || !clientesRes.ok) {
          throw new Error('Error al obtener los datos para el dashboard');
        }

        const ventasData = await ventasRes.json();
        const clientesData = await clientesRes.json();

        setVentas(ventasData);
        setClientes(clientesData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- Data Processing ---
  const totalRevenue = ventas.reduce((acc, venta) => acc + venta.total, 0);
  const totalSales = ventas.length;
  const totalClients = clientes.length;
  const recentSales = ventas.slice(0, 5); // API already sorts by date desc

  if (isLoading) {
    return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
  }

  if (error) {
    return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;
  }

  return (
    <Container className="mt-4">
      <h1>Dashboard</h1>

      <Row className="my-4">
        <Col md={4} className="mb-3">
          <Card bg="primary" text="white">
            <Card.Body>
              <Card.Title className="d-flex align-items-center">
                <FaDollarSign className="me-2" /> Ingresos Totales
              </Card.Title>
              <Card.Text className="fs-4 fw-bold">
                {new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(totalRevenue)}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card bg="success" text="white">
            <Card.Body>
              <Card.Title className="d-flex align-items-center">
                <FaShoppingCart className="me-2" /> Número de Ventas
              </Card.Title>
              <Card.Text className="fs-4 fw-bold">{totalSales}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card bg="info" text="white">
            <Card.Body>
              <Card.Title className="d-flex align-items-center">
                <FaUsers className="me-2" /> Total de Clientes
              </Card.Title>
              <Card.Text className="fs-4 fw-bold">{totalClients}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
            <Card>
                <Card.Header><h4>Últimas Ventas</h4></Card.Header>
                <Card.Body>
                    {recentSales.length > 0 ? (
                        <Table striped bordered hover responsive>
                            <thead>
                                <tr>
                                    <th>Cliente</th>
                                    <th>Fecha</th>
                                    <th>Monto Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentSales.map((venta) => (
                                    <tr key={venta.id}>
                                        <td>{venta.cliente?.nombre || 'N/A'}</td>
                                        <td>{new Date(venta.fecha).toLocaleDateString()}</td>
                                        <td>{new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(venta.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    ) : (
                        <Alert variant="light">No hay ventas registradas todavía.</Alert>
                    )}
                </Card.Body>
            </Card>
        </Col>
      </Row>

    </Container>
  );
}
