import { R }                        from "../../core/runtime.js";
import { UINode }                   from "../base/UINode.js";
import { EmployeeTray }             from "./EmployeeTray.js";
import { WeekGrid }                 from "./WeekGrid.js";
import { ContextMenuController }    from "../contextMenu/ContextMenuController.js";
import { InlineInput }              from "../overlays/InlineInput.js";
import { RestrictionHUD }           from "../overlays/RestrictionHUD.js";

export class Schedule extends UINode {
  constructor(state, commands) {
    super();
    this.hitType = "schedule";

    this.contextMenu        = new ContextMenuController(commands);
    this.requestContextMenu = (payload) => this.contextMenu.open(payload);

    this.inlineInput      = new InlineInput(commands);
    this.restrictionHUD   = new RestrictionHUD();
    this.tray        = new EmployeeTray(state.employees, this.requestContextMenu);
    this.grid        = new WeekGrid();

    // Children registered for hitTest — order matters (tray on top of grid)
    this.children = [this.grid, this.tray];

    this._lastW = 0;
    this._lastH = 0;
  }

  // ─────────────────────────────
  // LAYOUT
  // ─────────────────────────────

  layout() {
    const pad       = 20;
    const trayW     = this.w * 0.16;
    const trayX     = this.x + pad;
    const trayY     = this.y + pad;
    const trayH     = this.h - pad * 2;
    const gridX     = trayX + trayW + pad;
    const gridW     = this.w - trayW - pad * 3;

    this.tray.setGeometry(trayX, trayY, trayW, trayH);
    this.grid.setGeometry(gridX, trayY, gridW, trayH);
  }

  // ─────────────────────────────
  // HIT TEST  — context menu sits above everything
  // ─────────────────────────────

  hitTest(gx, gy) {
    // Context menu is highest z — check before children
    if (this.contextMenu.visible && this.contextMenu.hitTest(gx, gy)) {
      return { node: this.contextMenu, type: "contextMenu" };
    }

    if (!this.contains(gx, gy)) return null;

    // Walk children (grid, tray) — tray last = highest z
    for (let i = this.children.length - 1; i >= 0; i--) {
      const hit = this.children[i].hitTest(gx, gy);
      if (hit) return hit;
    }

    return { node: this, type: "schedule" };
  }

  // ─────────────────────────────
  // UPDATE
  // ─────────────────────────────

  update(p5, mouse) {
    // Resize guard
    const newW = p5.width  - 80;
    const newH = p5.height - 80;
    if (newW !== this._lastW || newH !== this._lastH) {
      this.setGeometry(40, 40, newW, newH);
      this._lastW = newW; this._lastH = newH;
    }

    this.tray.update(mouse);
    this.grid.update(mouse);

    // Scroll
    if (this.tray.contains(mouse.x, mouse.y) && !R.interaction.drag.active) {
      if (mouse.wheelDelta !== 0) this.tray.scroll(mouse.wheelDelta);
    }

    // Nearest slot during drag — works for both card and slot drag
    const drag = R.interaction.drag;
    if (drag.active) {
      let mx, my;
      if (drag.kind === "card" && drag.card) {
        mx = drag.card.getDragX(mouse) + drag.card.w / 2;
        my = drag.card.getDragY(mouse) + drag.card.h / 2;
      } else if (drag.kind === "slot") {
        mx = mouse.x - drag.offsetX + (drag.sourceSlot?.w ?? 0) / 2;
        my = mouse.y - drag.offsetY + (drag.sourceSlot?.h ?? 0) / 2;
      }
      drag._nearestSlot = (mx != null)
        ? this.grid.findNearestSlot(mx, my) ?? null
        : null;
    } else {
      drag._nearestSlot = null;
    }
  }

  // ─────────────────────────────
  // RENDER  — split gMain / gOverlay
  // ─────────────────────────────

  render(gMain, gOverlay) {
    gMain.push();
    gMain.noStroke();
    gMain.fill("#2c2c3a");
    gMain.rect(this.x, this.y, this.w, this.h, 16);
    gMain.pop();

    this.grid.render(gMain);
    
    const drag = R.interaction.drag;
    const activeCard = drag.kind === "card" ? drag.card : null;
    this.tray.render(gMain, activeCard);

    // Ghost render — card drag or slot drag
    
    if (drag.kind === "card" && drag.card) {
      drag.card.renderGhost(gOverlay, R.input.mouse);
    }
    if (drag.kind === "slot" && drag.sourceSlot) {
      drag.sourceSlot.renderGhost(gOverlay, R.input.mouse);
    }

    // Slot drag ghost
 
    if (drag.active && drag.kind === "slot" && drag.sourceSlot) {
      drag.sourceSlot.renderGhost(gOverlay, R.input.mouse);
    }

    this.inlineInput.render(gOverlay);
    this.contextMenu.render(gOverlay);
    this.restrictionHUD.render(gOverlay);
  }
}
