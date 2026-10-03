# CartShare — Collaborative Shopping Cart

A pure front-end collaborative shopping cart web app. Groups (dorms, office teams, travel groups) can coordinate joint purchases in real time across browser tabs.

## Features

- **Room System** — Create or join a shared room using a 6-character code
- **Shared Cart** — Add, remove, and edit items with live cross-tab sync
- **Activity Log** — See who did what with relative timestamps (capped at 100 entries)
- **Delivery Threshold** — Visual progress bar toward a configurable free-delivery amount
- **Per-Person Breakdown** — Fair expense splitting at a glance
- **Printable Receipt** — Audit-ready receipt with all details, optimised for A4 printing
- **Real-Time Sync** — Changes appear instantly in all tabs via `storage` event + BroadcastChannel
- **XSS Protection** — All user input is escaped via `textContent` (never raw `innerHTML`)
- **Mobile-First** — Responsive design with Bootstrap 5 grid and custom CSS Grid

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Structure | HTML5 |
| Styling | CSS3, Bootstrap 5 (CDN), custom CSS variables |
| Logic | Vanilla JavaScript (ES6+) |
| Persistence | localStorage (rooms), sessionStorage (current user) |
| Sync | `storage` event + BroadcastChannel API |
| Icons | Bootstrap Icons (CDN) |
| Fonts | Inter, JetBrains Mono (Google Fonts) |

**No build step. No backend. No frameworks.**

## Folder Structure

```
/
├── index.html            # Login / Join / Create room
├── room.html             # Shared cart + activity log
├── receipt.html           # Printable receipt
├── css/
│   ├── style.css         # Main styles (dark theme, components)
│   └── print.css         # Print-only styles (@media print)
├── js/
│   ├── storage.js        # Data layer (all localStorage access)
│   ├── auth.js           # Login / join / leave logic
│   ├── room.js           # Cart UI + activity log
│   ├── sync.js           # Cross-tab synchronisation
│   └── receipt.js        # Receipt page logic
├── assets/               # Images, icons (placeholder)
└── README.md
```

## How to Run Locally

### Option 1: Direct file open
Simply double-click `index.html` in your browser. Cross-tab sync via `storage` events works with `file://` protocol.

### Option 2: Local HTTP server (recommended)
```bash
# Using npx (no install needed)
npx serve .

# Or Python
python -m http.server 8000

# Or PHP
php -S localhost:8000
```

Then open `http://localhost:3000` (or whatever port is shown).

## How to Test Multi-User

Since there's no backend, multi-user is simulated across tabs in the **same browser**:

1. Open `index.html` in **Tab 1**, enter name "Alice", click **Create Room**
2. Copy the 6-character room code
3. Open `index.html` in **Tab 2**, enter name "Bob", paste the code, click **Join Room**
4. Open `index.html` in **Tab 3**, enter name "Charlie", paste the code, click **Join Room**
5. In any tab, add an item — it appears instantly in all other tabs
6. Try removing items, changing quantities, editing the threshold
7. Check the activity log updates live in every tab
8. Click **Receipt** to see the printable audit summary

> **Tip**: Each tab uses `sessionStorage` for the current user, so each tab can be a different person even in the same browser.

## Deployment

This is a **static site** — no server-side processing needed.

### GitHub Pages
1. Push to a GitHub repo
2. Go to Settings → Pages → Source: `main` branch, root `/`
3. Your site is live at `https://<user>.github.io/<repo>/`

### Netlify
1. Drag and drop the project folder at [app.netlify.com/drop](https://app.netlify.com/drop)
2. Or connect your Git repo and set publish directory to `/`

### Vercel
1. Import from GitHub at [vercel.com/new](https://vercel.com/new)
2. Set framework preset to "Other" and output directory to `/`
3. Deploy

No `vercel.json` or `netlify.toml` required.

## Known Limitations

| Limitation | Reason |
|-----------|--------|
| Sync only works across tabs in the **same browser** | No backend — relies on `localStorage` events |
| No authentication or passwords | Pure front-end, no server |
| Data can be cleared by the user | `localStorage` is browser-controlled |
| No persistent online/offline status | Would require WebSocket server |
| Room codes can collide (extremely unlikely) | 36^6 = ~2 billion possibilities |

## Screenshots

> _Screenshots placeholder — replace with actual screenshots after deployment._

| Screen | Description |
|--------|-------------|
| `screenshots/login.png` | Login / Create / Join room |
| `screenshots/room.png` | Shared cart with items and activity log |
| `screenshots/receipt.png` | Printable receipt |

---

Built with ❤️ for collaborative shopping.
