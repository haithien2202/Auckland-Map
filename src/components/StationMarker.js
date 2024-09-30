import React from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';

const icons = {
  busStopIcon: L.icon({
    iconUrl: '/logo/bus-stop.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  }),
  trainStationIcon: L.icon({
    iconUrl: '/logo/train.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  }),
};

const StationMarker = ({ station, iconType, measureActive, moveMode, deleteMode, onDragStart, onDragEnd, onClick, onDelete }) => {
  const handleDragEnd = (e) => {
    const newPosition = e.target.getLatLng();
    onDragEnd(station, newPosition);
  };

  const handleClick = () => {
    if (deleteMode) {
      onDelete(station); // Trigger deletion when delete mode is active
    } else if (measureActive) {
      onClick({ lat: station.STOPLAT, lng: station.STOPLON });
    }
  };

  const handleDragStart = (e) => {
    onDragStart();
  };

  return (
    <Marker
      position={[station.STOPLAT, station.STOPLON]}
      icon={icons[iconType]}
      draggable={moveMode} // Enable dragging only when moveMode is active
      eventHandlers={{
        dragstart: handleDragStart, // Disable map dragging when marker dragging starts
        dragend: handleDragEnd, // Save the new position on drag end
        click: handleClick, // Handle click for delete or measure
      }}
    >
      <Tooltip>{station.STOPNAME}</Tooltip>
    </Marker>
  );
};

export default StationMarker;
