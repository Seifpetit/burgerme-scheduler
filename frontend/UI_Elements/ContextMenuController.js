import { MENU_SCHEMAS } from "./menuSchema.js";
// ───────────────────────────────────────────────────────────────────────────
// CONTEXT MENU CONTROLLER
// ───────────────────────────────────────────────────────────────────────────  
const MENU_DATA = MENU_SCHEMAS; // can be extended with dynamic data if needed

export class ContextMenuController {

  constructor(operator) {
    this.operator = operator;

    this.x = 0; this.y = 0; this.w = 180; this.h = 0;
    this.itemH = 28;
    
    this.actions = [];
    this.visible = false;
    this.target = false;

    this.mode = "menu"; // "menu" | "input";
    this.inputValue = "";
    this.pendingAction = null;

  }   

  open(payload) {

    this.payload = payload;
    console.log("Opening context menu with payload:", payload);

    const {x, y, type, ref} = payload;
    
    this.x = x;
    this.y = y;
    this.visible = true;
    this.target = {type, ref};
    this.actions = this.initActions(type, ref);
    
  }

  close() {
    this.visible = false;
    this.target = null;
    this.actions = [];
    this.mode = "menu";
    this.inputValue = "";
    this.pendingAction = null;
  }

  initActions(type, ref) {
    
    const schema = MENU_DATA[type];
    if(!schema) return [];
    
    return schema;
  }

  selectAction(action) {
    if(action.requiresInput) {
      this.mode = "input";
      this.pendingAction = action.type;
      this.inputValue = "";
      return;
    }
    // TODO: Implement non-input actions
    // this.emitCommand(action, null); 
  }

  submitInput() {
    if(!this.pendingAction) return;
    const value = Number(this.inputValue);

    if(isNaN(value)) return;

    this.emitCommand( this.pendingAction, {value});

    this.operator.handleCommand({
      type: action.type,
      target: this.target,
      payload
    });

    this.close();

  }

  handleKey(key) {
    if(this.mode !== "input") return;
    if(key === "Enter") {
      this.submitInput();
      return;
    }
    if(key === "Backspace") {
      this.inputValue = this.inputValue.slice(0, -1);
      return;
    }

    if(/^\[0-9]$/.test(key)) {
      this.inputValue += key;
    }

  }

  hitTest(mx, my) {
    if(!this.visible || !this.actions || this.actions.length === 0) return false;

    const width = 180;
    const itemH = 28;

    if(this.mode === "menu") {
      const height = this.actions.length * itemH;
      return (mx > this.x && mx < this.x + width &&
              my > this.y && my < this.y + height);
    }

    if(this.mode === "input") {
      return (mx > this.x && mx < this.x + width &&
              my > this.y && my < this.y + 60);
    }
  
  
  }

  onClick(mx, my) {
    if(!this.visible) return;

    const itemH = 28;

    if(this.mode === "menu") {
      const index = Math.floor((my - this.y) / itemH);
      const action = this.actions[index];
      if(action) {
        this.selectAction(action);
      }
      return;
    }

    if(this.mode === "input") {
      // click outside input box should close menu
      this.close();
    }
  }

  renderAction(g, action, index) {
    g.push();
    const pad = 2;
      g.stroke("#000000ff"); g.strokeWeight(1); g.fill("#555555ff");
      g.rect(this.x + pad, this.y + index * 28 + pad, this.w - 2 * pad, this.itemH - 2 * pad, 4);

      g.textAlign(g.LEFT, g.CENTER);  g.textSize(14);  g.fill("#fff");  g.noStroke();
      g.text(action.label, this.x + 10, this.y + this.itemH / 2 + index * 28);
    g.pop();
  }

  render(g) {

    if(!this.visible || !this.actions || this.actions.length === 0) return;

    g.push();
    this.h = this.actions.length * this.itemH; 
    // main button
    g.fill("#fba700ff"); 
    g.rect(this.x, this.y, this.w, this.h, 4);

    if(this.mode === "menu") {
      this.actions.forEach((action, index) => {
        this.renderAction(g, action, index);
      });
    }
    
    if(this.mode === "input") {
      g.fill("#fff");
      g.textAlign(g.LEFT, g.CENTER); g.textSize(14);
      g.text("Enter value: ", this.x + 10, this.y + 10);

      g.fill("#333");
      g.rect(this.x + 10, this.y + 30, width - 20, itemH, 4);
      g.fill("#fff");
      g.textAlign(g.LEFT, g.CENTER); g.textSize(14);
      g.text(this.inputValue, this.x + 15, this.y + 30 + itemH / 2);
    }

    g.pop();

  }


}

class ContextTask {
  constructor( {type, label, onTask} ) {
    this.onTask = onTask;
    this.type = type;
    this.label = label;
    this.hover = false;
    this.x = 0; this.y = 0; this.w = 0; this.h = 0;
  }

  setGeometry(x, y, w, h) {
    this.x = x; this.y = y; this.w = w; this.h = h;
  }

  update(){
    
  }

  hit(mx, my){
    return (mx > this.x && mx < this.x + this.w &&
            my > this.y && my < this.y + this.h);
  }

  onHover(mx, my){
    this.hover = false;
    if(!this.hit(mx, my)) return false;
    this.hover = true;
  }

  onClick(mx, my){console.log('context click', this.type);
    if(!this.hit(mx, my)) {
      console.log("TYPE: ", this.type , " => ",!this.hit(mx, my));
      return false;}
    
    this.onTask(this.type);
    // further action handling can be implemented here
    return true;
  }


  draw(g){

    g.push();

    g.fill(this.hover?"#333333ff":"#555555ff"); g.strokeWeight(1); g.stroke("#000000ff");
    g.rect(this.x, this.y, this.w, this.h, 2);

    g.fill(255);
    g.textAlign(g.LEFT, g.CENTER); g.textSize(12);
    g.text(this.label, this.x + 5, this.y + this.h / 2);

    g.pop();
    
  }


}