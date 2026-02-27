
import { R } from "./core/runtime.js";
import { loadState } from "./core/loadState.js";
import { initGeometry , updateFrame, renderFrame, initUI } from "./core/operator.js";

new window.p5(p5 => {
  
  let appState = null;
  let gMain, gOverlay;

  // ─────────────────────────────────────────
  // SETUP (must stay synchronous)
  // ─────────────────────────────────────────
  p5.setup = () => {
    p5.createCanvas(window.innerWidth, window.innerHeight);
    p5.noSmooth();  p5.pixelDensity(1);   p5.canvas.focus();

    // Stop Draw loop
    p5.noLoop();

    // Create screen layers
    gMain    = p5.createGraphics(p5.width, p5.height);
    gOverlay = p5.createGraphics(p5.width, p5.height);


    // Start async boot
    initState();

    

    
  };

  // ─────────────────────────────────────────
  // Async boot (outside setup)
  // ─────────────────────────────────────────
  async function initState() {
    appState = await loadState(); console.log(appState);
    R.appState = appState;
    initUI();
    initGeometry(p5);
    p5.loop();
  }

  // ─────────────────────────────────────────
  // DRAW LOOP
  // ─────────────────────────────────────────
  p5.draw = () => {
    if (!gMain || !gOverlay) return;

    p5.clear();
    
    updateFrame(p5);
    
    gMain.clear(); gOverlay.clear();

    renderFrame(p5, { gMain, gOverlay });

    p5.background("#394457");
    p5.image(gMain, 0, 0);
    p5.image(gOverlay, 0, 0);
    
  };

  // ─────────────────────────────────────────
  // Mouse Scroll (for future use)
  // ─────────────────────────────────────────
  p5.mouseWheel = (event) => {
    R.input.mouse.wheel = event.deltaY;
  };


  // ─────────────────────────────────────────
  // Resize Handling
  // ─────────────────────────────────────────
  p5.windowResized = () => {
    p5.resizeCanvas(window.innerWidth, window.innerHeight);

    if (gMain && gOverlay) {
      gMain.resizeCanvas(p5.width, p5.height);
      gOverlay.resizeCanvas(p5.width, p5.height);
    }
  };

  // Prevent spacebar scrolling
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      e.preventDefault();
    }
  });

});