import { R } from "../core/runtime.js";

import { EmployeeTray } from "./EmployeeTray.js";
import { WeekGrid } from "./WeekGrid.js";
import { GenerateButton} from "./Button.js";


export class Schedule {
  constructor(state, commands) {
    // geometry
    this.x = 0;
    this.y = 0;
    this.w = 0;
    this.h = 0;

    // children
    this.tray = new EmployeeTray(state.employees);
    this.grid = new WeekGrid(state.demand);


    // app references
    this.state = state;         // R.state
    this.commands = commands;   // cmdAssign, cmdGenerate...

    // drag session
    this.activeSticker = null;
    this.hoverSlot = null;
  }

  setGeometry(x, y, w, h) {

    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;

    const padding = 20;

    // Layout proportions
    const trayWidth = w * 0.22;      // 22% left panel
    const gridWidth = w - trayWidth - padding * 2;

    const trayX = x + padding;
    const trayY = y + padding;
    const trayH = h - padding * 2;

    const gridX = trayX + trayWidth + padding;
    const gridY = trayY;
    const gridH = trayH;

    // Apply to children
    if (this.tray) {
      this.tray.setGeometry(
        trayX,
        trayY,
        trayWidth,
        trayH
      );
    }

    if (this.grid) {
      this.grid.setGeometry(
        gridX,
        gridY,
        gridWidth - padding,
        gridH
      );
    }

    if (this.generateBtn) {
      const btnW = 140;
      const btnH = 40;

      this.generateBtn.setGeometry(
        gridX + gridWidth - btnW - padding,
        y + padding
      );
    }
  }

  onHit(x, y) {
    return x > this.x && x < this.x + this.w &&
           y > this.y && y < this.y + this.h; 
  }

  onMouseHover(mouse) {

    // 1. Tray sticker
    if (!this.tray) return;
    const sticker = this.tray.hitTest(mouse.x, mouse.y);

    if (sticker) {
      sticker.highlight();
      return;
    } for (const s of this.tray.stickers) {
      s.highlighted = false;
    }

  }

  onMousePress(mouse) {

    // 1. Tray sticker
    const sticker = this.tray.hitTest(mouse.x, mouse.y);

    if (sticker) {
      this.activeSticker = sticker;

      // Compute current rendered position
      const renderedX = this.tray.x + sticker.localX;
      const renderedY = this.tray.y + sticker.localY - this.tray.scrollY;

      // Force sticker into global space
      sticker.x = renderedX;
      sticker.y = renderedY;

      // Now start drag
      sticker.startDrag(mouse);
      return;
    }
  }

  onMouseRelease(mouse) {

    if (!this.activeSticker) return;

    if (this.hoverSlot && this.commands?.assign) {
      this.commands.assign(
        this.activeSticker.employee.id,
        this.hoverSlot.slotId
      );
    }

    this.activeSticker.stopDrag();

    this.activeSticker = null;
    this.hoverSlot = null;
  }

  update(p5, mouse) {
    if (this.activeSticker) {
      console.log("ACTIVE AT START:", this.activeSticker.employee.name);
    }
    // Safety: This ensures stale drag doesn’t survive
    if (!this.activeSticker) {
      for (const s of this.tray.stickers) {
        s.dragging = false;
      }
    }

    // Layout (simple centered board)
    this.setGeometry(40, 40, p5.width - 80, p5.height - 80);

    // Delegate
    if (this.tray) this.tray.update(mouse);
    if (this.grid) this.grid.update(mouse);

    // Scroll logic (only if not dragging a sticker)
    if (this.tray.isHovered(mouse.x, mouse.y) && !this.activeSticker) {
      if (mouse.wheel !== 0) {
          this.tray.scroll(mouse.wheel);
      }
    }

    // Drag logic
    if (this.activeSticker) {

      this.activeSticker.dragTo(mouse);

      const slot = this.grid.findNearestSlot(mouse.x, mouse.y);

      this.hoverSlot = slot;

      if (slot) {
        slot.highlight = true;
      }
    }
    R.ui.activeEmployeeCard = this.activeSticker;
    mouse.wheel = 0; // reset after use
  }

  render(g) {
    if (!g) return;

    g.push();

    g.fill("#5c2890234");
    g.rect(this.x, this.y, this.w, this.h, 16);

    g.pop(); 
    //console.clear();
    //console.log("about to render tray");
    if (this.tray) this.tray.render(g, this.activeSticker);

    //console.log("about to render grid");
    if (this.grid) this.grid.render(g);

    //console.log("about to render active sticker");
    if (this.activeSticker) this.activeSticker.render(g);
    //if (this.tray.) this.tray.render(g); TODO: ADD Slots render
    
  }

}