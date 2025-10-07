'use client';

import { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useParams, useRouter } from 'next/navigation';

export default function EditNewsPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetch(`/api/admin/news/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            setTitle(data.title);
            setContent(data.content);
          } else {
            setError('No se pudo cargar la noticia.');
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
      const res = await fetch(`/api/admin/news/${id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content }),
        }
      );

      if (res.ok) {
        setSuccess('Noticia actualizada con éxito.');
        setTimeout(() => router.push('/admin/comunicaciones'), 2000);
      } else {
        const data = await res.json();
        setError(data.error || 'Error al actualizar la noticia.');
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
        <Card.Header as="h5">Editar Noticia</Card.Header>
        <Card.Body>
          {loading && <Spinner animation="border" />}
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          {!loading && (
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Título</Form.Label>
                <Form.Control
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Contenido</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </Form.Group>
              <Button type="submit" disabled={loading}>
                {loading ? 'Actualizando...' : 'Actualizar Noticia'}
              </Button>
              <Button variant="secondary" onClick={() => router.back()} className="ms-2">
                Cancelar
              </Button>
            </Form>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}
