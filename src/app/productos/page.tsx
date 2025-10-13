'use client';

import { useState, useEffect } from 'react';
import { Container, Table, Button, Alert, Spinner, Form, InputGroup, Card, Pagination } from 'react-bootstrap';
import Link from 'next/link';
import ProductImporter from '@/components/ProductImporter';

interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  categoria: { nombre: string } | null;
  precioNeto: number;
  precioTotal: number;
  precioKilo: number | null;
}

const PAGE_SIZE = 20;

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // Debounce effect for search term
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page on new search
    }, 500);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);

  // Effect to fetch products based on search, page, or refresh
  useEffect(() => {
    const fetchProductos = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          pageSize: PAGE_SIZE.toString(),
        });
        if (debouncedSearchTerm) {
          params.append('search', debouncedSearchTerm);
        }

        const res = await fetch(`/api/productos?${params.toString()}`);
        if (!res.ok) {
          throw new Error('Error al obtener los productos');
        }
        const data = await res.json();
        setProductos(data.productos);
        setTotalPages(Math.ceil(data.totalCount / PAGE_SIZE));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductos();
  }, [debouncedSearchTerm, currentPage, refreshKey]);

  const handleImportSuccess = () => {
    setRefreshKey(oldKey => oldKey + 1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(value);
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pageNumbers = [];
        const maxPagesToShow = 5;
        const halfMaxPages = Math.floor(maxPagesToShow / 2);
        let startPage = Math.max(1, currentPage - halfMaxPages);
        let endPage = Math.min(totalPages, currentPage + halfMaxPages);

        if (currentPage - halfMaxPages <= 0) {
            endPage = Math.min(totalPages, maxPagesToShow);
        }

        if (currentPage + halfMaxPages >= totalPages) {
            startPage = Math.max(1, totalPages - maxPagesToShow + 1);
        }

        if (startPage > 1) {
            pageNumbers.push(1);
            if (startPage > 2) {
                pageNumbers.push('ellipsis-start');
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pageNumbers.push('ellipsis-end');
            }
            pageNumbers.push(totalPages);
        }

        return pageNumbers;
    };

    const pageNumbers = getPageNumbers();

    return (
        <Pagination className="justify-content-center mt-4">
            <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
            <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />

            {pageNumbers.map((page, index) => {
                if (typeof page === 'string') {
                    return <Pagination.Ellipsis key={page + index} disabled />;
                }
                return (
                    <Pagination.Item
                        key={page}
                        active={page === currentPage}
                        onClick={() => handlePageChange(page)}
                    >
                        {page}
                    </Pagination.Item>
                );
            })}

            <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
            <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />
        </Pagination>
    );
}

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      );
    }

    if (error) {
      return <Alert variant="danger">{error}</Alert>;
    }

    if (productos.length === 0 && debouncedSearchTerm === '') {
      return <Alert variant="info">No se encontraron productos. ¡Agrega uno nuevo o importa desde Excel!</Alert>;
    } else if (productos.length === 0) {
        return <Alert variant="info">No se encontraron productos para los criterios de búsqueda.</Alert>;
    }

    return (
      <Card className="shadow-sm">
        <Table striped hover responsive className="responsive-table mb-0">
          <thead className="table-light">
            <tr>
              <th className="py-3 px-3">Código</th>
              <th className="py-3 px-3">Nombre</th>
              <th className="py-3 px-3">Categoría</th>
              <th className="py-3 px-3">Precio Neto</th>
              <th className="py-3 px-3">Precio Total (IVA incl.)</th>
              <th className="py-3 px-3">Precio Kilo</th>
              <th className="py-3 px-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((producto) => (
              <tr key={producto.id}>
                <td data-label="Código" className="py-3 px-3">{producto.codigo}</td>
                <td data-label="Nombre" className="py-3 px-3">{producto.nombre}</td>
                <td data-label="Categoría" className="py-3 px-3">{producto.categoria?.nombre || '-'}</td>
                <td data-label="Precio Neto" className="py-3 px-3">{formatCurrency(producto.precioNeto)}</td>
                <td data-label="Precio Total" className="py-3 px-3">{formatCurrency(producto.precioTotal)}</td>
                <td data-label="Precio Kilo" className="py-3 px-3">{formatCurrency(producto.precioKilo)}</td>
                <td data-label="Acciones" className="py-3 px-3">
                  <Link href={`/productos/${producto.id}/editar`} passHref>
                    <Button variant="outline-secondary" size="sm" className="me-2">
                      Editar
                    </Button>
                  </Link>
                  <Button variant="outline-danger" size="sm" disabled>
                    Eliminar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    );
  };

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Lista de Productos</h1>
        <Link href="/productos/nuevo" passHref>
          <Button variant="primary">Agregar Producto</Button>
        </Link>
      </div>

      <ProductImporter onImportSuccess={handleImportSuccess} />

      <Form.Group className="mb-4">
        <InputGroup>
            <InputGroup.Text>Buscar</InputGroup.Text>
            <Form.Control
                type="text"
                placeholder="Buscar por código o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </InputGroup>
      </Form.Group>

      {renderContent()}
      {renderPagination()}
    </Container>
  );
}
