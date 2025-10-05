'use client';

import { useState, useEffect, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Container,
  Form,
  Button,
  Alert,
  Spinner,
  Row,
  Col,
} from "react-bootstrap";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamically import the MapSelector component
const MapSelector = dynamic(() => import("@/components/MapSelector"), {
  ssr: false,
  loading: () => <p>Cargando mapa...</p>,
});

export default function EditarClientePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [formData, setFormData] = useState({
    razonSocial: "",
    rut: "",
    email: "",
    telefono: "",
    direccion: "",
    latitud: 0,
    longitud: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // For initial data loading
  const [isSubmitting, setIsSubmitting] = useState(false); // For form submission

  useEffect(() => {
    if (!id) return;

    const fetchCliente = async () => {
      try {
        const res = await fetch(`/api/clientes/${id}`);
        if (!res.ok) {
          throw new Error("No se pudo cargar la información del cliente.");
        }
        const data = await res.json();
        setFormData({
          razonSocial: data.razonSocial || data.nombre || "",
          rut: data.rut || "",
          email: data.email,
          telefono: data.telefono || "",
          direccion: data.direccion || "",
          latitud: data.latitud || -33.45694, // Default to Santiago if null
          longitud: data.longitud || -70.64827,
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCliente();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setFormData((prev) => ({ ...prev, latitud: lat, longitud: lng }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.razonSocial || !formData.email) {
      setError("La Razón Social y el email son obligatorios.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/clientes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al actualizar el cliente");
      }

      // Redirect to the client's detail page on successful update
      router.push(`/clientes`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" />
        <p>Cargando datos del cliente...</p>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Editar Cliente</h1>
        <Link href={`/clientes`} passHref>
          <Button variant="secondary">Cancelar</Button>
        </Link>
      </div>

      <Form onSubmit={handleSubmit}>
        {error && <Alert variant="danger">{error}</Alert>}

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="razonSocial">
              <Form.Label>Razón Social</Form.Label>
              <Form.Control
                type="text"
                name="razonSocial"
                value={formData.razonSocial}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="rut">
              <Form.Label>RUT (Opcional)</Form.Label>
              <Form.Control
                type="text"
                name="rut"
                value={formData.rut}
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
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="telefono">
              <Form.Label>Teléfono</Form.Label>
              <Form.Control
                type="text"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
              />
            </Form.Group>
          </Col>
        </Row>

        <Row>
           <Col md={12}>
            <Form.Group className="mb-3" controlId="direccion">
              <Form.Label>Dirección</Form.Label>
              <Form.Control
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
              />
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-3" controlId="mapa">
          <Form.Label>Ubicación</Form.Label>
          <div style={{ height: "400px", width: "100%" }}>
            <MapSelector
              onLocationChange={handleLocationChange}
              position={[formData.latitud, formData.longitud]}
            />
          </div>
          <Form.Text>
            Arrastra el marcador o haz clic en el mapa para seleccionar la
            ubicación.
          </Form.Text>
        </Form.Group>

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
