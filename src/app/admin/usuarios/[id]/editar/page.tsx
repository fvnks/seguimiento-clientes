'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Container, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { Role } from '@/generated/prisma/client';

interface User {
  username: string;
  role: Role;
  password?: string; // Make password optional
}

export default function EditUserPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated' && (session?.user as any)?.role === 'ADMIN' && id) {
      const fetchUser = async () => {
        try {
          const res = await fetch(`/api/admin/users/${id}`);
          if (!res.ok) throw new Error('Failed to fetch user data');
          const data = await res.json();
          setUser({ ...data, password: '' }); // Initialize with empty password
        } catch (err: any) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchUser();
    }
  }, [status, session, id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setError(null);

    // Don't send the password if it's empty
    const dataToSend: any = { username: user.username, role: user.role };
    if (user.password) {
      dataToSend.password = user.password;
    }

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update user');
      }

      router.push('/admin/usuarios'); // Redirect to user list on success
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return <Container className="text-center mt-5"><Spinner /></Container>;
  }

  if (status === 'unauthenticated' || (session?.user as any)?.role !== 'ADMIN') {
    return <Container className="mt-5"><Alert variant="danger">Access Denied</Alert></Container>;
  }

  return (
    <Container className="mt-4">
      <h1>Edit User</h1>
      <Card>
        <Card.Body>
          {user ? (
            <Form onSubmit={handleSubmit}>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form.Group className="mb-3">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  type="text"
                  value={user.username}
                  onChange={e => setUser({ ...user, username: e.target.value })}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  value={user.password}
                  onChange={e => setUser({ ...user, password: e.target.value })}
                  placeholder="Leave blank to keep current password"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Role</Form.Label>
                <Form.Select value={user.role} onChange={e => setUser({ ...user, role: e.target.value as Role })}>
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </Form.Select>
              </Form.Group>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? <Spinner size="sm" /> : 'Update User'}
              </Button>
              <Button variant="secondary" onClick={() => router.back()} className="ms-2">
                Cancel
              </Button>
            </Form>
          ) : (
            <Alert variant="warning">User not found.</Alert>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}
