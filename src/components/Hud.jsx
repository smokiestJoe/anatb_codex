import React from "react";
import { itemLibrary, rooms } from "../data/gameData";

export function SettingsButton({ onOpenSettings }) {
  return (
    <button className="corner-button settings-toggle" title="Settings" aria-label="Settings" onClick={onOpenSettings}>
      ⚙
    </button>
  );
}

export function Health({ value }) {
  return (
    <div className="health">
      <div className="health-label">
        <span>Health</span>
        <span>{value}</span>
      </div>
      <div className="health-track">
        <div
          className="health-fill"
          style={{ width: `${value}%`, backgroundColor: `hsl(${value * 1.2}, 58%, 55%)` }}
        />
      </div>
    </div>
  );
}

export function MapButton({ isMap, currentRoomId, onToggle }) {
  return (
    <button
      className="corner-button map-toggle"
      title={isMap ? "GUI" : "Map"}
      aria-label={isMap ? "GUI" : "Map"}
      onClick={() => onToggle(rooms[currentRoomId].position.z)}
    >
      {isMap ? "▣" : "⌖"}
    </button>
  );
}

export function UseBanner({ selectedUseItemId }) {
  if (!selectedUseItemId) return null;
  return <div className="use-banner">Using {itemLibrary[selectedUseItemId].name}. Pick a target.</div>;
}
