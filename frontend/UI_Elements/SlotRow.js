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
  }

  hitTest(x, y) {
    return (
      x > this.x &&
      x < this.x + this.w &&
      y > this.y &&
      y < this.y + this.h
    );
  }

  getCenter() {
    return {
      x: this.x + this.w / 2,
      y: this.y + this.h / 2
    };
  }

  update(mouse) {

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
    

    g.pop();

    // reset highlight (important)
    this.highlight = false;
  }

}