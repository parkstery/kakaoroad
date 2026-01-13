
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Location, RouteData } from '../types';
import { getAddressFromCoords } from '../services/kakaoService';

interface MapContainerProps {
  startPoint: Location | null;
  endPoint: Location | null;
  routeData?: RouteData | null;
  onSetPoint: (type: 'START' | 'END', loc: Location) => void;
  isDriving?: boolean;
  simulationSpeed?: number;
  onStopDriving?: () => void;
}

const getDistanceFromLatLonInM = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const MapContainer: React.FC<MapContainerProps> = ({ 
  startPoint, endPoint, routeData, onSetPoint, isDriving = false, simulationSpeed = 50, onStopDriving 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const roadviewRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const roadviewInstance = useRef<any>(null);
  const roadviewClient = useRef<any>(null);
  const roadviewMarker = useRef<any>(null);
  const markers = useRef<{ start: any; end: any }>({ start: null, end: null });
  const polylineRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);
  const animationReqRef = useRef<number | null>(null);
  const speedRef = useRef(simulationSpeed);
  const isFetchingPano = useRef(false);
  const driveStateRef = useRef({ pathIndex: 0, progress: 0, totalDistanceCovered: 0, lastRoadviewUpdateDist: 0 });

  const [clickedPos, setClickedPos] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isRoadviewMode, setIsRoadviewMode] = useState(false);
  const [isRoadviewOpen, setIsRoadviewOpen] = useState(false);

  useEffect(() => { speedRef.current = simulationSpeed; }, [simulationSpeed]);

  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      if (typeof window !== 'undefined' && window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          const options = { center: new window.kakao.maps.LatLng(37.5665, 126.9780), level: 3 };
          mapInstance.current = new window.kakao.maps.Map(mapRef.current, options);
          infoWindowRef.current = new window.kakao.maps.InfoWindow({ zIndex: 1 });
          roadviewClient.current = new window.kakao.maps.RoadviewClient();
          roadviewMarker.current = new window.kakao.maps.Marker({
            image: new window.kakao.maps.MarkerImage('https://t1.daumcdn.net/localimg/localimages/07/2018/pc/roadview_minimap_wk_2018.png', new window.kakao.maps.Size(26, 46), { spriteSize: new window.kakao.maps.Size(1666, 168), spriteOrigin: new window.kakao.maps.Point(705, 114), offset: new window.kakao.maps.Point(13, 46) }),
            position: options.center
          });
          setMapLoaded(true);
        });
      }
    }
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !mapLoaded) return;
    const clickHandler = async (mouseEvent: any) => {
      const latlng = mouseEvent.latLng;
      if (isDriving) return;

      if (isRoadviewMode) {
        const position = new window.kakao.maps.LatLng(latlng.getLat(), latlng.getLng());
        roadviewClient.current.getNearestPanoId(position, 50, (panoId: any) => {
          if (panoId) {
            setIsRoadviewOpen(true);
            if (!roadviewInstance.current && roadviewRef.current) roadviewInstance.current = new window.kakao.maps.Roadview(roadviewRef.current);
            roadviewInstance.current.setPanoId(panoId, position);
            roadviewMarker.current.setPosition(position);
            roadviewMarker.current.setMap(mapInstance.current);
            infoWindowRef.current.close();
            setClickedPos(null);
          } else {
            alert('이 위치에서는 로드뷰를 볼 수 없습니다.');
          }
        });
      } else {
        const address = await getAddressFromCoords(latlng.getLat(), latlng.getLng());
        setClickedPos({ lat: latlng.getLat(), lng: latlng.getLng(), address });
      }
    };
    window.kakao.maps.event.addListener(mapInstance.current, 'click', clickHandler);
    return () => { if(mapInstance.current) window.kakao.maps.event.removeListener(mapInstance.current, 'click', clickHandler); };
  }, [mapLoaded, isRoadviewMode, onSetPoint, isDriving]);

  useEffect(() => {
    if (mapInstance.current) mapInstance.current.relayout();
    if (roadviewInstance.current) roadviewInstance.current.relayout();
  }, [isRoadviewOpen]);

  useEffect(() => {
    if (!mapLoaded || !routeData || !routeData.polyline || routeData.polyline.length < 2) return;

    if (isDriving) {
      setIsRoadviewOpen(true);
      setIsRoadviewMode(true);
      mapInstance.current.addOverlayMapTypeId(window.kakao.maps.MapTypeId.ROADVIEW);
      if (!roadviewInstance.current && roadviewRef.current) roadviewInstance.current = new window.kakao.maps.Roadview(roadviewRef.current);
      
      driveStateRef.current = { pathIndex: 0, progress: 0, totalDistanceCovered: 0, lastRoadviewUpdateDist: -100 };
      isFetchingPano.current = false;
      const path = routeData.polyline;
      const fps = 60;

      const driveLoop = () => {
        const state = driveStateRef.current;
        const currentSpeedKmH = speedRef.current; 
        const distPerFrame = (currentSpeedKmH * 1000) / 3600 / fps; 

        if (state.pathIndex >= path.length - 1) {
          if (onStopDriving) onStopDriving();
          return;
        }

        const p1 = path[state.pathIndex];
        const p2 = path[state.pathIndex + 1];
        const segmentDist = getDistanceFromLatLonInM(p1.lat, p1.lng, p2.lat, p2.lng);
        state.progress += distPerFrame;
        state.totalDistanceCovered += distPerFrame;

        let currentLat, currentLng;
        if (state.progress >= segmentDist) {
          state.pathIndex++;
          state.progress = 0;
          currentLat = p2.lat;
          currentLng = p2.lng;
        } else {
          const ratio = state.progress / (segmentDist || 1); 
          currentLat = p1.lat + (p2.lat - p1.lat) * ratio;
          currentLng = p1.lng + (p2.lng - p1.lng) * ratio;
        }

        const currentPos = new window.kakao.maps.LatLng(currentLat, currentLng);
        roadviewMarker.current.setPosition(currentPos);
        roadviewMarker.current.setMap(mapInstance.current);
        mapInstance.current.panTo(currentPos);

        if (!isFetchingPano.current && state.totalDistanceCovered - state.lastRoadviewUpdateDist > 8) {
           isFetchingPano.current = true;
           roadviewClient.current.getNearestPanoId(currentPos, 30, (panoId: any) => {
             if (panoId && roadviewInstance.current) roadviewInstance.current.setPanoId(panoId, currentPos);
             isFetchingPano.current = false;
           });
           state.lastRoadviewUpdateDist = state.totalDistanceCovered;
        }
        animationReqRef.current = requestAnimationFrame(driveLoop);
      };
      animationReqRef.current = requestAnimationFrame(driveLoop);
    } else {
      if (animationReqRef.current) { cancelAnimationFrame(animationReqRef.current); animationReqRef.current = null; }
    }
    return () => { if (animationReqRef.current) cancelAnimationFrame(animationReqRef.current); };
  }, [isDriving, routeData, mapLoaded, onStopDriving]);

  const toggleRoadview = () => {
    if (!mapInstance.current) return;
    const newMode = !isRoadviewMode;
    setIsRoadviewMode(newMode);
    if (newMode) {
      mapInstance.current.addOverlayMapTypeId(window.kakao.maps.MapTypeId.ROADVIEW);
    } else {
      mapInstance.current.removeOverlayMapTypeId(window.kakao.maps.MapTypeId.ROADVIEW);
      setIsRoadviewOpen(false);
      roadviewMarker.current.setMap(null);
      if (isDriving && onStopDriving) onStopDriving();
    }
  };

  useEffect(() => {
    if (!mapInstance.current || !window.kakao) return;
    if (markers.current.start) markers.current.start.setMap(null);
    if (markers.current.end) markers.current.end.setMap(null);
    if (startPoint) {
      const startMarker = new window.kakao.maps.Marker({ position: new window.kakao.maps.LatLng(startPoint.lat, startPoint.lng), image: new window.kakao.maps.MarkerImage('https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/blue_b.png', new window.kakao.maps.Size(32, 32)) });
      startMarker.setMap(mapInstance.current);
      markers.current.start = startMarker;
      if (!routeData) mapInstance.current.panTo(new window.kakao.maps.LatLng(startPoint.lat, startPoint.lng));
    }
    if (endPoint) {
      const endMarker = new window.kakao.maps.Marker({ position: new window.kakao.maps.LatLng(endPoint.lat, endPoint.lng), image: new window.kakao.maps.MarkerImage('https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/red_b.png', new window.kakao.maps.Size(32, 32)) });
      endMarker.setMap(mapInstance.current);
      markers.current.end = endMarker;
    }
  }, [startPoint, endPoint, routeData]);

  useEffect(() => {
    if (!mapInstance.current || !window.kakao) return;
    if (polylineRef.current) { polylineRef.current.setMap(null); polylineRef.current = null; }
    if (routeData && routeData.polyline) {
      const path = routeData.polyline.map(p => new window.kakao.maps.LatLng(p.lat, p.lng));
      const polyline = new window.kakao.maps.Polyline({ path: path, strokeWeight: 7, strokeColor: '#4F46E5', strokeOpacity: 0.8, strokeStyle: 'solid' });
      polyline.setMap(mapInstance.current);
      polylineRef.current = polyline;
      const bounds = new window.kakao.maps.LatLngBounds();
      path.forEach((pos: any) => bounds.extend(pos));
      mapInstance.current.setBounds(bounds);
    }
  }, [routeData]);

  useEffect(() => {
    if (!mapInstance.current || !clickedPos || !window.kakao) return;
    const content = `<div class="p-4 min-w-[200px] font-sans"><div class="mb-3"><p class="text-xs text-gray-400 font-bold mb-1">선택된 위치</p><p class="text-sm text-gray-900 font-bold leading-tight break-keep">${clickedPos.address}</p><p class="text-[10px] text-gray-400 mt-1 font-mono">${clickedPos.lat.toFixed(6)}, ${clickedPos.lng.toFixed(6)}</p></div><div class="flex gap-2 border-t pt-3 border-gray-100"><button id="btn-start" class="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs py-2 px-3 rounded-lg font-bold transition-colors shadow-sm">출발지로 설정</button><button id="btn-end" class="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs py-2 px-3 rounded-lg font-bold transition-colors shadow-sm">도착지로 설정</button></div></div>`;
    infoWindowRef.current.setContent(content);
    infoWindowRef.current.setPosition(new window.kakao.maps.LatLng(clickedPos.lat, clickedPos.lng));
    infoWindowRef.current.open(mapInstance.current);
    const timeout = setTimeout(() => {
      const startBtn = document.getElementById('btn-start');
      const endBtn = document.getElementById('btn-end');
      if (startBtn) startBtn.onclick = () => { onSetPoint('START', clickedPos); infoWindowRef.current.close(); setClickedPos(null); };
      if (endBtn) endBtn.onclick = () => { onSetPoint('END', clickedPos); infoWindowRef.current.close(); setClickedPos(null); };
    }, 100);
    return () => clearTimeout(timeout);
  }, [clickedPos, onSetPoint]);

  return (
    <div className="w-full h-full flex">
      <div className={`h-full transition-all duration-300 relative ${isRoadviewOpen ? 'w-1/2' : 'w-full'}`}>
        <div ref={mapRef} className="w-full h-full" />
        <div className="absolute right-4 top-4 z-50 flex flex-col gap-2">
           <button onClick={toggleRoadview} className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold border transition-all shadow-md ${isRoadviewMode ? 'bg-blue-500 text-white border-blue-600 ring-2 ring-blue-300' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`} title="로드뷰 켜기/끄기">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          </button>
        </div>
        <div className="absolute right-4 bottom-10 z-20 flex flex-col gap-2 shadow-lg">
          <button onClick={() => mapInstance.current?.setLevel(mapInstance.current.getLevel() - 1)} className="w-10 h-10 bg-white hover:bg-gray-100 rounded-lg flex items-center justify-center font-bold text-gray-600 border border-gray-200 transition-all">+</button>
          <button onClick={() => mapInstance.current?.setLevel(mapInstance.current.getLevel() + 1)} className="w-10 h-10 bg-white hover:bg-gray-100 rounded-lg flex items-center justify-center font-bold text-gray-600 border border-gray-200 transition-all">-</button>
        </div>
      </div>
      <div className={`h-full transition-all duration-300 bg-gray-900 relative border-l border-gray-700 ${isRoadviewOpen ? 'w-1/2 block' : 'w-0 hidden'}`}>
        <div ref={roadviewRef} className="w-full h-full" />
        <button onClick={() => { setIsRoadviewOpen(false); if (isDriving && onStopDriving) onStopDriving(); }} className="absolute top-4 right-4 z-30 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
};

export default MapContainer;
