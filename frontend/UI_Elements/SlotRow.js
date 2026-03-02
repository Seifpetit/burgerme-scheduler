import { R } from "../core/runtime.js";

export class SlotRow {
  constructor(dayIndex, shiftType, slotIndex) {

    this.dayIndex = dayIndex;
    this.shiftType = shiftType;   // "lunch" | "dinner"
    this.slotIndex = slotIndex;

    // unique slot id
    this.slotId = `${dayIndex}_${shiftType}_${slotIndex}`;

    // geometry
    this.x = 0;
    this.y = 0;
    this.w = 0;
    this.h = 0;
    this.contextBox = {
      x: 0,
      y: 0,
      w: 0,
      h: 0,
    };

    // interaction state
    this.highlight = false;

    // V0 assignment
    this.assignedEmployeeId = null;
  }

  setGeometry(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    
    this.contextBox = {
      x: x + w - w * 0.20,
      y: y + h - h * 0.15,
      w: w * 0.16,
      h: h * 0.1,
    };
  }

  hitTest(x, y) {
    return (
      x > this.x &&
      x < this.x + this.w &&
      y > this.y &&
      y < this.y + this.h
    );
  }

  checkAssignemnt() {
    return R.appState.draft?.assignments?.[this.slotId];
  }

  getCenter() {
    return {
      x: this.x + this.w / 2,
      y: this.y + this.h / 2
    };
  }

  contextBoxHitTest(mx, my) {
    return (mx > this.contextBox.x && mx < this.contextBox.x + this.contextBox.w &&
            my > this.contextBox.y && my < this.contextBox.y + this.contextBox.h);
  }

  update(mouse) {

  }

  renderContextBox(g) {
    g.fill("#92ba00");  g.stroke("#92ba00"); g.strokeWeight(1.4);
    
    g.rect(this.contextBox.x, this.contextBox.y, this.contextBox.w, this.contextBox.h, 4);
    const pad = this.contextBox.w / 3;
    for (let i = 0; i < 3; i++) {
      g.fill("#000000");
      g.circle(
        this.contextBox.x + pad * (i + 0.5), 
        this.contextBox.y + this.contextBox.h / 2, 4);
    }
  }

  render(g) {
    
    g.push();
    // background color
    g.fill(this.highlight ? "#92ba0091":"#333333");

    g.rect(this.x, this.y, this.w, this.h, 6);

    const assigned =
      R.appState.draft?.assignments?.[this.slotId];
      
    if (assigned) {
      g.fill(this.highlight ? "#6a32a67a" : "#4a4a4a");
      g.rect(this.x, this.y, this.w, this.h, 6);

      const emp = R.appState.employees.find(e => e.id === assigned);

      if (emp) {
        g.fill("#ffffff");
        const font = R.assets.fonts["Bold"];
        g.textSize(18);
        g.textFont(font);
        g.textAlign(g.CENTER, g.CENTER);
        g.text(
          emp.name,
          this.x + this.w/2,
          this.y + this.h/2 - 4
        );
      }

    } 

    // context menu button (simple square on right side) 
    this.renderContextBox(g);

    g.pop();

    // reset highlight (important)
    this.highlight = false;
  }

}