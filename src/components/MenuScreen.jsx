import React from "react";

export function MenuScreen({ canContinue, onNewGame, onContinue, onLoadGame, modalLayer }) {
  return (
    <section className="screen menu-screen">
      <div className="main-menu">
        <h1 className="main-title">
          <span>A Night</span>
          <span>at the</span>
          <span>BARN</span>
        </h1>
        <p className="menu-subtitle">It’s not a puzzle. It’s a trap.</p>
        <div className="menu-actions">
          <button onClick={onNewGame}>New Game</button>
          <button disabled={!canContinue} onClick={onContinue}>Continue</button>
          <button onClick={onLoadGame}>Load Game</button>
        </div>
      </div>
      {modalLayer}
    </section>
  );
}
