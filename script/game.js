let pjs = new PointJS(800, 600, {
	backgroundColor : '#adc6dc' // optional
});
pjs.system.initFullPage(); // for Full Page mode
// pjs.system.initFullScreen(); // for Full Screen mode (only Desctop)

let log    = pjs.system.log;     // log = console.log;
let game   = pjs.game;           // Game Manager
let point  = pjs.vector.point;   // Constructor for Point
let camera = pjs.camera;         // Camera Manager
let brush  = pjs.brush;          // Brush, used for simple drawing
let OOP    = pjs.OOP;            // Objects manager
let math   = pjs.math;           // More Math-methods

let key   = pjs.keyControl.initControl();
let mouse = pjs.mouseControl.initControl();

let width  = game.getWH().w; // width of scene viewport
let height = game.getWH().h; // currentHealth of scene viewport

game.newLoopFromConstructor('myGame', function () {

  this.update = function () {


      let plPos = mouse.getPosition();

      brush.onContext(function (ctx) {
          let gradient = ctx.createRadialGradient(plPos.x, plPos.y, 100, plPos.x, plPos.y, 80);
          gradient.addColorStop(0, 'black');
          gradient.addColorStop(1, 'transparent');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);
      });
  }

});

game.startLoop('myGame');
