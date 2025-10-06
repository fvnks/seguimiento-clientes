'use client';

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, ListGroup } from 'react-bootstrap';

// Define types
interface Announcement {
  id: number;
  content: string;
  createdAt: string;
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
  // State for announcements
  const [announcementContent, setAnnouncementContent] = useState('');
  const [activeAnnouncement, setActiveAnnouncement] = useState<Announcement | null>(null);
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [announcementError, setAnnouncementError] = useState('');

  // State for news
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsList, setNewsList] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState('');

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      // Fetch latest announcement
      try {
        const res = await fetch('/api/announcements/latest');
        const data = await res.json();
        if (res.ok) {
          setActiveAnnouncement(data);
        }
      } catch (error) { console.error(error); }

      // Fetch news articles
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
    fetchInitialData();
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
        setActiveAnnouncement(data);
        setAnnouncementContent('');
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
      } else {
        setNewsError(newArticle.error || 'Error al publicar noticia');
      }
    } catch (error: any) {
      setNewsError(error.message);
    } finally {
      setNewsLoading(false);
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
              <Card.Text>El anuncio se mostrará como una notificación a todos los usuarios. El envío de un nuevo anuncio desactivará el anterior.</Card.Text>
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
              <h5>Anuncio Activo Actual</h5>
              {activeAnnouncement ? (
                <Alert variant="info">{activeAnnouncement.content}</Alert>
              ) : (
                <Alert variant="secondary">No hay ningún anuncio activo.</Alert>
              )}
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
