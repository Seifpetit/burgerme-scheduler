import { R }           from "./runtime.js";
import { UI_ELEMENTS } from "./operator.js";
import { commands }    from "./commands.js";
import { beginTransition } from "./operator.js";

export function routeInput() {
  if (R.transition.phase !== "READY") return;

  // ── Restriction selection mode — intercepts all normal input ──────────────
  const rm = R.interaction.restrictMode;
  if (rm.active) {
    _handleRestrictMode();
    return;
  }

  const { hovered, click, released } = R.interaction;
  const mouse = R.input.mouse;
  const kb    = R.input.keyboard;

  UI_ELEMENTS.schedule?.contextMenu?.update();

  if (kb.justPressed) {
    UI_ELEMENTS.schedule?.contextMenu?.handleKey(kb);
  }

  if (R.interaction.drag.active) {
    _updateDragTilt(mouse);
    // card drag needs its own per-frame update (drag offset tracking)
    if (R.interaction.drag.kind === "card") R.interaction.drag.card?.updateDrag(mouse);
  }

  if (hovered)              _onHover(hovered, mouse);
  if (mouse.justRightClicked) _onRightClick(hovered, mouse);
  if (click === "single")   _onClick(hovered, mouse);
  if (click === "double")   _onDoubleClick(hovered, mouse);
  if (released)             _onRelease(hovered, mouse);
}

