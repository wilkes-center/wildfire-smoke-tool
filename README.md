# Wildfire Smoke Tool

An interactive web application that visualizes wildfire smoke PM2.5 concentrations across the United States, providing both historical data and forecasts.

## Features

- Interactive map visualization of PM2.5 concentrations from wildfire smoke
- 4-day data window: 2 days of historical data and 2 days of forecast data
- Timeline controls for navigating through the temporal data
- PM2.5 threshold adjustment for filtering visible smoke concentrations
- Drawing tools for custom area analysis and population exposure analysis
- Light and dark mode for different viewing preferences

## Technology Stack

- React.js frontend framework
- Mapbox GL for map rendering
- React Map GL for React integration with Mapbox
- Tailwind CSS for styling
- Recharts for data visualization

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/wilkes-center/wildfire-smoke-tool.git
   cd wildfire-smoke-tool
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with your Mapbox API key and census_api_key:
   ```
   REACT_APP_MAPBOX_TOKEN=your_mapbox_api_key
   REACT_APP_CENSUS_API_KEY=your_census_api_key
   ```

4. Start the development server:
   ```
   npm start
   ```

## Usage

- Navigate the map using standard zoom and pan controls
- Use the time controls at the bottom to play through the timeline
- Adjust the PM2.5 threshold slider to filter visible smoke concentrations
- Toggle between light and dark mode for your preferred viewing experience
- Use drawing tools to analyze custom areas

## Deployment

The application is configured for deployment to GitHub Pages:

```
npm run deploy
```

This will automatically increment the version, build the project, and deploy it to GitHub Pages.

## Contributing

We welcome contributions to improve this tool. Please submit issues and pull requests through GitHub.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Issues and Feedback

If you encounter any issues or have ideas for new features, please submit a GitHub issue at:
https://github.com/wilkes-center/wildfire-smoke-tool/issues

## License

This project is maintained by the Wilkes Center for Climate Science and Policy at the University of Utah

## Acknowledgements

- [Mapbox GL](https://docs.mapbox.com/mapbox-gl-js/api/)
- [React Map GL](https://visgl.github.io/react-map-gl/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Recharts](https://recharts.org/)
- [CARTO](https://carto.com/)
- [U.S. Census Bureau](https://www.census.gov/)
- [OpenStreetMap](https://www.openstreetmap.org/)
