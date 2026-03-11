import { R }        from "../../core/runtime.js";
import { UINode }   from "../base/UINode.js";

export class EmployeeCard extends UINode {
  constructor(employee, requestContextMenu) {
    super();
    this.hitType            = "trayCard";
    this.employee           = employee;
    this.requestContextMenu = requestContextMenu;

    this.localX = 0;
    this.localY = 0;

    this.dragging    = false;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;

    this.isRenaming = false;

    this.contextBox = { x: 0, y: 0, w: 15, h: 0, isHovered: false };
    this.nameBox    = { x: 0, y: 0, w: 0,  h: 0 };
  }

  // ─────────────────────────────
  // GEOMETRY  — card lives in tray-local space
  // ─────────────────────────────

  setGeometry(x, y, w, h) {
    this.localX = x; this.localY = y;
    this.w = w; this.h = h;
    this.x = x; this.y = y; // UINode bounds (tray-local)
    this.layout();
  }

  layout() {
    this.contextBox.x = this.localX + this.w - 20;
    this.contextBox.y = this.localY + this.h * 0.1;
    this.contextBox.w = 15;
    this.contextBox.h = this.h * 0.8;

    this.nameBox.x = this.localX + 4;
    this.nameBox.y = this.localY;
    this.nameBox.w = this.w - 30;
    this.nameBox.h = this.h;
  }

  // ─────────────────────────────
  // HIT TEST  (tray-local coords)
  // ─────────────────────────────

  hitTest(lx, ly) {
    if (!this.contains(lx, ly)) return null;

    const b = this.contextBox;
    if (lx > b.x && lx < b.x + b.w && ly > b.y && ly < b.y + b.h) {
      return { node: this, type: "trayCardContextBox" };
    }

    const n = this.nameBox;
    if (lx > n.x && lx < n.x + n.w && ly > n.y && ly < n.y + n.h) {
      return { node: this, type: "trayCardName" };
    }

    return { node: this, type: "trayCard" };
  }

  // ─────────────────────────────
  // HOVER
  // ─────────────────────────────

  onHover(lx, ly) {
    const b = this.contextBox;
    this.contextBox.isHovered =
      lx > b.x && lx < b.x + b.w && ly > b.y && ly < b.y + b.h;
  }

  // ─────────────────────────────
  // DRAG
  // ─────────────────────────────

  startDrag(mouse, trayX, trayY, scrollY) {
    this.dragging    = true;
    this.dragOffsetX = mouse.x - (trayX + this.localX);
    this.dragOffsetY = mouse.y - (trayY + this.localY - scrollY);
  }

  updateDrag(mouse) {
    if (!this.dragging) return;
    // tilt is managed by R.interaction.drag.tilt via routeInput._updateDragTilt
  }

  stopDrag() {
    this.dragging = false;
  }

  getDragX(mouse) { return mouse.x - this.dragOffsetX; }
  getDragY(mouse) { return mouse.y - this.dragOffsetY; }

  // ─────────────────────────────
  // UPDATE
  // ─────────────────────────────

  update(mouse) {
    if (this.dragging) this.updateDrag(mouse);
    // leaf — no super.update()
  }

  // ─────────────────────────────
  // RENDER  (called inside tray's translate)
  // ─────────────────────────────

  render(g, isActive = false) {
    g.push();
    g.translate(this.localX + this.w / 2, this.localY + this.h / 2);

    const isHovered = R.interaction.hovered?.node === this;
    const alpha     = isActive ? "60" : "ff";
    g.noStroke();
    g.fill(isHovered ? `#afe000${alpha}` : `#92ba00${alpha}`);
    g.rect(-this.w / 2, -this.h / 2, this.w, this.h, 10);

    if (!isActive) {
      if (!this.isRenaming) {
        // Name
        g.fill("#fff");
        g.textSize(14);
        g.textAlign(g.LEFT, g.CENTER);
        g.stroke("#000"); g.strokeWeight(2);
        g.textFont(R.assets.fonts["Bold"]);
        g.text(this.employee.name, -this.w / 2 + 10, -6);
        g.noStroke();

        // Role badge
        const role = this.employee.role;
        if (role) {
          const roleColor = role === "kitchen" ? "#e2621d" : "#3a9bd5";
          g.fill(roleColor);
          g.textFont(R.assets.fonts["Medium"]);
          g.textSize(9);
          g.textAlign(g.LEFT, g.CENTER);
          g.text(role.toUpperCase(), -this.w / 2 + 10, 8);
        }
      }

      const bw = this.contextBox.w;
      const bh = this.contextBox.h;
      const bx = this.w / 2 - 20;
      const by = -(bh / 2);
      g.fill(this.contextBox.isHovered ? "#6c6c6c" : "#333");
      g.stroke("#fba700"); g.strokeWeight(1.4);
      g.rect(bx, by, bw, bh, 10);
      g.noStroke();
    }

    g.pop();
  }

  renderGhost(g, mouse) {
    if (!this.dragging) return;
    const gx = this.getDragX(mouse);
    const gy = this.getDragY(mouse);

    g.push();
    g.translate(gx + this.w / 2, gy + this.h / 2);
    g.rotate(R.interaction.drag.tilt);
    g.noStroke();
    g.fill("#afe000b0");
    g.rect(-this.w / 2, -this.h / 2, this.w, this.h, 10);
    g.fill("#fff");
    g.textSize(18);
    g.textAlign(g.LEFT, g.CENTER);
    g.stroke("#000"); g.strokeWeight(2);
    g.textFont(R.assets.fonts["Bold"]);
    g.text(this.employee.name, -this.w / 2 + 10, -2);
    g.noStroke();
    g.pop();
  }
}
