'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import moment from 'moment';

// Define the shape of a sale object
interface Venta {
  id: number;
  monto: number;
  fecha: string;
  descripcion: string | null;
}

interface EditSaleModalProps {
  show: boolean;
  onHide: () => void;
  sale: Venta | null;
  onSaleUpdated: () => void;
}

export default function EditSaleModal({ show, onHide, sale, onSaleUpdated }: EditSaleModalProps) {
  const [formData, setFormData] = useState({ monto: '', fecha: '', descripcion: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Populate form when a sale is selected
    if (sale) {
      setFormData({
        monto: sale.monto.toString(),
        fecha: moment(sale.fecha).format('YYYY-MM-DD'), // Format for the date input
        descripcion: sale.descripcion || '',
      });
    }
  }, [sale]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!sale) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/ventas/${sale.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            monto: formData.monto,
            fecha: formData.fecha,
            descripcion: formData.descripcion,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al actualizar la venta');
      }

      onSaleUpdated(); // Trigger data refresh in the parent component
      onHide(); // Close the modal

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Editar Venta</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="editMonto">
            <Form.Label>Monto (CLP)</Form.Label>
            <Form.Control
              type="number"
              name="monto"
              value={formData.monto}
              onChange={handleInputChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="editFecha">
            <Form.Label>Fecha</Form.Label>
            <Form.Control
              type="date"
              name="fecha"
              value={formData.fecha}
              onChange={handleInputChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="editDescripcion">
            <Form.Label>Descripción (Opcional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
            />
          </Form.Group>
          <div className="d-flex justify-content-end">
            <Button variant="secondary" onClick={onHide} className="me-2" disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Spinner as="span" animation="border" size="sm" /> : 'Guardar Cambios'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
