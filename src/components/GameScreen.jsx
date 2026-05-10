import React from "react";
import { Health, MapButton, SettingsButton, UseBanner } from "./Hud";
import { InventoryDismiss, InventoryOverlay, InventoryToggle } from "./Inventory";
import { MapScreen } from "./MapScreen";
import { Stage } from "./Stage";
import { VerbMenu } from "./VerbMenu";

export function GameScreen({
  activeMenu,
  currentRoom,
  gameState,
  modalLayer,
  onCloseActiveMenu,
  onCloseInventory,
  onCycleFloor,
  onOpenInventoryItem,
  onOpenSettings,
  onRunVerb,
  onSelectObject,
  onSetInventoryTab,
  onToggleInventory,
  onToggleMap,
  onTravelFromMap
}) {
  const isMap = gameState.gameView === "map";

  return (
    <section className="screen game-screen">
      <div className="stage-wrap">
        {isMap ? (
          <MapScreen gameState={gameState} onTravel={onTravelFromMap} onCycleFloor={onCycleFloor} />
        ) : (
          <Stage room={currentRoom} gameState={gameState} onSelectObject={onSelectObject} />
        )}
        <SettingsButton onOpenSettings={onOpenSettings} />
        <Health value={gameState.health} />
        <MapButton isMap={isMap} currentRoomId={gameState.roomId} onToggle={onToggleMap} />
        <InventoryToggle onToggle={onToggleInventory} />
        {gameState.inventoryOpen && <InventoryDismiss onClose={onCloseInventory} />}
        {gameState.inventoryOpen && (
          <InventoryOverlay
            activeTab={gameState.activeInventoryTab}
            inventory={gameState.inventory}
            onOpenItem={onOpenInventoryItem}
            onSetTab={onSetInventoryTab}
          />
        )}
        <UseBanner selectedUseItemId={gameState.selectedUseItemId} />
        {activeMenu && <button className="action-dismiss" aria-label="Close object menu" onClick={onCloseActiveMenu} />}
        {activeMenu && <VerbMenu activeMenu={activeMenu} gameState={gameState} onRunVerb={onRunVerb} />}
        {modalLayer}
      </div>
    </section>
  );
}
