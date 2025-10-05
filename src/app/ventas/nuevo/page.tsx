'use client';

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Container, Form, Button, Alert, Spinner, Row, Col, Card, ListGroup, InputGroup } from "react-bootstrap";
import Link from "next/link";

// --- Interfaces ---
interface Cliente {
  id: number;
  nombre: string; // legacy
  razonSocial: string | null;
}

interface Producto {
  id: number;
  nombre: string;
  precioTotal: number;
}

interface LineItem {
  productoId: number;
  nombre: string;
  cantidad: number;
  precio: number;
}

export default function NuevaVentaPage() {
  const router = useRouter();

  // Data state
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  
  // Form state
  const [clienteId, setClienteId] = useState<string>('');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [descripcion, setDescripcion] = useState('');

  // Product selection state
  const [currentProductoId, setCurrentProductoId] = useState<string>('');
  const [currentCantidad, setCurrentCantidad] = useState<number>(1);

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Effects ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientesRes, productosRes] = await Promise.all([
          fetch('/api/clientes'),
          fetch('/api/productos'),
        ]);
        if (!clientesRes.ok || !productosRes.ok) {
          throw new Error('No se pudieron cargar los clientes o productos.');
        }
        const clientesData = await clientesRes.json();
        const productosData = await productosRes.json();
        setClientes(clientesData);
        setProductos(productosData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- Handlers ---
  const handleAddProduct = () => {
    if (!currentProductoId || currentCantidad <= 0) {
      setError('Selecciona un producto y una cantidad válida.');
      return;
    }

    const producto = productos.find(p => p.id === parseInt(currentProductoId, 10));
    if (!producto) return;

    // Check if product is already in the list
    const existingItem = lineItems.find(item => item.productoId === producto.id);
    if (existingItem) {
      // Update quantity if it already exists
      setLineItems(lineItems.map(item => 
        item.productoId === producto.id 
          ? { ...item, cantidad: item.cantidad + currentCantidad } 
          : item
      ));
    } else {
      // Add new item
      setLineItems([...lineItems, {
        productoId: producto.id,
        nombre: producto.nombre,
        cantidad: currentCantidad,
        precio: producto.precioTotal,
      }]);
    }

    // Reset inputs
    setCurrentProductoId('');
    setCurrentCantidad(1);
    setError(null);
  };

  const handleRemoveItem = (productoId: number) => {
    setLineItems(lineItems.filter(item => item.productoId !== productoId));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!clienteId || lineItems.length === 0) {
      setError('Debes seleccionar un cliente y añadir al menos un producto.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload = {
      clienteId: parseInt(clienteId, 10),
      fecha,
      descripcion,
      productos: lineItems.map(({ productoId, cantidad }) => ({ productoId, cantidad }))
    };

    try {
      const res = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al crear la venta');
      }

      router.push('/ventas');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Calculations ---
  const totalVenta = lineItems.reduce((acc, item) => acc + (item.cantidad * item.precio), 0);

  // --- Render ---
  if (isLoading) {
    return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
  }

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Nueva Venta</h1>
        <Link href="/ventas" passHref>
          <Button variant="secondary">&larr; Volver al Historial</Button>
        </Link>
      </div>

      <Form onSubmit={handleSubmit}>
        {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

        <Row>
          {/* Client and Details Column */}
          <Col md={4}>
            <Card className="shadow-sm mb-4">
              <Card.Header>1. Detalles de la Venta</Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Cliente</Form.Label>
                  <Form.Select value={clienteId} onChange={e => setClienteId(e.target.value)} required>
                    <option value="">Selecciona un cliente...</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.razonSocial || c.nombre}</option>)}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha</Form.Label>
                  <Form.Control type="date" value={fecha} onChange={e => setFecha(e.target.value)} required />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Descripción (Opcional)</Form.Label>
                  <Form.Control as="textarea" rows={2} value={descripcion} onChange={e => setDescripcion(e.target.value)} />
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>

          {/* Products Column */}
          <Col md={8}>
            <Card className="shadow-sm mb-4">
              <Card.Header>2. Productos</Card.Header>
              <Card.Body>
                <InputGroup className="mb-3">
                  <Form.Select value={currentProductoId} onChange={e => setCurrentProductoId(e.target.value)}>
                    <option value="">Selecciona un producto...</option>
                    {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </Form.Select>
                  <Form.Control 
                    type="number" 
                    value={currentCantidad} 
                    onChange={e => setCurrentCantidad(parseInt(e.target.value, 10) || 1)} 
                    min={1}
                    style={{ maxWidth: '100px' }}
                  />
                  <Button variant="outline-primary" onClick={handleAddProduct}>Añadir</Button>
                </InputGroup>

                <ListGroup>
                  {lineItems.length > 0 ? lineItems.map(item => (
                    <ListGroup.Item key={item.productoId} className="d-flex justify-content-between align-items-center">
                      <div>
                        {item.cantidad}x {item.nombre}
                        <small className="text-muted d-block">{new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(item.precio)} c/u</small>
                      </div>
                      <div>
                        <span className="fw-bold me-3">{new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(item.cantidad * item.precio)}</span>
                        <Button variant="outline-danger" size="sm" onClick={() => handleRemoveItem(item.productoId)}>X</Button>
                      </div>
                    </ListGroup.Item>
                  )) : (
                    <p className="text-muted text-center mb-0">Añade productos a la venta.</p>
                  )}
                </ListGroup>
              </Card.Body>
              {lineItems.length > 0 && (
                <Card.Footer className="text-end fs-5 fw-bold">
                  Total: {new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(totalVenta)}
                </Card.Footer>
              )}
            </Card>
          </Col>
        </Row>

        <Button variant="success" size="lg" type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner as="span" size="sm" /> : 'Guardar Venta'}
        </Button>
      </Form>
    </Container>
  );
}
