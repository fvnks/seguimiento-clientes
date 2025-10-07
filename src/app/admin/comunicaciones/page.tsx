'use client';

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, ListGroup, Modal } from 'react-bootstrap';
import { useRouter } from 'next/navigation';

// Define types
interface Announcement {
  id: number;
  content: string;
  createdAt: string;
  isActive: boolean;
}

interface NewsArticle {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  author: {
    username: string;
  };
}

export default function CommunicationsPage() {
  const router = useRouter();
  // State for announcements
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [announcementError, setAnnouncementError] = useState('');

  // State for news
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsList, setNewsList] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState('');

  // State for editing
  const [editingNews, setEditingNews] = useState<NewsArticle | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/admin/announcements');
      const data = await res.json();
      if (res.ok) {
        setAnnouncements(data);
      } else {
        setAnnouncementError(data.error || 'Error al cargar anuncios');
      }
    } catch (error: any) { setAnnouncementError(error.message); }
  };

  const fetchNews = async () => {
    try {
      setNewsLoading(true);
      const res = await fetch('/api/news');
      const data = await res.json();
      if (res.ok) {
        setNewsList(data);
      } else {
        setNewsError(data.error || 'Error al cargar noticias');
      }
    } catch (error: any) {
      setNewsError(error.message);
    } finally {
      setNewsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    fetchNews();
  }, []);

  const handleAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnnouncementLoading(true);
    setAnnouncementError('');
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: announcementContent }),
      });
      const data = await res.json();
      if (res.ok) {
        setAnnouncementContent('');
        fetchAnnouncements(); // Refresh list
      } else {
        setAnnouncementError(data.error || 'Error al enviar anuncio');
      }
    } catch (error: any) {
      setAnnouncementError(error.message);
    } finally {
      setAnnouncementLoading(false);
    }
  };

  const handleNewsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewsLoading(true);
    setNewsError('');
    try {
      const res = await fetch('/api/admin/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newsTitle, content: newsContent }),
      });
      const newArticle = await res.json();
      if (res.ok) {
        setNewsList([newArticle, ...newsList]);
        setNewsTitle('');
        setNewsContent('');
        fetchNews(); // Refresh list
      } else {
        setNewsError(newArticle.error || 'Error al publicar noticia');
      }
    } catch (error: any) {
      setNewsError(error.message);
    } finally {
      setNewsLoading(false);
    }
  };

  const handleDeleteNews = async (id: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta noticia?')) {
      try {
        const res = await fetch(`/api/admin/news/${id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchNews(); // Refresh list
        } else {
          const data = await res.json();
          setNewsError(data.error || 'Error al eliminar la noticia');
        }
      } catch (error: any) {
        setNewsError(error.message);
      }
    }
  };

  const handleDeleteAnnouncement = async (id: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar este anuncio?')) {
      try {
        const res = await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchAnnouncements(); // Refresh list
        } else {
          const data = await res.json();
          setAnnouncementError(data.error || 'Error al eliminar el anuncio');
        }
      } catch (error: any) {
        setAnnouncementError(error.message);
      }
    }
  };

  const handleSetActive = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      });
      if (res.ok) {
        fetchAnnouncements();
      } else {
        const data = await res.json();
        setAnnouncementError(data.error || 'Error al activar el anuncio');
      }
    } catch (error: any) {
      setAnnouncementError(error.message);
    }
  };

  return (
    <Container className="mt-4">
      <h1>Gestión de Comunicaciones</h1>
      <Row className="g-4 mt-2">
        {/* Announcements Section */}
        <Col md={6}>
          <Card>
            <Card.Header as="h5">Anuncios Globales</Card.Header>
            <Card.Body>
              <Card.Title>Enviar un nuevo anuncio</Card.Title>
              <Form onSubmit={handleAnnouncementSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Contenido del Anuncio</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={announcementContent}
                    onChange={(e) => setAnnouncementContent(e.target.value)}
                    required
                  />
                </Form.Group>
                {announcementError && <Alert variant="danger">{announcementError}</Alert>}
                <Button type="submit" disabled={announcementLoading}>
                  {announcementLoading ? <Spinner as="span" size="sm" animation="border" /> : 'Enviar Anuncio'}
                </Button>
              </Form>
              <hr />
              <h5>Anuncios Creados</h5>
              <ListGroup>
                {announcements.map(ann => (
                  <ListGroup.Item key={ann.id} variant={ann.isActive ? 'success' : ''}>
                    {ann.content}
                    <div className="mt-2">
                      <Button variant="outline-primary" size="sm" onClick={() => router.push(`/admin/comunicaciones/announcements/${ann.id}/editar`)}>Editar</Button>{' '}
                      <Button variant="outline-danger" size="sm" onClick={() => handleDeleteAnnouncement(ann.id)}>Eliminar</Button>{' '}
                      {!ann.isActive && <Button variant="outline-success" size="sm" onClick={() => handleSetActive(ann.id)}>Activar</Button>}
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>

        {/* News Section */}
        <Col md={6}>
          <Card>
            <Card.Header as="h5">Noticias del Inicio</Card.Header>
            <Card.Body>
              <Card.Title>Publicar una nueva noticia</Card.Title>
              <Form onSubmit={handleNewsSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Título</Form.Label>
                  <Form.Control
                    type="text"
                    value={newsTitle}
                    onChange={(e) => setNewsTitle(e.target.value)}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Contenido</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    value={newsContent}
                    onChange={(e) => setNewsContent(e.target.value)}
                    required
                  />
                </Form.Group>
                {newsError && <Alert variant="danger">{newsError}</Alert>}
                <Button type="submit" disabled={newsLoading}>
                  {newsLoading ? <Spinner as="span" size="sm" animation="border" /> : 'Publicar Noticia'}
                </Button>
              </Form>
              <hr />
              <h5>Noticias Publicadas</h5>
              {newsLoading && <Spinner animation="border" size="sm" />}
              <ListGroup>
                {newsList.map(article => (
                  <ListGroup.Item key={article.id}>
                    <strong>{article.title}</strong>
                    <small className="d-block text-muted">Publicado el {new Date(article.createdAt).toLocaleDateString()}</small>
                    <div className="mt-2">
                      <Button variant="outline-primary" size="sm" onClick={() => router.push(`/admin/comunicaciones/news/${article.id}/editar`)}>Editar</Button>{' '}
                      <Button variant="outline-danger" size="sm" onClick={() => handleDeleteNews(article.id)}>Eliminar</Button>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
