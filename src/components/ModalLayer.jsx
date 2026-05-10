import React from "react";
import { AUTO_SLOT, MANUAL_SLOTS } from "../data/gameData";
import { formatSlot, getSlot, slotName } from "../lib/save";

export function ModalLayer({
  gameState,
  modal,
  onArmInventoryItem,
  onClose,
  onEatFood,
  onInspectInventoryItem,
  onLoadSlot,
  onOpenLoadMenu,
  onOpenSaveMenu,
  onSaveSlot,
  onSetSettings
}) {
  if (!modal) return null;

  return (
    <div>
      <div className="overlay" onClick={onClose} />
      {modal.type === "inventory-action" && (
        <div className="inventory-action">
          <h2>{modal.title}</h2>
          <p>{modal.body}</p>
          <div className="modal-actions">
            <button onClick={() => onInspectInventoryItem(modal.item)}>Inspect</button>
            <button onClick={() => onArmInventoryItem(modal.item)}>Use</button>
            <button onClick={onClose}>Close</button>
          </div>
        </div>
      )}
      {modal.type === "note" && (
        <div className="modal dialog">
          <h2>{modal.title}</h2>
          <p>{modal.body}</p>
          <div className="modal-actions">
            <button onClick={onClose}>X</button>
          </div>
        </div>
      )}
      {modal.type === "confirm-food" && (
        <div className="modal dialog">
          <h2>{modal.title}</h2>
          <p>{modal.body}</p>
          <div className="modal-actions">
            <button onClick={onEatFood}>Eat</button>
            <button onClick={onClose}>Cancel</button>
          </div>
        </div>
      )}
      {modal.type === "settings" && (
        <div className="modal dialog">
          <h2>Settings</h2>
          <div className="settings-grid">
            <label className="setting-row">
              <span>Volume {gameState.settings.volume}</span>
              <input
                type="range"
                min="0"
                max="100"
                value={gameState.settings.volume}
                onChange={event => onSetSettings({ volume: Number(event.target.value) })}
              />
            </label>
            <label className="toggle-row">
              <span>Subtitles</span>
              <input
                type="checkbox"
                checked={gameState.settings.subtitles}
                onChange={event => onSetSettings({ subtitles: event.target.checked })}
              />
            </label>
            <div className="modal-actions">
              <button onClick={onOpenSaveMenu}>Save</button>
              <button onClick={onOpenLoadMenu}>Load</button>
              <button onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      )}
      {(modal.type === "load" || modal.type === "save") && (
        <SlotModal modal={modal} onClose={onClose} onLoadSlot={onLoadSlot} onSaveSlot={onSaveSlot} />
      )}
    </div>
  );
}

function SlotModal({ modal, onClose, onLoadSlot, onSaveSlot }) {
  const isLoad = modal.type === "load";

  return (
    <div className="modal dialog">
      <h2>{modal.title}</h2>
      <div className="slot-list">
        {[AUTO_SLOT, ...MANUAL_SLOTS].map(slot => {
          const empty = !getSlot(slot);
          return (
            <button
              key={slot}
              className="slot-button"
              disabled={isLoad && empty}
              onClick={() => (isLoad ? onLoadSlot(slot) : onSaveSlot(slot))}
            >
              <strong>{slotName(slot)}</strong>
              <span>{formatSlot(slot)}</span>
            </button>
          );
        })}
      </div>
      <div className="modal-actions">
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
