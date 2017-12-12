let pjs = new PointJS(640, 480, {
    /*background: 'url(resources/background.png)'*/
});
pjs.system.initFullPage();

let log    = pjs.system.log;
let game   = pjs.game;
let point  = pjs.vector.point;
let camera = pjs.camera;
let brush  = pjs.brush;
let OOP    = pjs.OOP;
let math   = pjs.math;

let key   = pjs.keyControl.initKeyControl();
let mouse = pjs.mouseControl.initMouseControl();

let width  = game.getWH().w;
let height = game.getWH().h;

let BW = 57, BH = 55;

pjs.system.initFPSCheck();

let lastKey;
let closeMenu;

let changeAnimationTo = function(abject, animation){
    abject.setAnimation(animation);
    abject.w = animation.w;
    abject.h = animation.h;
};

console.log("Version 0.2.3");

game.newLoopFromConstructor('myGame', function () {

    let isWalkPlay = false;
    let walkAudio = null;
    let fireballAudio = null;
    let zombieAttack = null;

    let speedPlayer = point(0, 3);
    let speedCamera = point(3, 0);
    let previousPlayerX = null;
    let countJump = 0;

    let world = [];
    let skeletons = [];
    let player = null;

    pjs.levels.forStringArray({w : BW, h : BH, source : [
        '000000000000000000000000000000',
        '0P                           0',
        '0                            0',
        '0000000000     00000000      0',
        '0     S     0         00      0',
        '0          000         00           0',
        '000000000000000000000   0000000000000',
        '0                    0          S   0',
        '0                     0             0',
        '0                      000   00000000',
        '0     S                     00',
        '0                          000',
        '000000000000000000000000000000'
    ]}, function (S, X, Y, W, H, source) {
        if (S === '0') {
            world.push(game.newImageObject({
                x : X, y : Y,
                w : W, h : H,
                file : 'resources/wall.png'
            }));
        } else if (S === 'P') {
            player = game.newAnimationObject({
                animation : null,
                x : X, y : Y,
                w : 41, h : 102,
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
                    health : 5,
                    currentHealth : 5,
                    creationPoint : point(X, Y),
                    agro : false,
                    isAlive : true,
                    isAttack : false
                }
            });

            skeletons.push(skeleton);
        }

    });

    let levelLength = '000000000000000000000   0000000000000'.length * BW;

    let playerStayAnimation = pjs.tiles.newAnimation('resources/mageStraightStay.png', 50, 101, 8);
    let playerBackStayAnimation = pjs.tiles.newAnimation('resources/mageBackStay.png', 41, 101, 8);
    let playerStraightWalkAnimation = pjs.tiles.newAnimation('resources/walk2.png', 62, 102, 8);
    let playerBackWalkAnimation = pjs.tiles.newAnimation('resources/mage_back_walk.png', 72, 102, 8);
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
                zombieAttack.stop();
                game.stop();
            }, 1150);

        }else if(key.isDown('A')){

            if (!isWalkPlay){
                walkAudio.play();
                isWalkPlay = true;
            }
            let sp = -3;
            player.setAnimation(playerBackWalkAnimation);
            player.w = 62;
            player.h = 102;
            player.setDelay(3);

            if(key.isDown('SHIFT')){
                sp = -1;
                player.setDelay(8);
            }

            speedPlayer.x = sp;
            speedCamera = speedPlayer;

            let currentX = player.getPositionC().x;

            if(width / 2 > camera.getPosition().x &&
                previousPlayerX > currentX &&
                camera.getPosition().x > 0){

                    previousPlayerX = currentX;
                    camera.move(speedCamera);
            }

            lastKey = 'A';
        }
        else if(key.isDown('D')){

            if (!isWalkPlay){
                walkAudio.play();
                isWalkPlay = true;
            }

            let sp = 3;
            changeAnimationTo(player, playerStraightWalkAnimation);
            player.setDelay(3);

            if(key.isDown('SHIFT')){
                sp = 1;
                player.setDelay(8);
            }

            speedPlayer.x = sp;
            speedCamera = speedPlayer;

            let currentX = player.getPositionC().x;

            if(width / 2 < currentX &&
                previousPlayerX < currentX &&
                camera.getPosition().x + width < levelLength){

                    previousPlayerX = currentX;
                    camera.move(speedCamera);
            }

            lastKey = 'D'
        } else if(!player.isShot){

            walkAudio.stop();
            isWalkPlay = false;

            speedPlayer.x = 0;
            player.setDelay(8);
            changeAnimationTo(player, playerStayAnimation);

            if (lastKey === 'A'){
                changeAnimationTo(player, playerBackStayAnimation);
            }

            if (lastKey === 'D'){
                player.x += playerStraightWalkAnimation.w - playerStayAnimation.w;
                lastKey = null;
            }
        }

        if(key.isPress('W') && !countJump){
            countJump++;
            speedPlayer.y = -8;
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
                            fireballAudio.play();
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

                zombieAttack.play();

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
                    skeleton.moveToC(player.getPositionC(), 2);
                    skeleton.agro = true;

                    if (startX < skeleton.x) {
                        changeAnimationTo(skeleton, skeletonStraightWalkAnimation);
                    } else {
                        changeAnimationTo(skeleton, skeletonBackWalkAnimation);
                    }
                }

            } else if (!skeleton.isAttack && skeleton.isAlive && skeleton.agro && skeleton.getDistanceC(player.getPositionC()) > 250) {
                skeleton.moveTo(skeleton.creationPoint, 4);

                zombieAttack.stop();

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

            pjs.vector.moveCollision(skeleton, arr, speedSkeleton, function(sk, w, isX, isY) {

                if(w.x > sk.x){
                    sk.x -= speedSkeleton.x;
                } else if(w.x < sk.x){
                    sk.x += speedSkeleton.x;
                }

            });
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
    let preStart = false;

    this.update = function () {

        if (pjs.resources.isLoaded() || preStart) {

            pjs.system.setStyle( { background : 'url(resources/background.png)' } );

            brush.drawImage({
                x : 56, y : 56,
                w : 66, h : 110,
                file : 'resources/door.png'
            });

            mouse.setCursorImage("resources/cursorDefault.png");
            player.control(world, skeletons);
            player.draw();

            skeletons.control(world, player);

            OOP.forArr(world, function(brick) {
                OOP.forArr(fireBalls, function(fireball, idFireball){
                    if(fireball.isStaticIntersect(brick)){
                        fireBalls.splice(idFireball, 1);
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
                            zombieAttack.stop();
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

                /*if(skeleton.currentHealth > 0){
                 brush.drawTextS({
                 text : skeleton.currentHealth,
                 color : 'white',
                 size : 15,
                 x : skeleton.x + skeleton.w / 2,
                 y : skeleton.y - 10,
                 align : 'center'
                 });
                 }*/

                if(mouse.isInObject(skeleton)) {
                    mouse.setCursorImage("resources/cursorAttack.png");
                }

                skeleton.draw();
                // skeleton.drawStaticBox();
            });

            brush.onContext(function (ctx) {
                let plPos = player.getPosition();
                let gradient = ctx.createRadialGradient(plPos.x + player.w - 15 - camera.getPosition().x,
                    plPos.y + 5,
                    300,
                    plPos.x + player.w - 5 - camera.getPosition().x,
                    plPos.y + 5, 0);
                gradient.addColorStop(0, pjs.colors.rgba(0, 0, 0, 0.95));
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, game.getWH().w, game.getWH().h);
            });

            if(player.currentHealth >= 0) {

                brush.drawImageS({
                    file : 'resources/heart.png',
                    x : 10, y : 10,
                    w : 100,
                    scale : 0.8
                });

                brush.drawTextS({
                    text : player.currentHealth,
                    color : 'black',
                    size : 45,
                    x : 38, y : 22
                });
            }

            /*brush.drawTextS({
                 text : pjs.system.getFPS(),
                 color : 'white',
                 size : 50,
                 x : game.getWH().w - 65
            });*/

            if(key.isPress('SPACE')){
                game.setLoop('pause');
                zombieAttack.stop();
            }
        } else {
            brush.drawTextS({
                text : 'Loading... ' + pjs.resources.getProgress() + '%',
                color : 'black',
                size : 70,
                x : game.getWH2().w - 250 , y : game.getWH2().h - 50
            });

            setTimeout(() => preStart = true, 5000);
        }

    };

    this.entry = function () {
        walkAudio = pjs.wAudio.newAudio('resources/audio/walk.mp3');
        fireballAudio = pjs.wAudio.newAudio('resources/audio/fireball.mp3');
        zombieAttack = pjs.wAudio.newAudio('resources/audio/zombieAttack.mp3', 0.8);

        let fonAudio = pjs.wAudio.newAudio('resources/audio/fon.mp3', 0.6);
        game.setLoopSound('myGame', [fonAudio]);
    }
});

game.newLoopFromConstructor('pause', function () {

    this.update = function () {

        game.fill('black');

        brush.drawText({
            text : 'PAUSE',
            size : 70,
            color : 'white'
        });

        if(key.isPress('SPACE')){
            game.setLoop('myGame');
        }
    };

    this.entry = function () {
    }

});

game.newLoopFromConstructor('menu', function () {

    let base;
    let createMenu;
    let isCreated = false;


    this.update = function () {

        if(!isCreated && pjs.resources.isLoaded){
            createMenu();
        }

    };

    this.entry = function () {

        closeMenu = function() {
            pjs.system.removeDOM(base);
        };

        createMenu = function() {
            base = pjs.system.newDOM('div', true);
            base.className = 'base';
            base.innerHTML = `
	
                <h1>Game Name</h1>
        
                <div class="menu">
            
                    <span onclick="closeMenu(); game.startLoop('myGame')">New game</span>
                    <span>Options</span>
                    <span>About</span>
                
                </div>
            
            `;

            isCreated = true;
        };

    }

});


game.startLoop('menu');