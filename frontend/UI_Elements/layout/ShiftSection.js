import { R }      from "../../core/runtime.js";
import { UINode } from "../base/UINode.js";
import { SlotRow } from "../cards/SlotRow.js";

export class ShiftSection extends UINode {
  constructor(dayIndex, type) {
    super();
    this.hitType  = "shift";
    this.dayIndex = dayIndex;
    this.type     = type;
    this.key      = `${dayIndex}_${type}`;

    this.contextBox = { x: 0, y: 0, w: 16, h: 15 };

    const override  = R.appState?.config?.slotCounts?.[this.key];
    this.capacity   = override ?? 3;
    this.buildSlots();
  }

  // ─────────────────────────────
  // SLOTS
  // ─────────────────────────────

  buildSlots() {
    this.children = [];
    for (let i = 0; i < this.capacity; i++) {
      this.children.push(new SlotRow(this.dayIndex, this.type, i));
    }
    if (this.w > 0) this.layout();
  }

  get slots() { return this.children; }

  // ─────────────────────────────
  // LAYOUT
  // ─────────────────────────────

  layout() {
    const labelH  = 24;
    const slotAreaH = this.h - labelH;
    const slotH   = this.children.length > 0 ? slotAreaH / this.children.length : 0;

    this.contextBox = {
      x: this.x + this.w - 20,
      y: this.y + 4,
      w: 16,
      h: 15,
    };

    for (let i = 0; i < this.children.length; i++) {
      this.children[i].setGeometry(
        this.x + 8,
        this.y + labelH + i * slotH,
        this.w - 16,
        slotH - 8
      );
    }
  }

  // ─────────────────────────────
  // HIT TEST
  // ─────────────────────────────

  hitTest(gx, gy) {
    if (!this.contains(gx, gy)) return null;

    // Context box first
    const b = this.contextBox;
    if (gx > b.x && gx < b.x + b.w && gy > b.y && gy < b.y + b.h) {
      return { node: this, type: "shiftContextBox" };
    }

    // Walk slots
    for (let i = this.children.length - 1; i >= 0; i--) {
      const hit = this.children[i].hitTest(gx, gy);
      if (hit) return hit;
    }

    return { node: this, type: "shift" };
  }

  // ─────────────────────────────
  // STATE
  // ─────────────────────────────

  getLabel()  { return this.type === "lunch" ? "Lunch" : "Dinner"; }
  checkLock() { return R.appState.shiftLocks?.[this.key]; }

  // ─────────────────────────────
  // UPDATE
  // ─────────────────────────────

  update(mouse) {
    // Capacity change detection
    const slotCounts  = R.appState.config?.slotCounts;
    if (slotCounts && slotCounts[this.key] !== undefined) {
      const newCapacity = Number(slotCounts[this.key]);
      if (Number.isFinite(newCapacity) && this.capacity !== newCapacity) {
        this.capacity = newCapacity;
        this.buildSlots();
      }
    }
    super.update(mouse);
  }

  // ─────────────────────────────
  // RENDER
  // ─────────────────────────────

  render(g) {
    g.push();
    g.fill("#1f1f1f");
    g.stroke(this.checkLock() ? "#e2621d" : "#92ba00");
    g.strokeWeight(this.checkLock() ? 3 : 0.5);
    g.rect(this.x, this.y, this.w, this.h, 8);
    g.noStroke();

    g.fill(this.checkLock() ? "#e2621d" : "#fff");
    g.textAlign(g.LEFT, g.CENTER);
    g.textFont(R.assets.fonts["Medium"]);
    g.text(this.getLabel(), this.x + 8, this.y + 12);

    g.fill("#333333"); g.stroke("#fba700"); g.strokeWeight(1.4);
    g.rect(this.contextBox.x, this.contextBox.y, this.contextBox.w, this.contextBox.h, 4);
    g.pop();

    super.render(g); // render slots
  }
}
