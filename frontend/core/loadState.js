import { R } from "./runtime.js";

export async function loadState() {
  try {
    const response = await fetch("/state");

    if(!response.ok) throw new Error(`Server error: ${response.status}`);

    const data = await response.json();

    //ensure data config exists
    if(!R.appState.config) R.appState.config = {};
    if(!R.appState.config.slotCouts) R.appState.config.slotCouts = {};

    return data;

  } catch (error) {
    console.error("Failed to loadState!", error);
  };
  return null;
}