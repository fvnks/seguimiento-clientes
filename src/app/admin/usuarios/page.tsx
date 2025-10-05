'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, FormEvent } from 'react';
import { Container, Alert, Spinner, Table, Button, Form, Card, Row, Col, Modal } from 'react-bootstrap';
import { Role } from '@/generated/prisma/client';
import Link from 'next/link';

interface User {
  id: number;
  username: string;
  role: Role;
  createdAt: string;
}

export default function UserManagementPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<Role>('USER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && (session?.user as any)?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [status, session]);

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, password: newPassword, role: newRole }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create user');
      }

      setNewUsername('');
      setNewPassword('');
      setNewRole('USER');
      fetchUsers(); // Refresh user list
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setUserToDelete(null);
    setShowDeleteModal(false);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const res = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }

      fetchUsers(); // Refresh user list
      closeDeleteModal();
    } catch (err: any) {
      // Display error in modal or as a toast in a real app
      console.error(err.message);
      alert(err.message); // Simple alert for now
    }
  };

  if (status === 'loading') {
    return <Container className="text-center mt-5"><Spinner /></Container>;
  }

  if (status === 'unauthenticated' || (session?.user as any)?.role !== 'ADMIN') {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          <h1>Access Denied</h1>
          <p>You do not have permission to view this page.</p>
        </Alert>
      </Container>
    );
  }

  return (
    <>
      <Container className="mt-4">
        <h1>User Management</h1>
        
        <Row>
          <Col lg={8}>
            <Card className="mb-4">
              <Card.Header>Existing Users</Card.Header>
              <Card.Body>
                {isLoading ? (
                  <Spinner />
                ) : error ? (
                  <Alert variant="danger">{error}</Alert>
                ) : (
                  <Table striped bordered hover responsive>
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Created At</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.id}>
                          <td>{user.username}</td>
                          <td>{user.role}</td>
                          <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td>
                            <Link href={`/admin/usuarios/${user.id}/editar`} passHref>
                              <Button variant="outline-primary" size="sm" className="me-2">Edit</Button>
                            </Link>
                            <Button variant="outline-danger" size="sm" onClick={() => openDeleteModal(user)} disabled={(session?.user as any)?.id === user.id}>
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Col>
          <Col lg={4}>
            <Card>
              <Card.Header>Create New User</Card.Header>
              <Card.Body>
                <Form onSubmit={handleCreateUser}>
                  {formError && <Alert variant="danger">{formError}</Alert>}
                  <Form.Group className="mb-3">
                    <Form.Label>Username</Form.Label>
                    <Form.Control type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} required />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <Form.Control type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Role</Form.Label>
                    <Form.Select value={newRole} onChange={e => setNewRole(e.target.value as Role)}>
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </Form.Select>
                  </Form.Group>
                  <Button type="submit" variant="primary" disabled={isSubmitting}>
                    {isSubmitting ? <Spinner size="sm" /> : 'Create User'}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={closeDeleteModal}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the user <strong>{userToDelete?.username}</strong>?
          This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeDeleteModal}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteUser}>Delete User</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
