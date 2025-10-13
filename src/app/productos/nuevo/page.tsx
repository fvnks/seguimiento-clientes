'use client';

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Container, Form, Button, Alert, Spinner, Row, Col } from "react-bootstrap";
import Link from "next/link";

interface Categoria {
  id: number;
  nombre: string;
}

export default function NuevoProductoPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    categoriaId: "",
    precioNeto: "",
    precioKilo: "",
  });
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const res = await fetch('/api/categorias');
        if (!res.ok) throw new Error('No se pudieron cargar las categorías');
        const data = await res.json();
        setCategorias(data);
      } catch (err: any) {
        setError(err.message);
      }
    };
    fetchCategorias();
  }, []);

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
      const res = await fetch("/api/productos", {
        method: "POST",
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
        throw new Error(errorData.message || "Error al crear el producto");
      }

      router.push("/productos");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Agregar Nuevo Producto</h1>
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
              <span className="ms-2">Guardando...</span>
            </>
          ) : (
            "Guardar Producto"
          )}
        </Button>
      </Form>
    </Container>
  );
}
