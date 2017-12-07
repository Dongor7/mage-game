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

let lastKey;

let changeAnimationTo = function(abject, animation){
    abject.setAnimation(animation);
    abject.w = animation.w;
    abject.h = animation.h;
};

console.log("Version 0.1.5");

game.newLoopFromConstructor('myGame', function () {

    let speedPlayer = point(0, 3);
    let countJump = 0;

    let world = [];
    let skeletons = [];
    let player = null;
    pjs.levels.forStringArray({w : BW, h : BH, source : [
        '000000000000000000000000000000',
        '0                            0',
        '0                            0',
        '0 P     S      S         S   0',
        '0         0         0        0',
        '000000000000000000000000000000',
        '0                            0',
        '0                            0',
        '0                            0',
        '0                            0',
        '000000000000000000000000000000'
    ]}, function (S, X, Y, W, H) {
        if (S === '0') {
            world.push(game.newRoundRectObject({
                x : X, y : Y,
                w : W, h : H,
                fillColor : '#bcbcbc',
                radius : 10
            }));
        } else if (S === 'P') {
            player = game.newAnimationObject({
                animation : null,
                x : X, y : Y,
                w : 41, h : 101,
                delay : 8,
                scale : 1,
                userData : {
                    health : 5,
                    currentHealth : 5,
                    underAttack : false,
                    isShot : false
                }
            });
        } else if (S === 'S') {
            let skeleton = game.newAnimationObject({
                animation: null,
                x : X, y : Y,
                w : 58, h : 109,
                delay : 10,
                scale : 1,
                userData : {
                    health : 10,
                    currentHealth : 10,
                    creationPoint : point(X, Y),
                    agro : false,
                    isAlive : true,
                    isAttack : false
                }
            });

            skeletons.push(skeleton);
        }
    });

    let playerStayAnimation = pjs.tiles.newAnimation('resources/mageStraightStay.png', 50, 101, 8);
    let playerBackStayAnimation = pjs.tiles.newAnimation('resources/mageBackStay.png', 41, 101, 8);
    let playerStraightWalkAnimation = pjs.tiles.newAnimation('resources/mage_straight_walk.png', 72, 102, 8);
    let playerBackWalkAnimation = pjs.tiles.newAnimation('resources/mage_back_walk.png', 72, 102, 8);
    let playerInjuryAnimation = pjs.tiles.newAnimation('resources/mageInjury.png', 96, 102, 6);
    let playerDeathAnimation = pjs.tiles.newAnimation('resources/mageDeath.png', 83, 116, 8);
    let playerStraightAttackAnimation = pjs.tiles.newAnimation('resources/mageStraightAttack.png', 82, 108, 8);
    let playerBackAttackAnimation = pjs.tiles.newAnimation('resources/mageBackAttack.png', 82, 108, 5);

    let skeletonStraightWalkAnimation = pjs.tiles.newAnimation('resources/skeletonStraightWalk.png', 73, 87, 12);
    let skeletonBackWalkAnimation = pjs.tiles.newAnimation('resources/skeletonBackWalk.png', 73, 87, 12);
    let skeletonStayAnimation = pjs.tiles.newAnimation('resources/skeletonStay.png', 58, 109, 15);
    let skeletonDeathAnimation = pjs.tiles.newAnimation('resources/skeletonDeath.png', 90, 120, 11);
    let skeletonStraightAttackAnimation = pjs.tiles.newAnimation('resources/skeletonStraightAttack.png', 141, 112, 8);
    let skeletonBackAttackAnimation = pjs.tiles.newAnimation('resources/skeletonBackAttack.png', 141, 112, 8);
    OOP.forArr(skeletons, function (skeleton) {
       skeleton.setAnimation(skeletonStayAnimation);
    });

    player.control = function(arr, skeletons) {

        if(player.currentHealth === 0){
            changeAnimationTo(player, playerDeathAnimation);
            setTimeout(function () {
                game.stop();
            }, 1150);

        }else if(key.isDown('A')){
            let sp = -3;
            changeAnimationTo(player, playerBackWalkAnimation);
            player.setDelay(3);

            if(key.isDown('SHIFT')){
                sp = -1;
                player.setDelay(8);
            }

            speedPlayer.x = sp;

            lastKey = 'A';
        }
        else if(key.isDown('D')){
            let sp = 3;
            changeAnimationTo(player, playerStraightWalkAnimation);
            player.setDelay(3);

            if(key.isDown('SHIFT')){
                sp = 1;
                player.setDelay(8);
            }

            speedPlayer.x = sp;

            lastKey = 'B'
        } else if(!player.isShot){
            speedPlayer.x = 0;
            player.setDelay(8);
            changeAnimationTo(player, playerStayAnimation);

            if (lastKey === 'A'){
                changeAnimationTo(player, playerBackStayAnimation);
            }
        }

        if(key.isPress('W') && !countJump){
            countJump++;
            speedPlayer.y = -7;
        }

        if(speedPlayer.y < 5) {
            speedPlayer.y += 0.4;
        }

        pjs.vector.moveCollision(player, arr, speedPlayer, function(pl, w, isX, isY) {
            if(isY) countJump = 0;
        }, true, 100);

        OOP.forArr(skeletons, function (skeleton) {

            if(mouse.isInObject(skeleton) &&
                (mouse.isPress('LEFT') || mouse.isDown('LEFT')) &&
                player.getDistanceC((skeleton.getPositionC())) < 250 &&
                player.currentHealth > 0) {

                if(!player.isShot){
                    player.isShot = true;

                    player.w = 82;
                    player.h = 108;
                    player.setDelay(6);

                    if(player.x > skeleton.x)
                        changeAnimationTo(player, playerBackAttackAnimation);
                    else
                        changeAnimationTo(player, playerStraightAttackAnimation);

                    setTimeout(function () {
                        addFireBall();
                    }, 500);

                    setTimeout(function () {
                        player.isShot = false;
                        player.setDelay(8);
                    }, 700)
                }

            }
        });
    };

    skeletons.control = function (arr, player) {

        OOP.forArr(this, function (skeleton) {

            let speedSkeleton = point(0, 3);
            let startX = skeleton.x;

            if (skeleton.isAlive && skeleton.getDistanceC(player.getPositionC()) < 250){

                if (player.underAttack){

                } else if (skeleton.isIntersect(player)){

                    skeleton.isAttack = true;

                    if(player.x > skeleton.x){
                        changeAnimationTo(skeleton, skeletonStraightAttackAnimation);
                    } else {
                        changeAnimationTo(skeleton, skeletonBackAttackAnimation);
                    }

                    player.underAttack = true;

                    setTimeout(function () {
                        skeleton.isAttack = false;
                        player.underAttack = false;
                    }, 1500);

                    setTimeout(function () {
                        if(skeleton.isIntersect(player)){
                            player.currentHealth--;
                        }
                    },1000)

                } else if (!skeleton.isAttack){
                    skeleton.moveToC(player.getPositionC(), 1);
                    skeleton.agro = true;

                    if (startX < skeleton.x) {
                        changeAnimationTo(skeleton, skeletonStraightWalkAnimation);
                    } else {
                        changeAnimationTo(skeleton, skeletonBackWalkAnimation);
                    }
                }

            } else if (!skeleton.isAttack && skeleton.isAlive && skeleton.agro && skeleton.getDistanceC(player.getPositionC()) > 200) {
                skeleton.moveTo(skeleton.creationPoint, 1);

                if (skeleton.creationPoint.x < skeleton.x) {
                    changeAnimationTo(skeleton, skeletonBackWalkAnimation);
                } else {
                    changeAnimationTo(skeleton, skeletonStraightWalkAnimation);
                }
                if (Math.round(skeleton.x) === skeleton.creationPoint.x) {
                    skeleton.agro = false;
                    changeAnimationTo(skeleton, skeletonStayAnimation);
                    skeleton.currentHealth = skeleton.health;
                }
            }
            if(speedSkeleton.y < 5) {
                speedSkeleton.y += 0.4;
            }

            pjs.vector.moveCollision(skeleton, arr, speedSkeleton);
        })

    };

    let fireBalls = [];
    let addFireBall = function() {
        let pX = player.x + player.w;
        let pY = player.y + 10;
        let f = game.newImageObject( {
            file : "resources/fireball.png",
            x : pX,
            y : pY,
            scale : 0.8
        });

        f.rotate(mouse.getPosition());
        fireBalls.push(f);
    };

    this.update = function () {

        mouse.setCursorImage("resources/cursorDefault.png");
        player.control(world, skeletons);
        player.draw();

        skeletons.control(world, player);

        OOP.forArr(world, function(brick) {
            OOP.forArr(fireBalls, function(fireball, idFireball){
                if(fireball.isStaticIntersect(brick)){
                    fireBalls.splice(idFireball, 1);;
                }
            });
            brick.draw();
        });

        OOP.forArr(fireBalls, function(fireball, idFireball){
            OOP.forArr(skeletons, function (skeleton, idSkeleton) {
                if(fireball.isStaticIntersect(skeleton)){
                    skeleton.currentHealth--;
                    fireBalls.splice(idFireball, 1);
                    if(skeleton.currentHealth === 0) {
                        changeAnimationTo(skeleton, skeletonDeathAnimation);
                        skeleton.x += 11;
                        skeleton.isAlive = false;
                        skeleton.healthCounter = -10;

                        setTimeout(function () {
                            skeletons.splice(idSkeleton, 1);
                        }, 2000)
                    }
                }
            });

            if(!fireball.isInCameraStatic())
                return fireBalls.splice(idFireball, 1);
            fireball.moveAngle(5);
            fireball.draw();
        });

        OOP.forArr(skeletons, function (skeleton) {
            skeleton.draw();

            if(skeleton.currentHealth > 0){
                brush.drawTextS({
                    text : skeleton.currentHealth,
                    color : 'white',
                    size : 15,
                    x : skeleton.x + skeleton.w / 2,
                    y : skeleton.y - 10,
                    align : 'center'
                });
            }

            if(mouse.isInObject(skeleton)) {
                mouse.setCursorImage("resources/cursorAttack.png");
            }

        });

        pjs.system.setSmoothing(false);

        brush.onContext(function (ctx) {
            let plPos = player.getPosition();
            let gradient = ctx.createRadialGradient(plPos.x + player.w - 15, plPos.y + 5 , 300, plPos.x + player.w - 5, plPos.y + 5, 0);
            gradient.addColorStop(0, pjs.colors.rgba(0, 0, 0, 0.95));
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, game.getWH().w, game.getWH().h);
        });

        if(player.currentHealth > 0) {
            brush.drawTextS({
                text: player.currentHealth,
                color: 'white',
                size: 15,
                x: player.x + player.w / 2,
                y: player.y - 15,
                align: 'center'
            });
        }

    };
});

game.startLoop('myGame');