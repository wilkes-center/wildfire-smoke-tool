// census-api.js

const CENSUS_API_KEY = process.env.REACT_APP_CENSUS_API_KEY;
const UTAH_FIPS = '49'; // FIPS code for Utah

/**
 * Returns configuration for adding census tract data to the map
 */
export const getPopulationLayerConfig = () => ({
  source: {
    id: 'census-tracts-source',
    type: 'vector',
    url: 'mapbox://pkulandh.2fbjphk5'
  },
  layers: [
    {
      id: 'census-tracts-layer',
      type: 'line',
      source: 'census-tracts-source',
      'source-layer': 'CensusTracts_Utah-d9h86e',
      paint: {
        'line-color': '#666',
        'line-width': 1,
        'line-opacity': 0.5
      },
      layout: {
        visibility: 'visible'
      }
    },
    {
      id: 'census-tracts-layer-hover',
      type: 'line',
      source: 'census-tracts-source',
      'source-layer': 'CensusTracts_Utah-d9h86e',
      paint: {
        'line-color': '#000',
        'line-width': 2
      },
      filter: ['==', 'GEOID', ''],
      layout: {
        visibility: 'visible'
      }
    }
  ]
});

/**
 * Fetches population data for all census tracts in Utah
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
    const variables = ['B01003_001E'];
    
    const url = `${baseUrl}?get=${variables.join(',')}&for=tract:*&in=state:${UTAH_FIPS}&key=${CENSUS_API_KEY}`;

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
    console.log('Census API Response:', data.slice(0, 2)); // Log first two rows as sample
    
    if (!Array.isArray(data) || data.length < 2) {
      throw new Error('Invalid response format from Census API');
    }

    // Process the response into a more usable format
    // First row contains headers
    const [headers, ...rows] = data;
    
    // Create a mapping of variables to their column indices
    const columnMap = headers.reduce((acc, header, index) => {
      acc[header] = index;
      return acc;
    }, {});

    // Verify required columns exist
    const requiredColumns = ['state', 'county', 'tract', 'B01003_001E'];
    for (const col of requiredColumns) {
      if (!(col in columnMap)) {
        throw new Error(`Missing required column: ${col}`);
      }
    }

    // Create an object with GEOID as key and population as value
    const populationByTract = rows.reduce((acc, row) => {
      const state = row[columnMap['state']];
      const county = row[columnMap['county']];
      const tract = row[columnMap['tract']];
      const population = parseInt(row[columnMap['B01003_001E']]) || 0;

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
    }, {});

    console.log(`Processed ${Object.keys(populationByTract).length} census tracts`);
    return populationByTract;

  } catch (error) {
    console.error('Error fetching census data:', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};