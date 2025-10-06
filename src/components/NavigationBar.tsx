/* eslint-disable prettier/prettier */
'use client';

import { Container, Nav, Navbar, NavDropdown, Button } from "react-bootstrap";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { FaBullhorn, FaUsers, FaBoxOpen, FaTags, FaCalendarAlt, FaChartBar, FaShoppingCart, FaCog, FaUserShield, FaUserCircle } from 'react-icons/fa';

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
            <Nav className="align-items-center">
              {status === 'authenticated' ? (
                <>
                  {isAdmin && (
                    <>
                      <Nav.Link as={Link} href="/admin/comunicaciones" className="d-flex align-items-center">
                        <FaBullhorn className="me-2" /> Comunicaciones
                      </Nav.Link>
                      <NavDropdown title={<FaUserShield />} id="admin-dropdown" align="end">
                        <NavDropdown.Item as={Link} href="/admin/usuarios">Gestionar Usuarios</NavDropdown.Item>
                      </NavDropdown>
                    </>
                  )}
                  
                  <NavDropdown title={<><FaUserCircle className="me-1" /> {session.user.name}</>} id="user-dropdown" align="end">
                    <NavDropdown.Item as={Link} href="/perfil">Mi Perfil</NavDropdown.Item>
                    <NavDropdown.Item as={Link} href="/configuracion">Configuración</NavDropdown.Item>
                  </NavDropdown>

                  <Button variant="outline-primary" onClick={() => signOut({ callbackUrl: '/login' })} className="ms-3">
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