import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameScreen } from "./components/GameScreen";
import { IntroScreen } from "./components/IntroScreen";
import { MenuScreen } from "./components/MenuScreen";
import { ModalLayer } from "./components/ModalLayer";
import { OrientationGate } from "./components/OrientationGate";
import { SplashScreen } from "./components/SplashScreen";
import { AUTO_SLOT, WORLD_SIZE, initialState, itemLibrary, rooms } from "./data/gameData";
import { playSfx } from "./lib/audio";
import { addInventoryItem, cloneGameState, targetLabel, visibleObjects } from "./lib/gameState";
import { hasAnySave, loadSlotState, saveToSlot, slotName } from "./lib/save";

export function App() {
  const [gameState, setGameState] = useState(initialState);
  const [activeMenu, setActiveMenu] = useState(null);
  const [modal, setModal] = useState(null);
  const captionTimer = useRef(null);

  const currentRoom = rooms[gameState.roomId];

  const scheduleCaptionFade = useCallback(() => {
    clearTimeout(captionTimer.current);
    captionTimer.current = setTimeout(() => {
      setGameState(previous => (previous.screen === "game" ? { ...previous, captionVisible: false } : previous));
    }, 5200);
  }, []);

  const setCaption = useCallback((message) => {
    setGameState(previous => ({
      ...previous,
      caption: message,
      captionId: previous.captionId + 1,
      captionVisible: true
    }));
    scheduleCaptionFade();
  }, [scheduleCaptionFade]);

  const play = useCallback((name) => {
    playSfx(name, gameState.settings);
  }, [gameState.settings]);

  const setGameStateWithCaption = useCallback((nextState, message) => {
    setGameState(previous => ({
      ...nextState,
      caption: message,
      captionId: previous.captionId + 1,
      captionVisible: true
    }));
    scheduleCaptionFade();
  }, [scheduleCaptionFade]);

  useEffect(() => {
    if (gameState.screen !== "splash") return undefined;
    const timer = setTimeout(() => {
      setGameState(previous => ({ ...previous, screen: "menu" }));
    }, 1800);
    return () => clearTimeout(timer);
  }, [gameState.screen]);

  useEffect(() => {
    if (gameState.screen !== "intro") return undefined;
    const timer = setTimeout(() => beginGame(), 26000);
    return () => clearTimeout(timer);
  }, [gameState.screen]);

  useEffect(() => {
    const onKeyDown = event => {
      if (event.key !== "Escape") return;
      if (gameState.screen === "intro") {
        beginGame();
        return;
      }

      setActiveMenu(null);
      setModal(null);
      if (gameState.selectedUseItemId) {
        setGameState(previous => ({ ...previous, selectedUseItemId: null }));
        setCaption("You stop trying to use that.");
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [gameState.screen, gameState.selectedUseItemId, setCaption]);

  function newGame() {
    clearTimeout(captionTimer.current);
    const nextState = initialState();
    nextState.screen = "intro";
    setActiveMenu(null);
    setModal(null);
    setGameState(nextState);
  }

  function beginGame() {
    const nextState = cloneGameState(gameState);
    nextState.screen = "game";
    nextState.gameView = "room";
    nextState.caption = rooms[nextState.roomId].description;
    nextState.captionId = gameState.captionId + 1;
    nextState.captionVisible = true;
    saveToSlot(AUTO_SLOT, nextState);
    setGameState(nextState);
    scheduleCaptionFade();
  }

  function loadSlot(slot) {
    const loadedState = loadSlotState(slot);
    if (!loadedState) return false;
    setActiveMenu(null);
    setModal(null);
    loadedState.caption = `Loaded ${slotName(slot)}.`;
    loadedState.captionId = gameState.captionId + 1;
    loadedState.captionVisible = true;
    setGameState(loadedState);
    scheduleCaptionFade();
    return true;
  }

  function openLoadMenu() {
    setModal({ type: "load", title: "Load Game" });
    setActiveMenu(null);
  }

  function openSaveMenu() {
    setModal({ type: "save", title: "Save Game" });
    setActiveMenu(null);
  }

  function selectObject(objectId, x, y) {
    const room = rooms[gameState.roomId];
    const object = visibleObjects(room, gameState).find(candidate => candidate.id === objectId);
    if (!object) return;

    if (gameState.selectedUseItemId) {
      useItemWithTarget(gameState.selectedUseItemId, objectId);
      return;
    }

    if (objectId === "barnDoor" && gameState.flags.barnDoorUnlocked) {
      moveToRoom("3,1,0");
      return;
    }

    setActiveMenu({ objectId, x, y });
    setModal(null);
  }

  function runVerb(verb, objectId) {
    setActiveMenu(null);
    if (verb === "cancel") return;

    const room = rooms[gameState.roomId];
    const object = visibleObjects(room, gameState).find(candidate => candidate.id === objectId);
    if (!object) return;

    if (verb === "pickup") pickupObject(objectId);
    else if (verb === "open") openObject(objectId);
    else if (verb === "close") closeObject(objectId);
    else if (verb === "use") beginUseObject(objectId);
    else if (verb === "inspect") inspectObject(objectId);
    else if (verb === "push" || verb === "pull") {
      const { nextState, caption, sfx } = pushPullObject(verb, objectId);
      if (sfx) play(sfx);
      setGameStateWithCaption(nextState, caption);
    }
  }

  function pickupObject(objectId) {
    const nextState = cloneGameState(gameState);

    if (objectId === "hiddenKey") {
      nextState.flags.keyTaken = true;
      addInventoryItem(nextState, "barnKey");
      saveToSlot(AUTO_SLOT, nextState);
      play("pickup");
      setGameStateWithCaption(nextState, "You pick up the barn key. It knows exactly which lock it wants.");
      return;
    }

    if (objectId === "doorMat") {
      play("fail");
      setCaption("It is too damp and loyal to take with you.");
      return;
    }

    if (objectId === "coatShadow") {
      play("rustle");
      setCaption("The coat refuses to become luggage.");
      return;
    }

    play("fail");
    setCaption("That does not seem portable.");
  }

  function openObject(objectId) {
    const nextState = cloneGameState(gameState);

    if (objectId === "doorMat") {
      if (nextState.flags.matLifted) {
        play("fail");
        setCaption("You already moved it");
        return;
      }

      nextState.flags.matLifted = true;
      play("rustle");
      setGameStateWithCaption(nextState, "You lift the mat. A key glints beneath it with theatrical timing.");
      return;
    }

    if (objectId === "barnDoor") {
      if (!nextState.flags.barnDoorUnlocked) {
        play("fail");
        setCaption("The barn door is locked. The keyhole looks smug.");
        return;
      }
      moveToRoom("3,1,0");
      return;
    }

    if (objectId === "hallDrawer" || objectId === "hallStand") {
      if (!nextState.flags.hallDrawerOpen) {
        nextState.flags.hallDrawerOpen = true;
        addInventoryItem(nextState, "receiptNote");
        play("drawer");
        setGameStateWithCaption(nextState, "The drawer slides open. Inside is a faded receipt.");
      } else {
        play("wood");
        setCaption("The drawer is already open, revealing its shallow wooden mouth.");
      }
      return;
    }

    if (objectId === "northExit") {
      play("fail");
      setCaption("That part of the barn has not been drawn into the world yet.");
      return;
    }

    play("fail");
    setCaption("It does not open from this angle.");
  }

  function closeObject(objectId) {
    const nextState = cloneGameState(gameState);

    if (objectId === "hallDrawer" || objectId === "hallStand") {
      if (nextState.flags.hallDrawerOpen) {
        nextState.flags.hallDrawerOpen = false;
        play("drawer");
        setGameStateWithCaption(nextState, "You close the drawer. Something inside taps once.");
      } else {
        play("fail");
        setCaption("It is already closed.");
      }
      return;
    }

    if (objectId === "barnDoor") {
      play("fail");
      setCaption("You are on the wrong side for a meaningful close.");
      return;
    }

    play("fail");
    setCaption("Closed is not a state it currently understands.");
  }

  function beginUseObject(objectId) {
    if (gameState.selectedUseItemId) {
      useItemWithTarget(gameState.selectedUseItemId, objectId);
      return;
    }

    if (objectId === "barnDoor") {
      play("inspect");
      setCaption("Use what with the door?");
      return;
    }

    play("fail");
    setCaption("You use your best judgment. It remains unimpressed.");
  }

  function inspectObject(objectId) {
    const lines = {
      barnDoor: gameState.flags.barnDoorUnlocked
        ? "The unlocked door hangs slightly open, showing a sliver of impossible dark."
        : "A warped barn door. The lock is bright, modern, and rude.",
      doorMat: gameState.flags.matLifted
        ? "The mat is folded back. It has given up its secret."
        : "A scratchy mat reading WELCOME, though the letters are arranged like a warning.",
      hiddenKey: "A brass door key with a tooth pattern like a tiny skyline.",
      northExit: "A doorway into a room for a later chapter.",
      hallStand: "A narrow hall stand. Its drawer is angled so you can see inside when open.",
      hallDrawer: gameState.flags.hallDrawerOpen
        ? "The open drawer contains dust, a note, and a smell like old coins."
        : "The drawer sits proud of the frame, begging to be pulled.",
      coatShadow: "A coat or a shadow pretending to be one. Both options are bad tailoring."
    };
    play("inspect");
    setCaption(lines[objectId] || "There is nothing useful to learn from that.");
  }

  function pushPullObject(verb, objectId) {
    const nextState = cloneGameState(gameState);

    if (objectId === "doorMat") {
      if (nextState.flags.matLifted) {
        return { nextState, caption: "You already moved it", sfx: "fail" };
      }

      nextState.flags.matLifted = true;
      return {
        nextState,
        caption: verb === "pull"
          ? "You pull the mat aside. A key waits underneath."
          : "You shove the mat into a wrinkle. A key catches the light.",
        sfx: "rustle"
      };
    }

    if (objectId === "barnDoor") {
      return {
        nextState,
        caption: nextState.flags.barnDoorUnlocked
          ? "The door swings inward with a long wooden complaint."
          : "The locked door shudders, but stays shut.",
        sfx: nextState.flags.barnDoorUnlocked ? "wood" : "fail"
      };
    }

    if (objectId === "hallDrawer") {
      nextState.flags.hallDrawerOpen = true;
      addInventoryItem(nextState, "receiptNote");
      return { nextState, caption: "The drawer opens enough to show its contents.", sfx: "drawer" };
    }

    return {
      nextState,
      caption: `You ${verb} it. The barn files a silent objection.`,
      sfx: objectId === "coatShadow" ? "rustle" : "wood"
    };
  }

  function useItemWithTarget(itemId, targetId) {
    const nextState = cloneGameState(gameState);
    nextState.selectedUseItemId = null;

    if (itemId === "barnKey" && targetId === "barnDoor") {
      nextState.flags.barnDoorUnlocked = true;
      saveToSlot(AUTO_SLOT, nextState);
      setActiveMenu(null);
      setModal(null);
      play("unlock");
      setGameStateWithCaption(nextState, "The key turns once. The barn door unlocks and exhales.");
      return;
    }

    const item = itemLibrary[itemId];
    setActiveMenu(null);
    setModal(null);
    play("fail");
    setGameStateWithCaption(nextState, `${item?.name || "That"} has no useful effect on ${targetLabel(targetId, gameState.roomId)} yet.`);
  }

  function moveToRoom(roomId) {
    if (!rooms[roomId]) return;
    const nextState = cloneGameState(gameState);
    nextState.roomId = roomId;
    if (!nextState.visitedRooms.includes(roomId)) nextState.visitedRooms.push(roomId);
    nextState.caption = rooms[roomId].description;
    nextState.captionId += 1;
    nextState.captionVisible = true;
    saveToSlot(AUTO_SLOT, nextState);
    play("wood");
    setGameState(nextState);
    scheduleCaptionFade();
  }

  function openInventoryItem(id) {
    const item = Object.values(gameState.inventory).flat().find(candidate => candidate.id === id);
    if (!item) return;

    if (item.type === "food") {
      setModal({ type: "confirm-food", title: item.name, body: "Are you sure you want to eat this?", item });
    } else if (item.type === "note") {
      setModal({ type: "note", title: item.name, body: item.description });
    } else {
      setModal({ type: "inventory-action", title: item.name, body: item.description, item });
    }
    setActiveMenu(null);
    setGameState(previous => ({ ...previous, inventoryOpen: false }));
  }

  function inspectInventoryItem(item) {
    setModal(null);
    setCaption(item.description);
  }

  function armInventoryItem(item) {
    setModal(null);
    setGameState(previous => ({ ...previous, selectedUseItemId: item.id }));
    setCaption(`Use ${item.name} with what?`);
  }

  function saveManualSlot(slot) {
    saveToSlot(slot, gameState);
    setModal(null);
    setCaption(`Saved to ${slotName(slot)}.`);
  }

  function travelFromMap(roomId) {
    const room = rooms[roomId];
    if (!room) return;
    const nextState = cloneGameState(gameState);
    nextState.roomId = roomId;
    nextState.gameView = "room";
    setGameStateWithCaption(nextState, room.description);
  }

  function toggleMap(currentFloor) {
    setActiveMenu(null);
    setGameState(previous => ({
      ...previous,
      gameView: previous.gameView === "map" ? "room" : "map",
      mapFloor: previous.gameView === "map" ? previous.mapFloor : currentFloor,
      inventoryOpen: false
    }));
  }

  function cycleMapFloor() {
    setGameState(previous => ({ ...previous, mapFloor: (previous.mapFloor + 1) % WORLD_SIZE.z }));
  }

  const modalLayer = useMemo(() => (
    <ModalLayer
      gameState={gameState}
      modal={modal}
      onArmInventoryItem={armInventoryItem}
      onClose={() => setModal(null)}
      onEatFood={() => {
        setModal(null);
        setCaption("You eat it. We will wire consequences later.");
      }}
      onInspectInventoryItem={inspectInventoryItem}
      onLoadSlot={loadSlot}
      onOpenLoadMenu={openLoadMenu}
      onOpenSaveMenu={openSaveMenu}
      onSaveSlot={saveManualSlot}
      onSetSettings={settings => setGameState(previous => ({
        ...previous,
        settings: { ...previous.settings, ...settings }
      }))}
    />
  ), [gameState, modal]);

  let screen = null;
  if (gameState.screen === "splash") screen = <SplashScreen />;
  if (gameState.screen === "menu") {
    screen = (
      <MenuScreen
        canContinue={hasAnySave()}
        modalLayer={modalLayer}
        onContinue={() => loadSlot(AUTO_SLOT) || openLoadMenu()}
        onLoadGame={openLoadMenu}
        onNewGame={newGame}
      />
    );
  }
  if (gameState.screen === "intro") screen = <IntroScreen onSkip={beginGame} />;
  if (gameState.screen === "game") {
    screen = (
      <GameScreen
        activeMenu={activeMenu}
        currentRoom={currentRoom}
        gameState={gameState}
        modalLayer={modalLayer}
        onCloseActiveMenu={() => setActiveMenu(null)}
        onCloseInventory={() => setGameState(previous => ({ ...previous, inventoryOpen: false }))}
        onOpenInventoryItem={openInventoryItem}
        onOpenSettings={() => {
          setModal({ type: "settings", title: "Settings" });
          setActiveMenu(null);
        }}
        onRunVerb={runVerb}
        onSelectObject={selectObject}
        onSetInventoryTab={tab => setGameState(previous => ({ ...previous, activeInventoryTab: tab }))}
        onToggleInventory={() => {
          setActiveMenu(null);
          setGameState(previous => ({ ...previous, inventoryOpen: !previous.inventoryOpen }));
        }}
        onToggleMap={toggleMap}
        onCycleFloor={cycleMapFloor}
        onTravelFromMap={travelFromMap}
      />
    );
  }

  return (
    <>
      {screen}
      <OrientationGate />
    </>
  );
}
