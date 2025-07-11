import { useState, useEffect, useRef } from 'react';
import {
  getRandomText,
  simulateEnvironmentalData,
  fetchCustomContent,
  ROTATION_PERIOD,
  CONTENT_FETCH_INTERVAL,
  RANDOM_TEXT_INTERVAL,
  TIME_UPDATE_INTERVAL
} from './tvUtils';

export const useTVLogic = (tvId, initialTemperature, initialPressure) => {
  const [contentIndex, setContentIndex] = useState(0);
  const [temperature, setTemperature] = useState(initialTemperature);
  const [pressure, setPressure] = useState(initialPressure);
  const [randomText, setRandomText] = useState('');
  const [customContent, setCustomContent] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const prevContentRef = useRef(null);

  // Environmental data simulation and time updates
  useEffect(() => {
    const interval = setInterval(() => {
      const { temperature: newTemp, pressure: newPressure } = simulateEnvironmentalData(temperature, pressure);
      setTemperature(newTemp);
      setPressure(newPressure);
      setCurrentTime(new Date());
    }, TIME_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [temperature, pressure]);

  // Fetch custom content for this TV
  useEffect(() => {
    const fetchContent = () => fetchCustomContent(tvId, prevContentRef, setCustomContent);
    
    fetchContent();
    const interval = setInterval(fetchContent, CONTENT_FETCH_INTERVAL);
    
    return () => clearInterval(interval);
  }, [tvId]);

  // Set new random text periodically
  useEffect(() => {
    setRandomText(getRandomText());
    const interval = setInterval(() => {
      setRandomText(getRandomText());
    }, RANDOM_TEXT_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Content rotation logic
  useEffect(() => {
    const contentCount = customContent ? 3 : 2;
    
    console.log(`${tvId} - Content count: ${contentCount}, Custom content present: ${Boolean(customContent)}`);
    
    setContentIndex(0);
    
    const interval = setInterval(() => {
      setContentIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % contentCount;
        console.log(`${tvId} - Rotating content: ${prevIndex} -> ${nextIndex}, Content types: ${contentCount}`);
        return nextIndex;
      });
    }, ROTATION_PERIOD);

    return () => clearInterval(interval);
  }, [customContent, tvId]);

  return {
    contentIndex,
    temperature,
    pressure,
    randomText,
    customContent,
    currentTime
  };
};
