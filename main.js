import './style.css'
import { state } from './src/lib/state.js';
import { initUI } from './src/lib/ui.js';

document.querySelector('#app').innerHTML = `
  <header>
    <h1>RDC Sprite Editor</h1>
    <div class="toolbar">
      <div class="tools">
        <button id="tool-layout" class="tool-btn active">Layout</button>
        <button id="tool-draw" class="tool-btn">Draw</button>
      </div>
      <div class="toolbar-actions">
        <button id="import-btn">Import</button>
        <button id="export-btn">Export RDC</button>
        <button id="export-png-btn">Export PNG</button>
        <button id="patch-btn">Patch ROM</button>
        <select id="sample-select" title="Load sample sprite">
          <option value="">Load Sample...</option>
          <option value="link">Link (Zelda 1)</option>
          <option value="samus">Samus (Metroid 1)</option>
        </select>
        <input type="file" id="file-input" accept=".rdc,.asset,.png" style="display: none;" />
        <input type="file" id="patch-input" accept=".nes,.zip" style="display: none;" />
      </div>
    </div>
  </header>
  <main>
    <div class="sidebar">
      <div class="panel">
        <h2>View Options</h2>
        <div class="control-group">
          <label>Zoom: <span id="zoom-level">400%</span></label>
          <div class="button-group">
            <button id="zoom-out">-</button>
            <button id="zoom-in">+</button>
          </div>
        </div>
        <div class="control-group">
          <label>Grid: <input type="checkbox" id="grid-toggle" /></label>
        </div>
        <div class="control-group">
          <label>Layout Width: <span id="layout-width-display">8</span></label>
          <input type="range" id="layout-width" value="8" min="1" max="64" />
        </div>
        <div class="control-group">
          <label>Layout Height: <span id="layout-height-display">1</span></label>
          <input type="range" id="layout-height" value="1" min="1" max="8" />
        </div>
        <div class="control-group">
          <label>Flip: 
            <div class="checkbox-group">
                <label><input type="checkbox" id="flip-x" /> X</label>
                <label><input type="checkbox" id="flip-y" /> Y</label>
            </div>
          </label>
        </div>
      </div>
      <div class="panel">
        <h2>Palette Selection</h2>
        <select id="palette-select"></select>
      </div>
      <div class="panel">
        <h2>Layers</h2>
        <div id="layers-list" class="layers-list"></div>
      </div>
      <div class="panel">
        <h2>Active Palette</h2>
        <div id="palette-editor" class="palette-grid"></div>
      </div>
      <div class="panel">
        <h2>Metadata</h2>
        <div class="control-group">
          <label>Sprite Name: <input type="text" id="meta-name" placeholder="Link" /></label>
        </div>
        <div class="control-group">
          <label>Author: <input type="text" id="meta-author" placeholder="Unknown" /></label>
        </div>
      </div>
      <div class="panel">
        <h2>System Palette</h2>
        <div id="system-palette" class="system-palette-grid"></div>
      </div>
    </div>
    <div class="workspace">
      <div class="canvas-container">
        <canvas id="sprite-canvas"></canvas>
      </div>
      <div class="status-bar">
        <span id="status-text">Ready</span>
      </div>
    </div>
  </main>
`

const canvas = document.getElementById('sprite-canvas');
const ctx = canvas.getContext('2d');

initUI(state, canvas, ctx);
