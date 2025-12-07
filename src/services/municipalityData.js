/**
 * Service for managing municipality additional data (descriptions, etc.)
 * Stores data in MongoDB via API endpoints
 * Falls back to localStorage if API is unavailable
 */

const STORAGE_KEY = 'municipality_extra_data';
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api/municipalities';

/**
 * Get all municipality data from MongoDB
 * @returns {Promise<Object>} - Object with municipality names as keys
 */
export const getAllMunicipalityData = async () => {
  try {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch from API');
    }
    const data = await response.json();
    return data || {};
  } catch (error) {
    console.warn('Error loading from MongoDB, falling back to localStorage:', error);
    // Fallback to localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (localError) {
      console.error('Error loading from localStorage:', localError);
      return {};
    }
  }
};

/**
 * Get data for a specific municipality from MongoDB
 * @param {string} municipioName - Name of the municipality
 * @returns {Promise<Object|null>} - Municipality data or null if not found
 */
export const getMunicipalityData = async (municipioName) => {
  try {
    const encodedName = encodeURIComponent(municipioName);
    const response = await fetch(`${API_BASE_URL}?name=${encodedName}`);
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error('Failed to fetch from API');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('Error loading from MongoDB, falling back to localStorage:', error);
    // Fallback to localStorage
    try {
      const allData = getAllMunicipalityDataSync();
      return allData[municipioName] || null;
    } catch (localError) {
      console.error('Error loading from localStorage:', localError);
      return null;
    }
  }
};

/**
 * Save or update municipality data to MongoDB
 * @param {string} municipioName - Name of the municipality
 * @param {Object} data - Data to save (description, tags, etc.)
 * @returns {Promise<boolean>} - True if successful
 */
export const saveMunicipalityData = async (municipioName, data) => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: municipioName,
        ...data,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save to API');
    }

    // Also save to localStorage as backup
    try {
      const allData = getAllMunicipalityDataSync();
      allData[municipioName] = {
        ...allData[municipioName],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
    } catch (localError) {
      console.warn('Could not save to localStorage backup:', localError);
    }

    return true;
  } catch (error) {
    console.error('Error saving to MongoDB:', error);
    // Fallback to localStorage
    try {
      const allData = getAllMunicipalityDataSync();
      allData[municipioName] = {
        ...allData[municipioName],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
      return true;
    } catch (localError) {
      console.error('Error saving to localStorage:', localError);
      return false;
    }
  }
};

/**
 * Delete municipality data from MongoDB
 * @param {string} municipioName - Name of the municipality
 * @returns {Promise<boolean>} - True if successful
 */
export const deleteMunicipalityData = async (municipioName) => {
  try {
    const encodedName = encodeURIComponent(municipioName);
    const response = await fetch(`${API_BASE_URL}?name=${encodedName}`, {
      method: 'DELETE',
    });

    if (!response.ok && response.status !== 404) {
      throw new Error('Failed to delete from API');
    }

    // Also remove from localStorage
    try {
      const allData = getAllMunicipalityDataSync();
      delete allData[municipioName];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
    } catch (localError) {
      console.warn('Could not delete from localStorage backup:', localError);
    }

    return true;
  } catch (error) {
    console.error('Error deleting from MongoDB:', error);
    // Fallback to localStorage
    try {
      const allData = getAllMunicipalityDataSync();
      delete allData[municipioName];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
      return true;
    } catch (localError) {
      console.error('Error deleting from localStorage:', localError);
      return false;
    }
  }
};

/**
 * Get list of all municipalities with data
 * @returns {Promise<Array>} - Array of municipality names
 */
export const getMunicipalityList = async () => {
  const allData = await getAllMunicipalityData();
  return Object.keys(allData);
};

/**
 * Synchronous version for localStorage fallback
 * @private
 */
const getAllMunicipalityDataSync = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return {};
  }
};

