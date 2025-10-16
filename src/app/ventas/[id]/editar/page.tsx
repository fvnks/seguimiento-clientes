'use client';

import { useState, useEffect, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
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
  precioNeto: number;
  precioTotal: number;
  codigo: string;
}

interface LineItem {
  productoId: number;
  nombre: string;
  cantidad: number;
  precio: number;
  descuento: number; // Percentage
  precioNeto: number;
}

interface Venta {
    id: number;
    fecha: string;
    descripcion: string;
    clienteId: number;
    productosVendidos: { productoId: number; cantidad: number; producto: Producto, descuento: number, precioAlMomento: number }[];
}

export default function EditarVentaPage() {
  const router = useRouter();
  const params = useParams();
  const { id: ventaId } = params;

  // Data state
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [venta, setVenta] = useState<Venta | null>(null);
  
  // Form state
  const [clienteId, setClienteId] = useState<string>('');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [fecha, setFecha] = useState('');
  const [descripcion, setDescripcion] = useState('');

  // Product selection state
  const [currentProductoCode, setCurrentProductoCode] = useState<string>('');
  const [currentCantidad, setCurrentCantidad] = useState<number | ''>(1);
  const [currentDescuento, setCurrentDescuento] = useState<number | ''>(0);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Effects ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientesRes, productosRes, ventaRes] = await Promise.all([
          fetch('/api/clientes'),
          fetch('/api/productos?pageSize=1000'), // Fetch all products
          fetch(`/api/ventas/${ventaId}`),
        ]);

        if (!clientesRes.ok || !productosRes.ok || !ventaRes.ok) {
          throw new Error('No se pudieron cargar los datos necesarios para editar la venta.');
        }

        const clientesData = await clientesRes.json();
        const productosData = await productosRes.json();
        const ventaData = await ventaRes.json();

        setClientes(clientesData.clientes || clientesData);
        setProductos(productosData.productos);
        setVenta(ventaData);

        // Pre-fill form
        setClienteId(ventaData.clienteId.toString());
        setFecha(new Date(ventaData.fecha).toISOString().split('T')[0]);
        setDescripcion(ventaData.descripcion || '');
        setLineItems(ventaData.productosVendidos.map((p: any) => ({
          productoId: p.producto.id,
          nombre: p.producto.nombre,
          cantidad: p.cantidad,
          precio: p.precioAlMomento,
          descuento: p.descuento || 0,
          precioNeto: p.producto.precioNeto
        })));

      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (ventaId) {
      fetchData();
    }
  }, [ventaId]);

  useEffect(() => {
    if (currentProductoCode) {
      const product = productos.find(p => p.codigo === currentProductoCode);
      setSelectedProduct(product || null);
    } else {
      setSelectedProduct(null);
    }
  }, [currentProductoCode, productos]);

  // --- Handlers ---
  const handleAddProduct = () => {
    const cantidad = currentCantidad === '' ? 1 : currentCantidad;
    if (!selectedProduct || cantidad <= 0) {
      setError('Ingresa un código de producto válido y una cantidad.');
      return;
    }

    const producto = selectedProduct;
    const descuento = currentDescuento === '' ? 0 : currentDescuento;

    const existingItem = lineItems.find(item => item.productoId === producto.id);
    if (existingItem) {
      setLineItems(lineItems.map(item => 
        item.productoId === producto.id 
          ? { ...item, cantidad: item.cantidad + cantidad } 
          : item
      ));
    } else {
      setLineItems([...lineItems, {
        productoId: producto.id,
        nombre: producto.nombre,
        cantidad: cantidad,
        precio: producto.precioTotal,
        descuento: descuento,
        precioNeto: producto.precioNeto
      }]);
    }

    setCurrentProductoCode('');
    setCurrentCantidad(1);
    setCurrentDescuento(0);
    setSelectedProduct(null);
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
      productos: lineItems.map(({ productoId, cantidad, descuento }) => ({ productoId, cantidad, descuento }))
    };

    try {
      const res = await fetch(`/api/ventas/${ventaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al actualizar la venta');
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
  const totalVenta = lineItems.reduce((acc, item) => {
    const precioConDescuento = (item.precioNeto * (1 - item.descuento / 100)) * 1.19;
    return acc + (item.cantidad * precioConDescuento);
  }, 0);

  // --- Render ---
  if (isLoading) {
    return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
  }

  if (!venta) {
    return <Container className="mt-4"><Alert variant="danger">Venta no encontrada.</Alert></Container>
  }

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Editar Venta</h1>
        <Link href="/ventas" passHref>
          <Button variant="secondary">&larr; Volver al Historial</Button>
        </Link>
      </div>

      <Form onSubmit={(e) => { e.preventDefault(); handleAddProduct(); }}>
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
                  <Form.Control
                    type="text"
                    placeholder="Ingresa código de producto..."
                    value={currentProductoCode}
                    onChange={e => setCurrentProductoCode(e.target.value.toUpperCase())}
                    list="product-codes"
                  />
                   <datalist id="product-codes">
                    {productos.map(p => <option key={p.id} value={p.codigo}>{p.nombre}</option>)}
                  </datalist>
                  <InputGroup>
                    <InputGroup.Text>Cantidad</InputGroup.Text>
                    <Form.Control 
                      type="number" 
                      value={currentCantidad} 
                      onChange={e => setCurrentCantidad(e.target.value === '' ? '' : parseInt(e.target.value, 10))} 
                      min={1}
                      style={{ maxWidth: '100px' }}
                    />
                  </InputGroup>
                  <InputGroup>
                    <InputGroup.Text>Descuento %</InputGroup.Text>
                    <Form.Control 
                      type="number" 
                      placeholder="%"
                      value={currentDescuento} 
                      onChange={e => setCurrentDescuento(e.target.value === '' ? '' : parseInt(e.target.value, 10))} 
                      min={0}
                      max={100}
                      style={{ maxWidth: '100px' }}
                    />
                  </InputGroup>
                  <Button variant="outline-primary" onClick={handleAddProduct}>Añadir</Button>
                </InputGroup>

                {selectedProduct && (
                  <Alert variant="info" className="mt-2">
                    <p className="mb-0"><strong>Producto:</strong> {selectedProduct.nombre}</p>
                    <p className="mb-0"><strong>Precio Neto:</strong> {new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(selectedProduct.precioNeto)}</p>
                    <p className="mb-0"><strong>Precio Total:</strong> {new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(selectedProduct.precioTotal)}</p>
                  </Alert>
                )}

                <ListGroup>
                  {lineItems.length > 0 ? lineItems.map(item => (
                    <ListGroup.Item key={item.productoId} className="d-flex justify-content-between align-items-center">
                      <div>
                        {item.cantidad}x {item.nombre}
                        <small className="text-muted d-block">{new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format((item.precioNeto * (1 - item.descuento / 100)) * 1.19)} c/u (dto: {item.descuento}%)</small>
                      </div>
                      <div>
                        <span className="fw-bold me-3">{new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(item.cantidad * (item.precioNeto * (1 - item.descuento / 100)) * 1.19)}</span>
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

        <Button variant="success" size="lg" onClick={handleSubmit} disabled={isSubmitting || lineItems.length === 0}>
          {isSubmitting ? <Spinner as="span" size="sm" /> : 'Guardar Cambios'}
        </Button>
      </Form>
    </Container>
  );
}
