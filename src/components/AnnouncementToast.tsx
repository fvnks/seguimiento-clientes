'use client';

import { useState, useEffect } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

interface Announcement {
  id: number;
  content: string;
}

export default function AnnouncementToast() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    fetch('/api/announcements/latest')
      .then(res => res.json())
      .then(data => {
        if (data && data.id) {
          const dismissed = sessionStorage.getItem(`announcement_${data.id}_dismissed`);
          if (!dismissed) {
            setAnnouncement(data);
            setShow(true);
          }
        }
      })
      .catch(err => console.error("Error fetching announcement:", err));
  }, []);

  const handleClose = () => {
    if (announcement) {
      sessionStorage.setItem(`announcement_${announcement.id}_dismissed`, 'true');
    }
    setShow(false);
  };

  if (!announcement || !show) {
    return null;
  }

  return (
    <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1050 }}>
      <Toast show={show} onClose={handleClose} bg="info" autohide delay={15000}>
        <Toast.Header closeButton>
          <strong className="me-auto">Anuncio Importante</strong>
        </Toast.Header>
        <Toast.Body className="text-white">{announcement.content}</Toast.Body>
      </Toast>
    </ToastContainer>
  );
}
