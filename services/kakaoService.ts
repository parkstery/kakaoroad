
import { Location, RouteData } from '../types';

/**
 * Fetches route data using OSRM as a fallback if our Proxy fails.
 */
const getOsrmRoute = async (start: Location, end: Location): Promise<RouteData | null> => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('OSRM API Failed');
    
    const data = await response.json();
    if (!data.routes || data.routes.length === 0) return null;

    const route = data.routes[0];
    const path = route.geometry.coordinates.map((coord: number[]) => ({
      lat: coord[1],
      lng: coord[0]
    }));

    return {
      distance: route.distance,
      duration: route.duration,
      polyline: path,
      summary: 'OSRM 경로'
    };
  } catch (err) {
    console.error('OSRM Fallback failed:', err);
    return null;
  }
};

/**
 * Main function to get car route.
 * Calls our own Next.js API Route (/api/directions) to avoid CORS and hide API Keys.
 */
export const getCarRoute = async (start: Location, end: Location): Promise<RouteData | null> => {
  const origin = `${start.lng},${start.lat}`;
  const destination = `${end.lng},${end.lat}`;

  try {
    // Call our internal Next.js API Route
    const response = await fetch(`/api/directions?origin=${origin}&destination=${destination}`);

    if (!response.ok) {
      throw new Error(`Proxy Error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.routes || data.routes.length === 0) return null;

    const route = data.routes[0];
    const section = route.sections[0];
    
    const path: { lat: number; lng: number }[] = [];
    section.roads.forEach((road: any) => {
      const vertexes = road.vertexes;
      for (let i = 0; i < vertexes.length; i += 2) {
        path.push({ lng: vertexes[i], lat: vertexes[i + 1] });
      }
    });

    return {
      distance: route.summary.distance,
      duration: route.summary.duration,
      polyline: path,
      summary: '카카오맵 경로'
    };

  } catch (error) {
    console.warn('Main Route API failed, switching to OSRM...', error);
    // Fallback to OSRM if our proxy or Kakao fails
    return await getOsrmRoute(start, end);
  }
};

/**
 * Decodes address from coordinates using Client-side Kakao Geocoder.
 * This still runs in the browser using the loaded SDK.
 */
export const getAddressFromCoords = (lat: number, lng: number): Promise<string> => {
  return new Promise((resolve) => {
    if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
        resolve(`위도: ${lat.toFixed(4)}, 경도: ${lng.toFixed(4)}`);
        return;
    }
    
    // Services should be preloaded by the script tag in layout.tsx, but good to be safe
    window.kakao.maps.load(() => {
        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.coord2Address(lng, lat, (result: any, status: any) => {
          if (status === window.kakao.maps.services.Status.OK) {
            resolve(result[0].address.address_name);
          } else {
            resolve(`위도: ${lat.toFixed(4)}, 경도: ${lng.toFixed(4)}`);
          }
        });
    });
  });
};
