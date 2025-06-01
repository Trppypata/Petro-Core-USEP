import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { RocksMineralsItem } from '../rocks-minerals/types';
import 'leaflet/dist/leaflet.css';

// Component that dynamically loads the map
const LeafletMap = ({ rocks }: { rocks: RocksMineralsItem[] }) => {
  const [isMounted, setIsMounted] = useState(false);
  
  // Only render the map on the client side
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // If not mounted yet, show loading state
  if (!isMounted) {
    return (
      <div className="h-[600px] w-full bg-gray-100 rounded-3xl flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>Loading map...</p>
        </div>
      </div>
    );
  }
  
  // If mounted, now it's safe to import and render Leaflet components
  return <ClientSideMap rocks={rocks} />;
};

// After component mounted, initialize leaflet map
const useInitLeaflet = (rocks: RocksMineralsItem[]) => {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Dynamic import to ensure it only runs in the browser
    const initMap = async () => {
      try {
        // Import leaflet library
        const L = await import('leaflet');
        
        // Fix Leaflet icon issues
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });
        
        // Get map container element
        const mapElement = document.getElementById('map');
        if (!mapElement) return;
        
        // Initialize map
        const map = L.map(mapElement).setView([8.5, 124.5], 6);
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Parse coordinates function
        const parseCoordinates = (rock: RocksMineralsItem): [number, number] | null => {
          try {
            if (rock.coordinates) {
              // Try to extract lat/long from coordinates string
              const coordParts = rock.coordinates.split(',').map(part => part.trim());
              if (coordParts.length === 2) {
                // Extract numeric values from coordinate strings
                const latStr = coordParts[0];
                const longStr = coordParts[1];
                
                // Extract numeric values using regex
                const latMatch = latStr.match(/(\d+\.?\d*)/);
                const longMatch = longStr.match(/(\d+\.?\d*)/);
                
                if (latMatch && longMatch) {
                  const lat = parseFloat(latMatch[0]);
                  const long = parseFloat(longMatch[0]);
                  return [lat, long];
                }
              }
            } else if (rock.latitude && rock.longitude) {
              // Handle separate latitude and longitude fields
              const latMatch = rock.latitude.match(/(\d+\.?\d*)/);
              const longMatch = rock.longitude.match(/(\d+\.?\d*)/);
              
              if (latMatch && longMatch) {
                const lat = parseFloat(latMatch[0]);
                const long = parseFloat(longMatch[0]);
                return [lat, long];
              }
            }
            
            // If parsing fails, return null to skip this rock
            return null;
          } catch (e) {
            console.error("Error parsing coordinates for rock:", rock.id, e);
            return null;
          }
        };
        
        // Add markers for each rock with coordinates
        rocks.forEach(rock => {
          const position = parseCoordinates(rock);
          if (!position) return;
          
          const marker = L.marker(position).addTo(map);
          
          // Create popup content
          const popupContent = document.createElement('div');
          popupContent.className = 'max-w-xs';
          
          if (rock.imageUrl) {
            const img = document.createElement('img');
            img.src = rock.imageUrl;
            img.alt = rock.title;
            img.className = 'w-full h-32 object-cover mb-2 rounded-md';
            popupContent.appendChild(img);
          }
          
          const title = document.createElement('h3');
          title.className = 'font-bold text-lg mb-1';
          title.textContent = rock.title;
          popupContent.appendChild(title);
          
          const category = document.createElement('p');
          category.className = 'text-sm mb-1';
          category.textContent = rock.category || '';
          popupContent.appendChild(category);
          
          if (rock.description) {
            const desc = document.createElement('p');
            desc.className = 'text-xs text-gray-600 mb-2';
            desc.textContent = rock.description.substring(0, 100) + 
              (rock.description.length > 100 ? '...' : '');
            popupContent.appendChild(desc);
          }
          
          const link = document.createElement('a');
          link.href = `/rock-minerals/rock/${rock.id}`;
          link.className = 'inline-block px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700';
          link.textContent = 'View Details';
          popupContent.appendChild(link);
          
          // Bind popup to marker
          marker.bindPopup(popupContent);
        });
        
        // Clean up on unmount
        return () => {
          map.remove();
        };
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    };
    
    initMap();
  }, [rocks]);
};

// Client-side map component
const ClientSideMap = ({ rocks }: { rocks: RocksMineralsItem[] }) => {
  // Use the hook to initialize the map
  useInitLeaflet(rocks);
  
  return (
    <div id="map" className="h-[600px] w-full rounded-3xl overflow-hidden"></div>
  );
};

export default LeafletMap; 