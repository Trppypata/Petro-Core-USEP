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
    
    // Inject custom styles for better tooltip/popup appearance
    const injectCustomStyles = () => {
      const styleTag = document.createElement('style');
      styleTag.innerHTML = `
        .leaflet-popup-content {
          margin: 10px !important;
          min-width: 200px !important;
          max-width: 300px !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 8px !important;
          padding: 0 !important;
          overflow: hidden !important;
        }
        .rock-popup {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', sans-serif;
        }
        .rock-popup-image {
          width: 100%;
          height: 150px;
          object-fit: cover;
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
        }
        .rock-popup-content {
          padding: 12px;
        }
        .rock-popup-title {
          font-weight: 700;
          font-size: 16px;
          margin: 0 0 4px 0;
          color: #1a202c;
        }
        .rock-popup-category {
          font-size: 13px;
          margin: 0 0 8px 0;
          color: #4a5568;
        }
        .rock-popup-description {
          font-size: 12px;
          margin: 0 0 10px 0;
          color: #718096;
          line-height: 1.4;
        }
        .rock-popup-link {
          display: inline-block;
          background-color: #3182ce;
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
          text-decoration: none;
          font-size: 12px;
          font-weight: 500;
          transition: background-color 0.2s;
        }
        .rock-popup-link:hover {
          background-color: #2c5282;
        }
      `;
      document.head.appendChild(styleTag);
      
      return () => {
        document.head.removeChild(styleTag);
      };
    };
    
    // Dynamic import to ensure it only runs in the browser
    const initMap = async () => {
      try {
        // Add custom styles
        const removeStyles = injectCustomStyles();
        
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
        
        // Create custom icons based on rock categories
        const createCustomIcon = (category?: string) => {
          // Choose color based on category
          let color = '#3388ff'; // default blue
          
          if (category) {
            const lowerCategory = category.toLowerCase();
            if (lowerCategory.includes('igneous')) {
              color = '#f56565'; // red for igneous
            } else if (lowerCategory.includes('sedimentary')) {
              color = '#ed8936'; // orange for sedimentary
            } else if (lowerCategory.includes('metamorphic')) {
              color = '#9f7aea'; // purple for metamorphic
            } else if (lowerCategory.includes('mineral')) {
              color = '#38b2ac'; // teal for minerals
            }
          }
          
          // Create a custom marker with SVG
          return L.divIcon({
            html: `
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36">
                <path fill="${color}" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            `,
            className: '',
            iconSize: [36, 36],
            iconAnchor: [18, 36],
            popupAnchor: [0, -36]
          });
        };
        
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
          
          // Create marker with custom icon
          const marker = L.marker(position, {
            icon: createCustomIcon(rock.category)
          }).addTo(map);
          
          // Create popup content
          const popupContent = document.createElement('div');
          popupContent.className = 'rock-popup';
          
          // Build popup HTML
          let popupHTML = '';
          
          // Add image if available
          if (rock.imageUrl) {
            popupHTML += `<img src="${rock.imageUrl}" alt="${rock.title}" class="rock-popup-image">`;
          }
          
          // Add content container
          popupHTML += '<div class="rock-popup-content">';
          
          // Add title
          popupHTML += `<h3 class="rock-popup-title">${rock.title}</h3>`;
          
          // Add category if available
          if (rock.category) {
            popupHTML += `<p class="rock-popup-category">${rock.category}</p>`;
          }
          
          // Add description preview if available
          if (rock.description) {
            const shortDesc = rock.description.substring(0, 100) + 
              (rock.description.length > 100 ? '...' : '');
            popupHTML += `<p class="rock-popup-description">${shortDesc}</p>`;
          }
          
          // Add link
          popupHTML += `<a href="/rock-minerals/rock/${rock.id}" class="rock-popup-link">View Details</a>`;
          
          // Close content container
          popupHTML += '</div>';
          
          // Set popup HTML
          popupContent.innerHTML = popupHTML;
          
          // Create popup options
          const popupOptions = {
            maxWidth: 300,
            className: 'custom-popup'
          };
          
          // Bind popup to marker
          marker.bindPopup(popupContent, popupOptions);
        });
        
        // Clean up on unmount
        return () => {
          map.remove();
          removeStyles();
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