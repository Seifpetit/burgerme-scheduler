export class EmployeeCard {
  constructor(employee) {

    this.employee = employee;

    // geometry
    this.x = 0;   // local OR global depending on state
    this.y = 0;
    this.w = 0;
    this.h = 0;

    // interaction state
    this.highlighted = false;
    this.dragging = false;

    // drag offsets (global space)
    this.offsetX = 0;
    this.offsetY = 0;

    // original tray position (for reset)
    this.localX = 0;
    this.localY = 0;
  }

  // ─────────────────────────────
  // GEOMETRY
  // ─────────────────────────────

  setGeometry(x, y, w, h) {
    this.localX = x;
    this.localY = y;

    // only apply if not dragging
    if (!this.dragging) {
      this.x = x;
      this.y = y;
    }

    this.w = w;
    this.h = h;
  }

  // ─────────────────────────────
  // HIT TEST (LOCAL SPACE)
  // ─────────────────────────────

  hitTest(x, y) {
    return (
      x > this.localX &&
      x < this.localX + this.w &&
      y > this.localY &&
      y < this.localY + this.h
    );
  }

  highlight() {
    this.highlighted = true;
  }

  clearHighlight() {
    this.highlighted = false;
  }

  // ─────────────────────────────
  // DRAG
  // ─────────────────────────────

  /**
   * IMPORTANT:
   * This expects x/y already converted to global space
   * BEFORE calling startDrag.
   */
  startDrag(mouse) {

    this.dragging = true;

    this.offsetX = mouse.x - this.x;
    this.offsetY = mouse.y - this.y;
  }

  dragTo(mouse) {
    if (!this.dragging) return;

    this.x = mouse.x - this.offsetX;
    this.y = mouse.y - this.offsetY;
  }

  stopDrag() {
    this.dragging = false;
    // force reset to layout position next frame
    //this.x = this.localX;
    //this.y = this.localY;
  }

  // ─────────────────────────────
  // UPDATE
  // ─────────────────────────────

  update(mouse) {
    // future: add animation, hover effects, etc.
  }

  // ─────────────────────────────
  // RENDER
  // ─────────────────────────────

  render(g) {

    g.push();

    // subtle lift effect while dragging
    if (this.dragging) {
      g.shadowColor = "rgba(0,0,0,0.4)";
      g.shadowBlur = 15;
    }
    //                        "#afe000" : "#92ba00"
    g.fill(this.highlighted ? "#afe000" : "#92ba00");
    g.rect(this.x, this.y, this.w, this.h, 10);

    g.fill("#000000"); g.textSize(20);
    g.textAlign(g.LEFT, g.CENTER);
    g.text(
      this.employee.name,
      this.x + 12,
      this.y + this.h / 2
    );

    g.pop();
  }
}