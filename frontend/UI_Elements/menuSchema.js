// menuSchemas.js

export const MENU_TYPES = {
  SHIFT: "SHIFT",
  SLOT: "SLOT",
  ASSIGNMENT: "ASSIGNMENT",
  EMPLOYEE: "EMPLOYEE"
};

export const MENU_SCHEMAS = {

  [MENU_TYPES.SHIFT]: [
    {
      id: "changeSlotCount",
      label: "Change slot count",
      input: "number"
    },
    {
      id: "deleteShift",
      label: "Delete shift",
      input: null
    }
  ],

  [MENU_TYPES.SLOT]: [
    {
      id: "toggleLock",
      label: "Lock / Unlock slot",
      input: null
    },
  ],

  [MENU_TYPES.ASSIGNMENT]: [
    {
      id: "toggleLock",
      label: "Lock / Unlock slot",
      input: null
    },
    {
      id: "removeAssignment",
      label: "Remove assignment",
      input: null
    },
    
  ],

  [MENU_TYPES.EMPLOYEE]: [
    {
      id: "renameEmployee",
      label: "Rename employee",
      input: "text"
    },
    {
      id: "removeEmployee",
      label: "Remove employee",
      input: null
    }
  ]

};