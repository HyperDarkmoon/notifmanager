import React from 'react';
import SharedTVComponent from '../components/SharedTVComponent';

function TV3() {
  return <SharedTVComponent key="TV3" tvId="TV3" initialTemperature={22.3} initialPressure={1008.50} />;
}

export default TV3;
