import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { uicBuildings, defaultLocation } from '../data/uicBuildings';

interface CampusMapProps {
  locationName?: string | null;
}

export default function CampusMap({ locationName }: CampusMapProps) {
  const building = useMemo(() => {
    if (!locationName) return defaultLocation;
    return uicBuildings.find(b => b.name === locationName || b.shortName === locationName) || defaultLocation;
  }, [locationName]);

  const lat = building.coordinates ? building.coordinates[1] : building.lat;
  const lng = building.coordinates ? building.coordinates[0] : building.lng;
  
  const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

  if (!token) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Mapbox token missing in .env</Text>
      </View>
    );
  }

  // Pass all buildings to render pins for popular campus locations
  const buildingsJson = JSON.stringify(uicBuildings);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <script src="https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.js"></script>
        <link href="https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.css" rel="stylesheet" />
        <style>
          body { margin: 0; padding: 0; background-color: #f9fafb; }
          #map { position: absolute; top: 0; bottom: 0; width: 100%; }
          .custom-marker {
            width: 16px;
            height: 16px;
            background: #2563eb;
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(0,0,0,0.3);
            border: 2px solid white;
            cursor: pointer;
            transition: transform 0.2s;
          }
          .custom-marker.selected {
            width: 24px;
            height: 24px;
            background: #10b981; /* emerald-500 */
            transform: scale(1.2);
            z-index: 20;
          }
          /* Removed the display:none rules so the +/- zoom controls are visible */
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          mapboxgl.accessToken = '${token}';
          const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/light-v11',
            center: [${lng}, ${lat}],
            zoom: 15.5,
            pitch: 45,
            bearing: -17.6,
            antialias: true,
            interactive: true
          });

          // Add zoom and rotation controls to the map
          map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

          map.on('load', () => {
            map.addLayer({
              id: '3d-buildings',
              source: 'composite',
              'source-layer': 'building',
              filter: ['==', 'extrude', 'true'],
              type: 'fill-extrusion',
              minzoom: 14,
              paint: {
                'fill-extrusion-color': '#e4e4e7',
                'fill-extrusion-height': ['get', 'height'],
                'fill-extrusion-base': ['get', 'min_height'],
                'fill-extrusion-opacity': 0.6
              }
            });
          });

          const buildings = ${buildingsJson};
          const targetName = "${locationName || ''}";

          buildings.forEach(b => {
             const isSelected = b.name === targetName || b.shortName === targetName;
             const el = document.createElement('div');
             el.className = isSelected ? 'custom-marker selected' : 'custom-marker';
             
             // Create a simple popup for the building name
             const popup = new mapboxgl.Popup({ offset: 15, closeButton: false })
               .setHTML('<div style="font-family:sans-serif;font-size:12px;font-weight:bold;color:#333;">' + b.name + '</div>');

             new mapboxgl.Marker({ element: el })
                .setLngLat(b.coordinates)
                .setPopup(popup)
                .addTo(map);
          });
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={styles.map}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 240, // slightly taller to accommodate interactive map
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  map: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  errorContainer: {
    width: '100%',
    height: 240,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  errorText: {
    color: '#6b7280',
    fontSize: 14,
  },
});
