import { SlotRow } from "./SlotRow.js";

export class ShiftSection {
  constructor(dayIndex, type) {

    this.dayIndex = dayIndex;     // 0–6
    this.type = type;             // "lunch" | "dinner"

    // geometry
    this.x = 0;
    this.y = 0;
    this.w = 0;
    this.h = 0;

    // children
    this.slots = [];

    // V0: fixed capacity
    this.capacity = 3;

    this.buildSlots();
  }

  buildSlots() {
    this.slots = [];

    for (let i = 0; i < this.capacity; i++) {
      this.slots.push(
        new SlotRow(this.dayIndex, this.type, i)
      );
    }
  } 

  getLabel() {
    return this.type === "lunch"
      ? "Lunch (12–16)"
      : "Dinner (18–22)";
  }

  setGeometry(x, y, w, h) {

    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;

    const labelH = 24;
    const slotAreaH = h - labelH;
    const slotH = slotAreaH / this.slots.length;

    for (let i = 0; i < this.slots.length; i++) {
      this.slots[i].setGeometry(
        x + 8,
        y + labelH + i * slotH,
        w - 16,
        slotH - 8
      );
    }
  }

  update(mouse) {
    for (const slot of this.slots) {
      slot.update(mouse);
    }
  }

  render(g) {

    g.push();

    // shift container background
    g.fill("#1f1f1f");
    g.rect(this.x, this.y, this.w, this.h, 8);

    // shift label
    g.fill("#ffffff");
    g.textAlign(g.LEFT, g.CENTER);
    g.text(
      this.getLabel(),
      this.x + 8,
      this.y + 12
    );

    g.pop();

    for (const slot of this.slots) {
      slot.render(g); 
    }
  }




}