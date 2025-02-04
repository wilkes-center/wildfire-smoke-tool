// src/utils/map/censusAnalysis.js

const CENSUS_API_KEY = process.env.REACT_APP_CENSUS_API_KEY;
const UTAH_FIPS = '49'; // Utah state FIPS code

export const getSelectedCensusTracts = async (map, polygon) => {
    if (!map || !polygon) return [];
  
    try {
      // Get all features from the census tracts layer
      const features = map.queryRenderedFeatures({
        layers: ['census-tracts-layer']
      });

      // Debug: Log the first feature's complete properties
      console.log('First feature complete properties:', features[0]?.properties);
      
      // Filter features that intersect with the selected area
      const selectedFeatures = features.filter(feature => {
        return feature.geometry && feature.properties;
      });

      // Extract and log GEOIDs from map features
      const tractIds = [...new Set(selectedFeatures.map(f => {
        const geoid = f.properties.GEOID;
        console.log('Map Feature GEOID:', geoid);
        return geoid;
      }))];

      console.log('Selected tract IDs from map:', tractIds);
      
      if (tractIds.length === 0) {
        console.log('No census tracts found in selection');
        return {};
      }

      // Fetch from Census API
      const baseUrl = 'https://api.census.gov/data/2020/acs/acs5';
      const apiKey = process.env.REACT_APP_CENSUS_API_KEY;
      
      const variables = [
        'B01003_001E',  // Total Population
        'B19013_001E',  // Median Household Income
        'B25077_001E'   // Median Home Value
      ];
      
      const url = `${baseUrl}?get=${variables.join(',')}&for=tract:*&in=state:49&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      const [headers, ...rows] = data;

      // Process the response
      const populationData = {};
      let totalPopulation = 0;
      let totalIncome = 0;
      let totalHomeValue = 0;
      let validTractCount = 0;

      // Log a few rows of Census API data for comparison
      console.log('Sample Census API rows:', rows.slice(0, 3).map(row => {
        const state = row[headers.indexOf('state')];
        const county = row[headers.indexOf('county')];
        const tract = row[headers.indexOf('tract')];
        const geoid = `${state}${county.padStart(3, '0')}${tract.padStart(6, '0')}`;
        return {
          rawRow: row,
          constructedGeoid: geoid,
          population: row[headers.indexOf('B01003_001E')]
        };
      }));

      rows.forEach(row => {
        const state = row[headers.indexOf('state')];
        const county = row[headers.indexOf('county')];
        const tract = row[headers.indexOf('tract')];
        const geoid = `${state}${county.padStart(3, '0')}${tract.padStart(6, '0')}`;
        
        // Check if this tract is in our selected area
        if (tractIds.includes(geoid)) {
          console.log('Found matching tract:', geoid);
          
          const population = parseInt(row[headers.indexOf('B01003_001E')]) || 0;
          const income = parseInt(row[headers.indexOf('B19013_001E')]) || 0;
          const homeValue = parseInt(row[headers.indexOf('B25077_001E')]) || 0;

          populationData[geoid] = {
            population,
            medianIncome: income,
            medianHomeValue: homeValue,
            state,
            county,
            tract
          };

          totalPopulation += population;
          if (income > 0) {
            totalIncome += income;
            validTractCount++;
          }
          if (homeValue > 0) {
            totalHomeValue += homeValue;
          }
        }
      });

      // Log final matching stats
      console.log('Matching Statistics:', {
        totalTractsFromMap: tractIds.length,
        matchedTracts: Object.keys(populationData).length,
        sampleMapGeoid: tractIds[0],
        sampleApiGeoid: Object.keys(populationData)[0]
      });

      return {
        tracts: populationData,
        summary: {
          totalPopulation,
          averageMedianIncome: validTractCount > 0 ? Math.round(totalIncome / validTractCount) : 0,
          averageMedianHomeValue: validTractCount > 0 ? Math.round(totalHomeValue / validTractCount) : 0,
          tractCount: validTractCount
        }
      };

    } catch (error) {
      console.error('Error in getSelectedCensusTracts:', error);
      throw error;
    }
};