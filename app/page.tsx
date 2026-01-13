
'use client';

import React, { useState, useCallback } from 'react';
import MapContainer from '../components/MapContainer';
import SearchBar from '../components/SearchBar';
import { Location, RouteData } from '../types';
import { getCarRoute } from '../services/kakaoService';

export default function Home() {
  const [startPoint, setStartPoint] = useState<Location | null>(null);
  const [endPoint, setEndPoint] = useState<Location | null>(null);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isDriving, setIsDriving] = useState<boolean>(false);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(50);

  const handleSetPoint = useCallback((type: 'START' | 'END', loc: Location) => {
    if (type === 'START') {
      setStartPoint(loc);
    } else {
      setEndPoint(loc);
    }
    setRouteData(null);
    setIsDriving(false);
  }, []);

  const handleSearchRoute = async () => {
    if (startPoint && endPoint) {
      setLoading(true);
      setIsDriving(false);
      const data = await getCarRoute(startPoint, endPoint);
      setRouteData(data);
      setLoading(false);
    }
  };

  const clearRoute = () => {
    setStartPoint(null);
    setEndPoint(null);
    setRouteData(null);
    setIsDriving(false);
  };

  const toggleDriving = () => {
    setIsDriving(prev => !prev);
  };

  return (
    <div className="relative w-full h-screen font-sans bg-gray-50 flex flex-col md:flex-row overflow-hidden items-center">
      {/* Sidebar */}
      <div className="w-full md:w-96 bg-white shadow-2xl z-10 flex flex-col order-2 md:order-1 overflow-hidden h-[70vh] md:ml-6 md:rounded-3xl border border-gray-100 transition-all duration-300">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="bg-yellow-400 p-2 rounded-lg mr-2 shadow-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A2 2 0 013 15.487V6.513a2 2 0 011.553-1.944L9 2l5.447 2.724A2 2 0 0116 6.513v8.974a2 2 0 01-1.553 1.944L9 20z" />
                </svg>
              </span>
              Route Explorer
            </h1>

            <div className="space-y-4">
              <SearchBar onSelectLocation={(loc) => handleSetPoint('START', loc)} placeholder="출발지 (지명/주소 검색)" label="출발" />
              <SearchBar onSelectLocation={(loc) => handleSetPoint('END', loc)} placeholder="도착지 (지명/주소 검색)" label="도착" />
            </div>

            <div className="mt-8 space-y-4">
              {startPoint && (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-1 shrink-0">출</div>
                  <div className="overflow-hidden">
                    <p className="text-xs text-blue-600 font-semibold uppercase mb-0.5">출발지</p>
                    {startPoint.name && <p className="text-sm font-bold text-gray-800 truncate">{startPoint.name}</p>}
                    <p className={`${startPoint.name ? 'text-xs text-gray-500' : 'text-sm text-gray-800'} truncate`}>{startPoint.address}</p>
                  </div>
                </div>
              )}

              {endPoint && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-1 shrink-0">도</div>
                  <div className="overflow-hidden">
                    <p className="text-xs text-red-600 font-semibold uppercase mb-0.5">도착지</p>
                    {endPoint.name && <p className="text-sm font-bold text-gray-800 truncate">{endPoint.name}</p>}
                    <p className={`${endPoint.name ? 'text-xs text-gray-500' : 'text-sm text-gray-800'} truncate`}>{endPoint.address}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                {(startPoint || endPoint) && (
                  <button onClick={clearRoute} className="flex-1 py-3 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 hover:text-red-500 rounded-xl font-bold transition-all">초기화</button>
                )}
                {startPoint && endPoint && (
                  <button onClick={handleSearchRoute} disabled={loading || isDriving} className={`flex-[2] py-3 text-sm text-white rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 ${loading || isDriving ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg'}`}>
                    {loading ? '탐색 중...' : '경로 탐색'}
                  </button>
                )}
              </div>
            </div>

            {routeData && !loading && (
              <div className="mt-8 p-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white shadow-lg animate-fade-in">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div><p className="text-indigo-100 text-xs mb-1">총 거리</p><p className="text-xl font-bold">{(routeData.distance / 1000).toFixed(1)} km</p></div>
                  <div><p className="text-indigo-100 text-xs mb-1">예상 시간</p><p className="text-xl font-bold">{Math.round(routeData.duration / 60)} 분</p></div>
                </div>
                
                <div className="pt-4 border-t border-white/20">
                  <button onClick={toggleDriving} className={`w-full py-3 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 mb-4 ${isDriving ? 'bg-white text-red-500 hover:bg-gray-100' : 'bg-green-500 text-white hover:bg-green-600'}`}>
                    {isDriving ? '모의 주행 종료' : `모의 주행 시작 (${simulationSpeed}km/h)`}
                  </button>
                  <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/20">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-medium text-indigo-100">주행 속도</label>
                        <span className="text-sm font-bold">{simulationSpeed} km/h</span>
                    </div>
                    <input type="range" min="10" max="100" step="5" value={simulationSpeed} onChange={(e) => setSimulationSpeed(Number(e.target.value))} className="w-full h-2 bg-indigo-900/50 rounded-lg appearance-none cursor-pointer accent-white" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map Content */}
      <div className="flex-1 h-full relative order-1 md:order-2">
        <MapContainer 
          startPoint={startPoint} endPoint={endPoint} routeData={routeData} 
          onSetPoint={handleSetPoint} isDriving={isDriving} simulationSpeed={simulationSpeed} 
          onStopDriving={() => setIsDriving(false)} 
        />
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-md text-xs font-medium text-gray-600 hidden md:block border border-gray-200">
          지도를 클릭하여 출발/도착 지점을 선택할 수 있습니다.
        </div>
      </div>
    </div>
  );
}
