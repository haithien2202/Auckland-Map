// src/components/MeasureAndEditEvents.js
import { useMapEvents } from 'react-leaflet';

const MeasureAndEditEvents = ({ addMode, measureActive, addStation, addMeasurementPoint }) => {
  useMapEvents({
    click(e) {
      if (addMode) {
        addStation(e.latlng); // Add a bus stop or train station
      } else if (measureActive) {
        console.info("yes")
        addMeasurementPoint(e.latlng); // Measure distance between two points
      }
    },
    dblclick(e) {
      e.originalEvent.stopPropagation(); // Prevent double-click from adding a new point
    },
  });

  return null;
};

export default MeasureAndEditEvents;
