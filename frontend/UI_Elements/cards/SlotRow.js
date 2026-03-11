import { R }             from "../../core/runtime.js";
import { UINode }        from "../base/UINode.js";
import { VERDICT_COLORS } from "../../core/validator.js";

export class SlotRow extends UINode {
  constructor(dayIndex, shiftType, slotIndex) {
    super();
    this.hitType   = "slot";
    this.dayIndex  = dayIndex;
    this.shiftType = shiftType;
    this.slotIndex = slotIndex;
    this.slotId    = `${dayIndex}_${shiftType}_${slotIndex}`;

    this.contextBox = { x: 0, y: 0, w: 0, h: 0 };
    this.nameBox    = { x: 0, y: 0, w: 0, h: 0 };
    this.isRenaming = false;

    this.isDragging   = false;
    this.isDragSource = false;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;

    this.pulse          = 0;
    this.pulseTriggered = false;
  }

  // ─────────────────────────────
  // GEOMETRY
  // ─────────────────────────────

  layout() {
    this.contextBox = {
      x: this.x + this.w - this.w * 0.16,
      y: this.y + this.h * 0.1,
      w: this.w * 0.12,
      h: this.h * 0.8,
    };
    this.nameBox = {
      x: this.x + 4,
      y: this.y,
      w: this.w - this.w * 0.16 - 8,
      h: this.h,
    };
  }

  // ─────────────────────────────
  // HIT TEST — returns specific sub-region types before falling to "slot"
  // ─────────────────────────────

  hitTest(gx, gy) {
    if (!this.contains(gx, gy)) return null;

    // Context box — highest priority within slot
    const b = this.contextBox;
    if (gx > b.x && gx < b.x + b.w && gy > b.y && gy < b.y + b.h) {
      return { node: this, type: "slotContextBox" };
    }

    // Name box — only when assigned
    if (this.checkAssignment()) {
      const n = this.nameBox;
      if (gx > n.x && gx < n.x + n.w && gy > n.y && gy < n.y + n.h) {
        return { node: this, type: "slotName" };
      }
    }

    return { node: this, type: "slot" };
  }

  // ─────────────────────────────
  // STATE
  // ─────────────────────────────

  checkAssignment() { return R.appState.draft?.assignments?.[this.slotId]; }
  checkLock()       { return R.appState.slotLocks?.[this.slotId]; }
  getCenter()       { return { x: this.x + this.w / 2, y: this.y + this.h / 2 }; }

  // ─────────────────────────────
  // DRAG SOURCE
  // ─────────────────────────────

  startDrag(mouse) {
    this.isDragging  = true;
    this.dragOffsetX = mouse.x - (this.x + this.w / 2);
    this.dragOffsetY = mouse.y - (this.y + this.h / 2);
  }

  stopDrag() {
    this.isDragging  = false;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
  }

  getDragX(mouse) { return mouse.x - this.dragOffsetX - this.w / 2; }
  getDragY(mouse) { return mouse.y - this.dragOffsetY - this.h / 2; }

  renderGhost(g, mouse) {
    const assigned = this.checkAssignment();
    if (!assigned) return;
    const emp = R.appState.employees.find(e => e.id === assigned);
    if (!emp) return;

    const gx = this.getDragX(mouse);
    const gy = this.getDragY(mouse);

    g.push();
    g.noStroke();
    g.fill("#92ba00b0");
    g.rect(gx, gy, this.w, this.h, 6);
    g.fill("#fff");
    g.textFont(R.assets.fonts["Bold"]);
    g.textSize(18);
    g.textAlign(g.LEFT, g.CENTER);
    g.stroke("#000"); g.strokeWeight(2);
    g.text(emp.name, gx + 4, gy + this.h / 2 - 2);
    g.noStroke();
    g.pop();
  }

  triggerPulse() {
    if (this.pulseTriggered) return;
    this.pulseTriggered = true;
    this.pulse = 1.0;
  }

  // ─────────────────────────────
  // UPDATE
  // ─────────────────────────────

  update(mouse) {
    // Pulse tick — no children to walk
    if (this.pulse > 0) {
      this.pulse *= 0.82;
      if (this.pulse < 0.01) { this.pulse = 0; this.pulseTriggered = false; }
    }
  }

