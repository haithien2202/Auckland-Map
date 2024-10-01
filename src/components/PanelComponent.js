import React, { useState } from 'react';
import { Form, Button, Dropdown, ButtonGroup } from 'react-bootstrap';

const PanelComponent = ({
  selectedStationType,
  setSelectedStationType,
  measureActive,
  addMode,
  moveMode,
  deleteMode,
  handleMeasureToggle,
  handleAddToggle,
  handleMoveToggle,
  handleDeleteToggle,
  handleCancelModes, // Ensure this is passed from parent
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const toggleDropdown = () => {
    if (addMode || moveMode || deleteMode) {
      handleCancelModes(); // Cancel modes if active
    } else {
      setShowDropdown((prevShowDropdown) => !prevShowDropdown); // Toggle dropdown visibility
    }
  };

  return (
    <div className="panel d-flex flex-column" style={{ width: '300px', height: '100vh' }}>
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

      <div className="mt-auto">
        <Button
          variant={measureActive ? 'danger' : 'primary'}
          onClick={handleMeasureToggle}
          className="w-100 mb-2"
        >
          {measureActive ? 'Cancel Measure' : 'Measure'}
        </Button>

        {addMode || moveMode || deleteMode ? (
          // Normal cancel button when in add/move/delete mode
          <Button
            variant="danger"
            className="w-100"
            onClick={() => {
              handleCancelModes(); // Reset modes on cancel
              setShowDropdown(false); // Ensure dropdown is closed
            }}
          >
            Cancel
          </Button>
        ) : (
          // Dropdown button when no edit mode is active
          <Dropdown
            as={ButtonGroup}
            className="w-100 dropup"
            show={showDropdown}
            onToggle={() => setShowDropdown(false)} // Close dropdown on outside click
          >
            <Dropdown.Toggle
              variant="secondary"
              id="dropdown-button-drop-up"
              className="w-100"
              onClick={toggleDropdown}
            >
              Edit
            </Dropdown.Toggle>

            <Dropdown.Menu className="dropdown-menu-right" style={{ right: '0', left: 'auto' }}>
              <Dropdown.Item onClick={() => { handleAddToggle(); setShowDropdown(false); }}>
                Add
              </Dropdown.Item>
              <Dropdown.Item onClick={() => { handleMoveToggle(); setShowDropdown(false); }}>
                Move
              </Dropdown.Item>
              <Dropdown.Item onClick={() => { handleDeleteToggle(); setShowDropdown(false); }}>
                Delete
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        )}
      </div>
    </div>
  );
};

export default PanelComponent;
