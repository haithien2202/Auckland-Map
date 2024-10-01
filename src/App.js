import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import { Container, Modal, Button } from 'react-bootstrap';
import StationMarker from './components/StationMarker'; 
import MeasureAndEditEvents from './components/MeasureAndEditEvents';
import NavbarComponent from './components/NavbarComponent';
import PanelComponent from './components/PanelComponent';
import ModalComponent from './components/ModalComponent';
import useFetchStations from './hooks/FetchStations';
import { calculateDistanceInFeet } from './utils/calculateDistance';
import { saveStop, deleteStop, updateStopLocation } from './services/stopService';

function App() {
  const { busStop, trainStation, setBusStop, setTrainStation } = useFetchStations(); 
  const [selectedStationType, setSelectedStationType] = useState('busStops');
  const [measureActive, setMeasureActive] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [moveMode, setMoveMode] = useState(false); 
  const [points, setPoints] = useState([]);
  const [showEditOptions, setShowEditOptions] = useState(false);
  const [measurements, setMeasurements] = useState([]);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [stopToDelete, setStopToDelete] = useState(null);
  const [draggingMap, setDraggingMap] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [newStop, setNewStop] = useState(null);
  const [stopName, setStopName] = useState('');
  const [selectedStop, setSelectedStop] = useState(null);

  // Clear selected stop info
  const handleClearStop = () => {
    setSelectedStop(null);
  };

  // Adding a new station
  const addStation = (latlng) => {
    const newStopData = {
      OBJECTID: Math.random(),  
      STOPLAT: latlng.lat,
      STOPLON: latlng.lng,
      STOPNAME: '',  
    };
    setNewStop(newStopData);
    setStopName('');
    setShowModal(true);
    setAddMode(false);
  };

  // Saving the new or edited station
  const handleSaveStop = () => {
    saveStop(newStop, stopName, selectedStationType, setBusStop, setTrainStation, busStop, trainStation)
      .then(success => {
        if (success) {
          setShowModal(false);
          setNewStop(null);
        }
      });
  };

  // Cancel stop editing
  const handleCancelStop = () => {
    setNewStop(null);
    setShowModal(false);
  };

  // Add a measurement point
  const addMeasurementPoint = useCallback((latlng) => {
    setPoints((prevPoints) => {
      if (prevPoints.length < 2) {
        return [...prevPoints, latlng];
      }
      return prevPoints;
    });
  }, []);

  // Calculate the distance between two points
  useEffect(() => {
    if (points.length === 2) {
      const dist = calculateDistanceInFeet(points[0], points[1]);
      if (dist > 0) {
        setMeasurements([...measurements, { points, distance: dist }]);
      }
      setPoints([]);
    }
  }, [points, measurements]);

  // Update station (bus or train) position on drag end and update measurements
  const handleMarkerDragEnd = useCallback((station, newPosition) => {
    const updatedStops = selectedStationType === 'busStops'
      ? busStop.map(stop => stop.OBJECTID === station.OBJECTID
        ? { ...stop, STOPLAT: newPosition.lat, STOPLON: newPosition.lng }
        : stop)
      : trainStation.map(stop => stop.OBJECTID === station.OBJECTID
        ? { ...stop, STOPLAT: newPosition.lat, STOPLON: newPosition.lng }
        : stop);

    if (selectedStationType === 'busStops') {
      setBusStop(updatedStops);
    } else {
      setTrainStation(updatedStops);
    }

    // Update linked measurements
    const updatedMeasurements = measurements.map((measurement) => {
      const updatedPoints = measurement.points.map((point) => {
        if (point.station && point.station.OBJECTID === station.OBJECTID) {
          return newPosition;
        }
        return point;
      });

      // Recalculate the distance for updated points
      const newDistance = calculateDistanceInFeet(updatedPoints[0], updatedPoints[1]);
      return { ...measurement, points: updatedPoints, distance: newDistance };
    });

    setMeasurements(updatedMeasurements);

    // Update stop position on the backend
    updateStopLocation(station, newPosition, selectedStationType)
      .then(() => setDraggingMap(true));
  }, [busStop, trainStation, measurements, selectedStationType, setBusStop, setTrainStation]);

  // Disable map dragging on marker drag start
  const handleMarkerDragStart = useCallback(() => {
    setDraggingMap(false);
  }, []);

  // Delete a station
  const handleDeleteStop = (station) => {
    setStopToDelete(station);
    setShowDeleteConfirmation(true); 
  };

  // Confirm deletion of the station
  const confirmDeleteStop = () => {
    deleteStop(stopToDelete, selectedStationType, setBusStop, setTrainStation, busStop, trainStation)
      .then(success => {
        if (success) {
          // Remove measurements linked to this station
          const updatedMeasurements = measurements.filter((measurement) => {
            return !measurement.points.some(point => point.station && point.station.OBJECTID === stopToDelete.OBJECTID);
          });
  
          setMeasurements(updatedMeasurements);
          setStopToDelete(null);
          setShowDeleteConfirmation(false);
        }
      });
  };

  // Cancel the delete confirmation modal
  const cancelDeleteStop = () => {
    setStopToDelete(null);
    setShowDeleteConfirmation(false);  
  };

  // Render stations (bus stops or train stations)
  const renderStations = useMemo(() => {
    if (selectedStationType === 'busStops') {
      return busStop.map((station) => (
        <StationMarker
          key={station.OBJECTID}
          station={station}
          iconType="busStopIcon"
          measureActive={measureActive}
          moveMode={moveMode}
          deleteMode={deleteMode}
          onDragStart={handleMarkerDragStart}
          onDragEnd={handleMarkerDragEnd}
          onClick={addMeasurementPoint}
          onDelete={handleDeleteStop}
          onSelectStop={setSelectedStop}  // Pass selected stop handler
        />
      ));
    } else if (selectedStationType === 'trainStations') {
      return trainStation.map((station) => (
        <StationMarker
          key={station.OBJECTID}
          station={station}
          iconType="trainStationIcon"
          measureActive={measureActive}
          moveMode={moveMode}
          deleteMode={deleteMode}
          onDragStart={handleMarkerDragStart}
          onDragEnd={handleMarkerDragEnd}
          onClick={addMeasurementPoint}
          onDelete={handleDeleteStop}
          onSelectStop={setSelectedStop}  // Pass selected stop handler
        />
      ));
    }
  }, [selectedStationType, busStop, trainStation, measureActive, moveMode, deleteMode, handleMarkerDragStart, handleMarkerDragEnd, addMeasurementPoint]);


  const handleCancelMode = () => {
    setMoveMode(false);
    setDeleteMode(false);
    setAddMode(false);
  };

  // Handling different modes (Measure, Add, Move, Delete)
  const handleMeasureToggle = () => {
    setMeasureActive(!measureActive);
    setMoveMode(false);
    setDeleteMode(false);
    setAddMode(false);
  };

  const handleEditToggle = () => {
    setMoveMode(!moveMode);
    setAddMode(false);
    setDeleteMode(false);
    setMeasureActive(false);
  };

  const handleAddToggle = () => {
    setAddMode(true);
    setMoveMode(false);
    setDeleteMode(false);
    setMeasureActive(false);
    setShowEditOptions(false);
  };

  const handleMoveToggle = () => {
    setMoveMode(true);
    setAddMode(false);
    setDeleteMode(false);
    setMeasureActive(false);
    setShowEditOptions(false);
  };

  const handleDeleteToggle = () => {
    setDeleteMode(true);
    setMoveMode(false);
    setAddMode(false);
    setMeasureActive(false);
    setShowEditOptions(false);
  };

  // Control dragging of the map during marker drag
  const MapEvents = () => {
    const map = useMap();

    useEffect(() => {
      if (!draggingMap) {
        map.dragging.disable();
      } else {
        map.dragging.enable();
      }
    }, [map]);

    return null;
  };

  return (
    <div className="App">
      <NavbarComponent />
      <Container fluid className="main-content d-flex">
        {/* Panel on the left side */}
        <PanelComponent
          selectedStationType={selectedStationType}
          setSelectedStationType={setSelectedStationType}
          measureActive={measureActive}
          addMode={addMode}
          moveMode={moveMode}
          deleteMode={deleteMode}
          handleMeasureToggle={handleMeasureToggle}
          handleEditToggle={handleEditToggle}
          handleAddToggle={handleAddToggle}
          handleMoveToggle={handleMoveToggle}
          handleDeleteToggle={handleDeleteToggle}
          showEditOptions={showEditOptions}
          selectedStop={selectedStop}
          handleClearStop={handleClearStop} 
          handleCancelModes={handleCancelMode}
        />

        {/* Map on the right side */}
        <div className="map-container flex-grow-1">
          <MapContainer center={[-36.8485, 174.7633]} zoom={10} scrollWheelZoom={true} className="map">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapEvents />

            <MeasureAndEditEvents 
              addMode={addMode} 
              measureActive={measureActive} 
              addStation={addStation} 
              addMeasurementPoint={addMeasurementPoint}
            />

            {measurements.map((measurement, index) => (
              <Polyline
                key={index}
                positions={measurement.points}
                color="red"
                eventHandlers={{
                  dblclick: () => setMeasurements(measurements.filter((_, i) => i !== index)),
                }}
              >
                <Tooltip permanent>
                  Distance: {measurement.distance} ft
                </Tooltip>
              </Polyline>
            ))}

            {renderStations}
          </MapContainer>
        </div>
      </Container>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteConfirmation} onHide={cancelDeleteStop}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this stop?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cancelDeleteStop}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDeleteStop}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      <ModalComponent
        showModal={showModal}
        stopName={stopName}
        setStopName={setStopName}
        handleCancelStop={handleCancelStop}
        handleSaveStop={handleSaveStop}
      />
    </div>
  );
}

export default App;
