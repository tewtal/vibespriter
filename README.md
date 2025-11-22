# VibeSpriter

A modern NES sprite editor for **The Legend of Zelda** and **Metroid** with support for the RDC (Retro Data Container) format.

## Features

- ✨ **Multi-Game Support**: Edit sprites from Zelda 1 and Metroid 1
- 🎨 **NES Palette Editor**: Full NES palette support with live preview
- 📦 **RDC Format**: Import/export RDC sprite containers
- 🖼️ **PNG Export/Import**: Export sprites with embedded palettes for easy sharing
- 🎮 **ROM Patching**: Direct ROM patching support
- 📝 **Metadata**: Edit sprite name and author information
- 🔄 **Layout Modes**: Flexible drag-and-drop layout or pixel-perfect drawing
- 📋 **Sample Files**: Includes Link and Samus samples to get started

## Live Demo

Visit [https://yourusername.github.io/vibespriter/](https://yourusername.github.io/vibespriter/)

## Usage

### Loading Sprites

1. **Sample Files**: Use the "Load Sample..." dropdown to load Link or Samus
2. **Import RDC**: Click "Import" to load `.rdc`, `.asset`, or `.png` files
3. **Drag & Drop**: (Coming soon) Drag files directly onto the canvas

### Editing

- **Layout Mode**: Arrange sprite segments by dragging them
- **Draw Mode**: Click to draw pixels with the selected palette color
- **Palette**: Select colors from the NES system palette
- **Layers**: Toggle visibility and select individual sprite segments

### Exporting

- **Export RDC**: Save as `.rdc` format with metadata
- **Export PNG**: Export with embedded palette for reimporting
- **Patch ROM**: Apply sprites directly to NES ROMs

## File Formats

### RDC (Retro Data Container)
- Native format for sprite data
- Supports metadata and multiple sprite types
- See `docs/rdc-spec.md` for format details

### PNG Import/Export
- **Zelda 1**: 160×24 pixels (16px sprites + 8px palette row)
- **Metroid 1**: 200×32 pixels (24px sprites + 8px palette row)
- Palette automatically embedded for accurate reimport

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Technologies

- **Vite**: Build tool and dev server
- **JavaScript Modules**: Clean, modern ES6+ code
- **Canvas API**: Real-time sprite rendering
- **Web APIs**: File handling, local storage

## Project Structure

```
vibespriter/
├── src/
│   └── lib/
│       ├── state.js          # Global application state
│       ├── renderer.js       # Canvas rendering
│       ├── editor.js         # Workspace & drawing logic
│       ├── ui.js             # UI & event handling
│       ├── io.js             # Import/export
│       ├── rdc.js            # RDC format parser/writer
│       ├── games.js          # Game definitions
│       ├── nes_graphics.js   # NES 2bpp encoding
│       ├── patcher.js        # ROM patching
│       ├── z1-png-importer.js
│       └── m1-png-importer.js
├── default/                   # Sample sprite files
│   ├── link.rdc
│   └── samus.rdc
├── docs/                      # Documentation
├── main.js                    # Entry point
├── index.html
└── style.css

```

## Credits

- **NES Graphics**: 2bpp tile encoding/decoding
- **RDC Format**: Retro Data Container specification
- **Sample Sprites**: Nintendo (The Legend of Zelda, Metroid)

## License

MIT License - See LICENSE file for details

## Contributing

Contributions welcome! Please open an issue or pull request.

---

Made with ❤️ for retro game enthusiasts
