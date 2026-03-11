import { R } from "../../core/runtime.js";
import { TextInput } from "../base/TextInput.js";

// ─────────────────────────────────────────────────────────────────────────────
// InlineInput
// Positions a DOM TextInput directly over a card name or slot name.
// The target element sets isRenaming = true while active so it skips
// rendering its own name text — the DOM input sits exactly in its place.
// ─────────────────────────────────────────────────────────────────────────────

export class InlineInput {
  constructor(commands) {
    this.commands = commands;
    this.active   = false;
    this.target   = null;   // { type: "card"|"slot", ref, employeeId }

    this.textInput = new TextInput({
      onSubmit: (val) => this._commit(val),
      onCancel: ()    => this.cancel(),
    });
  }

  // ─────────────────────────────
  // OPEN ON CARD  (tray employee card)
  // trayX/trayY — tray global origin
  // scrollY     — current tray scroll
  // ─────────────────────────────

  openOnCard(card, trayX, trayY, scrollY) {
    if (this.active) this.cancel();

    const canvas = document.querySelector("canvas");

    // Global position of the name text area inside the card
    // Card renders at tray-local (localX, localY), tray is at (trayX, trayY - scrollY)
    const gx = trayX + card.localX;
    const gy = trayY + card.localY - scrollY;

    // Name zone: left portion of card, leaving room for context button
    const pad = 6;
    this.textInput.setGeometry(
      gx + pad,
      gy + pad,
      card.w - 30 - pad,   // 30 = context button width + gap
      card.h - pad * 2,
      canvas
    );

    this.textInput.setValue(card.employee.name);
    this.textInput.focus(canvas);

    card.isRenaming = true;
    this.target = { type: "card", ref: card, employeeId: card.employee.id };
    this.active = true;
  }

  // ─────────────────────────────
  // OPEN ON SLOT  (assigned slot row)
  // slot.x/y are already in global canvas space
  // ─────────────────────────────

  openOnSlot(slot) {
    console.log("[inline] openOnSlot called, active:", this.active);
    if (this.active) this.cancel();

    const assigned = slot.checkAssignment();
    if (!assigned) return;

    const emp = R.appState.employees.find(e => e.id === assigned);
    if (!emp) return;

    const canvas = document.querySelector("canvas");

    // Name text sits on the left of the slot, right of the context box
    const pad = 4;
    this.textInput.setGeometry(
      slot.x + pad,
      slot.y + pad,
      slot.w - slot.contextBox.w - 20 - pad,
      slot.h - pad * 2,
      canvas
    );

    this.textInput.setValue(emp.name);
    this.textInput.focus(canvas);

    slot.isRenaming = true;
    this.target = { type: "slot", ref: slot, employeeId: assigned };
    this.active = true;
  }

  // ─────────────────────────────
  // OPEN FOR NEW EMPLOYEE  (+ button at bottom of tray)
  // btnGlobalX/Y — global canvas coords of the button
  // ─────────────────────────────

  openForNewEmployee(btn, trayX, trayY, scrollY) {
    if (this.active) this.cancel();

    const canvas = document.querySelector("canvas");
    const gx = trayX + btn.x;
    const gy = trayY + btn.y - scrollY;
    const pad = 6;

    this.textInput.setGeometry(
      gx + pad, gy + pad,
      btn.w - pad * 2, btn.h - pad * 2,
      canvas
    );

    this.textInput.setValue("");
    this.textInput.focus(canvas);

    this.target = { type: "newEmployee" };
    this.active = true;
  }

  // ─────────────────────────────
  // COMMIT / CANCEL
  // ─────────────────────────────

  _commit(val) {
    const trimmed = val?.trim();
    if (!trimmed || !this.target) { this.cancel(); return; }

    // Find the EmployeeCard ref to pass to renameEmployee
    // commands.renameEmployee expects (ref, payload) where ref.employee.id exists
    // For slot: we need a fake ref with employee.id
    if (this.target.type === "newEmployee") {
      this.commands.addEmployee(trimmed);
      this._cleanup();
      return;
    }

    const ref = this.target.type === "card"
      ? this.target.ref
      : { employee: { id: this.target.employeeId } };

    this.commands.renameEmployee(ref, trimmed);
    this._cleanup();
  }

  cancel() {
    this._cleanup();
  }

  _cleanup() {
    if (this.target?.ref) this.target.ref.isRenaming = false;
    this.textInput.blur();
    this.textInput.clear();
    this.active = false;
    this.target = null;
  }

  // ─────────────────────────────
  // RENDER  — draws a highlight box in p5 behind where the DOM input sits
  // Call on gOverlay each frame while active
  // ─────────────────────────────

  render(g) {
    if (!this.active) return;

    const t = this.textInput;

    g.push();
    // Highlight background behind the DOM input
    g.noStroke();
    g.fill("#1a1a1a");
    g.rect(t.x - 2, t.y - 2, t.w + 4, t.h + 4, 4);

    // Teal focus border
    g.noFill();
    g.stroke("#0dc3aa");
    g.strokeWeight(1.5);
    g.rect(t.x - 2, t.y - 2, t.w + 4, t.h + 4, 4);
    g.pop();
  }
}
