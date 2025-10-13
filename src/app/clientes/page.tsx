'use client';

import { useState, useEffect } from 'react';
import { Container, Table, Button, Alert, Spinner, Form, InputGroup, Card } from 'react-bootstrap';
import Link from 'next/link';
import styles from './Clientes.module.css';

// Define a type for the client object for type safety
interface Cliente {
  id: number;
  nombre: string; // legacy
  razonSocial: string | null;
  rut: string | null;
  email: string;
  telefono: string | null;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Debounce effect for search term
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // Wait 500ms after user stops typing

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);

  // Effect to fetch clients based on debounced search term
  useEffect(() => {
    const fetchClientes = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const url = debouncedSearchTerm
          ? `/api/clientes?search=${encodeURIComponent(debouncedSearchTerm)}`
          : '/api/clientes';
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error('Error al obtener los clientes');
        }
        const data = await res.json();
        setClientes(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientes();
  }, [debouncedSearchTerm, refreshKey]);

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este cliente? Esta acción no se puede deshacer.')) {
      try {
        const res = await fetch(`/api/clientes/${id}`, {
          method: 'DELETE',
        });

        if (res.status !== 204) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Error al eliminar el cliente');
        }

        // Refresh the list after deleting
        setRefreshKey(oldKey => oldKey + 1);

      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </Spinner>
        </div>
      );
    }

    if (error) {
      return <Alert variant="danger">{error}</Alert>;
    }

    if (clientes.length === 0) {
      return <Alert variant="info">No se encontraron clientes para los criterios de búsqueda.</Alert>;
    }

    return (
      <>
        {/* Vista de Tabla para Escritorio */}
        <div className={styles.tableView}>
          <Card className="shadow-sm">
            <Table striped hover responsive className="mb-0">
              <thead className="table-light">
                <tr>
                  <th className="py-3 px-3">Razón Social</th>
                  <th className="py-3 px-3">RUT</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <tr key={cliente.id}>
                    <td className="py-3 px-3">
                      <Link href={`/clientes/${cliente.id}`} style={{ textDecoration: 'none' }}>
                        {cliente.razonSocial || cliente.nombre}
                      </Link>
                    </td>
                    <td className="py-3 px-3">{cliente.rut || '-'}</td>
                    <td className="py-3 px-3">{cliente.email}</td>
                    <td className="py-3 px-3">
                      <div className={styles.actions}>
                        <Link href={`/clientes/${cliente.id}/editar`} passHref>
                          <Button variant="outline-secondary" size="sm">
                            Editar
                          </Button>
                        </Link>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(cliente.id)}>
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </div>

        {/* Vista de Tarjetas para Móvil */}
        <div className={styles.cardView}>
          {clientes.map((cliente) => (
            <div key={cliente.id} className={styles.clientCard}>
              <div className={styles.clientCardHeader}>
                <Link href={`/clientes/${cliente.id}`} style={{ textDecoration: 'none' }}>
                  {cliente.razonSocial || cliente.nombre}
                </Link>
              </div>
              <div className={styles.clientCardBody}>
                <div>
                  <span>RUT:</span>
                  <span>{cliente.rut || '-'}</span>
                </div>
                <div>
                  <span>Email:</span>
                  <span>{cliente.email}</span>
                </div>
                <div className={styles.actions}>
                  <Link href={`/clientes/${cliente.id}/editar`} passHref>
                    <Button variant="secondary" size="sm">Editar</Button>
                  </Link>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(cliente.id)}>
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Lista de Clientes</h1>
        <Link href="/clientes/nuevo" passHref>
          <Button variant="primary">Agregar Cliente</Button>
        </Link>
      </div>

      <Form.Group className="mb-4">
        <InputGroup>
            <InputGroup.Text>Buscar</InputGroup.Text>
            <Form.Control
                type="text"
                placeholder="Buscar por Razón Social, RUT o Email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </InputGroup>
      </Form.Group>

      {renderContent()}
    </Container>
  );
}