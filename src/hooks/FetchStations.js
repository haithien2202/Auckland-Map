import { useState, useEffect, useCallback } from 'react';

const useFetchStations = () => {
  const [busStop, setBusStop] = useState(() => {
    const localData = localStorage.getItem('busStopData');
    return localData ? JSON.parse(localData) : [];
  });

  const [trainStation, setTrainStation] = useState(() => {
    const localData = localStorage.getItem('trainStationData');
    return localData ? JSON.parse(localData) : [];
  });

  // Function to fetch bus stops from the server
  const fetchBusStops = useCallback(() => {
    fetch('http://127.0.0.1:5000/api/bus-stops')
      .then(response => response.json())
      .then(data => {
        if (data && data.length > 0) {
          setBusStop(data);
          localStorage.setItem('busStopData', JSON.stringify(data));  // Store in localStorage
        }
      })
      .catch(error => console.error('Error fetching bus stops:', error));
  }, []);

  // Function to fetch train stations from the server
  const fetchTrainStations = useCallback(() => {
    fetch('http://127.0.0.1:5000/api/train-stations')
      .then(response => response.json())
      .then(data => {
        if (data && data.length > 0) {
          setTrainStation(data);
          localStorage.setItem('trainStationData', JSON.stringify(data));  // Store in localStorage
        }
      })
      .catch(error => console.error('Error fetching train stations:', error));
  }, []);

  // Fetch bus stops and train stations on mount
  useEffect(() => {
    fetchBusStops();
    fetchTrainStations();
  }, [fetchBusStops, fetchTrainStations]);

  return {
    busStop,
    trainStation,
    setBusStop,
    setTrainStation
  };
};

export default useFetchStations;
