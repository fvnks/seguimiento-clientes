'use client';

import { useState, FormEvent } from 'react';
import { Alert, Button, Form, Spinner, Card, ListGroup } from 'react-bootstrap';

interface ClientImporterProps {
  onImportSuccess: () => void;
}

interface ImportResult {
  message: string;
  errors?: string[];
}

export default function ClientImporter({ onImportSuccess }: ClientImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
      setError(null);
      setResult(null);
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
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/clientes/import', {
        method: 'POST',
        body: formData,
      });

      const importResult: ImportResult = await res.json();

      if (!res.ok) {
        throw new Error(importResult.message || 'Error al importar los clientes.');
      }

      setResult(importResult);
      onImportSuccess(); // Refresca la lista de clientes en la página padre
      setFile(null); // Limpia el input del archivo
      (document.getElementById('formFile') as HTMLInputElement).value = ""; // Resetea el input
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card className="mb-4">
      <Card.Header>Importar Clientes desde Excel</Card.Header>
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          {error && <Alert variant="danger">{error}</Alert>}
          {result && <Alert variant="success">{result.message}</Alert>}
          {result?.errors && result.errors.length > 0 && (
            <Alert variant="warning">
              <Alert.Heading>Se encontraron algunos problemas:</Alert.Heading>
              <ListGroup>
                {result.errors.map((e, i) => <ListGroup.Item key={i} variant="warning">{e}</ListGroup.Item>)}
              </ListGroup>
            </Alert>
          )}
          
          <Form.Group controlId="formFile" className="mb-3">
            <Form.Label>Selecciona un archivo .xlsx o .xls. Columnas requeridas: "Razón Social" (o "Nombre Alias") y "Correo".</Form.Label>
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
              'Importar Clientes'
            )}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}