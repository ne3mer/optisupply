import React from "react";

// Placeholder for the WorldMap component
// TODO: Implement actual map visualization (e.g., using react-simple-maps)

interface WorldMapProps {
  data: Array<{ id: string; value: number }>;
  onCountryClick: (countryCode: string | null) => void;
  mapColor?: string;
  dataColor?: string;
  selectedColor?: string;
}

const WorldMap: React.FC<WorldMapProps> = ({
  data,
  onCountryClick,
  mapColor = "#334155",
  dataColor = "#00F0FF",
  selectedColor = "#FF00FF",
}) => {
  console.log("WorldMap data received:", data); // Log received data
  console.log("Map Color:", mapColor);
  console.log("Data Color:", dataColor);
  console.log("Selected Color:", selectedColor);

  return (
    <div
      className="w-full h-full flex items-center justify-center border-2 border-dashed rounded-lg"
      style={{ borderColor: mapColor, backgroundColor: mapColor + "10" }}
    >
      <div className="text-center p-4">
        <p style={{ color: dataColor }} className="text-lg font-semibold">
          World Map Placeholder
        </p>
        <p style={{ color: mapColor }} className="text-sm mt-1">
          (Map visualization to be implemented here)
        </p>
        <button
          onClick={() => onCountryClick("US")} // Example interaction
          className="mt-4 px-3 py-1 rounded text-xs"
          style={{
            backgroundColor: selectedColor + "30",
            color: selectedColor,
          }}
        >
          Test Click (US)
        </button>
      </div>
    </div>
  );
};

export default WorldMap;
