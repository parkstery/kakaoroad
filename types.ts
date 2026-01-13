
export interface Location {
  lat: number;
  lng: number;
  address: string;
  name?: string;
}

export interface RouteData {
  distance: number;
  duration: number;
  polyline: { lat: number; lng: number }[];
  summary: string;
}

export enum LocationType {
  START = 'START',
  END = 'END'
}

declare global {
  interface Window {
    kakao: any;
  }
}
