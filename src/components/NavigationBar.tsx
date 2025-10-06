/* eslint-disable prettier/prettier */
'use client';

import { Container, Nav, Navbar, NavDropdown, Button } from "react-bootstrap";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { FaBullhorn, FaUsers, FaBoxOpen, FaTags, FaCalendarAlt, FaChartBar, FaShoppingCart, FaCog, FaUserShield } from 'react-icons/fa';

export default function NavigationBar() {
  const { data: session, status } = useSession();
  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  return (
    <Navbar variant="light" expand="lg" sticky="top">
      <div className="navbar-glass shadow rounded-bar w-100">
        <Container>
          <Navbar.Brand as={Link} href="/"><strong>Gestor de Clientes</strong></Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              {status === 'authenticated' && (
                <>
                  <Nav.Link as={Link} href="/clientes" className="d-flex align-items-center">
                    <FaUsers className="me-2" /> Clientes
                  </Nav.Link>
                  <Nav.Link as={Link} href="/productos" className="d-flex align-items-center">
                    <FaBoxOpen className="me-2" /> Productos
                  </Nav.Link>
                  <Nav.Link as={Link} href="/categorias" className="d-flex align-items-center">
                    <FaTags className="me-2" /> Categorías
                  </Nav.Link>
                  <Nav.Link as={Link} href="/ventas" className="d-flex align-items-center">
                    <FaShoppingCart className="me-2" /> Ventas
                  </Nav.Link>
                  <Nav.Link as={Link} href="/calendario" className="d-flex align-items-center">
                    <FaCalendarAlt className="me-2" /> Calendario
                  </Nav.Link>
                  <Nav.Link as={Link} href="/reportes" className="d-flex align-items-center">
                    <FaChartBar className="me-2" /> Reportes
                  </Nav.Link>
                </>
              )}
            </Nav>
            <Nav>
              {status === 'authenticated' ? (
                <>
                  {isAdmin && (
                    <NavDropdown title={<><FaUserShield className="me-2" /> Admin</>} id="admin-dropdown">
                      <NavDropdown.Item as={Link} href="/admin/usuarios">User Management</NavDropdown.Item>
                      <NavDropdown.Item as={Link} href="/admin/comunicaciones"><FaBullhorn className="me-2" /> Comunicaciones</NavDropdown.Item>
                    </NavDropdown>
                  )}
                  <Nav.Link as={Link} href="/configuracion" className="d-flex align-items-center">
                    <FaCog className="me-2" /> Configuración
                  </Nav.Link>
                  <Button variant="outline-primary" onClick={() => signOut({ callbackUrl: '/login' })} className="ms-2">
                    Logout
                  </Button>
                </>
              ) : (
                <Link href="/login" passHref>
                  <Button variant="primary">Login</Button>
                </Link>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </div>
    </Navbar>
  );
}