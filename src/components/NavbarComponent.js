// src/components/NavbarComponent.js
import React from 'react';
import { Navbar, Container } from 'react-bootstrap';

const NavbarComponent = () => (
  <Navbar bg="primary" variant="dark" className="navbar">
    <Container>
      <Navbar.Brand>Train and Bus Tracker</Navbar.Brand>
    </Container>
  </Navbar>
);

export default NavbarComponent;
