import React from 'react';
import { useParams } from 'react-router-dom';
import SharedTVComponent from './SharedTVComponent';

function DynamicTVPage() {
  const { tvName } = useParams();
  
  // Default initial values - these could be fetched from TV settings in the future
  const initialTemperature = 23.8;
  const initialPressure = 1010.75;
  
  return (
    <SharedTVComponent 
      key={tvName}
      tvId={tvName} 
      initialTemperature={initialTemperature} 
      initialPressure={initialPressure} 
    />
  );
}

export default DynamicTVPage;
