import React from "react";
import { objectLayers } from "../data/gameData";
import { rectForObject, visibleObjects } from "../lib/gameState";

export function Stage({ room, gameState, onSelectObject }) {
  const objects = visibleObjects(room, gameState);

  return (
    <section className={`stage ${room.className}`}>
      <div className="perspective" aria-hidden="true">
        <div className="ceiling" />
        <div className="left-wall" />
        <div className="right-wall" />
        <div className="north-wall" />
        <div className="floor" />
      </div>
      <ObjectLayers room={room} gameState={gameState} />
      {objects.map(object => {
        const rect = rectForObject(object, gameState);
        return (
          <button
            key={object.id}
            className="hotspot"
            title={object.name}
            aria-label={object.name}
            style={rectStyle(rect)}
            onClick={event => onSelectObject(object.id, event.clientX, event.clientY)}
          />
        );
      })}
      {gameState.captionVisible && <div key={gameState.captionId} className="caption">{gameState.caption}</div>}
    </section>
  );
}

function ObjectLayers({ room, gameState }) {
  const layers = objectLayers[room.id] || [];
  return layers.flatMap(layer => {
    if (layer.visible && !layer.visible(gameState)) return [];
    const layerState = layer.state ? layer.state(gameState) : "default";
    const asset = layer.assets[layerState];
    if (!asset) return [];

    return (
      <img
        key={`${layer.id}-${layerState}`}
        className={`object-layer object-layer-${layer.id}`}
        src={asset.src}
        alt=""
        aria-hidden="true"
        style={rectStyle(asset.rect)}
      />
    );
  });
}

function rectStyle(rect) {
  return {
    left: `${rect.left}%`,
    top: `${rect.top}%`,
    width: `${rect.width}%`,
    height: `${rect.height}%`
  };
}
