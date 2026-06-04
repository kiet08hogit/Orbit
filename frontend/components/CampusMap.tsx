"use client";

import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { uicBuildings, UICBuilding } from "../data/uicBuildings";

interface CampusMapProps {
  onLocationSelect?: (building: UICBuilding) => void;
}

export default function CampusMap({ onLocationSelect }: CampusMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ id: string; el: HTMLDivElement }[]>([]);

  const [selectedBuilding, setSelectedBuilding] = useState<UICBuilding | null>(null);

  // Exact marker design from the reference
  const updateMarkerStyle = (el: HTMLDivElement, isSelected: boolean) => {
    el.style.width = "20px";
    el.style.height = "20px";
    el.style.background = isSelected ? "#DC2626" : "#2563eb";
    el.style.borderRadius = "50%";
    el.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";
    el.style.border = "2px solid white";
    el.style.cursor = "pointer";
    el.style.transformOrigin = "bottom";
    el.style.transition = "transform 0.2s ease-in-out, background-color 0.2s";

    // Scale up if selected
    if (isSelected) {
      el.style.transform = "scale(1.2)";
      el.style.zIndex = "20";
    } else {
      el.style.transform = "scale(1)";
      el.style.zIndex = "10";
    }
  };

  // 1. Initialize Map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [-87.6496, 41.8719],
      zoom: 16,
      pitch: 45,
      bearing: -17.6,
      antialias: true,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.current.on("load", () => {
      if (!map.current) return;
      map.current.addLayer({
        id: "3d-buildings",
        source: "composite",
        "source-layer": "building",
        filter: ["==", "extrude", "true"],
        type: "fill-extrusion",
        minzoom: 14,
        paint: {
          "fill-extrusion-color": "#e4e4e7",
          "fill-extrusion-height": ["get", "height"],
          "fill-extrusion-base": ["get", "min_height"],
          "fill-extrusion-opacity": 0.6,
        },
      });
    });

    // Create a shared popup for hover events (offset 25 matches the reference)
    const hoverPopup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 25,
      className: 'hover-popup shadow-lg rounded-lg overflow-hidden'
    });

    // Add markers
    uicBuildings.forEach((building) => {
      const el = document.createElement("div");
      el.className = "custom-marker";
      updateMarkerStyle(el, false);

      const popupNode = document.createElement("div");
      popupNode.className = "p-1 font-sans min-w-[160px]";

      const title = document.createElement("h3");
      title.className = "font-bold text-gray-900 mb-0.5 text-sm leading-tight";
      title.innerText = building.name;
      popupNode.appendChild(title);

      const cat = document.createElement("p");
      cat.className = "text-[10px] text-zinc-400 uppercase tracking-widest mb-3 font-black";
      cat.innerText = building.category;
      popupNode.appendChild(cat);

      const btn = document.createElement("button");
      btn.className = "bg-[#3252DF] hover:bg-[#2842B3] text-white font-bold py-1.5 px-3 rounded-md w-full text-xs transition-colors shadow-sm active:scale-95";
      btn.innerText = "Use this meetup location";
      btn.onclick = () => {
        setSelectedBuilding(building);
      };
      popupNode.appendChild(btn);

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false, closeOnClick: true })
        .setDOMContent(popupNode);

      if (map.current) {
        const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
          .setLngLat(building.coordinates)
          .setPopup(popup)
          .addTo(map.current);

        // Add hover events
        el.addEventListener('mouseenter', () => {
          if (popup.isOpen()) return;

          hoverPopup.setLngLat(building.coordinates)
            .setHTML(`
              <div class="p-2 font-sans bg-white min-w-[120px]">
                <div class="font-bold text-gray-900 text-sm leading-tight">${building.name}</div>
                <div class="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">${building.category}</div>
              </div>
            `)
            .addTo(map.current!);
        });

        el.addEventListener('mouseleave', () => {
          hoverPopup.remove();
        });
      }

      markersRef.current.push({ id: building.id, el });
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // 2. Update marker styles when selection changes
  useEffect(() => {
    markersRef.current.forEach(({ id, el }) => {
      updateMarkerStyle(el, selectedBuilding !== null && selectedBuilding.id === id);
    });
  }, [selectedBuilding]);

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 w-full rounded-2xl overflow-hidden shadow-sm relative border border-zinc-200">
        <div ref={mapContainer} className="w-full h-full" />

        {!process.env.NEXT_PUBLIC_MAPBOX_TOKEN && (
          <div className="absolute inset-0 bg-zinc-100 flex items-center justify-center text-zinc-500 font-medium z-10 p-4 text-center">
            Mapbox token missing. Please add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local
          </div>
        )}
      </div>

      {/* Selected Location Display */}
      {selectedBuilding && (
        <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-bottom-2">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-0.5">Selected meetup location</span>
            <span className="font-black text-emerald-900 text-lg">{selectedBuilding.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedBuilding(null)}
              className="text-emerald-600 hover:text-emerald-800 text-sm font-bold underline"
            >
              Clear
            </button>
            {onLocationSelect && (
              <button 
                onClick={() => onLocationSelect(selectedBuilding)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2 px-4 rounded-lg shadow-sm transition-colors"
              >
                Send Request
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
