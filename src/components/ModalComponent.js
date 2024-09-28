// src/components/ModalComponent.js
import React from 'react';
import { Modal, Form, Button } from 'react-bootstrap';

const ModalComponent = ({ showModal, stopName, setStopName, handleCancelStop, handleSaveStop }) => (
  <Modal show={showModal} onHide={handleCancelStop}>
    <Modal.Header closeButton>
      <Modal.Title>Edit Stop Name</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <Form.Group controlId="stopName">
        <Form.Label>Stop Name</Form.Label>
        <Form.Control
          type="text"
          value={stopName}
          onChange={(e) => setStopName(e.target.value)}
        />
      </Form.Group>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={handleCancelStop}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSaveStop}>
        Save Stop
      </Button>
    </Modal.Footer>
  </Modal>
);

export default ModalComponent;
