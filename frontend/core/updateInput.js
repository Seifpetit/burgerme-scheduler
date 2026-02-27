import { R } from "./runtime.js";

export function updateInput(p5) {

  const mouse = R.input.mouse;

  // mouse wheel (for future use)
  mouse.wheelDelta = p5._mouseWheelDeltaY || 0;

  // store previous
  mouse.prevPressed = mouse.pressed;

  // update current
  mouse.x = p5.mouseX;
  mouse.y = p5.mouseY;
  mouse.pressed = p5.mouseIsPressed;

  // detect transitions
  mouse.justPressed = mouse.pressed && !mouse.prevPressed;
  mouse.justReleased = !mouse.pressed && mouse.prevPressed;

  // touch
  R.input.touch.active = p5.touches && p5.touches.length > 0;
}

