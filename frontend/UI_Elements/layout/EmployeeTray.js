import { R }            from "../../core/runtime.js";
import { UINode }       from "../base/UINode.js";
import { EmployeeCard } from "../cards/EmployeeCard.js";

export class EmployeeTray extends UINode {
  constructor(employees, requestContextMenu) {
    super();
    this.hitType            = "tray";
    this.requestContextMenu = requestContextMenu;

    this.scrollY              = 0;
    this.targetScrollY        = 0;
    this.contentHeight        = 0;
    this.scrollIndicatorAlpha = 0;

    // id → EmployeeCard  (Map preserves insertion order)
    this.stickers = new Map();
    this._syncEmployees(employees || []);

    // Add employee button — positioned at bottom of scroll content
    this.addBtn = { x: 0, y: 0, w: 0, h: 36, isHovered: false };
  }

  // children array kept in sync with stickers map for UINode traversal
  get children() { return [...this.stickers.values()]; }
  set children(_) {}  // UINode tries to set this in constructor — ignore

  // ─────────────────────────────
  // EMPLOYEE SYNC
  // ─────────────────────────────

  _syncEmployees(employees) {
    const incoming = new Set(employees.map(e => e.id));
    for (const [id] of this.stickers) {
      if (!incoming.has(id)) this.stickers.delete(id);
    }
    for (const emp of employees) {
      if (!this.stickers.has(emp.id)) {
        this.stickers.set(emp.id, new EmployeeCard(emp, this.requestContextMenu));
      }
    }
    if (this.w > 0) this.layout();
  }

  // ─────────────────────────────
  // LAYOUT
  // ─────────────────────────────

  layout() {
    const padding  = 12;
    const stickerH = 48;
    const spacing  = 10;
    let   curY     = padding;

    for (const card of this.stickers.values()) {
      card.setGeometry(padding, curY, this.w - padding * 2, stickerH);
      curY += stickerH + spacing;
    }
    // Add button sits below last card
    const btnPad = 12;
    this.addBtn.x = btnPad;
    this.addBtn.y = curY;
    this.addBtn.w = this.w - btnPad * 2;
    this.contentHeight = curY + this.addBtn.h + btnPad;
  }

  // ─────────────────────────────
  // HIT TEST  — converts global→tray-local before walking cards
  // ─────────────────────────────

  hitTest(gx, gy) {
    if (!this.contains(gx, gy)) return null;

    const lx = gx - this.x;
    const ly = gy - this.y + this.scrollY;

    for (const card of this.stickers.values()) {
      const hit = card.hitTest(lx, ly);
      if (hit) return hit;
    }

    const b = this.addBtn;
    if (lx > b.x && lx < b.x + b.w && ly > b.y && ly < b.y + b.h) {
      b.isHovered = true; 
      return { node: this, type: "addEmployeeButton" };
    }
    b.isHovered = false;

    return { node: this, type: "tray" };
  }

  // ─────────────────────────────
  // SCROLL
  // ─────────────────────────────

  scroll(delta) {
    const maxScroll = Math.max(0, this.contentHeight - this.h);
    const scaled    = delta * 0.4;
    const proposed  = this.targetScrollY + scaled;
    if (proposed >= 0 && proposed <= maxScroll) {
      this.targetScrollY = proposed;
    } else {
      this.targetScrollY += scaled * 0.12;
    }
  }

  _clampScroll() {
    const maxScroll = Math.max(0, this.contentHeight - this.h);
    if (maxScroll === 0) { this.targetScrollY = 0; this.scrollY = 0; return; }
    if (this.targetScrollY < 0)         this.targetScrollY *= 0.9;
    if (this.targetScrollY > maxScroll) this.targetScrollY = maxScroll + (this.targetScrollY - maxScroll) * 0.9;
  }

  // ─────────────────────────────
  // UPDATE
  // ─────────────────────────────

  update(mouse) {
    this._syncEmployees(R.appState.employees);

    this._clampScroll();
    this.scrollY += (this.targetScrollY - this.scrollY) * 0.18;

    const maxScroll = Math.max(0, this.contentHeight - this.h);
    if (this.scrollY < 0 && Math.abs(this.scrollY) < 0.5) {
      this.scrollY = 0; this.targetScrollY = 0;
    }
    if (this.scrollY > maxScroll && Math.abs(this.scrollY - maxScroll) < 0.5) {
      this.scrollY = maxScroll; this.targetScrollY = maxScroll;
    }

    const isScrolling         = Math.abs(this.targetScrollY - this.scrollY) > 0.5;
    this.scrollIndicatorAlpha = isScrolling ? 1 : this.scrollIndicatorAlpha * 0.9;

   
    // Update cards directly (not via super — need to pass mouse)
    for (const card of this.stickers.values()) card.update(mouse);
  }

  // ─────────────────────────────
  // RENDER
  // ─────────────────────────────

  render(g, activeCard = null) {
    g.push();
    g.noStroke();
    g.fill("#1c1c1c");
    g.rect(this.x, this.y, this.w, this.h, 12);

    g.drawingContext.save();
    g.drawingContext.beginPath();
    g.drawingContext.rect(this.x, this.y, this.w, this.h);
    g.drawingContext.clip();

    g.translate(this.x, this.y - this.scrollY);
    for (const card of this.stickers.values()) {
      card.render(g, card === activeCard);
    }

    this._renderAddBtn(g);

    g.drawingContext.restore();
    g.pop();

    this._renderScrubber(g);
  }

  _renderAddBtn(g) {
    const b      = this.addBtn;
    const hov    = b.isHovered;
    const cx     = b.x + b.w / 2;
    const cy     = b.y + b.h / 2;
    const color  = hov ? "#92ba00" : "#555";
    const r      = 8;

    g.push();

    // Hover fill 
    if (hov) {
      g.noStroke();
      g.fill("#92ba0015");
      g.rect(b.x, b.y, b.w, b.h, r);
    }

    // Dashed outline via drawingContext
    g.drawingContext.save();
    g.drawingContext.setLineDash([5, 4]);
    g.drawingContext.lineWidth   = 1.5;
    g.drawingContext.strokeStyle = color;
    g.drawingContext.beginPath();
    g.drawingContext.roundRect(b.x, b.y, b.w, b.h, r);
    g.drawingContext.stroke();
    g.drawingContext.restore();

    // + label
    g.noStroke();
    g.fill(color);
    g.textFont(R.assets.fonts["Bold"]);
    g.textSize(18);
    g.textAlign(g.CENTER, g.CENTER);
    g.text("+", cx, cy - 1);

    g.pop();
     this.addBtn.isHovered = false;  // reset each frame — hitTest sets it back if hovered
  }

  _renderScrubber(g) {
    if (this.contentHeight <= this.h) return;
    const ratio      = this.h / this.contentHeight;
    const indicatorH = this.h * ratio;
    const maxScroll  = this.contentHeight - this.h;
    const progress   = maxScroll > 0 ? this.scrollY / maxScroll : 0;
    const indicatorY = Math.max(this.y,
      Math.min(this.y + this.h - indicatorH, this.y + progress * (this.h - indicatorH)));

    g.push();
    g.noStroke();
    g.fill(255, 255 * this.scrollIndicatorAlpha * 0.25);
    g.rect(this.x + this.w - 6, indicatorY, 4, indicatorH, 4);
    g.pop();
  }
}
