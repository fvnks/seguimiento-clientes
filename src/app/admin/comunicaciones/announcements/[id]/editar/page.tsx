'use client';

import { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useParams, useRouter } from 'next/navigation';

export default function EditAnnouncementPage() {
  const [content, setContent] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetch(`/api/admin/announcements/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            setContent(data.content);
            setIsActive(data.isActive);
          } else {
            setError('No se pudo cargar el anuncio.');
          }
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/admin/announcements/${id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, isActive }),
        }
      );

      if (res.ok) {
        setSuccess('Anuncio actualizado con éxito.');
        setTimeout(() => router.push('/admin/comunicaciones'), 2000);
      } else {
        const data = await res.json();
        setError(data.error || 'Error al actualizar el anuncio.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-4">
      <Card>
        <Card.Header as="h5">Editar Anuncio</Card.Header>
        <Card.Body>
          {loading && <Spinner animation="border" />}
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          {!loading && (
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Contenido</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Check
                type="switch"
                id="active-switch"
                label="Activo"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <Button type="submit" disabled={loading} className="mt-3">
                {loading ? 'Actualizando...' : 'Actualizar Anuncio'}
              </Button>
              <Button variant="secondary" onClick={() => router.back()} className="ms-2 mt-3">
                Cancelar
              </Button>
            </Form>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}
