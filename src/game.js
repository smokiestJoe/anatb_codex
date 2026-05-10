const SAVE_PREFIX = "anatb-save-";
const AUTO_SLOT = "auto";
const MANUAL_SLOTS = ["slot1", "slot2", "slot3"];
const WORLD_SIZE = { x: 7, y: 5, z: 3 };

const initialState = () => ({
  screen: "splash",
  roomId: "0,3,0",
  health: 100,
  activeInventoryTab: "item",
  selectedUseItemId: null,
  selectedTargetId: null,
  caption: "The night waits politely.",
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

const itemLibrary = {
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

const rooms = {
  "0,3,0": {
    id: "0,3,0",
    name: "Outside the Barn",
    className: "outside",
    position: { x: 0, y: 3, z: 0 },
    description: "The barn leans toward you, as though listening through the rain.",
    exits: { north: "1,3,0" },
    objects: [
      {
        id: "barnDoor",
        name: "Barn Door",
        verbs: ["push", "pull", "inspect", "open", "close", "use"],
        rect: { left: 44, top: 32.5, width: 12.5, height: 31.5 }
      },
      {
        id: "doorMat",
        name: "Door Mat",
        verbs: ["push", "pull", "pickup", "inspect", "open"],
        rect: { left: 42.3, top: 66.2, width: 15.6, height: 7.2 }
      },
      {
        id: "hiddenKey",
        name: "Door Key",
        verbs: ["pickup", "inspect"],
        rect: { left: 47.4, top: 70, width: 6.5, height: 4.5 },
        visible: state => state.flags.matLifted && !state.flags.keyTaken
      }
    ]
  },
  "1,3,0": {
    id: "1,3,0",
    name: "Entrance Hall",
    className: "hall",
    position: { x: 1, y: 3, z: 0 },
    description: "Inside, the barn smells of dust, damp rope, and patient old wood.",
    exits: { south: "0,3,0" },
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

let state = initialState();
let activeMenu = null;
let modal = null;
let splashTimer = null;

const app = document.querySelector("#app");

function saveToSlot(slot) {
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

function loadSlot(slot) {
  const raw = localStorage.getItem(`${SAVE_PREFIX}${slot}`);
  if (!raw) return false;
  const payload = JSON.parse(raw);
  state = { ...initialState(), ...payload.state, screen: "game" };
  activeMenu = null;
  modal = null;
  setCaption(`Loaded ${slotName(slot)}.`);
  render();
  return true;
}

function getSlot(slot) {
  const raw = localStorage.getItem(`${SAVE_PREFIX}${slot}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function hasAnySave() {
  return [AUTO_SLOT, ...MANUAL_SLOTS].some(getSlot);
}

function slotName(slot) {
  if (slot === AUTO_SLOT) return "Auto Save";
  return `Manual Save ${MANUAL_SLOTS.indexOf(slot) + 1}`;
}

function startSplash() {
  state.screen = "splash";
  render();
  clearTimeout(splashTimer);
  splashTimer = setTimeout(() => {
    state.screen = "menu";
    render();
  }, 1800);
}

function newGame() {
  state = initialState();
  state.screen = "intro";
  activeMenu = null;
  modal = null;
  render();
}

function beginGame() {
  state.screen = "game";
  setCaption(rooms[state.roomId].description);
  saveToSlot(AUTO_SLOT);
  render();
}

function setCaption(message) {
  state.caption = message;
}

function getCurrentRoom() {
  return rooms[state.roomId];
}

function visibleObjects(room) {
  return room.objects.filter(object => !object.visible || object.visible(state));
}

function inventoryHas(id) {
  return Object.values(state.inventory).some(items => items.some(item => item.id === id));
}

function addInventory(id) {
  const item = itemLibrary[id];
  if (!item || inventoryHas(id)) return;
  state.inventory[item.type].push(item);
}

function removeInventory(id) {
  for (const type of Object.keys(state.inventory)) {
    state.inventory[type] = state.inventory[type].filter(item => item.id !== id);
  }
}

function selectObject(objectId, x, y) {
  const room = getCurrentRoom();
  const object = visibleObjects(room).find(candidate => candidate.id === objectId);
  if (!object) return;

  if (state.selectedUseItemId) {
    useItemWithTarget(state.selectedUseItemId, objectId);
    state.selectedUseItemId = null;
    activeMenu = null;
    modal = null;
    render();
    return;
  }

  if (objectId === "barnDoor" && state.flags.barnDoorUnlocked) {
    moveToRoom("1,3,0");
    render();
    return;
  }

  activeMenu = { objectId, x, y };
  modal = null;
  render();
}

function runVerb(verb, objectId) {
  activeMenu = null;
  const room = getCurrentRoom();
  const object = visibleObjects(room).find(candidate => candidate.id === objectId);
  if (!object) return;

  if (verb === "pickup") {
    pickupObject(objectId);
  } else if (verb === "open") {
    openObject(objectId);
  } else if (verb === "close") {
    closeObject(objectId);
  } else if (verb === "use") {
    beginUseObject(objectId);
  } else if (verb === "inspect") {
    inspectObject(objectId);
  } else if (verb === "push" || verb === "pull") {
    setCaption(pushPullObject(verb, objectId));
  }
  render();
}

function pickupObject(objectId) {
  if (objectId === "hiddenKey") {
    state.flags.keyTaken = true;
    addInventory("barnKey");
    setCaption("You pick up the barn key. It knows exactly which lock it wants.");
    saveToSlot(AUTO_SLOT);
    return;
  }

  if (objectId === "doorMat") {
    setCaption("It is too damp and loyal to take with you.");
    return;
  }

  if (objectId === "coatShadow") {
    setCaption("The coat refuses to become luggage.");
    return;
  }

  setCaption("That does not seem portable.");
}

function openObject(objectId) {
  if (objectId === "doorMat") {
    state.flags.matLifted = true;
    setCaption("You lift the mat. A key glints beneath it with theatrical timing.");
    return;
  }

  if (objectId === "barnDoor") {
    if (!state.flags.barnDoorUnlocked) {
      setCaption("The barn door is locked. The keyhole looks smug.");
      return;
    }
    moveToRoom("1,3,0");
    return;
  }

  if (objectId === "hallDrawer" || objectId === "hallStand") {
    if (!state.flags.hallDrawerOpen) {
      state.flags.hallDrawerOpen = true;
      addInventory("receiptNote");
      setCaption("The drawer slides open. Inside is a faded receipt.");
    } else {
      setCaption("The drawer is already open, revealing its shallow wooden mouth.");
    }
    return;
  }

  if (objectId === "northExit") {
    setCaption("That part of the barn has not been drawn into the world yet.");
    return;
  }

  setCaption("It does not open from this angle.");
}

function closeObject(objectId) {
  if (objectId === "hallDrawer" || objectId === "hallStand") {
    if (state.flags.hallDrawerOpen) {
      state.flags.hallDrawerOpen = false;
      setCaption("You close the drawer. Something inside taps once.");
    } else {
      setCaption("It is already closed.");
    }
    return;
  }

  if (objectId === "barnDoor") {
    setCaption("You are on the wrong side for a meaningful close.");
    return;
  }

  setCaption("Closed is not a state it currently understands.");
}

function beginUseObject(objectId) {
  if (state.selectedUseItemId) {
    useItemWithTarget(state.selectedUseItemId, objectId);
    state.selectedUseItemId = null;
    return;
  }

  if (objectId === "barnDoor") {
    setCaption("Use what with the door?");
    return;
  }

  setCaption("You use your best judgment. It remains unimpressed.");
}

function inspectObject(objectId) {
  const lines = {
    barnDoor: state.flags.barnDoorUnlocked
      ? "The unlocked door hangs slightly open, showing a sliver of impossible dark."
      : "A warped barn door. The lock is bright, modern, and rude.",
    doorMat: state.flags.matLifted
      ? "The mat is folded back. It has given up its secret."
      : "A scratchy mat reading WELCOME, though the letters are arranged like a warning.",
    hiddenKey: "A brass door key with a tooth pattern like a tiny skyline.",
    northExit: "A doorway into a room for a later chapter.",
    hallStand: "A narrow hall stand. Its drawer is angled so you can see inside when open.",
    hallDrawer: state.flags.hallDrawerOpen
      ? "The open drawer contains dust, a note, and a smell like old coins."
      : "The drawer sits proud of the frame, begging to be pulled.",
    coatShadow: "A coat or a shadow pretending to be one. Both options are bad tailoring."
  };
  setCaption(lines[objectId] || "There is nothing useful to learn from that.");
}

function pushPullObject(verb, objectId) {
  if (objectId === "doorMat") {
    state.flags.matLifted = true;
    return verb === "pull"
      ? "You pull the mat aside. A key waits underneath."
      : "You shove the mat into a wrinkle. A key catches the light.";
  }

  if (objectId === "barnDoor") {
    return state.flags.barnDoorUnlocked
      ? "The door swings inward with a long wooden complaint."
      : "The locked door shudders, but stays shut.";
  }

  if (objectId === "hallDrawer") {
    state.flags.hallDrawerOpen = true;
    addInventory("receiptNote");
    return "The drawer opens enough to show its contents.";
  }

  return `You ${verb} it. The barn files a silent objection.`;
}

function useItemWithTarget(itemId, targetId) {
  if (itemId === "barnKey" && targetId === "barnDoor") {
    state.flags.barnDoorUnlocked = true;
    setCaption("The key turns once. The barn door unlocks and exhales.");
    saveToSlot(AUTO_SLOT);
    return;
  }

  const item = itemLibrary[itemId];
  setCaption(`${item?.name || "That"} has no useful effect on ${targetLabel(targetId)} yet.`);
}

function targetLabel(targetId) {
  const object = getCurrentRoom().objects.find(candidate => candidate.id === targetId);
  return object ? object.name.toLowerCase() : "that";
}

function moveToRoom(roomId) {
  if (!rooms[roomId]) return;
  state.roomId = roomId;
  setCaption(rooms[roomId].description);
  saveToSlot(AUTO_SLOT);
}

function openInventoryItem(id) {
  const item = Object.values(state.inventory).flat().find(candidate => candidate.id === id);
  if (!item) return;

  if (item.type === "food") {
    modal = {
      type: "confirm-food",
      title: item.name,
      body: "Are you sure you want to eat this?",
      item
    };
  } else if (item.type === "note") {
    modal = {
      type: "note",
      title: item.name,
      body: item.description
    };
  } else {
    modal = {
      type: "inventory-action",
      title: item.name,
      body: item.description,
      item
    };
  }
  activeMenu = null;
  render();
}

function inspectInventoryItem(item) {
  modal = null;
  setCaption(item.description);
  render();
}

function armInventoryItem(item) {
  modal = null;
  state.selectedUseItemId = item.id;
  setCaption(`Use ${item.name} with what?`);
  render();
}

function openSettings() {
  modal = { type: "settings", title: "Settings" };
  activeMenu = null;
  render();
}

function openLoadMenu() {
  modal = { type: "load", title: "Load Game" };
  activeMenu = null;
  render();
}

function openSaveMenu() {
  modal = { type: "save", title: "Save Game" };
  activeMenu = null;
  render();
}

function formatSlot(slot) {
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

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key === "html") node.innerHTML = value;
    else if (key.startsWith("on")) node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (value === true) node.setAttribute(key, "");
    else if (value !== false && value != null) node.setAttribute(key, value);
  }
  for (const child of children) {
    node.append(child);
  }
  return node;
}

function render() {
  app.replaceChildren();

  if (state.screen === "splash") renderSplash();
  if (state.screen === "menu") renderMenu();
  if (state.screen === "intro") renderIntro();
  if (state.screen === "game") renderGame();
}

function renderSplash() {
  app.append(el("section", { class: "screen splash" }, [
    el("div", { class: "brand-lockup" }, [
      el("div", { class: "brand-mark", "aria-hidden": "true" }),
      el("h1", { text: "Smokiest Software" }),
      el("p", { text: "presents" })
    ])
  ]));
}

function renderMenu() {
  app.append(el("section", { class: "screen menu-screen" }, [
    el("div", { class: "main-menu" }, [
      el("h1", { class: "main-title", text: "A Night at the Barn" }),
      el("p", { class: "menu-subtitle", text: "A crooked puzzle adventure in three dimensions and one bad evening." }),
      el("div", { class: "menu-actions" }, [
        el("button", { text: "New Game", onclick: newGame }),
        el("button", { text: "Continue", disabled: !hasAnySave(), onclick: () => loadSlot(AUTO_SLOT) || openLoadMenu() }),
        el("button", { text: "Load Game", onclick: openLoadMenu })
      ])
    ]),
    renderModalLayer()
  ]));
}

function renderIntro() {
  app.append(el("section", { class: "screen intro-screen" }, [
    el("div", { class: "intro-window" }, [
      el("div", {
        class: "intro-scroll",
        html: `<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
          <p>Integer vel augue non magna blandit gravida. The barn waits past the hedge, leaning into the lane like a secret with hinges.</p>
          <p>Sed euismod, risus at fermentum porttitor, nunc neque dapibus eros, sed tempor mi metus at nulla.</p>
          <p>Tonight, every ordinary thing has a second job.</p>`
      })
    ]),
    el("button", { class: "skip", text: "Skip", onclick: beginGame })
  ]));

  setTimeout(() => {
    if (state.screen === "intro") beginGame();
  }, 26000);
}

function renderGame() {
  const room = getCurrentRoom();
  app.append(el("section", { class: "screen game-screen" }, [
    renderHud(room),
    el("div", { class: "stage-wrap" }, [
      renderStage(room),
      state.selectedUseItemId ? el("div", {
        class: "use-banner",
        text: `Using ${itemLibrary[state.selectedUseItemId].name}. Pick a target.`
      }) : "",
      activeMenu ? renderVerbMenu() : "",
      modal ? renderModalLayer() : ""
    ]),
    el("div", { class: "caption", text: state.caption }),
    renderInventory()
  ]));
}

function renderHud(room) {
  return el("header", { class: "hud" }, [
    el("button", { class: "icon-button", title: "Settings", "aria-label": "Settings", text: "⚙", onclick: openSettings }),
    el("div", { class: "room-label", text: `${room.name} (${room.id})` }),
    el("div", { class: "health" }, [
      el("div", { class: "health-label" }, [
        el("span", { text: "Health" }),
        el("span", { text: `${state.health}` })
      ]),
      el("div", { class: "health-track" }, [
        el("div", { class: "health-fill", style: `width: ${state.health}%` })
      ])
    ])
  ]);
}

function renderStage(room) {
  const objects = visibleObjects(room);
  return el("section", { class: `stage ${room.className} ${roomStateClass(room)}` }, [
    el("div", { class: "perspective", "aria-hidden": "true" }, [
      el("div", { class: "ceiling" }),
      el("div", { class: "left-wall" }),
      el("div", { class: "right-wall" }),
      el("div", { class: "north-wall" }),
      el("div", { class: "floor" })
    ]),
    ...renderRoomAssets(room),
    ...objects.map(object => {
      const rect = rectForObject(object);
      return el("button", {
        class: "hotspot",
        title: object.name,
        "aria-label": object.name,
        style: `left:${rect.left}%;top:${rect.top}%;width:${rect.width}%;height:${rect.height}%;`,
        onclick: event => selectObject(object.id, event.clientX, event.clientY)
      });
    })
  ]);
}

function rectForObject(object) {
  if (state.roomId === "0,3,0" && object.id === "doorMat" && state.flags.matLifted) {
    return { left: 58, top: 72.5, width: 18, height: 10.5 };
  }

  return object.rect;
}

function roomStateClass(room) {
  if (room.id !== "0,3,0") return "";
  if (state.flags.barnDoorUnlocked) return "door-unlocked";
  if (state.flags.matLifted && state.flags.keyTaken) return "mat-moved-empty";
  if (state.flags.matLifted) return "mat-moved-key";
  return "mat-down";
}

function renderRoomAssets(room) {
  return [];
}

function renderVerbMenu() {
  const room = getCurrentRoom();
  const object = visibleObjects(room).find(candidate => candidate.id === activeMenu.objectId);
  if (!object) return "";
  const x = Math.min(Math.max(activeMenu.x - 160, 12), window.innerWidth - 372);
  const y = Math.min(Math.max(activeMenu.y - 30, 70), window.innerHeight - 310);

  return el("div", { class: "verb-menu", style: `left:${x}px;top:${y}px;` }, [
    el("h2", { text: object.name }),
    el("div", { class: "verb-grid" }, object.verbs.map(verb => el("button", {
      text: verbLabel(verb),
      onclick: () => runVerb(verb, object.id)
    }))),
    el("button", { text: "Cancel", onclick: () => { activeMenu = null; render(); } })
  ]);
}

function verbLabel(verb) {
  return verb.charAt(0).toUpperCase() + verb.slice(1);
}

function renderInventory() {
  const currentItems = state.inventory[state.activeInventoryTab];
  return el("aside", { class: "inventory" }, [
    el("div", { class: "inventory-tabs" }, [
      inventoryTabButton("item", "Items"),
      inventoryTabButton("food", "Food"),
      inventoryTabButton("note", "Notes")
    ]),
    el("div", { class: "inventory-list" }, currentItems.length
      ? currentItems.map(item => el("button", {
        class: "inventory-card",
        onclick: () => openInventoryItem(item.id)
      }, [
        el("strong", { text: item.name }),
        el("small", { text: item.type })
      ]))
      : [el("div", { class: "empty-inventory", text: "Nothing here yet." })])
  ]);
}

function inventoryTabButton(tab, label) {
  return el("button", {
    class: state.activeInventoryTab === tab ? "active" : "",
    text: label,
    onclick: () => {
      state.activeInventoryTab = tab;
      render();
    }
  });
}

function renderModalLayer() {
  const layerChildren = [
    el("div", { class: "overlay", onclick: () => { modal = null; render(); } })
  ];

  if (!modal) return "";

  if (modal.type === "inventory-action") {
    layerChildren.push(el("div", { class: "inventory-action" }, [
      el("h2", { text: modal.title }),
      el("p", { text: modal.body }),
      el("div", { class: "modal-actions" }, [
        el("button", { text: "Inspect", onclick: () => inspectInventoryItem(modal.item) }),
        el("button", { text: "Use", onclick: () => armInventoryItem(modal.item) }),
        el("button", { text: "Close", onclick: () => { modal = null; render(); } })
      ])
    ]));
  }

  if (modal.type === "note") {
    layerChildren.push(el("div", { class: "modal dialog" }, [
      el("h2", { text: modal.title }),
      el("p", { text: modal.body }),
      el("div", { class: "modal-actions" }, [
        el("button", { text: "X", onclick: () => { modal = null; render(); } })
      ])
    ]));
  }

  if (modal.type === "confirm-food") {
    layerChildren.push(el("div", { class: "modal dialog" }, [
      el("h2", { text: modal.title }),
      el("p", { text: modal.body }),
      el("div", { class: "modal-actions" }, [
        el("button", { text: "Eat", onclick: () => { modal = null; setCaption("You eat it. We will wire consequences later."); render(); } }),
        el("button", { text: "Cancel", onclick: () => { modal = null; render(); } })
      ])
    ]));
  }

  if (modal.type === "settings") {
    layerChildren.push(el("div", { class: "modal dialog" }, [
      el("h2", { text: "Settings" }),
      el("div", { class: "settings-grid" }, [
        el("label", { class: "setting-row" }, [
          el("span", { text: `Volume ${state.settings.volume}` }),
          el("input", {
            type: "range",
            min: "0",
            max: "100",
            value: state.settings.volume,
            oninput: event => {
              state.settings.volume = Number(event.target.value);
              render();
            }
          })
        ]),
        el("label", { class: "toggle-row" }, [
          el("span", { text: "Subtitles" }),
          el("input", {
            type: "checkbox",
            checked: state.settings.subtitles,
            onchange: event => {
              state.settings.subtitles = event.target.checked;
              render();
            }
          })
        ]),
        el("div", { class: "modal-actions" }, [
          el("button", { text: "Save", onclick: openSaveMenu }),
          el("button", { text: "Load", onclick: openLoadMenu }),
          el("button", { text: "Close", onclick: () => { modal = null; render(); } })
        ])
      ])
    ]));
  }

  if (modal.type === "load" || modal.type === "save") {
    const isLoad = modal.type === "load";
    layerChildren.push(el("div", { class: "modal dialog" }, [
      el("h2", { text: modal.title }),
      el("div", { class: "slot-list" }, [AUTO_SLOT, ...MANUAL_SLOTS].map(slot => {
        const empty = !getSlot(slot);
        return el("button", {
          class: "slot-button",
          disabled: isLoad && empty,
          onclick: () => {
            if (isLoad) loadSlot(slot);
            else {
              saveToSlot(slot);
              modal = null;
              setCaption(`Saved to ${slotName(slot)}.`);
              render();
            }
          }
        }, [
          el("strong", { text: slotName(slot) }),
          el("span", { text: formatSlot(slot) })
        ]);
      })),
      el("div", { class: "modal-actions" }, [
        el("button", { text: "Close", onclick: () => { modal = null; render(); } })
      ])
    ]));
  }

  return el("div", {}, layerChildren);
}

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    if (state.screen === "intro") beginGame();
    else {
      activeMenu = null;
      modal = null;
      if (state.selectedUseItemId) {
        state.selectedUseItemId = null;
        setCaption("You stop trying to use that.");
      }
      render();
    }
  }
});

startSplash();
