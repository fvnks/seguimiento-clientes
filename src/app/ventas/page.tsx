'use client';

import { useState, useEffect } from 'react';
import { Container, Table, Alert, Spinner, Card, Button, Modal } from 'react-bootstrap';
import Link from 'next/link';

// Define types
interface VentaProducto {
  cantidad: number;
  descuento: number;
  producto: {
    nombre: string;
    precioNeto: number;
  };
}

interface Venta {
  id: number;
  fecha: string;
  total: number;
  cliente: {
    nombre: string; // legacy
    razonSocial: string | null;
  };
  productosVendidos: VentaProducto[];
}

export default function VentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [ventaToDelete, setVentaToDelete] = useState<number | null>(null);

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

  const handleDelete = async () => {
    if (ventaToDelete === null) return;

    try {
      const res = await fetch(`/api/ventas/${ventaToDelete}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Error al eliminar la venta');
      }

      setVentas(ventas.filter(v => v.id !== ventaToDelete));
      closeConfirmModal();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openConfirmModal = (id: number) => {
    setVentaToDelete(id);
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setVentaToDelete(null);
    setShowConfirmModal(false);
  };

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
                    <Button variant="outline-primary" size="sm" className="me-2">Ver Nota</Button>
                  </Link>
                  <Link href={`/ventas/${venta.id}/editar`} passHref>
                    <Button variant="outline-secondary" size="sm" className="me-2">Editar</Button>
                  </Link>
                  <Button variant="outline-danger" size="sm" onClick={() => openConfirmModal(venta.id)}>Eliminar</Button>
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

      <Modal show={showConfirmModal} onHide={closeConfirmModal}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>¿Estás seguro de que quieres eliminar esta venta?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeConfirmModal}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
