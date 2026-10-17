import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, AlertTriangle, Truck, ArrowRight, ShieldCheck, Check, X } from 'lucide-react';
import { SiteConditions, EquipmentRecommendation } from '../types';

interface RouteAccessPlannerProps {
  site: SiteConditions;
  setSite: React.Dispatch<React.SetStateAction<SiteConditions>>;
  recommendations: EquipmentRecommendation[];
}

export const RouteAccessPlanner: React.FC<RouteAccessPlannerProps> = ({
  site,
  setSite,
  recommendations
}) => {
  const [startPoint, setStartPoint] = useState<string>('Sanitation Depot / Main Road');
  const [endPoint, setEndPoint] = useState<string>('Hillside Containment Pit Cluster');
  const [manualDistanceM, setManualDistanceM] = useState<number>(site.route_length_m);
  const [hasNarrowPinchPoint, setHasNarrowPinchPoint] = useState<boolean>(site.access_width_m < 1.5);
  const [hasSteepStairs, setHasSteepStairs] = useState<boolean>(site.slope_degrees > 20);
  const [mapInitialized, setMapInitialized] = useState<boolean>(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);

  // Initialize Leaflet Map safely when window.L or leaflet package is loaded
  useEffect(() => {
    let mapInstance: any = null;

    const initMap = async () => {
      try {
        if (!mapContainerRef.current || leafletMapRef.current) return;
        const L = (window as any).L || (await import('leaflet')).default;

        // Coordinates default centered around typical mountain settlement (e.g. 31.1048° N, 77.1734° E Shimla / Himachal)
        const lat = 31.1048;
        const lng = 77.1734;

        mapInstance = L.map(mapContainerRef.current, {
          center: [lat, lng],
          zoom: 15,
          zoomControl: true
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(mapInstance);

        // Add Start marker (Depot / Vehicle Stop)
        const startIcon = L.divIcon({
          className: 'custom-start-marker',
          html: `<div style="background-color: #10b981; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.5);">A</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });
        L.marker([lat, lng], { icon: startIcon }).addTo(mapInstance).bindPopup("<b>Starting Depot / Road Access Point</b><br>Truck turnaround area.");

        // Add End marker (Pit site)
        const endIcon = L.divIcon({
          className: 'custom-end-marker',
          html: `<div style="background-color: #ef4444; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.5);">B</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });
        L.marker([lat + 0.006, lng + 0.005], { icon: endIcon }).addTo(mapInstance).bindPopup("<b>Sanitation Facility / Pit Location</b><br>Slope: " + site.slope_degrees + "°.");

        // Draw illustrative route polyline
        const routeCoords = [
          [lat, lng],
          [lat + 0.002, lng + 0.001],
          [lat + 0.0035, lng + 0.003],
          [lat + 0.006, lng + 0.005]
        ];
        L.polyline(routeCoords, { color: '#10b981', weight: 4, opacity: 0.8, dashArray: '8, 6' }).addTo(mapInstance);

        leafletMapRef.current = mapInstance;
        setMapInitialized(true);
      } catch (err) {
        console.warn('Leaflet offline or tile server unreachable:', err);
      }
    };

    initMap();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  const handleApplyDistance = () => {
    setSite((prev) => ({
      ...prev,
      route_length_m: manualDistanceM
    }));
  };

  // Compare vehicle proximity vs carry-in
  const vehicleRec = recommendations.find((r) => r.equipment.equipment_type === 'small_vacuum_tanker');
  const portableRec = recommendations.find((r) => r.equipment.equipment_type === 'portable_pump_hose' || r.equipment.equipment_type === 'remote_tracked_unit');

  return (
    <div className="space-y-6">
      {/* Route & Access Header */}
      <div className="bg-slate-850 rounded-xl border border-slate-800 p-5 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Navigation className="w-5 h-5 text-emerald-400" />
              <span>Route & Access Corridor Planner</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Geographic corridor evaluation comparing vehicular access vs portable equipment transport
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="bg-slate-900 border border-slate-700 px-3 py-1 rounded-lg text-xs font-mono text-emerald-400">
              Corridor Width: {site.access_width_m}m · Surface: {site.road_surface}
            </span>
          </div>
        </div>

        {/* Route Points & Manual Distance Fallback */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Point A: Staging / Vehicle Access Stop</label>
            <input
              type="text"
              value={startPoint}
              onChange={(e) => setStartPoint(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Point B: Containment Pit Location</label>
            <input
              type="text"
              value={endPoint}
              onChange={(e) => setEndPoint(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Transit Route Length (m)</label>
            <div className="flex space-x-1.5">
              <input
                type="number"
                min="50"
                max="50000"
                step="50"
                value={manualDistanceM}
                onChange={(e) => setManualDistanceM(parseFloat(e.target.value) || 50)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-mono"
              />
              <button
                onClick={handleApplyDistance}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded font-medium text-xs whitespace-nowrap"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Map View & Route Constraints */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaflet Map Canvas - Expanded Height for Panoramic GIS View */}
        <div className="lg:col-span-2 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col h-[560px]">
          <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-200 flex items-center space-x-1.5">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Interactive Geographic Map (OpenStreetMap GIS View)</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              GPS: 31.1048° N, 77.1734° E (Shimla Corridor)
            </span>
          </div>

          <div ref={mapContainerRef} className="w-full flex-1 z-0 bg-slate-900 relative">
            {!mapInitialized && (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs">
                Loading GIS map tiles...
              </div>
            )}
          </div>
        </div>

        {/* Route Bottleneck Constraints & Options */}
        <div className="space-y-4 text-xs">
          <div className="bg-slate-850 rounded-xl border border-slate-800 p-4 shadow-md">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Access Corridor Pinch-Points</span>
            </h3>

            <div className="space-y-2.5">
              <label className="flex items-center space-x-2 bg-slate-900 p-2.5 rounded border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasNarrowPinchPoint}
                  onChange={(e) => {
                    setHasNarrowPinchPoint(e.target.checked);
                    if (e.target.checked && site.access_width_m > 1.2) {
                      setSite((prev) => ({ ...prev, access_width_m: 1.1 }));
                    }
                  }}
                  className="rounded text-emerald-500 focus:ring-0"
                />
                <div>
                  <div className="text-slate-200 font-medium">Narrow Alleyway (&lt; 1.3m)</div>
                  <div className="text-[10px] text-slate-400">Blocks trucks &amp; standard 4-wheel trailers</div>
                </div>
              </label>

              <label className="flex items-center space-x-2 bg-slate-900 p-2.5 rounded border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasSteepStairs}
                  onChange={(e) => {
                    setHasSteepStairs(e.target.checked);
                    if (e.target.checked && site.slope_degrees < 22) {
                      setSite((prev) => ({ ...prev, slope_degrees: 25.0 }));
                    }
                  }}
                  className="rounded text-emerald-500 focus:ring-0"
                />
                <div>
                  <div className="text-slate-200 font-medium">Steep Stairs / Rock Terraces</div>
                  <div className="text-[10px] text-slate-400">Requires crawler tracks or 2-man carry harnesses</div>
                </div>
              </label>
            </div>
          </div>

          {/* Vehicle Proximity vs Portable Carry Comparison */}
          <div className="bg-slate-850 rounded-xl border border-slate-800 p-4 shadow-md">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
              <Truck className="w-4 h-4 text-emerald-400" />
              <span>Deployment Mode Comparison</span>
            </h3>

            <div className="space-y-3">
              {/* Option A: Tanker close */}
              <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-200">Approach A: Vacuum Tanker</span>
                  {vehicleRec?.is_feasible ? (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center space-x-1">
                      <Check className="w-3 h-3" />
                      <span>Traversable</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-rose-400 font-semibold flex items-center space-x-1">
                      <X className="w-3 h-3" />
                      <span>Infeasible</span>
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400">
                  {vehicleRec?.is_feasible
                    ? 'Road width and slope permit 4x4 commercial tanker right to pit.'
                    : `Blocked by ${vehicleRec?.rejection_reasons[0] || 'road width/slope constraints'}.`}
                </div>
              </div>

              {/* Option B: Carry-in / Remote Crawler */}
              <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-200">Approach B: Portable Carry-In</span>
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center space-x-1">
                    <Check className="w-3 h-3" />
                    <span>Always Feasible</span>
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Vehicle stays on paved road (A); crew carries portable pump/hose {site.distance_to_facility_m}m to pit (B).
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
