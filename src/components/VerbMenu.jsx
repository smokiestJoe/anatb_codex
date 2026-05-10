import React from "react";
import { rooms } from "../data/gameData";
import { visibleObjects } from "../lib/gameState";

export function VerbMenu({ activeMenu, gameState, onRunVerb }) {
  const room = rooms[gameState.roomId];
  const object = visibleObjects(room, gameState).find(candidate => candidate.id === activeMenu.objectId);
  if (!object) return null;

  const x = Math.min(Math.max(activeMenu.x - 160, 12), window.innerWidth - 372);
  const y = Math.min(Math.max(activeMenu.y - 30, 70), window.innerHeight - 310);

  return (
    <div className="verb-menu" style={{ left: `${x}px`, top: `${y}px` }}>
      <h2>{object.name}</h2>
      <div className="verb-grid">
        {object.verbs.map(verb => (
          <button key={verb} onClick={() => onRunVerb(verb, object.id)}>
            {verbLabel(verb)}
          </button>
        ))}
      </div>
      <button onClick={() => onRunVerb("cancel", object.id)}>Cancel</button>
    </div>
  );
}

function verbLabel(verb) {
  return verb.charAt(0).toUpperCase() + verb.slice(1);
}
