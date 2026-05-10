import { AUTO_SLOT, MANUAL_SLOTS, SAVE_PREFIX, initialState, rooms } from "../data/gameData";

export function saveToSlot(slot, state) {
  const payload = {
    savedAt: new Date().toISOString(),
    state: {
      ...state,
      screen: "game",
      selectedTargetId: null,
      selectedUseItemId: null
    }
  };
  localStorage.setItem(`${SAVE_PREFIX}${slot}`, JSON.stringify(payload));
}

export function loadSlotState(slot) {
  const raw = localStorage.getItem(`${SAVE_PREFIX}${slot}`);
  if (!raw) return null;
  const payload = normalizeSavePayload(JSON.parse(raw));
  return { ...initialState(), ...payload.state, screen: "game" };
}

export function getSlot(slot) {
  const raw = localStorage.getItem(`${SAVE_PREFIX}${slot}`);
  if (!raw) return null;
  try {
    return normalizeSavePayload(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function normalizeSavePayload(payload) {
  if (!payload?.state) return payload;
  return {
    ...payload,
    state: normalizeState(payload.state)
  };
}

export function normalizeState(savedState) {
  const legacyRoomIds = {
    "0,3,0": "3,0,0",
    "1,3,0": "3,1,0"
  };
  const roomId = legacyRoomIds[savedState.roomId] || savedState.roomId;
  const visitedRooms = (savedState.visitedRooms || [roomId]).map(id => legacyRoomIds[id] || id);
  return {
    ...savedState,
    roomId,
    visitedRooms: [...new Set(visitedRooms)],
    mapFloor: savedState.mapFloor ?? rooms[roomId]?.position.z ?? 0
  };
}

export function hasAnySave() {
  return [AUTO_SLOT, ...MANUAL_SLOTS].some(getSlot);
}

export function slotName(slot) {
  if (slot === AUTO_SLOT) return "Auto Save";
  return `Manual Save ${MANUAL_SLOTS.indexOf(slot) + 1}`;
}

export function formatSlot(slot) {
  const payload = getSlot(slot);
  if (!payload) return "Empty";
  const room = rooms[payload.state.roomId]?.name || payload.state.roomId;
  const date = new Date(payload.savedAt).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
  return `${room} - ${date}`;
}
