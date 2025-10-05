'use client';

import { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "moment/locale/es"; // Import Spanish locale for moment
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Container, Modal, Button, Spinner, Alert } from "react-bootstrap";

// Setup the localizer by providing the moment Object
moment.locale("es"); // Set moment to Spanish
const localizer = momentLocalizer(moment);

// Define types
interface Venta {
  id: number;
  monto: number;
  fecha: string;
  descripcion: string | null;
  cliente: {
    nombre: string;
  };
}

interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  resource: Venta; // The original sale object
}

export default function CalendarioPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchVentas = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/ventas");
        if (!res.ok) {
          throw new Error("Error al obtener las ventas");
        }
        const ventas: Venta[] = await res.json();
        
        const calendarEvents = ventas.map((venta) => ({
          title: `${venta.cliente.nombre} - ${new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(venta.monto)}`,
          start: new Date(venta.fecha),
          end: new Date(venta.fecha),
          resource: venta,
        }));
        setEvents(calendarEvents);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVentas();
  }, []);

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
  };
  
  const calendarMessages = {
    allDay: 'Todo el día',
    previous: 'Anterior',
    next: 'Siguiente',
    today: 'Hoy',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    agenda: 'Agenda',
    date: 'Fecha',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'No hay eventos en este rango.',
    showMore: (total: number) => `+ Ver más (${total})`
  };

  if (isLoading) {
    return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
  }

  if (error) {
    return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;
  }

  return (
    <Container className="mt-4">
      <h1>Calendario de Ventas</h1>
      <div style={{ height: "70vh" }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          onSelectEvent={handleSelectEvent}
          messages={calendarMessages}
        />
      </div>

      {selectedEvent && (
        <Modal show={showModal} onHide={handleCloseModal}>
          <Modal.Header closeButton>
            <Modal.Title>Detalle de la Venta</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p><strong>Cliente:</strong> {selectedEvent.resource.cliente.nombre}</p>
            <p><strong>Monto:</strong> {new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(selectedEvent.resource.monto)}</p>
            <p><strong>Fecha:</strong> {moment(selectedEvent.start).format("LL")}</p>
            <p><strong>Descripción:</strong> {selectedEvent.resource.descripcion || "Sin descripción"}</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cerrar
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </Container>
  );
}
