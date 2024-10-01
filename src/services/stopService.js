// Function to save a new bus stop or train station
export const saveStop = async (newStop, stopName, selectedStationType, setBusStop, setTrainStation, busStop, trainStation) => {
    const stopData = {
      stopName: stopName,
      lat: newStop.STOPLAT,
      lon: newStop.STOPLON,
      stopType: selectedStationType,
    };
  
    const response = await fetch('http://127.0.0.1:5000/save-stop', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stopData),
    });
  
    const data = await response.json();
  
    if (data.type === 'Feature') {
      const updatedStop = {
        ...newStop,
        STOPNAME: stopName,
        STOPLAT: data.properties.STOPLAT,
        STOPLON: data.properties.STOPLON,
        OBJECTID: data.properties.OBJECTID,
      };
  
      if (selectedStationType === 'busStops') {
        setBusStop([...busStop, updatedStop]);
      } else {
        setTrainStation([...trainStation, updatedStop]);
      }
      return true;
    } else {
      console.error('Failed to save the stop:', data.error);
      return false;
    }
  };
  
  // Function to delete a bus stop or train station
  export const deleteStop = async (stopToDelete, selectedStationType, setBusStop, setTrainStation, busStop, trainStation) => {
    const deleteData = {
      STOPCODE: stopToDelete.STOPCODE,
      stopType: selectedStationType,
    };
  
    const response = await fetch('http://127.0.0.1:5000/delete-stop', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deleteData),
    });
  
    const data = await response.json();
  
    if (data.success) {
      if (selectedStationType === 'busStops') {
        setBusStop(busStop.filter(stop => stop.OBJECTID !== stopToDelete.OBJECTID));
      } else {
        setTrainStation(trainStation.filter(stop => stop.OBJECTID !== stopToDelete.OBJECTID));
      }
      return true;
    } else {
      console.error('Failed to delete stop:', data.message);
      return false;
    }
  };
  
  // Function to update the location of a bus stop or train station
  export const updateStopLocation = async (station, newPosition, selectedStationType) => {
    const updatedStopData = {
      OBJECTID: station.OBJECTID,
      STOPLAT: newPosition.lat,
      STOPLON: newPosition.lng,
      stopType: selectedStationType,
    };
  
    const response = await fetch('http://127.0.0.1:5000/update-stop-location', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedStopData),
    });
  
    const data = await response.json();
  
    if (data.success) {
      console.log(`${selectedStationType} location updated successfully.`);
      return true;
    } else {
      console.error('Failed to update stop location:', data.message);
      return false;
    }
  };
  