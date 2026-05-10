import barnKeySprite from "../assets/objects/barn-key.png";
import doormatDownSprite from "../assets/objects/doormat-down.png";
import doormatTossedSprite from "../assets/objects/doormat-tossed.png";
import lockLockedSprite from "../assets/objects/lock-locked.png";
import lockUnlockedSprite from "../assets/objects/lock-unlocked.png";

export const SAVE_PREFIX = "anatb-save-";
export const AUTO_SLOT = "auto";
export const MANUAL_SLOTS = ["slot1", "slot2", "slot3"];
export const WORLD_SIZE = { x: 7, y: 5, z: 3 };

export const initialState = () => ({
  screen: "splash",
  gameView: "room",
  mapFloor: 0,
  roomId: "3,0,0",
  visitedRooms: ["3,0,0"],
  health: 100,
  activeInventoryTab: "item",
  inventoryOpen: false,
  selectedUseItemId: null,
  selectedTargetId: null,
  caption: "The night waits politely.",
  captionId: 0,
  captionVisible: true,
  settings: { volume: 70, subtitles: true },
  inventory: {
    item: [],
    food: [],
    note: []
  },
  flags: {
    matLifted: false,
    keyTaken: false,
    barnDoorUnlocked: false,
    hallDrawerOpen: false
  }
});

export const itemLibrary = {
  barnKey: {
    id: "barnKey",
    name: "Barn Key",
    type: "item",
    description: "A crooked brass key, cold enough to feel freshly dug up."
  },
  receiptNote: {
    id: "receiptNote",
    name: "Faded Receipt",
    type: "note",
    description: "A receipt for one bag of feed, three candles, and something called moon varnish."
  }
};

export const rooms = {
  "3,0,0": {
    id: "3,0,0",
    name: "Outside the Barn",
    className: "outside",
    position: { x: 3, y: 0, z: 0 },
    description: "The barn leans toward you, as though listening through the rain.",
    exits: { north: "3,1,0" },
    objects: [
      {
        id: "barnDoor",
        name: "Barn Door",
        verbs: ["push", "pull", "inspect", "open", "close", "use"],
        rect: { left: 47, top: 35, width: 11, height: 32 }
      },
      {
        id: "doorMat",
        name: "Door Mat",
        verbs: ["push", "pull", "pickup", "inspect", "open"],
        rect: { left: 44.5, top: 66.5, width: 16, height: 8 }
      },
      {
        id: "hiddenKey",
        name: "Door Key",
        verbs: ["pickup", "inspect"],
        rect: { left: 48, top: 70, width: 8, height: 5 },
        visible: state => state.flags.matLifted && !state.flags.keyTaken
      }
    ]
  },
  "3,1,0": {
    id: "3,1,0",
    name: "Entrance Hall",
    className: "hall",
    position: { x: 3, y: 1, z: 0 },
    description: "Inside, the barn smells of dust, damp rope, and patient old wood.",
    exits: { south: "3,0,0" },
    objects: [
      {
        id: "northExit",
        name: "Dark Doorway",
        verbs: ["inspect", "open", "use"],
        rect: { left: 43, top: 29, width: 16, height: 35 }
      },
      {
        id: "hallStand",
        name: "Hall Stand",
        verbs: ["push", "pull", "inspect", "open", "close", "use"],
        rect: { left: 22, top: 34, width: 16, height: 38 }
      },
      {
        id: "hallDrawer",
        name: "Drawer",
        verbs: ["pull", "inspect", "open", "close"],
        rect: { left: 23, top: 45, width: 14, height: 18 }
      },
      {
        id: "coatShadow",
        name: "Hanging Coat",
        verbs: ["push", "pull", "pickup", "inspect", "open", "use"],
        rect: { left: 66, top: 25, width: 14, height: 42 }
      }
    ]
  }
};

export const objectLayers = {
  "3,0,0": [
    {
      id: "doorMat",
      state: gameState => (gameState.flags.matLifted ? "tossed" : "down"),
      assets: {
        down: {
          src: doormatDownSprite,
          rect: { left: 34.4, top: 63.2, width: 34, height: 13.7 }
        },
        tossed: {
          src: doormatTossedSprite,
          rect: { left: 50.2, top: 66.4, width: 42, height: 23 }
        }
      }
    },
    {
      id: "hiddenKey",
      visible: gameState => gameState.flags.matLifted && !gameState.flags.keyTaken,
      state: () => "visible",
      assets: {
        visible: {
          src: barnKeySprite,
          rect: { left: 44, top: 65, width: 18.5, height: 9.3 }
        }
      }
    },
    {
      id: "barnDoorLock",
      state: gameState => (gameState.flags.barnDoorUnlocked ? "unlocked" : "locked"),
      assets: {
        locked: {
          src: lockLockedSprite,
          rect: { left: 52.9, top: 46.3, width: 6.9, height: 14.4 }
        },
        unlocked: {
          src: lockUnlockedSprite,
          rect: { left: 52.9, top: 46.3, width: 6.9, height: 14.4 }
        }
      }
    }
  ]
};
