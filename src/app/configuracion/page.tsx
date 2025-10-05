'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Container, Form, Button, Alert, Spinner, Card, Row, Col } from 'react-bootstrap';

interface SettingsData {
  empresaNombre?: string;
  empresaRut?: string;
  empresaDireccion?: string;
  empresaEmail?: string;
  empresaTelefono?: string;
}

export default function ConfiguracionPage() {
  const [settings, setSettings] = useState<SettingsData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/configuracion');
        if (!res.ok) throw new Error('No se pudo cargar la configuración.');
        const data = await res.json();
        setSettings(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/configuracion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al guardar la configuración.');
      }

      setSuccess('¡Configuración guardada exitosamente!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Container className="text-center mt-5"><Spinner /></Container>;
  }

  return (
    <Container className="mt-4">
      <h1>Configuración de la Empresa</h1>
      <p className="text-muted">Esta información aparecerá en las notas de venta.</p>

      <Card className="shadow-sm">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="empresaNombre">
                  <Form.Label>Nombre de la Empresa</Form.Label>
                  <Form.Control
                    type="text"
                    name="empresaNombre"
                    value={settings.empresaNombre || ''}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="empresaRut">
                  <Form.Label>RUT de la Empresa</Form.Label>
                  <Form.Control
                    type="text"
                    name="empresaRut"
                    value={settings.empresaRut || ''}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3" controlId="empresaDireccion">
              <Form.Label>Dirección</Form.Label>
              <Form.Control
                type="text"
                name="empresaDireccion"
                value={settings.empresaDireccion || ''}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="empresaEmail">
                  <Form.Label>Email de Contacto</Form.Label>
                  <Form.Control
                    type="email"
                    name="empresaEmail"
                    value={settings.empresaEmail || ''}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="empresaTelefono">
                  <Form.Label>Teléfono de Contacto</Form.Label>
                  <Form.Control
                    type="text"
                    name="empresaTelefono"
                    value={settings.empresaTelefono || ''}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Spinner as="span" size="sm" /> : 'Guardar Configuración'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
