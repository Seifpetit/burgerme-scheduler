import { R } from "./runtime.js";

export const commands = {
//=================================================//
//EMPLOYEE COMMANDS
//=================================================//
  renameEmployee(employeeId, newName) {
    const employees = R.appState.employees;
   
    for(const emp of employees){
      if(emp.id === employeeId) emp.name = newName;
    }

  },

  removeEmployee(employeeId) {
   
    R.appState.employees = R.appState.employees.filter(e => e.id !== employeeId);

    if (!R.appState.draft) {
      R.appState.draft = { assignments: {} };
    }
    const assigned = R.appState.draft.assignments;

    for(const slot in assigned) {
      if(assigned[slot] === employeeId) assigned[slot] = null;
    }
     

  },

//=================================================//
//SCHEDULE COMMANDS
//=================================================//
  assign(employeeId, slotId) {

    if (!R.appState.draft) {
      R.appState.draft = { assignments: {} };
    }
    if (!R.appState.locks) R.appState.locks = {};

    if (R.appState.locks[slotId]) {
      console.log("Assign blocked (locked slot):", slotId);
      return false;
    }
    R.appState.draft.assignments[slotId] = employeeId;

    console.log("Assigned:", employeeId, "→", slotId);
  },

  unassign(slotId) {
    if (!R.appState.draft?.assignments) return false;
    if (!R.appState.locks) R.appState.locks = {};

    if (R.appState.locks[slotId]) {
      console.log("Unassign blocked (locked slot):", slotId);
      return false;
    }

    delete R.appState.draft.assignments[slotId];
    return true;
  },

//=================================================//
//SLOT / ASSIGNED  COMMANDS
//=================================================//

  removeAssignment(slotId){
    this.unassign(slotId);
  },

  toggleLock(slotId) {
    if (!R.appState.locks) R.appState.locks = {};
    const locks = R.appState.locks;

    if (locks[slotId]) {
      delete locks[slotId];
      console.log("Unlocked:", slotId);
    } else {
      locks[slotId] = true;
      console.log("Locked:", slotId);
    }
  },


//=================================================//
//SHIFT COMMANDS
//=================================================//

  changeSlotCount(shift, newCapacity){
    
    const key = `${shift.dayIndex}_${shift.type}`;
    console.log(key);
    R.appState.config.slotCounts[key] = newCapacity;
    console.log(R.appState.config.slotCounts[key]);
  },

  deleteShift(shift) {
    const key = `${shift.dayIndex}_${shift.type}`;
    R.appState.config.slotCounts[key] = 0;
  },


//=================================================//
//BUTTON  COMMANDS
//=================================================//
  generate() {

    console.log("Generate clicked");

    if (!R.appState.draft) {
      R.appState.draft = { assignments: {} };
    }

    const assignments = R.appState.draft.assignments;
    const employees = R.appState.employees;
    const locks = R.appState.locks || {};

    let index = 0;

    for (let day = 0; day < 7; day++) {

      for (let shift of ["lunch", "dinner"]) {

        const usedInShift = new Set();

        // collect already assigned employees for this shift
        for (let slot = 0; slot < 6; slot++) {
          const slotId = `${day}_${shift}_${slot}`;
          const emp = assignments[slotId];
          if (emp) usedInShift.add(emp);
        }

        for (let slot = 0; slot < 6; slot++) {

          const slotId = `${day}_${shift}_${slot}`;

          // respect locks
          if (locks[slotId]) continue;

          // skip already filled slots
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

    console.log("Generation complete");
  }

};