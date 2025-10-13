'use client';

import { useState } from "react";
import { Form, Button, Alert, Card } from "react-bootstrap";

interface AddSaleFormProps {
  clienteId: number;
  onSaleAdded: () => void;
}

export default function AddSaleForm({ clienteId, onSaleAdded }: AddSaleFormProps) {
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ventas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          monto: parseInt(monto, 10),
          fecha,
          descripcion,
          clienteId,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al guardar la venta");
      }

      // Clear form and trigger refresh in parent component
      setMonto("");
      setDescripcion("");
      onSaleAdded();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-4">
      <Card.Body>
        <Card.Title>Agregar Nueva Venta</Card.Title>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="formMonto">
            <Form.Label>Monto (CLP)</Form.Label>
            <Form.Control
              type="number"
              placeholder="Ingrese el monto"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formFecha">
            <Form.Label>Fecha</Form.Label>
            <Form.Control
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formDescripcion">
            <Form.Label>Descripción (Opcional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Detalles de la venta"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </Form.Group>

          <Button variant="primary" type="submit" disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar Venta"}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}
