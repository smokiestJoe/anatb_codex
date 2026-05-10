# A Night at the Barn

An eerie, surreal puzzle adventure prototype built as a mobile/tablet-first browser game.

## Run

Install dependencies, then run the Vite dev server:

```sh
npm install
npm run dev
```

The app runs at the local URL printed by Vite, usually `http://127.0.0.1:5173/`.

## Current Slice

- Smokiest Software splash screen
- Main menu with New Game, Continue, and Load Game
- Skippable scrolling intro
- Four save slots: Auto plus three manual slots
- 7x5x3 world grid model
- Fixed south-wall-looking-north room perspective
- Room `3,0,0`: outside the barn
- Room `3,1,0`: entrance hall
- Door mat interaction, hidden key, and `USE KEY WITH DOOR`
- Context action menu: Push, Pull, Pickup, Inspect, Open, Close, Use
- Inventory tabs: Items, Food, Notes
- Settings panel with volume, subtitles, save, and load hooks
- Health bar starting at 100
