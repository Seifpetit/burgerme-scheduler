
export class GenerateButton {
  constructor(command) {
    this.x = 0;
    this.y = 0;
    this.w = 140;
    this.h = 40;

    this.hovered = false;
    this.command = command; // function to call on click
  }

  setGeometry(x, y) {
    this.x = x;
    this.y = y;
  }

  hitTest(x, y) {
    return x > this.x &&
          x < this.x + this.w &&
          y > this.y &&
          y < this.y + this.h;
  }

  onHover() {
    this.hovered = true;
  }

  onClick() {
    if (this.command) {
      this.command();
    }
  }

  update(p5, mouse) {

    this.setGeometry(p5.width - 140, 0);
    
    this.hovered = this.hitTest(mouse.x, mouse.y);

  }

  render(g) {
    g.push();
    g.noStroke();

    // outer rect (border)  #fa0000 #fe6700 
    g.fill("#fe6700");
    g.rect(this.x, this.y, this.w, this.h, 8);

    //inner Rect for border effect
    const padding = 2;
    g.fill("#333333");
    g.rect(this.x + padding, this.y + padding, this.w - padding * 2, this.h - padding * 2, 8);

    g.fill(this.hovered ? "#afe000" : "#92ba00");
    g.textAlign(g.CENTER, g.CENTER); g.textSize(24); 
    
    g.text("Generate", this.x + this.w/2, this.y + this.h/2);

    g.pop();
  }


}