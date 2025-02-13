// census-api.js

const CENSUS_API_KEY = process.env.REACT_APP_CENSUS_API_KEY;

/**
 * Returns configuration for adding census tract data to the map
 */
export const getPopulationLayerConfig = () => ({
  source: {
    id: 'census-tracts',
    type: 'vector',
    url: 'mapbox://pkulandh.3r0plqr0'
  },
  layers: [
    {
      id: 'census-tracts-layer',
      type: 'fill',
      source: 'census-tracts',
      'source-layer': 'cb_2019_us_tract_500k-2qnt3v',
      paint: {
        'fill-color': '#6B7280',
        'fill-opacity': 0,
        'fill-outline-color': '#4B5563'
      },
      layout: {
        visibility: 'visible'
      }
    },
    {
      id: 'census-tracts-outline',
      type: 'line',
      source: 'census-tracts',
      'source-layer': 'cb_2019_us_tract_500k-2qnt3v',
      paint: {
        'line-color': '#4B5563',
        'line-width': 1,
        'line-opacity': 0
      },
      layout: {
        visibility: 'visible'
      }
    }
  ]
});

/**
 * Fetches population data for all census tracts in the United States
 * @returns {Promise<Object>} Object with GEOID keys and population values
 */
export const fetchCensusPopulation = async () => {
  if (!CENSUS_API_KEY) {
    console.error('Census API Key is missing. Please check your .env file');
    throw new Error('Census API Key is required');
  }

  try {
    // Census API endpoint for 2020 ACS 5-year estimates
    const baseUrl = 'https://api.census.gov/data/2020/acs/acs5';
    
    // Variables we want to fetch:
    // B01003_001E: Total Population
    // We'll add more demographic variables here as needed
    const variables = ['B01003_001E'];
    
    // Fetch data for all states (no state filter)
    const url = `${baseUrl}?get=${variables.join(',')}&for=tract:*&key=${CENSUS_API_KEY}`;

    console.log('Fetching Census data from:', url);

    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Census API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      throw new Error(`Census API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data) || data.length < 2) {
      throw new Error('Invalid response format from Census API');
    }

    // Log the first few rows as a sample (excluding sensitive data)
    console.log('Census API Response Sample:', 
      data.slice(0, 2).map(row => row.map((val, i) => 
        i === 0 ? '[REDACTED]' : val
      ))
    );

    // Process the response into a more usable format
    const [headers, ...rows] = data;
    
    // Create a mapping of variables to their column indices
    const columnMap = headers.reduce((acc, header, index) => {
      acc[header] = index;
      return acc;
    }, {});

    // Verify required columns exist
    const requiredColumns = ['state', 'county', 'tract', 'B01003_001E'];
    const missingColumns = requiredColumns.filter(col => !(col in columnMap));
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    // Create an object with GEOID as key and population as value
    const populationByTract = rows.reduce((acc, row) => {
      try {
        const state = row[columnMap['state']];
        const county = row[columnMap['county']];
        const tract = row[columnMap['tract']];
        const population = parseInt(row[columnMap['B01003_001E']]) || 0;

        // Validate data
        if (!state || !county || !tract) {
          console.warn('Skipping row with missing geographic identifiers:', {
            state, county, tract
          });
          return acc;
        }

        // Create GEOID (11-digit identifier: 2-digit state + 3-digit county + 6-digit tract)
        const geoid = `${state}${county.padStart(3, '0')}${tract.padStart(6, '0')}`;
        
        acc[geoid] = {
          population,
          metadata: {
            state,
            county,
            tract,
            geoid
          }
        };

        return acc;
      } catch (error) {
        console.warn('Error processing census tract row:', error);
        return acc;
      }
    }, {});

    const tractCount = Object.keys(populationByTract).length;
    console.log(`Successfully processed ${tractCount.toLocaleString()} census tracts`);

    if (tractCount === 0) {
      throw new Error('No census tracts were successfully processed');
    }

    return populationByTract;

  } catch (error) {
    console.error('Error fetching census data:', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Validates a GEOID format
 * @param {string} geoid - The GEOID to validate
 * @returns {boolean} Whether the GEOID is valid
 */
export const isValidGEOID = (geoid) => {
  // GEOIDs should be 11 digits: 2 (state) + 3 (county) + 6 (tract)
  if (typeof geoid !== 'string' || geoid.length !== 11) {
    return false;
  }
  
  // Should only contain numbers
  return /^\d{11}$/.test(geoid);
};

/**
 * Extracts state, county, and tract information from a GEOID
 * @param {string} geoid - The GEOID to parse
 * @returns {Object} Object containing state, county, and tract codes
 */
export const parseGEOID = (geoid) => {
  if (!isValidGEOID(geoid)) {
    throw new Error('Invalid GEOID format');
  }

  return {
    state: geoid.slice(0, 2),
    county: geoid.slice(2, 5),
    tract: geoid.slice(5)
  };
};