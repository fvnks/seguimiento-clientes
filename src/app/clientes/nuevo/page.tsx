"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Form,
  Button,
  Alert,
  Spinner,
  Row,
  Col,
  InputGroup,
} from "react-bootstrap";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamically import the MapSelector component to avoid SSR issues with Leaflet
const MapSelector = dynamic(() => import("@/components/MapSelector"), {
  ssr: false,
  loading: () => <p>Cargando mapa...</p>,
});

export default function NuevoClientePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    mediosDePago: "", // Added field
    direccion: "",
    latitud: -33.45694, // Default initial position (Santiago)
    longitud: -70.64827,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setFormData((prev) => ({ ...prev, latitud: lat, longitud: lng }));
  };

  const handleGeocode = async () => {
    if (!formData.direccion) {
      setError("Por favor, introduce una dirección para buscar.");
      return;
    }
    setError(null);
    setIsGeocoding(true);
    try {
      const res = await fetch(
        `/api/geocode?address=${encodeURIComponent(formData.direccion)}`
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.message || "Error al obtener las coordenadas"
        );
      }
      const data = await res.json();
      handleLocationChange(data.lat, data.lon);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Use razonSocial for both nombre and razonSocial
    const submissionData = {
      ...formData,
      razonSocial: formData.nombre,
      latitud: parseFloat(formData.latitud as any),
      longitud: parseFloat(formData.longitud as any),
    };

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al crear el cliente");
      }

      router.push("/clientes");
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
        <h1>Agregar Nuevo Cliente</h1>
        <Link href="/clientes" passHref>
          <Button variant="secondary">&larr; Volver a la Lista</Button>
        </Link>
      </div>

      <Form onSubmit={handleSubmit}>
        {error && <Alert variant="danger">{error}</Alert>}

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="nombre">
              <Form.Label>Nombre o Razón Social</Form.Label>
              <Form.Control
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
          </Col>
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
        </Row>

        <Row>
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
          <Col md={6}>
            <Form.Group className="mb-3" controlId="mediosDePago">
              <Form.Label>Medios de Pago (ej. Efectivo, Tarjeta)</Form.Label>
              <Form.Control
                type="text"
                name="mediosDePago"
                value={formData.mediosDePago}
                onChange={handleInputChange}
              />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col>
            <Form.Group className="mb-3" controlId="direccion">
              <Form.Label>Dirección</Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputChange}
                />
                <Button
                  variant="outline-secondary"
                  onClick={handleGeocode}
                  disabled={isGeocoding}
                >
                  {isGeocoding ? (
                    <Spinner as="span" animation="border" size="sm" />
                  ) : (
                    "Buscar"
                  )}
                </Button>
              </InputGroup>
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
            Arrastra el marcador, haz clic en el mapa o usa el buscador de
            dirección para seleccionar la ubicación.
          </Form.Text>
        </Form.Group>

        <Button variant="primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
              />
              <span className="ms-2">Guardando...</span>
            </>
          ) : (
            "Guardar Cliente"
          )}
        </Button>
      </Form>
    </Container>
  );
}