  // ─────────────────────────────
  // RENDER
  // ─────────────────────────────

  render(g) {
    g.push();
    g.noStroke();

    const hov          = R.interaction.hovered;
    const drag         = R.interaction.drag;
    const rm           = R.interaction.restrictMode;
    const isHovered    = hov?.node === this;
    const isDragSource = drag.active && drag.kind === "slot" && drag.sourceSlot === this;
    const isDragTarget = drag.active && drag._nearestSlot === this && drag.sourceSlot !== this;

    const assigned = this.checkAssignment();
    const locked   = this.checkLock();

    if (locked) { g.stroke("#e2621d"); g.strokeWeight(3); }

    // Pick fill
    let fillColor;
    if (rm.active) {
      // Restriction selection mode — show selected/hover state, mute everything else
      const isSelected  = rm.selected?.has(this.slotId);
      const isRestrHov  = isHovered;
      if (isSelected)      fillColor = "#fba70099";
      else if (isRestrHov) fillColor = "#fba70044";
      else                 fillColor = "#22222299";
    } else if (isDragSource) {
      fillColor = "#33333380";
    } else if (isDragTarget) {
      const verdict = drag.verdict ?? "neutral";
      const base    = VERDICT_COLORS[verdict] ?? VERDICT_COLORS.neutral;
      fillColor = base + "90";
    } else if (isHovered) {
      fillColor = assigned ? "#6a32a67a" : "#58e6fc3b";
    } else {
      fillColor = assigned ? "#92ba00" : "#333333";
    }
    g.fill(fillColor);
    g.rect(this.x, this.y, this.w, this.h, 6);
    g.noStroke();

    if (assigned && !this.isRenaming && !isDragSource) {
      const emp = R.appState.employees.find(e => e.id === assigned);
      if (emp) {
        g.fill("#fff");
        g.textFont(R.assets.fonts["Bold"]);
        g.textSize(18);
        g.textAlign(g.LEFT, g.CENTER);
        g.text(emp.name, this.x + 4, this.y + this.h / 2 - 2);
      }
    }

    const hasAssignment = !!assigned;
    g.fill(hasAssignment ? "#333" : "#92ba00");
    g.stroke(hasAssignment ? "#333" : "#92ba00"); g.strokeWeight(1.4);
    g.rect(this.contextBox.x, this.contextBox.y, this.contextBox.w, this.contextBox.h, 4);
    const pad = this.contextBox.h / 3;
    for (let i = 0; i < 3; i++) {
      g.fill(hasAssignment ? "#92ba00" : "#333"); g.noStroke();
      g.circle(this.contextBox.x + this.contextBox.w / 2, this.contextBox.y + pad * (i + 0.5), 4);
    }

    if (this.pulse > 0) {
      const expand = this.pulse * 6;
      g.push(); g.noFill();
      g.stroke("#00ffffbe"); g.strokeWeight(2 + this.pulse * 2);
      g.rect(this.x - expand/2, this.y - expand/2, this.w + expand, this.h + expand, 6);
      g.pop();
    }

    g.pop();
    // SlotRow is a leaf — no super.render() needed
  }

  // ─────────────────────────────
  // DRAG GHOST  — floating card drawn on overlay while this slot is being dragged
  // ─────────────────────────────

  renderGhost(g, mouse) {
    const drag = R.interaction.drag;
    if (!drag.active || drag.sourceSlot !== this) return;

    const gx = mouse.x - drag.offsetX;
    const gy = mouse.y - drag.offsetY;

    const assigned = this.checkAssignment();
    const emp      = R.appState.employees.find(e => e.id === assigned);
    if (!emp) return;

    g.push();
    g.translate(gx + this.w / 2, gy + this.h / 2);
    g.rotate(drag.tilt);  // shared tilt from R.interaction.drag
    g.noStroke();

    g.fill("#7b4fcfb0");
    g.rect(-this.w / 2, -this.h / 2, this.w, this.h, 6);

    g.fill("#fff");
    g.textFont(R.assets.fonts["Bold"]);
    g.textSize(18);
    g.textAlign(g.LEFT, g.CENTER);
    g.stroke("#000"); g.strokeWeight(2);
    g.text(emp.name, -this.w / 2 + 4, -2);
    g.noStroke();

    g.pop();
  }
}
