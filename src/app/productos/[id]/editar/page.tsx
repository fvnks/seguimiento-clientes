'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Container, Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import Link from 'next/link';

interface Categoria {
  id: number;
  nombre: string;
}

export default function EditarProductoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    categoriaId: "",
    precioNeto: "",
    precioKilo: "",
  });
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const [productoRes, categoriasRes] = await Promise.all([
          fetch(`/api/productos/${id}`),
          fetch('/api/categorias'),
        ]);

        if (!productoRes.ok) {
          throw new Error('Error al obtener los datos del producto');
        }
        if (!categoriasRes.ok) {
          throw new Error('No se pudieron cargar las categorías');
        }

        const productoData = await productoRes.json();
        const categoriasData = await categoriasRes.json();
        
        setFormData({
          codigo: productoData.codigo,
          nombre: productoData.nombre,
          categoriaId: productoData.categoriaId || '',
          precioNeto: String(productoData.precioNeto),
          precioKilo: productoData.precioKilo ? String(productoData.precioKilo) : ''
        });
        setCategorias(categoriasData);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.codigo || !formData.nombre || !formData.precioNeto) {
      setError("El código, nombre y precio neto son obligatorios.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/productos/${id}`, {
        method: 'PUT',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            ...formData,
            precioNeto: parseFloat(formData.precioNeto),
            precioKilo: formData.precioKilo ? parseFloat(formData.precioKilo) : null,
            categoriaId: formData.categoriaId ? parseInt(formData.categoriaId, 10) : null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al actualizar el producto");
      }

      router.push("/productos");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
  }

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Editar Producto</h1>
        <Link href="/productos" passHref>
          <Button variant="secondary">&larr; Volver a la Lista</Button>
        </Link>
      </div>

      <Form onSubmit={handleSubmit}>
        {error && <Alert variant="danger">{error}</Alert>}

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="codigo">
              <Form.Label>Código</Form.Label>
              <Form.Control
                type="text"
                name="codigo"
                value={formData.codigo}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="nombre">
              <Form.Label>Nombre del Producto</Form.Label>
              <Form.Control
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={4}>
            <Form.Group className="mb-3" controlId="categoriaId">
              <Form.Label>Categoría</Form.Label>
              <Form.Select
                name="categoriaId"
                value={formData.categoriaId}
                onChange={handleInputChange}
              >
                <option value="">Sin categoría</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3" controlId="precioNeto">
              <Form.Label>Precio Neto</Form.Label>
              <Form.Control
                type="number"
                name="precioNeto"
                value={formData.precioNeto}
                onChange={handleInputChange}
                required
                step="0.01"
              />
            </Form.Group>
          </Col>
           <Col md={4}>
            <Form.Group className="mb-3" controlId="precioKilo">
              <Form.Label>Precio por Kilo (Opcional)</Form.Label>
              <Form.Control
                type="number"
                name="precioKilo"
                value={formData.precioKilo}
                onChange={handleInputChange}
                step="0.01"
              />
            </Form.Group>
          </Col>
        </Row>

        <Button variant="primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner as="span" animation="border" size="sm" />
              <span className="ms-2">Guardando Cambios...</span>
            </>
          ) : (
            "Guardar Cambios"
          )}
        </Button>
      </Form>
    </Container>
  );
}
