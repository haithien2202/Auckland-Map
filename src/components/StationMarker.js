// src/components/StationMarker.js
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

const StationMarker = ({ station, iconType, measureActive, moveMode, onDragStart, onDragEnd, onClick }) => {
  const handleDragEnd = (e) => {
    const newPosition = e.target.getLatLng();
    onDragEnd(station, newPosition);
  };

  const handleClick = () => {
    if (measureActive) {
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
        click: handleClick, // Handle measurement clicks
      }}
    >
      <Tooltip>{station.STOPNAME}</Tooltip>
    </Marker>
  );
};

export default StationMarker;
