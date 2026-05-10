import React from "react";
import { WORLD_SIZE, rooms } from "../data/gameData";
import { mapRoomStatus } from "../lib/gameState";

export function MapScreen({ gameState, onTravel, onCycleFloor }) {
  const floor = gameState.mapFloor;
  const cells = [];

  for (let y = WORLD_SIZE.y - 1; y >= 0; y -= 1) {
    for (let x = 0; x < WORLD_SIZE.x; x += 1) {
      const id = `${x},${y},${floor}`;
      const room = rooms[id];
      const visited = gameState.visitedRooms.includes(id);
      cells.push(
        <button
          key={id}
          className={`map-cell ${mapRoomStatus(id, gameState)} ${id === gameState.roomId ? "current" : ""}`}
          disabled={!room}
          title={room ? `${room.name} (${id})` : `Unknown (${id})`}
          aria-label={room ? `${room.name} ${id}` : `Unknown room ${id}`}
          onClick={() => visited && room && onTravel(id)}
        >
          <strong>{room && visited ? room.name : "?"}</strong>
          <span>{id}</span>
        </button>
      );
    }
  }

  return (
    <section className="stage map-stage">
      <div className="map-panel">
        <div className="map-heading">
          <div>
            <h2>Barn Map</h2>
            <p>Current room: {rooms[gameState.roomId].name} ({gameState.roomId})</p>
          </div>
          <button className="floor-button" onClick={() => onCycleFloor()}>
            Floor {floor + 1} / {WORLD_SIZE.z}
          </button>
        </div>
        <div className="map-grid">{cells}</div>
        <div className="map-legend">
          <span className="legend unknown">Unvisited</span>
          <span className="legend todo">To do</span>
          <span className="legend done">Complete</span>
        </div>
      </div>
    </section>
  );
}
