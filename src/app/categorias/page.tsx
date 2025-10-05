'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Container, ListGroup, Button, Alert, Spinner, Form, InputGroup, Row, Col } from 'react-bootstrap';

interface Categoria {
  id: number;
  nombre: string;
}

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchCategorias = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/categorias');
        if (!res.ok) {
          throw new Error('Error al obtener las categorías');
        }
        const data = await res.json();
        setCategorias(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategorias();
  }, [refreshKey]);

  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      setError('El nombre de la categoría no puede estar vacío.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: newCategoryName }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al crear la categoría');
      }

      setNewCategoryName('');
      setRefreshKey(oldKey => oldKey + 1); // Refresh the list
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta categoría? Los productos en esta categoría no se eliminarán, pero se quedarán sin categoría.')) {
      try {
        const res = await fetch(`/api/categorias/${id}`, {
          method: 'DELETE',
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Error al eliminar la categoría');
        }

        setRefreshKey(oldKey => oldKey + 1); // Refresh the list
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center"><Spinner animation="border" /></div>;
    }

    if (error) {
      return <Alert variant="danger">{error}</Alert>;
    }

    return (
      <ListGroup>
        {categorias.length > 0 ? (
          categorias.map((cat) => (
            <ListGroup.Item key={cat.id} className="d-flex justify-content-between align-items-center">
              {cat.nombre}
              <Button variant="outline-danger" size="sm" onClick={() => handleDelete(cat.id)}>
                Eliminar
              </Button>
            </ListGroup.Item>
          ))
        ) : (
          <ListGroup.Item>No hay categorías creadas.</ListGroup.Item>
        )}
      </ListGroup>
    );
  };

  return (
    <Container className="mt-4">
      <h1>Gestionar Categorías</h1>
      
      <Row className="my-4">
        <Col md={6}>
          <Form onSubmit={handleAddCategory}>
            <InputGroup className="mb-3">
              <Form.Control
                type="text"
                placeholder="Nombre de la nueva categoría"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? <Spinner as="span" size="sm" animation="border" /> : 'Agregar'}
              </Button>
            </InputGroup>
          </Form>
        </Col>
      </Row>

      {renderContent()}

    </Container>
  );
}
