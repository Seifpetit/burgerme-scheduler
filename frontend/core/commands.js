import { R } from "./runtime.js";

// ─────────────────────────────────────────────────────────────────────────────
// commands
// Responsibility: every mutation of R.appState lives here.
//
// Commands called from the context menu receive (ref, payload) where:
//   ref     — the UI element that owns the menu (SlotRow, ShiftSection, EmployeeCard)
//   payload — string from input box, or null
//
// Commands called directly (assign, generate) keep their natural signatures.
// ─────────────────────────────────────────────────────────────────────────────

export const commands = {

  // ═══════════════════════════════════════
  // EMPLOYEES   ref = EmployeeCard
  // ═══════════════════════════════════════

  addEmployee(name) {
    const id = "emp_" + Date.now();
    R.appState.employees.push({ id, name });
  },

  setRoleKitchen(ref) {
    const emp = R.appState.employees.find(e => e.id === ref.employee.id);
    if (emp) emp.role = "kitchen";
  },

  setRoleCourier(ref) {
    const emp = R.appState.employees.find(e => e.id === ref.employee.id);
    if (emp) emp.role = "courier";
  },

  renameEmployee(ref, payload) {
    const id = ref.employee.id;
    for (const emp of R.appState.employees) {
      if (emp.id === id) { emp.name = payload; return; }
    }
  },

  removeEmployee(ref) {
    const id = ref.employee.id;
    R.appState.employees = R.appState.employees.filter(e => e.id !== id);

    const assigned = R.appState.draft?.assignments ?? {};
    for (const slot in assigned) {
      if (assigned[slot] === id) assigned[slot] = null;
    }
  },

  // ═══════════════════════════════════════
  // ASSIGNMENTS   ref = SlotRow
  // ═══════════════════════════════════════

  assign(employeeId, slotId) {
    if (R.appState.slotLocks?.[slotId]) return false;
    R.appState.draft.assignments[slotId] = employeeId;
    return true;
  },

  unassign(slotId) {
    if (R.appState.slotLocks?.[slotId]) return false;
    delete R.appState.draft.assignments[slotId];
    return true;
  },

  removeAssignment(ref) {
    return this.unassign(ref.slotId);
  },

  // Move assignment from one slot to another.
  // If target is occupied and not locked → swap.
  moveAssignment(fromSlotId, toSlotId) {
    const locks       = R.appState.slotLocks;
    const assignments = R.appState.draft.assignments;

    if (locks[toSlotId])   { console.log("Move blocked — target locked:", toSlotId);   return false; }
    if (locks[fromSlotId]) { console.log("Move blocked — source locked:", fromSlotId); return false; }

    const fromEmp = assignments[fromSlotId];
    const toEmp   = assignments[toSlotId];   // may be undefined

    if (!fromEmp) return false;

    // Swap or move
    assignments[toSlotId]   = fromEmp;
    if (toEmp) {
      assignments[fromSlotId] = toEmp;    // swap
    } else {
      delete assignments[fromSlotId];     // move
    }
    return true;
  },

  // ═══════════════════════════════════════
  // SLOT LOCKS   ref = SlotRow
  // ═══════════════════════════════════════

  toggleSlotLock(ref) {
    const locks = R.appState.slotLocks;
    const id    = ref.slotId;
    if (locks[id]) { delete locks[id]; }
    else           { locks[id] = true; }
  },

  // ═══════════════════════════════════════
  // SHIFT REQUIREMENTS   ref = ShiftSection
  // ═══════════════════════════════════════

  setShiftRequirements(ref, payload) {
    // payload = { kitchen: n, bicycle: n, motor: n }
    R.appState.shiftRequirements            ??= {};
    R.appState.shiftRequirements[ref.key]    = {
      kitchen: Math.max(0, parseInt(payload.kitchen) || 0),
      bicycle: Math.max(0, parseInt(payload.bicycle) || 0),
      motor:   Math.max(0, parseInt(payload.motor)   || 0),
    };
  },

  // no-op stub — panel is opened by ContextMenuController directly
  openRequirementsPanel() {},

  // ═══════════════════════════════════════
  // SHIFTS   ref = ShiftSection
  // ═══════════════════════════════════════

  changeSlotCount(ref, payload) {
    const n = Number(payload);
    if (!Number.isFinite(n) || n < 0) return;
    R.appState.config.slotCounts[ref.key] = n;
  },

  toggleShiftLock(ref) {
    const locks = R.appState.shiftLocks;
    const key   = ref.key;
    if (locks[key]) { delete locks[key]; }
    else            { locks[key] = true; }
  },

  deleteShift(ref) {
    R.appState.config.slotCounts[ref.key] = 0;
  },

  // ═══════════════════════════════════════
  // RESTRICTIONS   ref = EmployeeCard
  // ═══════════════════════════════════════

  // Opens restriction selection mode — closes context menu, activates HUD.
  // Called from EMPLOYEE menu "Restrict from…" action.
  openRestrictMode(ref) {
    const empId = ref.employee?.id;
    if (!empId) return;

    R.appState.restrictions        ??= {};
    R.appState.restrictions[empId] ??= [];

    // Pre-select existing restrictions for this employee
    const existing = new Set(R.appState.restrictions[empId]);

    R.interaction.restrictMode.active     = true;
    R.interaction.restrictMode.employeeId = empId;
    R.interaction.restrictMode.selected   = existing;
  },

  // Commits the selected slot ids as restrictions for the employee.
  // Called by RestrictionHUD validate button.
  setSlotRestrictions(employeeId, slotIds) {
    if (!employeeId) return;
    R.appState.restrictions            ??= {};
    R.appState.restrictions[employeeId] = [...slotIds];
  },

  // Clears restriction mode without saving.
  cancelRestrictMode() {
    R.interaction.restrictMode.active     = false;
    R.interaction.restrictMode.employeeId = null;
    R.interaction.restrictMode.selected   = null;
  },

  // ═══════════════════════════════════════
  // GENERATE  (called directly, no ref)
  // ═══════════════════════════════════════

  generate() {
    const assignments = R.appState.draft.assignments;
    const employees   = R.appState.employees;
    const locks       = R.appState.slotLocks;
    let   index       = 0;

    for (let day = 0; day < 7; day++) {
      for (const shift of ["lunch", "dinner"]) {

        const usedInShift = new Set();
        for (let slot = 0; slot < 6; slot++) {
          const emp = assignments[`${day}_${shift}_${slot}`];
          if (emp) usedInShift.add(emp);
        }

        for (let slot = 0; slot < 6; slot++) {
          const slotId = `${day}_${shift}_${slot}`;
          if (locks[slotId])       continue;
          if (assignments[slotId]) continue;

          let tries = 0;
          while (tries < employees.length) {
            const employee = employees[index % employees.length];
            index++;
            if (!usedInShift.has(employee.id)) {
              assignments[slotId] = employee.id;
              usedInShift.add(employee.id);
              break;
            }
            tries++;
          }
        }
      }
    }
  },

};
