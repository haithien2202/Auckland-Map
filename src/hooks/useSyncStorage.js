import { useEffect, useCallback } from 'react';

const useSyncStorage = (setBusStop, setTrainStation) => {
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

  return { updateLocalStorage };
};

export default useSyncStorage;
