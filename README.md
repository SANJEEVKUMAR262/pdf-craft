# PDF Craft 🛠️

A fast, minimal web tool to **split** and **merge** PDF files instantly — no sign-up, no storage, no nonsense.

🔗 **Live Demo**: [pdf-craft-fb0i.onrender.com](https://pdf-craft-fb0i.onrender.com)

---

## Features

- ✂️ **Split PDF** — Extract custom page ranges from a single PDF and download them as a ZIP bundle
- 🔗 **Merge PDFs** — Combine multiple PDF files into one and download instantly
- 📦 Drag & drop file upload
- ⚡ Fast server-side processing with `pdf-lib`
- 🔒 Files are processed in memory — nothing is saved to disk

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js |
| Framework | Express.js |
| PDF Processing | pdf-lib |
| File Upload | Multer |
| ZIP Packaging | JSZip |
| Frontend | HTML, Tailwind CSS, Vanilla JS |
| Hosting | Render |

---

## Getting Started

### Prerequisites
- Node.js v18+
- npm

### Installation

```bash
# Clone the repo
git clone https://github.com/SANJEEVKUMAR262/pdf-craft.git
cd pdf-craft

# Install dependencies
npm install

# Start the server
node server.js
```

Then open **http://localhost:3000** in your browser.

---

## API Endpoints

### `POST /api/splice` — Split a PDF
| Field | Type | Description |
|-------|------|-------------|
| `pdfFile` | File | The source PDF to split |
| `ranges` | String (repeatable) | Page ranges e.g. `1-3`, `5`, `7-10` |

Returns a `.zip` file containing one PDF per range.

### `POST /api/merge` — Merge PDFs
| Field | Type | Description |
|-------|------|-------------|
| `pdfFiles` | File[] | Two or more PDF files to merge |

Returns a single merged `merged_output.pdf`.

---

## Project Structure

```
pdf-craft/
├── public/
│   ├── index.html      # Frontend UI
│   └── app.js          # Client-side logic
├── server.js           # Express server & API routes
├── package.json
└── README.md
```

---

## Deployment

This project is hosted on **Render**. Every push to the `main` branch triggers an automatic redeploy.

```bash
git add .
git commit -m "your message"
git push
```

---

## License

MIT — free to use and modify.

---

Made with ☕ by [Sanjeev Kumar](https://github.com/SANJEEVKUMAR262)
