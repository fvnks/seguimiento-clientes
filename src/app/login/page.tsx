'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await signIn('credentials', {
      redirect: false,
      username,
      password,
    });

    setIsLoading(false);

    if (result?.error) {
      setError('Invalid username or password');
    } else if (result?.ok) {
      router.push(callbackUrl);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <Card style={{ width: '24rem' }}>
        <Card.Body>
          <Card.Title className="text-center mb-4">Login</Card.Title>
          <Form onSubmit={handleSubmit}>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form.Group className="mb-3" controlId="username">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="password">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100" disabled={isLoading}>
              {isLoading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Sign In'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
