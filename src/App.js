import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import { calculateDistanceInFeet } from './utils/calculateDistance';
import { Container, Row, Col } from 'react-bootstrap';
import StationMarker from './components/StationMarker'; 
import MeasureAndEditEvents from './components/MeasureAndEditEvents';
import NavbarComponent from './components/NavbarComponent';
import PanelComponent from './components/PanelComponent';
import ModalComponent from './components/ModalComponent';
import useFetchStations from './hooks/FetchStations'; 

function App() {
  const { busStop, trainStation, setBusStop, setTrainStation } = useFetchStations(); 
  const [selectedStationType, setSelectedStationType] = useState('busStops');
  const [measureActive, setMeasureActive] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [moveMode, setMoveMode] = useState(false); 
  const [points, setPoints] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [showEditOptions, setShowEditOptions] = useState(false);
  const [draggingMap, setDraggingMap] = useState(true); // Track if the map should be draggable

  const [showModal, setShowModal] = useState(false);
  const [newStop, setNewStop] = useState(null);
  const [stopName, setStopName] = useState('');

  const addStation = (latlng) => {
    const stopType = selectedStationType === 'busStops' ? 'Bus Stop' : 'Train Station';
    const newStopData = {
      OBJECTID: Math.random(),
      STOPLAT: latlng.lat,
      STOPLON: latlng.lng,
      STOPNAME: `New ${stopType}`,
      STOPDESC: `Added on ${new Date().toLocaleDateString()}`,
    };

    setNewStop(newStopData);
    setStopName(`New ${stopType}`);
    setShowModal(true);
    setAddMode(false);
  };

  const handleSaveStop = () => {
    if (selectedStationType === 'busStops') {
      setBusStop([...busStop, { ...newStop, STOPNAME: stopName }]); 
    } else {
      setTrainStation([...trainStation, { ...newStop, STOPNAME: stopName }]); 
    }
    setNewStop(null);
    setShowModal(false);
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

  const handleMarkerDragEnd = useCallback((station, newPosition) => {
    if (selectedStationType === 'busStops') {
      const updatedBusStops = busStop.map((stop) =>
        stop.OBJECTID === station.OBJECTID
          ? { ...stop, STOPLAT: newPosition.lat, STOPLON: newPosition.lng }
          : stop
      );
      setBusStop(updatedBusStops);
    } else {
      const updatedTrainStations = trainStation.map((stop) =>
        stop.OBJECTID === station.OBJECTID
          ? { ...stop, STOPLAT: newPosition.lat, STOPLON: newPosition.lng }
          : stop
      );
      setTrainStation(updatedTrainStations);
    }
    setDraggingMap(true); // Re-enable map dragging after dragging marker
  }, [busStop, trainStation, selectedStationType, setBusStop, setTrainStation]);

  const handleMarkerDragStart = useCallback(() => {
    setDraggingMap(false); // Disable map dragging when marker drag starts
  }, []);

  const renderStations = useMemo(() => {
    if (selectedStationType === 'busStops') {
      return busStop.map((station) => (
        <StationMarker
          key={station.OBJECTID}
          station={station}
          iconType="busStopIcon"
          measureActive={measureActive}
          moveMode={moveMode}
          onDragStart={handleMarkerDragStart}
          onDragEnd={handleMarkerDragEnd}
          onClick={addMeasurementPoint}
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
          onDragStart={handleMarkerDragStart}
          onDragEnd={handleMarkerDragEnd}
          onClick={addMeasurementPoint}
        />
      ));
    }
  }, [selectedStationType, busStop, trainStation, measureActive, moveMode, handleMarkerDragStart, handleMarkerDragEnd, addMeasurementPoint]);

  const handleMeasureToggle = () => {
    setMeasureActive(!measureActive);
    setMoveMode(false);
    setAddMode(false);
  };

  const handleEditToggle = () => {
    setMoveMode(!moveMode);
    setAddMode(false);
    setMeasureActive(false);
  };

  const handleAddToggle = () => {
    setAddMode(true);
    setMoveMode(false);
    setMeasureActive(false);
    setShowEditOptions(false);
  };

  const handleMoveToggle = () => {
    setMoveMode(true);
    setAddMode(false);
    setMeasureActive(false);
    setShowEditOptions(false);
  };

  const MapEvents = () => {
    const map = useMap();

    useEffect(() => {
      if (!draggingMap) {
        map.dragging.disable(); // Disable map dragging when a marker is being dragged
      } else {
        map.dragging.enable(); // Enable map dragging when dragging ends
      }
    }, [map]); // Remove 'draggingMap' from the dependency array    
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
              handleMeasureToggle={handleMeasureToggle}
              handleEditToggle={handleEditToggle}
              handleAddToggle={handleAddToggle}
              handleMoveToggle={handleMoveToggle} // Pass handleMoveToggle to Panel
              showEditOptions={showEditOptions}
              moveMode={moveMode}
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
