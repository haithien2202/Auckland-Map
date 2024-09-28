import { useEffect, useCallback, useState } from 'react';

// Custom hook to fetch stations data
const useFetchStations = () => {
  const [busStop, setBusStop] = useState([]);
  const [trainStation, setTrainStation] = useState([]);

  // Function to fetch data from the API
  const fetchData = useCallback(async (url, setter) => {
    try {
      const response = await fetch(url);
      const data = await response.json();
      setter(data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, []);

  // Fetch bus stops
  useEffect(() => {
    fetchData('http://127.0.0.1:5000/api/bus-stops', setBusStop);
  }, [fetchData]);

  // Fetch train stations
  useEffect(() => {
    fetchData('http://127.0.0.1:5000/api/train-stations', setTrainStation);
  }, [fetchData]);

  return { busStop, trainStation, setBusStop, setTrainStation }; // Return setter functions
};

export default useFetchStations;
