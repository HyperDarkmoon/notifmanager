import React from 'react';
import SharedTVComponent from '../components/SharedTVComponent';

function TV1() {
  return <SharedTVComponent key="TV1" tvId="TV1" initialTemperature={23.8} initialPressure={1010.75} />;
}

export default TV1;
