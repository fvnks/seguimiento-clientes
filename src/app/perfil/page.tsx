'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Container, Form, Button, Alert, Spinner, Card, Row, Col } from 'react-bootstrap';
import { useSession } from 'next-auth/react';

interface UserProfile {
  nombre: string | null;
  apellido: string | null;
  rut: string | null;
  zona: string | null;
  email: string | null;
}

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [profile, setProfile] = useState<UserProfile>({ 
    nombre: '', 
    apellido: '', 
    rut: '', 
    zona: '',
    email: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (session) {
      setIsLoading(true);
      fetch('/api/user/profile')
        .then(res => res.json())
        .then(data => {
          if (data) {
            setProfile({
              nombre: data.nombre || '',
              apellido: data.apellido || '',
              rut: data.rut || '',
              zona: data.zona || '',
              email: data.email || '',
            });
          }
        })
        .catch(() => setError('No se pudo cargar el perfil.'))
        .finally(() => setIsLoading(false));
    }
  }, [session]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al actualizar el perfil.');
      }
      
      setSuccess('¡Perfil actualizado con éxito!');
      // Also update the session to reflect the changes immediately if needed
      await update({ ...session, user: { ...session?.user, ...data } });

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
      <Row className="justify-content-center">
        <Col lg={8} md={10}>
          <Card>
            <Card.Header as="h4">Mi Perfil</Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="nombre">
                      <Form.Label>Nombre</Form.Label>
                      <Form.Control
                        type="text"
                        name="nombre"
                        value={profile.nombre || ''}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="apellido">
                      <Form.Label>Apellido</Form.Label>
                      <Form.Control
                        type="text"
                        name="apellido"
                        value={profile.apellido || ''}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                   <Col md={6}>
                    <Form.Group className="mb-3" controlId="email">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={profile.email || ''}
                        onChange={handleInputChange}
                        placeholder="(No se puede cambiar todavía)"
                        disabled // Disabled for now
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="rut">
                      <Form.Label>RUT</Form.Label>
                      <Form.Control
                        type="text"
                        name="rut"
                        value={profile.rut || ''}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3" controlId="zona">
                  <Form.Label>Zona</Form.Label>
                  <Form.Control
                    type="text"
                    name="zona"
                    value={profile.zona || ''}
                    onChange={handleInputChange}
                  />
                </Form.Group>

                <Button variant="primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
