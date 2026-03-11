export const MENU_TYPES = {
  SHIFT:      "SHIFT",
  SLOT:       "SLOT",
  ASSIGNMENT: "ASSIGNMENT",
  EMPLOYEE:   "EMPLOYEE",
};

export const MENU_SCHEMAS = {

  [MENU_TYPES.SHIFT]: [
    { id: "changeSlotCount",      label: "Change slot count",    input: "number"       },
    { id: "openRequirementsPanel", label: "Set requirements",    requirements: true    },
    { id: "toggleShiftLock",      label: "Lock / Unlock shift",  input: null           },
    { id: "deleteShift",          label: "Delete shift",         input: null           },
  ],

  [MENU_TYPES.SLOT]: [
    { id: "toggleSlotLock",   label: "Lock / Unlock slot",   input: null   },
  ],

  [MENU_TYPES.ASSIGNMENT]: [
    { id: "toggleSlotLock",   label: "Lock / Unlock slot",   input: null   },
    { id: "removeAssignment", label: "Remove assignment",    input: null   },
  ],

  [MENU_TYPES.EMPLOYEE]: [
    { id: "renameEmployee",   label: "Rename employee",      input: "text" },
    {
      label: "Set role",
      options: [
        { id: "_back",          label: "Set role"      },   // back row — first item
        { id: "setRoleKitchen", label: "Kitchen"       },
        { id: "setRoleCourier", label: "Courier"       },
      ],
    },
    { id: "openRestrictMode", label: "Restrict from slots…", input: null   },
    { id: "removeEmployee",   label: "Remove employee",      input: null   },
  ],

};
