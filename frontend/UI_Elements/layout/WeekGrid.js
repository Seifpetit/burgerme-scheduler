import { UINode }    from "../base/UINode.js";
import { DayColumn } from "./DayColumn.js";

export class WeekGrid extends UINode {
  constructor() {
    super();
    this.hitType  = "grid";

    // Build 7 day columns as children
    this.children = Array.from({ length: 7 }, (_, i) => new DayColumn(i));
  }

  get days() { return this.children; }

  // ─────────────────────────────
  // LAYOUT
  // ─────────────────────────────

  layout() {
    const colW = this.w / 7;
    for (let i = 0; i < this.children.length; i++) {
      this.children[i].setGeometry(this.x + i * colW , this.y, colW, this.h);
    }
  }

  // ─────────────────────────────
  // NEAREST SLOT  — used by drag system
  // ─────────────────────────────

  findNearestSlot(gx, gy) {
    let nearest = null;
    let minDist = 60;

    for (const day of this.children) {
      for (const shift of day.shifts) {
        for (const slot of shift.slots) {
          const c  = slot.getCenter();
          const dx = gx - c.x;
          const dy = gy - c.y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < minDist) { minDist = d; nearest = slot; }
        }
      }
    }
    return nearest;
  }

  // ─────────────────────────────
  // UPDATE — pulse management + base walk
  // ─────────────────────────────

  update(mouse) {
    const hov  = R.interaction?.hovered;
    const drag = R.interaction?.drag;

    for (const day of this.children) {
      for (const shift of day.shifts) {
        shift.update(mouse);
        for (const slot of shift.slots) {
          const isTarget = (hov?.node === slot) ||
                           (drag?.active && drag._nearestSlot === slot);
          if (isTarget && !slot.pulseTriggered) slot.triggerPulse();
          if (!isTarget) slot.pulseTriggered = false;
          slot.update(mouse);
        }
      }
    }
  }

  // ─────────────────────────────
  // RENDER — base walks children (days → shifts → slots)
  // ─────────────────────────────

  render(g) {
    super.render(g);
  }
}

// WeekGrid needs R for update — import here to avoid circular at top
import { R } from "../../core/runtime.js";