// ─────────────────────────────────────────────────────────────────────────────
// RESTRICT MODE  — slot selection for employee restrictions
// ─────────────────────────────────────────────────────────────────────────────
function _handleRestrictMode() {
  const rm       = R.interaction.restrictMode;
  const mouse    = R.input.mouse;
  const hovered  = R.interaction.hovered;
  const schedule = UI_ELEMENTS.schedule;
  const hud      = schedule?.restrictionHUD;

  // Hover still runs so SlotRow highlight works
  if (hovered) _onHover(hovered, mouse);

  // Drag-select — runs every frame while mouse is held
  // Must come BEFORE the click check so _didDragSelect is set before click fires
  if (mouse.pressed && hovered) {
    if (hovered.type === "slot" || hovered.type === "slotName") {
      const slotId = hovered.node.slotId;
      if (rm._lastToggled !== slotId) {
        if (rm.selected.has(slotId)) rm.selected.delete(slotId);
        else                         rm.selected.add(slotId);
        rm._lastToggled   = slotId;
        rm._didDragSelect = true;
        console.log("[restrict] drag-select toggled:", slotId, "selected:", [...rm.selected]);
      }
    }
  }

  // Reset _lastToggled when mouse released (but NOT _didDragSelect — click reads it below)
  if (!mouse.pressed) {
    rm._lastToggled = null;
  }

  // Click — validate, cancel, or single-slot toggle
  if (R.interaction.click === "single") {
    console.log("[restrict] click, _didDragSelect:", rm._didDragSelect, "hovered:", hovered?.type);

    if (hud?.hitTestValidate(mouse.x, mouse.y)) {
      console.log("[restrict] validate");
      commands.setSlotRestrictions(rm.employeeId, rm.selected);
      commands.cancelRestrictMode();
      rm._didDragSelect = false;
      return;
    }

    if (hud?.hitTestCancel(mouse.x, mouse.y)) {
      console.log("[restrict] cancel");
      commands.cancelRestrictMode();
      rm._didDragSelect = false;
      return;
    }

    // Only toggle on pure click — skip if drag-select already handled this gesture
    if (!rm._didDragSelect && (hovered?.type === "slot" || hovered?.type === "slotName")) {
      const slotId = hovered.node.slotId;
      if (rm.selected.has(slotId)) rm.selected.delete(slotId);
      else                         rm.selected.add(slotId);
      console.log("[restrict] click-toggle:", slotId, "selected:", [...rm.selected]);
    }

    rm._didDragSelect = false;  // reset AFTER click reads it
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DRAG TILT  — velocity-based rotation, shared by all drag kinds
// ─────────────────────────────────────────────────────────────────────────────
function _updateDragTilt(mouse) {
  const drag = R.interaction.drag;

  const prevX    = drag._tiltPrevX ?? mouse.x;
  const velocityX = mouse.x - prevX;
  drag._tiltPrevX = mouse.x;

  const maxTilt   = 0.12;
  const targetTilt = Math.max(-maxTilt, Math.min(maxTilt, velocityX * 0.018));
  drag.tilt += (targetTilt - drag.tilt) * 0.15;
}

// ─────────────────────────────────────────────────────────────────────────────
// HOVER
// ─────────────────────────────────────────────────────────────────────────────
function _onHover({ type, node }, mouse) {
  if (type === "exportButton") {
    node.updateHover(mouse);
  }

  const tray = UI_ELEMENTS.schedule?.tray;

  if (type === "trayCard" || type === "trayCardName") {
    const lx = mouse.x - tray.x;
    const ly = mouse.y - tray.y + tray.scrollY;
    node.onHover(lx, ly);
  }

  if (type === "contextMenu") {
    node.onHover(mouse.x, mouse.y);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RIGHT-CLICK
// ─────────────────────────────────────────────────────────────────────────────
function _onRightClick(hovered, mouse) {
  const schedule = UI_ELEMENTS.schedule;
  if (!schedule) return;

  schedule.contextMenu.close();
  if (!hovered) return;

  const { type, node } = hovered;
  const mw     = schedule.contextMenu.w;
  const spawnX = (mouse.x + mw > schedule.x + schedule.w) ? mouse.x - mw : mouse.x;
  const spawnY = mouse.y;

  if (type === "trayCard" || type === "trayCardName" || type === "trayCardContextBox") {
    schedule.requestContextMenu({ x: spawnX, y: spawnY, type: "EMPLOYEE", ref: node });
    return;
  }
  if (type === "slot" || type === "slotContextBox" || type === "slotName") {
    const menuType = node.checkAssignment() ? "ASSIGNMENT" : "SLOT";
    schedule.requestContextMenu({ x: spawnX, y: spawnY, type: menuType, ref: node });
    return;
  }
  if (type === "shiftContextBox" || type === "shift") {
    schedule.requestContextMenu({ x: spawnX, y: spawnY, type: "SHIFT", ref: node });
    return;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CLICK
// ─────────────────────────────────────────────────────────────────────────────
function _onClick(hovered, mouse) {
  console.log("[click] type:", hovered?.type, "contextVisible:", UI_ELEMENTS.schedule?.contextMenu?.visible);
  const schedule = UI_ELEMENTS.schedule;
  const tray     = schedule?.tray;

  if (!hovered) {
    schedule?.contextMenu?.close();
    schedule?.inlineInput?.cancel();
    UI_ELEMENTS.exportButton?.closeMenu();
    return;
  }

  const { type, node } = hovered;

  if (type === "exportButton") {
    node.onClick(mouse.x, mouse.y);
    return;
  }

  if (type === "contextMenu") {
    node.onClick(mouse.x, mouse.y);
    return;
  }

  schedule?.contextMenu?.close();
  UI_ELEMENTS.exportButton?.closeMenu();

  if (type === "button") {
    commands.generate();
    return;
  }

  if (type === "testButton") {
    node.onClick();
    return;
  }

  if (type === "addEmployeeButton") {
    const btn = tray.addBtn;
    schedule.inlineInput.openForNewEmployee(btn, tray.x, tray.y, tray.scrollY);
    return;
  }

  if (type === "trayCardContextBox") {
    schedule.requestContextMenu({
      x:    tray.x + node.contextBox.x,
      y:    tray.y + node.contextBox.y - tray.scrollY,
      type: "EMPLOYEE",
      ref:  node,
    });
    return;
  }

  if (type === "trayCard" || type === "trayCardName") {
    schedule.inlineInput?.cancel();
    node.startDrag(mouse, tray.x, tray.y, tray.scrollY);
    R.interaction.drag.active     = true;
    R.interaction.drag.kind       = "card";
    R.interaction.drag.card       = node;
    R.interaction.drag.sourceSlot = null;
    R.interaction.drag.tilt       = 0;
    R.interaction.drag._tiltPrevX = mouse.x;
    return;
  }

  // Assigned slot body — start slot drag
  // slotName is excluded: single click on name zone opens inline input instead
  if ((type === "slot" || type === "slotName") && node.checkAssignment() && !node.checkLock()) {
    const drag    = R.interaction.drag;
    drag.active     = true;
    drag.kind       = "slot";
    drag.sourceSlot = node;
    drag.card       = null;
    drag.offsetX    = mouse.x - node.x;
    drag.offsetY    = mouse.y - node.y;
    drag.tilt       = 0;
    drag._tiltPrevX = mouse.x;
    return;
  }

  if (type === "shiftContextBox") {
    const mw     = schedule.contextMenu.w;
    const spawnX = (node.contextBox.x + mw > schedule.x + schedule.w)
      ? node.contextBox.x + node.contextBox.w - mw : node.contextBox.x;
    schedule.requestContextMenu({ x: spawnX, y: node.contextBox.y, type: "SHIFT", ref: node });
    return;
  }

  if (type === "slotContextBox") {
    const menuType = node.checkAssignment() ? "ASSIGNMENT" : "SLOT";
    const mw       = schedule.contextMenu.w;
    const spawnX   = (node.contextBox.x + mw > schedule.x + schedule.w)
      ? node.contextBox.x + node.contextBox.w - mw : node.contextBox.x;
    schedule.requestContextMenu({ x: spawnX, y: node.contextBox.y, type: menuType, ref: node });
    return;
  }

}

// ─────────────────────────────────────────────────────────────────────────────
// DOUBLE-CLICK
// ─────────────────────────────────────────────────────────────────────────────
function _onDoubleClick(hovered, mouse) {
  console.log("[dbl] fired", hovered?.type, "inlineActive:", UI_ELEMENTS.schedule?.inlineInput?.active);
  const schedule = UI_ELEMENTS.schedule;
  if (!schedule || !hovered) return;

  const { type, node } = hovered;
  const tray   = schedule.tray;
  const mw     = schedule.contextMenu.w;
  const spawnX = (mouse.x + mw > schedule.x + schedule.w) ? mouse.x - mw : mouse.x;

  if (type === "trayCardName") {
    // Cancel the drag that started on the first click of this double-click
    if (R.interaction.drag.active && R.interaction.drag.card === node) {
      R.interaction.drag.card?.stopDrag();
      R.interaction.drag.active = false;
      R.interaction.drag.card   = null;
      R.interaction.drag.kind   = null;
    }
    schedule.inlineInput.openOnCard(node, tray.x, tray.y, tray.scrollY);
    return;
  }

  if (type === "slotName") {
    // Cancel slot drag that started on first click
    if (R.interaction.drag.active && R.interaction.drag.sourceSlot === node) {
      R.interaction.drag.active     = false;
      R.interaction.drag.sourceSlot = null;
      R.interaction.drag.kind       = null;
    }
    schedule.inlineInput.openOnSlot(node);
    return;
  }

  if (type === "shiftContextBox") {
    schedule.contextMenu.openInput({ x: spawnX, y: mouse.y, type: "SHIFT", ref: node });
    return;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RELEASE
// ─────────────────────────────────────────────────────────────────────────────
function _onRelease(hovered, mouse) {
  const drag = R.interaction.drag;
  if (!drag.active) return;

  const grid = UI_ELEMENTS.schedule?.grid;

  // ── Card drag (tray → slot) ──────────────
  if (drag.kind === "card" && drag.card) {
    if (grid) {
      const slot = grid.findNearestSlot(
        drag.card.getDragX(mouse) + drag.card.w / 2,
        drag.card.getDragY(mouse) + drag.card.h / 2
      );
      if (slot) {
        commands.assign(drag.card.employee.id, slot.slotId);
        slot.triggerPulse();
      }
    }
    drag.card.stopDrag();
  }

  // ── Slot drag (slot → slot) ──────────────
  if (drag.kind === "slot" && drag.sourceSlot) {
    const target = drag._nearestSlot;
    if (target && target !== drag.sourceSlot) {
      const moved = commands.moveAssignment(drag.sourceSlot.slotId, target.slotId);
      if (moved) {
        target.triggerPulse();
        drag.sourceSlot.triggerPulse();
      }
    }
  }

  drag.active       = false;
  drag.kind         = null;
  drag.card         = null;
  drag.sourceSlot   = null;
  drag._nearestSlot = null;
  drag.offsetX      = 0;
  drag.offsetY      = 0;
  drag.tilt         = 0;
  drag._tiltPrevX   = null;
}
