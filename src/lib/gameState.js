import { itemLibrary, rooms } from "../data/gameData";

export function cloneGameState(state) {
  return {
    ...state,
    flags: { ...state.flags },
    settings: { ...state.settings },
    visitedRooms: [...state.visitedRooms],
    inventory: {
      item: [...state.inventory.item],
      food: [...state.inventory.food],
      note: [...state.inventory.note]
    }
  };
}

export function visibleObjects(room, state) {
  return room.objects.filter(object => !object.visible || object.visible(state));
}

export function inventoryHas(inventory, id) {
  return Object.values(inventory).some(items => items.some(item => item.id === id));
}

export function addInventoryItem(state, id) {
  const item = itemLibrary[id];
  if (!item || inventoryHas(state.inventory, id)) return;
  state.inventory[item.type].push(item);
}

export function rectForObject(object, state) {
  if (state.roomId === "3,0,0" && object.id === "doorMat" && state.flags.matLifted) {
    return { left: 61, top: 73.5, width: 16, height: 15 };
  }

  return object.rect;
}

export function mapRoomStatus(roomId, state) {
  if (!state.visitedRooms.includes(roomId)) return "unknown";
  return isRoomComplete(roomId, state) ? "done" : "todo";
}

export function isRoomComplete(roomId, state) {
  if (roomId === "3,0,0") return state.flags.barnDoorUnlocked;
  if (roomId === "3,1,0") return state.flags.hallDrawerOpen;
  return false;
}

export function targetLabel(targetId, roomId) {
  const object = rooms[roomId].objects.find(candidate => candidate.id === targetId);
  return object ? object.name.toLowerCase() : "that";
}
