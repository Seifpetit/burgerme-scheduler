import { ShiftSection } from "./ShiftSection.js";

export class DayColumn {
  constructor(dayIndex) {

    this.dayIndex = dayIndex;

    // geometry
    this.x = 0;
    this.y = 0;
    this.w = 0;
    this.h = 0;

    // children
    this.shifts = [];

    this.buildShifts();
  }

  buildShifts() {
    this.shifts = [
      new ShiftSection(this.dayIndex, "lunch"),
      new ShiftSection(this.dayIndex, "dinner")
    ];
  }

  getDayLabel() {
    const labels = ["MON","TUE","WED","THU","FRI","SAT","SUN"];
    return labels[this.dayIndex];
  }

  setGeometry(x, y, w, h) {

    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;

    const headerH = 40;
    const shiftH = (h - headerH) / 2;

    // Lunch
    this.shifts[0].setGeometry(
      x,
      y + headerH,
      w,
      shiftH
    );

    // Dinner
    this.shifts[1].setGeometry(
      x,
      y + headerH + shiftH,
      w,
      shiftH
    );
  }

  update(mouse) {
    for (const shift of this.shifts) {
      shift.update(mouse);
    }
  }

  render(g) {

    g.push();

    // column background (optional subtle)
    g.fill("#2b2b2b");
    g.rect(this.x, this.y, this.w, this.h, 8);

    // header
    g.fill("#ffffff");
    g.textAlign(g.CENTER, g.CENTER);

    const label = this.getDayLabel();
    g.text(label, this.x + this.w / 2, this.y + 20);

    g.pop();

    // render shifts
    for (const shift of this.shifts) {
      shift.render(g);
    }
  }

}