// src/components/PanelComponent.js
import React from 'react';
import { Form, Button, Dropdown, ButtonGroup } from 'react-bootstrap';

const PanelComponent = ({
  selectedStationType,
  setSelectedStationType,
  measureActive,
  addMode,
  handleMeasureToggle,
  handleEditToggle,
  handleAddToggle,
  handleMoveToggle,
}) => (
  <div className="panel">
    <Form.Group controlId="stationTypeSelect" className="mb-3">
      <Form.Label>Select Station Type</Form.Label>
      <Form.Control
        as="select"
        value={selectedStationType}
        onChange={(e) => setSelectedStationType(e.target.value)}
      >
        <option value="busStops">Bus Stops</option>
        <option value="trainStations">Train Stations</option>
      </Form.Control>
    </Form.Group>

    <div className="d-flex justify-content-between mt-4">
      <Button variant={measureActive ? 'danger' : 'primary'} onClick={handleMeasureToggle}>
        {measureActive ? 'Cancel Measure' : 'Measure'}
      </Button>

      <Dropdown as={ButtonGroup}>
        <Button variant={addMode ? 'danger' : 'secondary'} onClick={handleEditToggle}>
          {addMode ? 'Cancel' : 'Edit'}
        </Button>

        <Dropdown.Toggle split variant="secondary" id="dropdown-split-basic" />

        <Dropdown.Menu>
          <Dropdown.Item onClick={handleAddToggle}>Add</Dropdown.Item>
          <Dropdown.Item onClick={handleMoveToggle}>Move</Dropdown.Item>
          <Dropdown.Item onClick={() => alert('Delete functionality is not yet implemented.')}>
            Delete
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </div>
  </div>
);

export default PanelComponent;
