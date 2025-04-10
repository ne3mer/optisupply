import React, { useState, useEffect } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { motion } from "framer-motion";
import { Tooltip } from "react-tooltip";

interface SupplierLocation {
  country: string;
  count: number;
  riskLevel: "high" | "medium" | "low";
}

interface SupplierMapProps {
  suppliers: SupplierLocation[];
}

const SupplierMap: React.FC<SupplierMapProps> = ({ suppliers }) => {
  const [geoData, setGeoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGeoData = async () => {
      try {
        const response = await fetch(
          "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
        );
        if (!response.ok) {
          throw new Error("Failed to fetch map data");
        }
        const data = await response.json();
        setGeoData(data);
      } catch (err) {
        console.error("Error fetching map data:", err);
        setError("Failed to load map data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchGeoData();
  }, []);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "high":
        return "#ef4444";
      case "medium":
        return "#f59e0b";
      case "low":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-danger">
        {error}
      </div>
    );
  }

  if (!geoData) {
    return null;
  }

  return (
    <div className="relative w-full h-full">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 100,
          center: [0, 0],
        }}
      >
        <ZoomableGroup>
          <Geographies geography={geoData}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const supplier = suppliers.find(
                  (s) =>
                    s.country.toLowerCase() ===
                    geo.properties.name.toLowerCase()
                );

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={
                      supplier ? getRiskColor(supplier.riskLevel) : "#e5e7eb"
                    }
                    stroke="#ffffff"
                    strokeWidth={0.5}
                    style={{
                      default: {
                        outline: "none",
                      },
                      hover: {
                        outline: "none",
                        fill: supplier
                          ? getRiskColor(supplier.riskLevel)
                          : "#d1d5db",
                        cursor: "pointer",
                      },
                      pressed: {
                        outline: "none",
                        fill: supplier
                          ? getRiskColor(supplier.riskLevel)
                          : "#9ca3af",
                      },
                    }}
                    data-tooltip-id={`tooltip-${geo.rsmKey}`}
                    data-tooltip-content={
                      supplier
                        ? `${supplier.country}: ${supplier.count} suppliers (${supplier.riskLevel} risk)`
                        : geo.properties.name
                    }
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
      <Tooltip id="tooltip" className="z-50" />
    </div>
  );
};

export default SupplierMap;
