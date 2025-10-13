'use client';

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Table } from 'react-bootstrap';
import { FaDollarSign, FaShoppingCart, FaUsers, FaRss } from 'react-icons/fa';
import styles from './Dashboard.module.css';

// Define types
interface Venta {
  id: number;
  total: number;
  fecha: string;
  cliente: {
    nombre: string;
    razonSocial: string | null;
  };
}

interface Cliente {
  id: number;
}

interface NewsArticle {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  author: {
    username: string;
  };
}

export default function DashboardPage() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [ventasRes, clientesRes, newsRes] = await Promise.all([
          fetch('/api/ventas'),
          fetch('/api/clientes'),
          fetch('/api/news'),
        ]);

        if (!ventasRes.ok || !clientesRes.ok || !newsRes.ok) {
          throw new Error('Error al obtener los datos para el dashboard');
        }

        const ventasData = await ventasRes.json();
        const clientesData = await clientesRes.json();
        const newsData = await newsRes.json();

        setVentas(ventasData);
        setClientes(clientesData);
        setNews(newsData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalRevenue = ventas.reduce((acc, venta) => acc + venta.total, 0);
  const totalSales = ventas.length;
  const totalClients = clientes.length;
  const recentSales = ventas.slice(0, 5);

  if (isLoading) {
    return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
  }

  if (error) {
    return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;
  }

  return (
    <Container className="mt-4">
      <h1 className="h2 mb-4">Dashboard</h1>
      
      <Row className="my-4">
        <Col md={4} className="mb-3">
          <Card bg="primary" text="white">
            <Card.Body>
              <Card.Title className="d-flex align-items-center h5">
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
              <Card.Title className="d-flex align-items-center h5">
                <FaShoppingCart className="me-2" /> Número de Ventas
              </Card.Title>
              <Card.Text className="fs-4 fw-bold">{totalSales}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card bg="info" text="white">
            <Card.Body>
              <Card.Title className="d-flex align-items-center h5">
                <FaUsers className="me-2" /> Total de Clientes
              </Card.Title>
              <Card.Text className="fs-4 fw-bold">{totalClients}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        <Col lg={8}>
            <Card>
                <Card.Header><h4>Últimas Ventas</h4></Card.Header>
                <Card.Body>
                    {recentSales.length > 0 ? (
                        <>
                            <div className={styles.tableView}>
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
                            </div>
                            <div className={styles.cardView}>
                                {recentSales.map((venta) => (
                                    <div key={venta.id} className={styles.saleCard}>
                                        <div className={styles.saleCardHeader}>{venta.cliente?.nombre || 'N/A'}</div>
                                        <div className={styles.saleCardBody}>
                                            <div><span>Fecha:</span> <span>{new Date(venta.fecha).toLocaleDateString()}</span></div>
                                            <div><span>Monto:</span> <span className="fw-bold">{new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(venta.total)}</span></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <Alert variant="light">No hay ventas registradas todavía.</Alert>
                    )}
                </Card.Body>
            </Card>
        </Col>
        <Col lg={4}>
          <Card>
            <Card.Header><h4><FaRss className="me-2" /> Últimas Noticias</h4></Card.Header>
            <Card.Body style={{maxHeight: '400px', overflowY: 'auto'}}>
              {news.length > 0 ? (
                news.map(article => (
                  <div key={article.id} className="mb-3">
                    <h5 className="h6 mb-1">{article.title}</h5>
                     <small className="text-muted d-block mb-2">
                      Por <strong>{article.author.username}</strong> el {new Date(article.createdAt).toLocaleDateString()}
                    </small>
                    <p className="small mb-1">{article.content}</p>
                  </div>
                ))
              ) : (
                <Alert variant="light" className="mb-0">No hay noticias recientes.</Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}