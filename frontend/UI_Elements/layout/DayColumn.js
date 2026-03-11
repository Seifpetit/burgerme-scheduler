import { R }            from "../../core/runtime.js";
import { UINode }       from "../base/UINode.js";
import { ShiftSection } from "./ShiftSection.js";

export class DayColumn extends UINode {
  constructor(dayIndex) {
    super();
    this.hitType  = "day";
    this.dayIndex = dayIndex;

    this.children = [
      new ShiftSection(dayIndex, "lunch"),
      new ShiftSection(dayIndex, "dinner"),
    ];
  }

  get shifts() { return this.children; }

  getDayLabel() {
    return ["MON","TUE","WED","THU","FRI","SAT","SUN"][this.dayIndex];
  }

  // ─────────────────────────────
  // LAYOUT
  // ─────────────────────────────

  layout() {
    const headerH = 40;
    const shiftH  = (this.h - headerH) / 2;

    this.children[0].setGeometry(this.x, this.y + headerH,          this.w-3, shiftH-2);
    this.children[1].setGeometry(this.x, this.y + headerH + shiftH, this.w-3, shiftH-2);
  }

  // ─────────────────────────────
  // RENDER
  // ─────────────────────────────

  render(g) {
    g.push();
    g.fill("#333");
    g.rect(this.x, this.y, this.w, this.h, 8);
    g.noStroke();

    g.fill("#92ba00");
    g.textAlign(g.CENTER, g.CENTER);
    g.stroke("#000"); g.strokeWeight(1);
    g.textFont(R.assets.fonts["ExtraBold"]);
    g.textSize(20);
    g.text(this.getDayLabel(), this.x + this.w / 2, this.y + 16);
    g.pop();

    super.render(g); // renders shifts → slots
  }
}
