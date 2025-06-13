/**
 * Fetches population data for all census tracts in the United States
 * @returns {Promise<Object>} Object with GEOID keys and population values
 */
export const fetchCensusPopulation = async () => {
  if (!process.env.REACT_APP_CENSUS_API_KEY) {
    console.error('Census API Key is missing. Please check your .env file');
    throw new Error('Census API Key is required');
  }

  try {
    // Census API endpoint for 2020 ACS 5-year estimates
    const baseUrl = 'https://api.census.gov/data/2020/acs/acs5';
    const apiKey = process.env.REACT_APP_CENSUS_API_KEY;

    // Variables we want to fetch:
    // B01003_001E: Total Population
    const variables = ['B01003_001E'];

    // Fetch data for all states first
    const statesUrl = `https://api.census.gov/data/2020/acs/acs5?get=NAME&for=state:*&key=${apiKey}`;
    const statesResponse = await fetch(statesUrl);
    if (!statesResponse.ok) {
      throw new Error(`States API request failed: ${statesResponse.status}`);
    }
    const statesData = await statesResponse.json();
    const states = statesData.slice(1).map(row => row[1]); // Get state FIPs codes

    // Fetch tract data for each state
    const allTracts = await Promise.all(
      states.map(async state => {
        const tractUrl = `${baseUrl}?get=${variables.join(',')},NAME&for=tract:*&in=state:${state}&in=county:*&key=${apiKey}`;
        const response = await fetch(tractUrl);
        if (!response.ok) {
          console.warn(`Skipping state ${state} due to error:`, response.statusText);
          return [];
        }
        return response.json();
      })
    );

    // Process all tract data
    const populationByTract = {};
    allTracts.forEach(stateData => {
      if (!Array.isArray(stateData) || stateData.length < 2) return;

      const [headers, ...rows] = stateData;
      const columnMap = headers.reduce((acc, header, index) => {
        acc[header] = index;
        return acc;
      }, {});

      rows.forEach(row => {
        try {
          const state = row[columnMap['state']];
          const county = row[columnMap['county']];
          const tract = row[columnMap['tract']];
          const population = parseInt(row[columnMap['B01003_001E']]) || 0;

          if (!state || !county || !tract) {
            console.warn('Skipping row with missing geographic identifiers');
            return;
          }

          // Create GEOID (11-digit identifier: 2-digit state + 3-digit county + 6-digit tract)
          const geoid = `${state}${county.padStart(3, '0')}${tract.padStart(6, '0')}`;

          populationByTract[geoid] = {
            population,
            metadata: {
              state,
              county,
              tract,
              geoid
            }
          };
        } catch (error) {
          console.warn('Error processing census tract row:', error);
        }
      });
    });

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
export const isValidGEOID = geoid => {
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
export const parseGEOID = geoid => {
  if (!isValidGEOID(geoid)) {
    throw new Error('Invalid GEOID format');
  }

  return {
    state: geoid.slice(0, 2),
    county: geoid.slice(2, 5),
    tract: geoid.slice(5)
  };
};
