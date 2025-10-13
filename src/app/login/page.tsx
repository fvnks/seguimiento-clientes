import { Suspense } from 'react';
import LoginForm from '@/components/LoginForm';
import { Container, Spinner } from 'react-bootstrap';

export default function LoginPage() {
  return (
    <Suspense fallback={<Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}><Spinner animation="border" /></Container>}>
      <LoginForm />
    </Suspense>
  );
}
