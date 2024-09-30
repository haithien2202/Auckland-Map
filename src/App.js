import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import { Container, Row, Col, Modal, Button } from 'react-bootstrap';
import StationMarker from './components/StationMarker'; 
import MeasureAndEditEvents from './components/MeasureAndEditEvents';
import NavbarComponent from './components/NavbarComponent';
import PanelComponent from './components/PanelComponent';
import ModalComponent from './components/ModalComponent';
import useFetchStations from './hooks/FetchStations';
import { calculateDistanceInFeet } from './utils/calculateDistance';

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
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false); // Track delete confirmation
  const [stopToDelete, setStopToDelete] = useState(null); // Track the stop to delete
  const [draggingMap, setDraggingMap] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [newStop, setNewStop] = useState(null);
  const [stopName, setStopName] = useState('');

  // Utility to sync data between tabs using localStorage
  const updateLocalStorage = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  const handleStorageChange = useCallback((event) => {
    if (event.key === 'busStopData') {
      const updatedBusStops = JSON.parse(event.newValue);
      setBusStop(updatedBusStops);
    }

    if (event.key === 'trainStationData') {
      const updatedTrainStations = JSON.parse(event.newValue);
      setTrainStation(updatedTrainStations);
    }
  }, [setBusStop, setTrainStation]);

  useEffect(() => {
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [handleStorageChange]);

  useEffect(() => {
    updateLocalStorage('busStopData', busStop);
  }, [busStop]);

  useEffect(() => {
    updateLocalStorage('trainStationData', trainStation);
  }, [trainStation]);

  const addStation = (latlng) => {
    const newStopData = {
      OBJECTID: Math.random(),  // Generate a temporary unique identifier
      STOPLAT: latlng.lat,
      STOPLON: latlng.lng,
      STOPNAME: '',  // Stop name will be provided by the user in the modal
    };

    setNewStop(newStopData);
    setStopName('');
    setShowModal(true);
    setAddMode(false);
  };

  const handleSaveStop = () => {
    const stopData = {
      stopName: stopName,
      lat: newStop.STOPLAT,
      lon: newStop.STOPLON,
      stopType: selectedStationType,
    };

    fetch('http://127.0.0.1:5000/save-stop', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stopData),
    })
      .then(response => response.json())
      .then(data => {
        if (data.type === "Feature") {
          const updatedStop = {
            ...newStop,
            STOPNAME: stopName,
            STOPLAT: data.properties.STOPLAT,
            STOPLON: data.properties.STOPLON,
            OBJECTID: data.properties.OBJECTID,
          };
          if (selectedStationType === 'busStops') {
            setBusStop(prevStops => [...prevStops, updatedStop]);
            updateLocalStorage('busStopData', [...busStop, updatedStop]);
          } else {
            setTrainStation(prevStations => [...prevStations, updatedStop]);
            updateLocalStorage('trainStationData', [...trainStation, updatedStop]);
          }
          setNewStop(null);
          setShowModal(false);
        } else {
          console.error('Failed to save the stop:', data.error);
        }
      })
      .catch(error => {
        console.error('Error:', error);
      });
  };

  const handleCancelStop = () => {
    setNewStop(null);
    setShowModal(false);
  };

  const addMeasurementPoint = useCallback((latlng) => {
    setPoints((prevPoints) => {
      if (prevPoints.length < 2) {
        return [...prevPoints, latlng];
      }
      return prevPoints;
    });
  }, []);

  useEffect(() => {
    if (points.length === 2) {
      const dist = calculateDistanceInFeet(points[0], points[1]);
      if (dist > 0) {
        setMeasurements([...measurements, { points, distance: dist }]);
      }
      setPoints([]);
    }
  }, [points, measurements]);

  // Update bus stop or train station on drag end
  const handleMarkerDragEnd = useCallback((station, newPosition) => {
    const updatedStops = (selectedStationType === 'busStops') 
      ? busStop.map((stop) => stop.OBJECTID === station.OBJECTID
        ? { ...stop, STOPLAT: newPosition.lat, STOPLON: newPosition.lng }
        : stop)
      : trainStation.map((stop) => stop.OBJECTID === station.OBJECTID
        ? { ...stop, STOPLAT: newPosition.lat, STOPLON: newPosition.lng }
        : stop);

    if (selectedStationType === 'busStops') {
      setBusStop(updatedStops);
      updateLocalStorage('busStopData', updatedStops);
    } else {
      setTrainStation(updatedStops);
      updateLocalStorage('trainStationData', updatedStops);
    }

    // Send updated location to backend
    const updatedStopData = {
      OBJECTID: station.OBJECTID,
      STOPLAT: newPosition.lat,
      STOPLON: newPosition.lng,
      stopType: selectedStationType
    };

    fetch('http://127.0.0.1:5000/update-stop-location', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedStopData),
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log(`${selectedStationType} location updated successfully.`);
      } else {
        console.error('Failed to update stop location:', data.message);
      }
    })
    .catch(error => {
      console.error('Error updating stop location:', error);
    });

    setDraggingMap(true); // Re-enable map dragging
  }, [busStop, trainStation, selectedStationType, setBusStop, setTrainStation]);

  const handleMarkerDragStart = useCallback(() => {
    setDraggingMap(false);
  }, []);

  const handleDeleteStop = (station) => {
    setStopToDelete(station);  // Store the stop to be deleted
    setShowDeleteConfirmation(true);  // Show confirmation modal
  };

  const confirmDeleteStop = () => {
    if (!stopToDelete) return;

    const deleteData = {
      STOPCODE: stopToDelete.STOPCODE,  // Use STOPCODE to identify stop
      stopType: selectedStationType,
    };

    // Send a DELETE request to the backend
    fetch('http://127.0.0.1:5000/delete-stop', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deleteData),
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log('Stop deleted successfully.');

        // Remove the stop from the frontend state
        if (selectedStationType === 'busStops') {
          setBusStop(busStop.filter(stop => stop.OBJECTID !== stopToDelete.OBJECTID));
        } else {
          setTrainStation(trainStation.filter(stop => stop.OBJECTID !== stopToDelete.OBJECTID));
        }

        setStopToDelete(null);
        setShowDeleteConfirmation(false);  // Close confirmation modal
      } else {
        console.error('Failed to delete stop:', data.message);
      }
    })
    .catch(error => {
      console.error('Error deleting stop:', error);
    });
  };

  const cancelDeleteStop = () => {
    setStopToDelete(null);  // Clear the stop to delete
    setShowDeleteConfirmation(false);  // Close confirmation modal
  };

  const renderStations = useMemo(() => {
    if (selectedStationType === 'busStops') {
      return busStop.map((station) => (
        <StationMarker
          key={station.OBJECTID}
          station={station}
          iconType="busStopIcon"
          measureActive={measureActive}
          moveMode={moveMode}
          deleteMode={deleteMode}  // Pass deleteMode to StationMarker
          onDragStart={handleMarkerDragStart}
          onDragEnd={handleMarkerDragEnd}
          onClick={addMeasurementPoint}  // Handle measurement clicks
          onDelete={handleDeleteStop}  // Handle delete clicks
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
          deleteMode={deleteMode}  // Pass deleteMode to StationMarker
          onDragStart={handleMarkerDragStart}
          onDragEnd={handleMarkerDragEnd}
          onClick={addMeasurementPoint}  // Handle measurement clicks
          onDelete={handleDeleteStop}  // Handle delete clicks
        />
      ));
    }
  }, [selectedStationType, busStop, trainStation, measureActive, moveMode, deleteMode, handleMarkerDragStart, handleMarkerDragEnd, addMeasurementPoint]);
  

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
      <Container fluid className="main-content">
        <Row className="h-100">
          <Col xs={2} className="panel">
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
            />
          </Col>

          <Col xs={10} className="map-col">
            <div className="map-container">
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
          </Col>
        </Row>
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
