<div align="center">


 ██████╗       ███████╗  ██████╗  ██╗   ██╗ ██╗
 ██╔══██╗      ██╔════╝  ██╔══██╗ ██║   ██║ ██║
 ██║  ██║ ███  ███████╗  ██║  ██║ ██║   ██║ ██║
 ██║  ██║ ███  ╚════██║  ██║  ██║ ╚██╗ ██╔╝ ██║
 ██████╔╝      ███████║  ██████╔╝  ╚████╔╝  ██║
 ╚═════╝       ╚══════╝  ╚═════╝    ╚═══╝   ╚═╝


# ⚡ D@%@$oul ⚡

### *Paste HTML. Get Data URLs. Get Bookmarks. One click. Any page.*

<img src="https://img.shields.io/badge/HTML-→_DataURL-007acc?style=for-the-badge&logo=html5&logoColor=white" alt="HTML to DataURL">
<img src="https://img.shields.io/badge/HTML-→_Bookmark-8a2be2?style=for-the-badge&logo=bookmark&logoColor=white" alt="HTML to Bookmark">
<img src="https://img.shields.io/badge/100%25-Client_Side-4ec9b0?style=for-the-badge&logo=shield&logoColor=white" alt="Client Side">
<img src="https://img.shields.io/badge/Zero-Dependencies-f85149?style=for-the-badge&logo=dependabot&logoColor=white" alt="Zero Dependencies">

---

*Forged in the dark by* **🖤 OnyxSoul** 🖤

</div>

---

## 💀 The Idea

> Browsers **block** you from saving `data:` URLs as bookmarks.
> Extensions are heavy. Online converters spy on your code.
>
> **D@%@$oul doesn't care.**
>
> It's a single **bookmarklet** — a tiny spell living in your bookmarks bar.
> Click it on *any* page and a dark studio panel materializes.
> Paste HTML in. Get **Data URLs** and **named Bookmarks** out.
>
> No servers. No tracking. No mercy.

<div align="center">

```
   ┌─────────────────────────────────────┐
   │  D@%@$oul Studio            ✕      │
   ├─────────────────────────────────────┤
   │  Name: [ D@%@$oul                ] │
   │  ┌───────────────────────────────┐  │
   │  │ <h1>Paste your HTML...</h1>   │  │
   │  └───────────────────────────────┘  │
   │  [Convert] [Copy URL] [Test]        │
   │  [⭐ Make Bookmark] [Download]      │
   │  ┌───────────────────────────────┐  │
   │  │ data:text/html;base64,PGgx... │  │
   │  └───────────────────────────────┘  │
   └─────────────────────────────────────┘
```

</div>

---

## ⚔️ Powers

| | Power | What it does |
|---|---|---|
| 🔗 | **Convert** | Turns your HTML into a base64 **Data URL** (UTF-8 safe) |
| 📋 | **Copy URL** | Slams the Data URL onto your clipboard |
| 👁️ | **Test** | Renders your creation **live** in a floating preview window |
| ⭐ | **Make Bookmark** | Names your page → spawns a **green draggable link** → drag it to your bookmarks bar → your HTML becomes a **one-click app** |
| 📑 | **Copy Bookmark** | Copies the `javascript:` bookmark code for manual install |
| 💾 | **Download** | Exports your HTML as a standalone `.html` file |
| 🎨 | **Dark Studio UI** | VS Code vibes. Because light theme is a crime. |

---

## 📜 Summoning Ritual (Installation)

### 🪄 Path of the Drag (easiest)

```
1. Download dsoul.html from this repo
2. Open it in your browser
3. Press Ctrl + Shift + B  (reveal the bookmarks bar)
4. DRAG the purple button onto the bar
5. The ritual is complete ✅
```

### 🗡️ Path of the Manual

```
1. Copy the entire javascript:(function(){...})() code from dsoul.html
2. Right-click bookmarks bar → "Add page"
3. Name:  D@%@$oul
4. URL:   paste the code
5. Save — you are chosen now
```

---

## 🎮 How to Wield It

### → Forge a Data URL
```
Click D@%@$oul on any page → paste HTML → [Convert] → [Copy URL]
```
Use it in `<iframe src>`, `<a href download>`, or embed it anywhere.

### → Forge a Named Bookmark
```
Type a name → paste HTML → [⭐ Make Bookmark]
→ a green link appears → DRAG it to your bookmarks bar
→ click it anywhere → YOUR PAGE OPENS INSTANTLY
```
Your entire HTML app. Living in your bookmarks bar. Like a boss. 😎

---

## 🧪 Sacrificial Example

**You feed it:**

```html
<h1>Hello from D@%@$oul!</h1>
<style>
  body { background:#1e1e1e; color:#4ec9b0;
         font-family:monospace; text-align:center;
         padding-top:40vh }
</style>
```

**It births:**

```
data:text/html;charset=utf-8;base64,PGgxPkhlbGxvIGZyb20gREAlQyRTb3VsITwvaDE+
```

**And a bookmark that resurrects it anywhere:**

```javascript
javascript:(function(){document.open();document.write(
  decodeURIComponent(escape(atob(`PGgxPk...`))));document.close()})()
```

---

## ⚠️ Laws of the Realm

> [!IMPORTANT]
> **Browsers block `data:` URLs in the address bar** (anti-phishing magic).
> That's exactly *why* the ⭐ Make Bookmark feature wraps your HTML in a
> `javascript:` spell instead — bookmarks are the one loophole left. 🕳️

> [!WARNING]
> Data URLs have an **opaque origin** — `localStorage`, cookies, and some
> APIs are sealed inside them. Wrap storage calls in `try/catch`.

> [!TIP]
> Base64 inflates your HTML by ~33%. Keep your pages lean and deadly.

| Law | Effect |
|---|---|
| 🚫 Address bar | `data:` URLs can't be pasted/typed directly |
| 🍪 Opaque origin | No `localStorage` / cookies inside data URLs |
| 📏 Size limit | Giant HTML = giant bookmark URL — stay reasonable |

---

## 🌍 Compatible Realms

| Browser | Status |
|---|---|
| 🟡 Chrome | ✅ Fully operational |
| 🟦 Edge | ✅ Fully operational |
| 🟧 Firefox | ✅ Fully operational |
| 🟣 Brave | ✅ Fully operational |

---

## 🛠️ Built With

```
Vanilla JavaScript  •  zero frameworks  •  zero build tools
Bookmarklet architecture  •  Base64/UTF-8  •  Blob API
Pure spite toward heavy extensions
```

---

## 📁 The Artifacts

```
D@%@$oul/
├── dsoul.html      🪄 The installer (drag-to-bookmark + built-in converter)
├── README.md       📖 You are reading it, chosen one
└── LICENSE         📜 MIT
```

---

## 🤝 Join the Coven

```bash
git clone https://github.com/YOUR_USERNAME/D-Soul.git
cd D-Soul
git checkout -b feature/your-dark-magic
git commit -m "✨ add dark magic"
git push origin feature/your-dark-magic
# open a Pull Request — if your code is worthy
```

---

<div align="center">

## 🖤 Crafted by OnyxSoul 🖤

```
  ╔══════════════════════════════════════════╗
  ║   D@%@$oul  •  an OnyxSoul creation      ║
  ║   forged at midnight, shipped at dawn    ║
  ╚══════════════════════════════════════════╝
```

**⭐ Star this repo — every star feeds the Soul ⭐**

*No servers were harmed. No data ever left your machine.*

</div>
