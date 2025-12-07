/**
 * Service for managing municipality additional data (descriptions, etc.)
 * Stores data in localStorage
 */

const STORAGE_KEY = 'municipality_extra_data';

/**
 * Get all municipality data
 * @returns {Object} - Object with municipality names as keys
 */
export const getAllMunicipalityData = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error loading municipality data:', error);
    return {};
  }
};

/**
 * Get data for a specific municipality
 * @param {string} municipioName - Name of the municipality
 * @returns {Object|null} - Municipality data or null if not found
 */
export const getMunicipalityData = (municipioName) => {
  const allData = getAllMunicipalityData();
  return allData[municipioName] || null;
};

/**
 * Save or update municipality data
 * @param {string} municipioName - Name of the municipality
 * @param {Object} data - Data to save (description, tags, etc.)
 */
export const saveMunicipalityData = (municipioName, data) => {
  try {
    const allData = getAllMunicipalityData();
    allData[municipioName] = {
      ...allData[municipioName],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
    return true;
  } catch (error) {
    console.error('Error saving municipality data:', error);
    return false;
  }
};

/**
 * Delete municipality data
 * @param {string} municipioName - Name of the municipality
 */
export const deleteMunicipalityData = (municipioName) => {
  try {
    const allData = getAllMunicipalityData();
    delete allData[municipioName];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
    return true;
  } catch (error) {
    console.error('Error deleting municipality data:', error);
    return false;
  }
};

/**
 * Get list of all municipalities with data
 * @returns {Array} - Array of municipality names
 */
export const getMunicipalityList = () => {
  const allData = getAllMunicipalityData();
  return Object.keys(allData);
};

