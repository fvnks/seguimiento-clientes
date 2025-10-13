'use client';

import { useState, useEffect } from 'react';
import { Container, Table, Button, Alert, Spinner, Form, InputGroup, Card, Pagination } from 'react-bootstrap';
import ClientImporter from '@/components/ClientImporter';
import Link from 'next/link';

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
  const [selectedClientes, setSelectedClientes] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalClientes, setTotalClientes] = useState(0);
  const pageSize = 15;

  // Function to trigger a refresh of the client list after a successful import
  const handleImportSuccess = () => {
    setRefreshKey(oldKey => oldKey + 1);
  };

  // Debounce effect for search term
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page on new search
    }, 500); // Wait 500ms after user stops typing

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);

  // Effect to fetch clients based on debounced search term and page
  useEffect(() => {
    const fetchClientes = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
            page: currentPage.toString(),
            pageSize: pageSize.toString(),
        });
        if (debouncedSearchTerm) {
            params.append('search', debouncedSearchTerm);
        }

        const res = await fetch(`/api/clientes?${params.toString()}`);
        if (!res.ok) {
          throw new Error('Error al obtener los clientes');
        }
        const data = await res.json();
        setClientes(data.data);
        setTotalPages(data.totalPages);
        setTotalClientes(data.total);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientes();
  }, [debouncedSearchTerm, refreshKey, currentPage]);

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

  const handleBulkDelete = async () => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar ${selectedClientes.length} clientes? Esta acción no se puede deshacer.`)) {
      try {
        const res = await fetch(`/api/clientes`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ids: selectedClientes }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Error al eliminar los clientes');
        }

        // Refresh the list after deleting
        setRefreshKey(oldKey => oldKey + 1);
        setSelectedClientes([]); // Clear selection

      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const handleSelectAll = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      try {
        const res = await fetch('/api/clientes/all-ids');
        if (!res.ok) {
          throw new Error('Error fetching all client IDs');
        }
        const allIds = await res.json();
        setSelectedClientes(allIds);
      } catch (err: any) {
        setError(err.message);
      }
    } else {
      setSelectedClientes([]);
    }
  };

  const handleSelectOne = (e: React.ChangeEvent<HTMLInputElement>, id: number) => {
    if (e.target.checked) {
      setSelectedClientes([...selectedClientes, id]);
    } else {
      setSelectedClientes(selectedClientes.filter((selectedId) => selectedId !== id));
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    let items = [];
    for (let number = 1; number <= totalPages; number++) {
      items.push(
        <Pagination.Item key={number} active={number === currentPage} onClick={() => setCurrentPage(number)}>
          {number}
        </Pagination.Item>,
      );
    }

    return (
        <div className="d-flex justify-content-center mt-4">
            <Pagination>
                <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                <Pagination.Prev onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} />
                {items}
                <Pagination.Next onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} />
                <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
            </Pagination>
        </div>
    );
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
      <Card className="shadow-sm">
        <Card.Body>
            <div className="mb-3">
                Mostrando {clientes.length} de {totalClientes} clientes.
            </div>
            <Table striped hover responsive className="responsive-table mb-0">
            <thead className="table-light">
                <tr>
                <th className="py-3 px-3" style={{ width: '5%' }}>
                    <Form.Check
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={totalClientes > 0 && selectedClientes.length === totalClientes}
                    />
                </th>
                <th className="py-3 px-3">Razón Social</th>
                <th className="py-3 px-3">RUT</th>
                <th className="py-3 px-3">Email</th>
                <th className="py-3 px-3">Acciones</th>
                </tr>
            </thead>
            <tbody>
                {clientes.map((cliente) => (
                <tr key={cliente.id} className={selectedClientes.includes(cliente.id) ? 'table-active' : ''}>
                    <td className="py-3 px-3">
                    <Form.Check
                        type="checkbox"
                        checked={selectedClientes.includes(cliente.id)}
                        onChange={(e) => handleSelectOne(e, cliente.id)}
                    />
                    </td>
                    <td data-label="Razón Social" className="py-3 px-3">
                    <Link href={`/clientes/${cliente.id}`} style={{ textDecoration: 'none' }}>
                        {cliente.razonSocial || cliente.nombre}
                    </Link>
                    </td>
                    <td data-label="RUT" className="py-3 px-3">{cliente.rut || '-'}</td>
                    <td data-label="Email" className="py-3 px-3">{cliente.email}</td>
                    <td data-label="Acciones" className="py-3 px-3">
                    <Link href={`/clientes/${cliente.id}/editar`} passHref>
                        <Button variant="outline-secondary" size="sm" className="me-2">
                        Editar
                        </Button>
                    </Link>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(cliente.id)}>
                        Eliminar
                    </Button>
                    </td>
                </tr>
                ))}
            </tbody>
            </Table>
        </Card.Body>
        <Card.Footer>
            {renderPagination()}
        </Card.Footer>
      </Card>
    );
  };

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Lista de Clientes</h1>
        <div className="d-flex gap-2">
          {selectedClientes.length > 0 && (
            <Button variant="danger" onClick={handleBulkDelete}>
              Eliminar ({selectedClientes.length})
            </Button>
          )}
          <Link href="/clientes/nuevo" passHref>
            <Button variant="primary">Agregar Cliente</Button>
          </Link>
        </div>
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

      {/* --- Componente de Importación --- */}
      <ClientImporter onImportSuccess={handleImportSuccess} />

      {renderContent()}
    </Container>
  );
}