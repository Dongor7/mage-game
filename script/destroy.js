let pjs = new PointJS(640, 480, {
    backgroundColor: '#4b4843' // optional
});
pjs.system.initFullPage(); // for Full Page mode
// pjs.system.initFullScreen(); // for Full Screen mode (only Desctop)

let log = pjs.system.log;     // log = console.log;
let game   = pjs.game;           // Game Manager
let point  = pjs.vector.point;   // Constructor for Point
let camera = pjs.camera;         // Camera Manager
let brush  = pjs.brush;          // Brush, used for simple drawing
let OOP    = pjs.OOP;            // Objects manager
let math   = pjs.math;           // More Math-methods

let key   = pjs.keyControl.initKeyControl();
let mouse = pjs.mouseControl.initMouseControl();

let width  = game.getWH().w; // width of scene viewport
let height = game.getWH().h; // currentHealth of scene viewport

let BW = 50, BH = 50;

pjs.system.initFPSCheck();

game.newLoopFromConstructor('myGame', function () {

    let playerPosition = null;
    let speed = point(0, 3);
    let scaleCount = 0;
    let countJump = 0;

    let world = [];
    pjs.levels.forStringArray({w : BW, h : BH, source : [
        '0000000000000000000000000000',
        '0000000000000000000000000000',
        '0000000000000000000000000000',
        '0000000000000000000000000000',
        '000000        00000000000000',
        '000           00000000000000',
        '000  P     00000000000000000',
        '000       000000000000000000',
        '0000000000000000000000000000',
        '0000000000000000000000000000'
    ]}, function (S, X, Y, W, H) {
        if (S === '0') {
            world.push(game.newRoundRectObject({
                x : X, y : Y,
                w : W, h : H,
                fillColor : '#bcbcbc',
                radius : 10
            }));
        } else if (S === 'P') {
            playerPosition = point(X, Y);
        }

    });

    let playerStayAnimation = pjs.tiles.newAnimation('resources/mage_stay.png', 41, 101, 8);
    let playerStraightWalkAnimation = pjs.tiles.newAnimation('resources/mage_straight_walk.png', 72, 102, 8);
    let playerBackWalkAnimation = pjs.tiles.newAnimation('resources/mage_back_walk.png', 72, 102, 8);
    let player = game.newAnimationObject({
        animation : playerStayAnimation,
        x : playerPosition.x, y : playerPosition.y,
        w : 41, h : 101,
        delay : 10,
        scale : 1
    });

    player.control = function(arr) {

        if(key.isDown('A')){
            let sp = -1;
            player.setAnimation(playerBackWalkAnimation);
            player.w = 72;
            player.h = 102;

            if(key.isDown('SHIFT')){
                sp = -2;
                player.setDelay(5);
            }

            speed.x = sp;

            if(player.x > width / 2) {
                camera.move(point(sp, 0));
            }
        }
        else if(key.isDown('D')){
            let sp = 1;
            player.setAnimation(playerStraightWalkAnimation);
            player.w = 72;
            player.h = 102;

            if(key.isDown('SHIFT')){
                sp = 2;
                player.setDelay(5);
            }

            speed.x = sp;

            if(player.x > width / 2) {
                camera.move(point(sp, 0));
            }
        }
        else {
            speed.x = 0;
            player.setAnimation(playerStayAnimation);
            player.w = 41;
            player.h = 101;
        }
        if(key.isPress('W') && !countJump){
            countJump++;
            speed.y = -7;
        }
        if(speed.y < 5) {
            speed.y += 0.4;
        }

        pjs.vector.moveCollision(player, arr, speed, function(pl, w, isX, isY) {
            if(isY) countJump = 0;
        }, true, 100);

        if(mouse.isPress('LEFT')){
            addFireBall();
        }
    };

    let fireBalls = [];
    let addFireBall = function() {
        let pX = player.x + player.w;
        let pY = player.y + player.h / 2;
        let f = game.newCircleObject({
            x : pX, y : pY,
            radius : 5,
            fillColor : 'red'
        });

        f.rotate(mouse.getPosition());

        fireBalls.push(f);
    };

    this.update = function () {

        player.control(world);
        player.draw();

        OOP.drawArr(world);

        OOP.forArr(world, function(brick, idBrick) {

            OOP.forArr(fireBalls, function(fireball, idFireball){
                if(fireball.isIntersect(brick)){
                    fireBalls.splice(idFireball, 1);
                    world.slice(idBrick, 1);
                }
            });

            brick.draw();
        });

        OOP.forArr(fireBalls, function(fireball, id){
            if(!fireball.isInCameraStatic())
                return fireBalls.splice(id, 1);
            fireball.moveAngle(5);
            console.log(fireBalls.length);
            fireball.draw();
        });

        brush.drawTextS({
            text : pjs.system.getFPS(),
            color : 'white',
            size : 50
        });

    };


});

game.startLoop('myGame');/**
 * Created by Miraj on 04.12.2017.
 */
