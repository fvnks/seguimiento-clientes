'use client';

import { useState, FormEvent } from 'react';
import { Alert, Button, Form, Spinner, Card } from 'react-bootstrap';

interface ProductImporterProps {
  onImportSuccess: () => void;
}

export default function ProductImporter({ onImportSuccess }: ProductImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
      setError(null);
      setSuccessMessage(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Por favor, selecciona un archivo de Excel para importar.');
      return;
    }

    setIsImporting(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/productos/import', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || 'Error al importar los productos.');
      }

      setSuccessMessage(result.message);
      onImportSuccess(); // Refresh the product list on the parent page
      setFile(null); // Clear the file input
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card className="mb-4">
      <Card.Header>Importar Productos desde Excel</Card.Header>
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          {error && <Alert variant="danger">{error}</Alert>}
          {successMessage && <Alert variant="success">{successMessage}</Alert>}
          
          <Form.Group controlId="formFile" className="mb-3">
            <Form.Label>Selecciona un archivo .xlsx o .xls</Form.Label>
            <Form.Control 
              type="file" 
              onChange={handleFileChange} 
              accept=".xlsx, .xls"
            />
          </Form.Group>
          
          <Button variant="info" type="submit" disabled={isImporting || !file}>
            {isImporting ? (
              <>
                <Spinner as="span" animation="border" size="sm" />
                <span className="ms-2">Importando...</span>
              </>
            ) : (
              'Importar Productos'
            )}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}
