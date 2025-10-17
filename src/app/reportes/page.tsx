'use client';

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Table } from 'react-bootstrap';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import moment from 'moment';

// Define types
interface Venta {
  id: number;
  monto: number;
  fecha: string;
  cliente: {
    id: number;
    nombre: string;
  };
}

interface Cliente {
    id: number;
    nombre: string;
}

interface SalesByMonth {
  name: string;
  Ingresos: number;
}

interface TopClient {
    id: number;
    nombre: string;
    totalVendido: number;
}

export default function ReportesPage() {
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
          throw new Error('Error al obtener los datos para los reportes');
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
  const totalRevenue = ventas.reduce((acc, venta) => acc + (Number(venta.monto) || 0), 0);
  const totalSales = ventas.length;
  const totalClients = clientes.length;

  const salesByMonth: SalesByMonth[] = ventas.reduce((acc, venta) => {
    const month = moment(venta.fecha).format('MMM YYYY');
    const existingMonth = acc.find(item => item.name === month);
    const monto = Number(venta.monto) || 0;

    if (existingMonth) {
      existingMonth.Ingresos += monto;
    } else {
      acc.push({ name: month, Ingresos: monto });
    }
    return acc;
  }, [] as SalesByMonth[]).sort((a, b) => moment(a.name, 'MMM YYYY').valueOf() - moment(b.name, 'MMM YYYY').valueOf());

  const topClients: TopClient[] = ventas.reduce((acc, venta) => {
    const client = acc.find(c => c.id === venta.cliente.id);
    const monto = Number(venta.monto) || 0;
    if(client) {
        client.totalVendido += monto;
    } else if (venta.cliente) {
        acc.push({ id: venta.cliente.id, nombre: venta.cliente.nombre, totalVendido: monto });
    }
    return acc;
  }, [] as TopClient[]).sort((a, b) => b.totalVendido - a.totalVendido).slice(0, 5);


  if (isLoading) {
    return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
  }

  if (error) {
    return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;
  }

  return (
    <Container className="mt-4">
      <h1>Reportes de Ventas</h1>

      <Row className="my-4">
        <Col md={4}>
          <Card bg="primary" text="white">
            <Card.Body>
              <Card.Title>Ingresos Totales</Card.Title>
              <Card.Text className="fs-4 fw-bold">
                {new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(totalRevenue)}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card bg="success" text="white">
            <Card.Body>
              <Card.Title>Número de Ventas</Card.Title>
              <Card.Text className="fs-4 fw-bold">{totalSales}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card bg="info" text="white">
            <Card.Body>
              <Card.Title>Total de Clientes</Card.Title>
              <Card.Text className="fs-4 fw-bold">{totalClients}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={12}>
            <Card className="mb-4">
                <Card.Body>
                    <Card.Title>Ingresos por Mes</Card.Title>
                    {ventas.length > 0 ? (
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={salesByMonth}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(value) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", notation: 'compact' }).format(value as number)} />
                            <Tooltip formatter={(value) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(value as number)} />
                            <Legend />
                            <Bar dataKey="Ingresos" fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <Alert variant="light">No hay suficientes datos para mostrar el gráfico.</Alert>
                    )}
                </Card.Body>
            </Card>
        </Col>
      </Row>

      <Row>
        <Col md={12}>
            <Card>
                <Card.Body>
                    <Card.Title>Top 5 Clientes por Ingresos</Card.Title>
                    {topClients.length > 0 ? (
                        <Table striped bordered hover responsive>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Nombre Cliente</th>
                                    <th>Total Vendido</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topClients.map((client, index) => (
                                    <tr key={client.id}>
                                        <td>{index + 1}</td>
                                        <td>{client.nombre}</td>
                                        <td>{new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(client.totalVendido)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    ) : (
                        <Alert variant="light">No hay suficientes datos para mostrar los mejores clientes.</Alert>
                    )}
                </Card.Body>
            </Card>
        </Col>
      </Row>

    </Container>
  );
}
