'use client';

import { useState, useEffect } from 'react';
import { Container, Card, Spinner, Alert, ListGroup, Row, Col } from 'react-bootstrap';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from 'react-bootstrap';

interface Cliente {
  id: number;
  nombre: string;
  razonSocial: string | null;
  rut: string | null;
  email: string;
  telefono: string | null;
  direccion: string | null;
  latitud: number | null;
  longitud: number | null;
  mediosDePago: string | null;
  paymentStatus: string;
  empresa: string | null;
  codigoCliente: string | null;
  nombreAlias: string | null;
  tipoDespacho: string | null;
  canalCliente: string | null;
  subCanal: string | null;
  giroComercial: string | null;
  contacto: string | null;
  listaPrecios: string | null;
  ejecutivaComercial: string | null;
  tipoDireccion: string | null;
  ciudad: string | null;
  comuna: string | null;
}

export default function ClienteProfilePage() {
  const params = useParams();
  const id = params.id;
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const fetchCliente = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const res = await fetch(`/api/clientes/${id}`);
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Error al obtener el cliente');
          }
          const data = await res.json();
          setCliente(data);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchCliente();
    }
  }, [id]);

  const renderDetail = (label: string, value: string | number | null | undefined) => {
    return (
      <ListGroup.Item>
        <strong>{label}:</strong> {value || 'No especificado'}
      </ListGroup.Item>
    );
  };

  if (isLoading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!cliente) {
    return (
      <Container className="mt-5">
        <Alert variant="warning">No se encontró el cliente.</Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Perfil del Cliente</h1>
        <Link href="/clientes" passHref>
          <Button variant="secondary">Volver a la lista</Button>
        </Link>
      </div>
      <Card>
        <Card.Header>
          <h2>{cliente.razonSocial || cliente.nombre}</h2>
        </Card.Header>
        <Card.Body>
          <ListGroup variant="flush">
            <Row>
              <Col md={6}>
                {renderDetail('Razón Social', cliente.razonSocial)}
                {renderDetail('Nombre Alias', cliente.nombreAlias)}
                {renderDetail('RUT', cliente.rut)}
                {renderDetail('Email', cliente.email)}
                {renderDetail('Teléfono', cliente.telefono)}
                {renderDetail('Dirección', cliente.direccion)}
                {renderDetail('Ciudad', cliente.ciudad)}
                {renderDetail('Comuna', cliente.comuna)}
                {renderDetail('Estado de Pago', cliente.paymentStatus)}
              </Col>
              <Col md={6}>
                {renderDetail('Empresa', cliente.empresa)}
                {renderDetail('Código Cliente', cliente.codigoCliente)}
                {renderDetail('Tipo Despacho', cliente.tipoDespacho)}
                {renderDetail('Canal Cliente', cliente.canalCliente)}
                {renderDetail('Sub-Canal', cliente.subCanal)}
                {renderDetail('Giro Comercial', cliente.giroComercial)}
                {renderDetail('Contacto', cliente.contacto)}
                {renderDetail('Lista de Precios', cliente.listaPrecios)}
                {renderDetail('Ejecutiva Comercial', cliente.ejecutivaComercial)}
                {renderDetail('Tipo Dirección', cliente.tipoDireccion)}
                {renderDetail('Medios de Pago', cliente.mediosDePago)}
              </Col>
            </Row>
          </ListGroup>
        </Card.Body>
      </Card>
    </Container>
  );
}