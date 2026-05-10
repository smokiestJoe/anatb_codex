import React from "react";

export function InventoryToggle({ onToggle }) {
  return (
    <button className="inventory-toggle" title="Inventory" aria-label="Inventory" onClick={onToggle}>
      ☰
    </button>
  );
}

export function InventoryDismiss({ onClose }) {
  return <button className="inventory-dismiss" aria-label="Close inventory" onClick={onClose} />;
}

export function InventoryOverlay({ activeTab, inventory, onOpenItem, onSetTab }) {
  const currentItems = inventory[activeTab];

  return (
    <aside className="inventory-panel">
      <div className="inventory-tabs">
        <InventoryTabButton activeTab={activeTab} tab="item" icon="▣" label="Items" onSetTab={onSetTab} />
        <InventoryTabButton activeTab={activeTab} tab="food" icon="◍" label="Food" onSetTab={onSetTab} />
        <InventoryTabButton activeTab={activeTab} tab="note" icon="◇" label="Notes" onSetTab={onSetTab} />
      </div>
      <div className="inventory-title">{inventoryTabTitle(activeTab)}</div>
      <div className="inventory-list">
        {currentItems.length ? currentItems.map(item => (
          <button key={item.id} className="inventory-card" onClick={() => onOpenItem(item.id)}>
            <strong>{item.name}</strong>
            <small>{item.type}</small>
          </button>
        )) : <div className="empty-inventory">Nothing here yet.</div>}
      </div>
    </aside>
  );
}

function InventoryTabButton({ activeTab, tab, icon, label, onSetTab }) {
  return (
    <button className={activeTab === tab ? "active" : ""} title={label} aria-label={label} onClick={() => onSetTab(tab)}>
      {icon}
    </button>
  );
}

function inventoryTabTitle(tab) {
  return { item: "Items", food: "Food", note: "Notes" }[tab];
}
