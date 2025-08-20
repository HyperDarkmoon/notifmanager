/**
 * Natural sort function to handle TV1, TV2, ..., TV10 correctly
 * @param {Object} a - First TV object to compare
 * @param {Object} b - Second TV object to compare
 * @returns {number} - Sort comparison result
 */
export const naturalSortTVs = (a, b) => {
  const extractNumber = (str) => {
    const match = str.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };
  
  const aNum = extractNumber(a.value);
  const bNum = extractNumber(b.value);
  
  if (aNum !== bNum) {
    return aNum - bNum;
  }
  
  // If numbers are the same or no numbers found, use alphabetical sort
  return a.value.localeCompare(b.value);
};

/**
 * Generic natural sort function for strings with numbers
 * @param {string} a - First string to compare
 * @param {string} b - Second string to compare
 * @returns {number} - Sort comparison result
 */
export const naturalSortStrings = (a, b) => {
  const extractNumber = (str) => {
    const match = str.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };
  
  const aNum = extractNumber(a);
  const bNum = extractNumber(b);
  
  if (aNum !== bNum) {
    return aNum - bNum;
  }
  
  // If numbers are the same or no numbers found, use alphabetical sort
  return a.localeCompare(b);
};
