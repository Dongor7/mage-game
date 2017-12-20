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

let changeAnimationTo = function(object, animation, delay = 10){
    object.setAnimation(animation);
    object.w = animation.w;
    object.h = animation.h;
    object.setDelay(delay);
};

game.newLoopFromConstructor('myGame', function () {

    let isWalkPlay      = false;
    let walkAudio       = null;
    let fireballAudio   = null;
    let zombieAttack    = null;

    let speedPlayer     = point(0, 3);
    let speedCamera     = point(3, 0);
    let previousPlayerX = null;
    let countJump       = 0;

    let world           = [];
    let doorEnter       = null;
    let doorExit        = null;
    let skeletons       = [];
    let player          = null;
    let dragon          = null;
    let doorKey         = null;
    let isWin           = false;
    let motionBlock     = null;
    let portA           = null;
    let portB           = null;

    pjs.levels.forStringArray({w : BW, h : BH, source : [
        '0000000000000000000000000000000000000000000',
        '0P                               S        0',
        '01                            K    C      0',
        '0                                         0',
        '0000000000     00000000      00000000     0',
        '0      S    0         00            0     0',
        '0          000         00           0 M  00',
        '000000000000000000000   0000000000000   000',
        '0                    0        S     0     0',
        '0  S     S     S      0             00    0',
        '0                      000   0000000000   0',
        '0A 00000000000000  0        00           00',
        '0                   0      00           000',
        '02  B                0000000    00000000000',
        '0                              000000000000',
        '0000000000000000000           0000000000000',
        '0000000000000000000000000000000000000000000'
    ]}, function (S, X, Y, W, H) {
        if (S === '0') {
            world.push(game.newImageObject({
                x : X, y : Y,
                w : W, h : H,
                file : 'resources/wall.png'
            }));
        }
        else if (S === 'A') {
            portA = game.newRectObject({
                x : X, y : Y,
                w : W, h : H,
                visible : false
            });
        }
        else if (S === 'C') {
            portB = game.newRectObject({
                x : X, y : Y,
                w : W, h : H,
                visible : false
            });
        }
        else if (S === 'M') {
            motionBlock = game.newImageObject({
                x : X, y : Y,
                w : W, h : H,
                file : 'resources/wall.png'
            });
        }
        else if (S === '1') {
            doorEnter = game.newImageObject({
                x : X, y : Y,
                w : 66, h : 110,
                file : 'resources/door.png'
            });
        }
        else if (S === '2') {
            doorExit = game.newImageObject({
                x : X, y : Y,
                w : 66, h : 110,
                file : 'resources/door.png',
                userData : {
                    isOpen : false
                }
            });
        }
        else if (S === 'P') {
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
                    isShot : false,
                    score : 0,
                    isGetKey : false
                }
            });
        }
        else if (S === 'S') {
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
                    isAttack : false,
                    attackSound : pjs.wAudio.newAudio('resources/audio/zombieAttack.mp3', 0.8)
                }
            });

            skeletons.push(skeleton);
        }
        else if (S === 'B') {
            dragon = game.newAnimationObject({
                animation: null,
                x : X, y : Y,
                w : 90, h : 115,
                delay : 8,
                scale : 1,
                userData : {
                    health : 10,
                    currentHealth : 10,
                    creationPoint : point(X, Y),
                    agro : false,
                    isAlive : true,
                    isAttack : false,
                    attackSound : pjs.wAudio.newAudio('resources/audio/rev-drakona.mp3')
                }
            });
        }
        else if (S === 'K') {
            doorKey = game.newAnimationObject({
                animation: pjs.tiles.newAnimation('resources/key.png', 32, 78, 6),
                x :X, y : Y + 16,
                w : 32, h : 78,
                delay : 8,
                scale : 1
            });
        }

    });

    let levelLength = '0000000000000000000000000000000000000000000000'.length * BW;

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

    let dragonStayAnimation = pjs.tiles.newAnimation('resources/dragonStay.png', 90, 115, 15);
    let dragonStraightAttackAnimation = pjs.tiles.newAnimation('resources/dragonStraightAttack.png', 233, 133, 9);
    let dragonBackAttackAnimation = pjs.tiles.newAnimation('resources/dragonBackAttack.png', 233, 133, 9);
    let dragonStraightWalkAnimation = pjs.tiles.newAnimation('resources/dragonStraightWalk.png', 201, 128, 12);
    let dragonDeathAnimation = pjs.tiles.newAnimation('resources/dragonDeath.png', 195, 141, 6);
    changeAnimationTo(dragon, dragonStayAnimation);

    motionBlock.control = function (world) {

        if (mouse.isInObject(this)){
            this.drawStaticBox();

            if(mouse.isDown('LEFT')){
                this.setPositionC(mouse.getPosition());
                pjs.vector.moveCollision(this, world, mouse.getSpeed());
            }
        }

};

    player.control = function(arr, skeletons, dragon) {

        /*if(player.currentHealth <= 0){
            changeAnimationTo(player, playerDeathAnimation, 8);
            brush.drawTextS({
                text : 'YOU LOSE',
                color : 'red',
                size : 120,
                x : game.getWH2().w - 250 , y : game.getWH2().h - 50
            });

            setTimeout(function () {
                game.stop();
                window.location.href = "https://dongor7.github.io/mage-game/";
            }, 1150);

        }
        else*/ if(key.isDown('A')){

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

            console.log("game.getWH2().w = " + game.getWH2().w);
            console.log(" > camera.getPosition().x = " + camera.getPosition().x);

            if(previousPlayerX > currentX &&
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

            if(game.getWH2().w < currentX &&
                previousPlayerX < currentX &&
                camera.getPosition().x + game.getWH().w < levelLength){

                    previousPlayerX = currentX;
                    camera.move(speedCamera);
            }

            lastKey = 'D'
        }
        else if(!player.isShot){

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

            if (camera.getPosition().y > 8) {
                camera.move(speedPlayer);
            }
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

        if(dragon &&
            mouse.isInObject(dragon) &&
            (mouse.isPress('LEFT') || mouse.isDown('LEFT')) &&
            (player.getDistanceC((dragon.getPositionC()))) < 250 &&
            player.currentHealth > 0) {

            if(!player.isShot){
                player.isShot = true;

                player.w = 82;
                player.h = 108;
                player.setDelay(6);

                if(player.x > dragon.x)
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

        /*if(player.isStaticIntersect(portA)){
            player.setPosition(portB.getPosition());
            camera.setPosition(point(levelLength - game.getWH().w, 0))
        }*/

    };

    skeletons.control = function (arr, player) {

        OOP.forArr(this, function (skeleton) {

            let speedSkeleton = point(0, 3);
            let startX = skeleton.x;

            if (skeleton.isAlive && skeleton.getDistanceC(player.getPositionC()) < 250){

                skeleton.attackSound.play();

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

            }
            else if (!skeleton.isAttack && skeleton.isAlive && skeleton.agro && skeleton.getDistanceC(player.getPositionC()) > 250) {
                skeleton.moveTo(skeleton.creationPoint, 4);

                skeleton.attackSound.stop();

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
                speedSkeleton.y += 0.9;
            }

            pjs.vector.moveCollision(skeleton, arr, speedSkeleton, function(sk, w) {

                if(w.x > sk.x){
                    sk.x -= speedSkeleton.x;
                } else if(w.x < sk.x){
                    sk.x += speedSkeleton.x;
                }

            });

            if(skeleton.currentHealth > 0){
                brush.drawImageS({
                    file : 'resources/skeletonHeart.png',
                    x : skeleton.x - 30 - camera.getPosition().x,
                    y : skeleton.y - 5 - camera.getPosition().y,
                    w : 100,
                    scale : 0.3
                });
                brush.drawTextS({
                    text : skeleton.currentHealth,
                    color : 'black',
                    size : 18,
                    x : skeleton.x - 20 - camera.getPosition().x,
                    y : skeleton.y - 2 - camera.getPosition().y
                });

            }

            if(mouse.isInObject(skeleton)) {
                mouse.setCursorImage("resources/cursorAttack.png");
            }
        })

    };

    dragon.control = function (arr, player) {

        let speedDragon = point(0, 3);
        let startX = this.x;

        if (this.isAlive && this.getDistanceC(player.getPositionC()) <= 250){

            dragon.attackSound.play();

            if (player.underAttack){

            } else if (this.isIntersect(player)){

                this.isAttack = true;

                if(player.x > this.x){
                    changeAnimationTo(this, dragonStraightAttackAnimation);
                } else {
                    changeAnimationTo(this, dragonBackAttackAnimation);
                }

                player.underAttack = true;
                let self = this;

                setTimeout(function () {
                    self.isAttack = false;
                    player.underAttack = false;
                }, 1500);

                setTimeout(function () {
                    if(self.isIntersect(player)){
                        player.currentHealth -= 2;
                    }
                },1000)

            } else if (!this.isAttack){
                this.moveToC(player.getPositionC(), 1);
                this.agro = true;

                if (startX < this.x) {
                    changeAnimationTo(this, dragonStraightWalkAnimation, 5);
                } else {
                    changeAnimationTo(this, skeletonBackWalkAnimation, 5);
                }
            }

        } else if (!this.isAttack &&
                    this.isAlive &&
                    this.agro &&
                    this.getDistanceC(player.getPositionC()) > 250) {

                this.moveTo(this.creationPoint, 4);

                dragon.attackSound.stop();

                if (this.creationPoint.x < this.x) {
                    changeAnimationTo(this, skeletonBackWalkAnimation, 5);
                } else {
                    changeAnimationTo(this, dragonStraightWalkAnimation, 5);
                }
                if (Math.round(this.x) === this.creationPoint.x) {
                    this.agro = false;
                    changeAnimationTo(this, dragonStayAnimation);
                    this.currentHealth = this.health;
                }
        }

        if(speedDragon.y < 5) {
            speedDragon.y += 0.9;
        }

        pjs.vector.moveCollision(this, arr, speedDragon);

        if(mouse.isInObject(dragon)) {
            mouse.setCursorImage("resources/cursorAttack.png");
        }

        if(this.currentHealth > 0){
            brush.drawImageS({
                file : 'resources/skeletonHeart.png',
                x : this.x - 30 - camera.getPosition().x,
                y : this.y - 5 - camera.getPosition().y,
                w : 100,
                scale : 0.3
            });
            brush.drawTextS({
                text : this.currentHealth,
                color : 'black',
                size : 18,
                x : this.x - 15 - camera.getPosition().x,
                y : this.y - 2 - camera.getPosition().y,
                align : 'center'
            });

        }
    };

    let fireBalls   = [];
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
    let preStart    = false;
    let dragonKey   = null;
    let hearts      = [];

    world.push(motionBlock);


    this.update = function () {

        if (pjs.resources.isLoaded() || preStart) {


            pjs.system.setStyle( { background : 'url(resources/background.png)' } );


            mouse.setCursorImage("resources/cursorDefault.png");
            doorEnter.draw();
            doorExit.draw();
            if (dragon){
                dragon.control(world, player);
                dragon.draw();
            }
            player.control(world, skeletons, dragon, motionBlock);
            player.draw();

            portA.draw();
            portB.draw();

            motionBlock.control(world);

            skeletons.control(world, player);
            OOP.drawArr(skeletons);

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
                            skeleton.attackSound.stop();
                            changeAnimationTo(skeleton, skeletonDeathAnimation);
                            skeleton.x += 11;
                            skeleton.isAlive = false;
                            skeleton.healthCounter = -10;

                            setTimeout(function () {
                                hearts.push(
                                    game.newAnimationObject({
                                    animation: pjs.tiles.newAnimation('resources/addHeart.png', 86, 81, 6),
                                    x : skeleton.getPosition().x + 10, y : skeleton.getPositionC().y - 10,
                                    w : 86, h : 81,
                                    delay : 6,
                                    scale : 0.4
                                }));

                                skeletons.splice(idSkeleton, 1);
                                player.score++;
                            }, 2000)
                        }
                    }
                });

                if(dragon && fireball.isStaticIntersect(dragon)){
                    dragon.currentHealth--;
                    fireBalls.splice(idFireball, 1);
                    if(dragon.currentHealth <= 0) {
                        dragon.attackSound.stop();
                        changeAnimationTo(dragon, dragonDeathAnimation);
                        dragon.x += 11;
                        dragon.isAlive = false;
                        dragon.healthCounter = -10;

                        setTimeout(function () {
                            dragonKey = game.newAnimationObject({
                                animation: pjs.tiles.newAnimation('resources/key.png', 32, 78, 6),
                                x : dragon.getPositionC().x, y : dragon.getPositionC().y - 20,
                                w : 32, h : 78,
                                delay : 8,
                                scale : 1
                            });

                            dragon = null;
                            player.score++;

                        }, 1000)
                    }
                }

                if(!fireball.isInCameraStatic())
                    return fireBalls.splice(idFireball, 1);
                fireball.moveAngle(5);
                fireball.draw();
            });

            if (dragonKey) {
                dragonKey.draw();

                if (player.isStaticIntersect(dragonKey)){
                    player.isGetKey = true;
                    dragonKey = null;
                }

            }

            if (doorKey) {
                doorKey.draw();

                if (player.isStaticIntersect(doorKey)){
                    player.isGetKey = true;
                    doorKey = null;
                }

            }

            OOP.forArr(hearts, function (heart, id) {
               if(player.isStaticIntersect(heart)){
                   player.currentHealth++;
                   hearts.splice(id, 1);
               }

               heart.draw();
            });

            brush.onContext(function (ctx) {
                let plPos = player.getPosition();
                let gradient = ctx.createRadialGradient(plPos.x + player.w - 15 - camera.getPosition().x,
                    plPos.y + 5 - camera.getPosition().y,
                    400,
                    plPos.x + player.w - 5 - camera.getPosition().x,
                    plPos.y + 5 - camera.getPosition().y, 0);
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

            if (player.isStaticIntersect(doorExit) && player.isGetKey){
                player.isGetKey = false;
                doorExit.isOpen = true;
                isWin = true;
            }
            else if (player.isStaticIntersect(doorExit) && !doorExit.isOpen) {

                brush.drawTextS({
                    text : 'I need a key...',
                    color : 'white',
                    size : 15,
                    x : player.x + player.w / 2 - camera.getPosition().x,
                    y : player.y - 10 - camera.getPosition().y
                });

            }
            else if (player.isGetKey) {

                brush.drawImageS({
                    file : 'resources/keyIcon.png',
                    x : 40, y : 100,
                    w : 32,
                    scale : 0.5
                });

            }

            if (isWin) {
                brush.drawTextS({
                    text : 'YOU WIN',
                    color : 'red',
                    size : 120,
                    x : game.getWH2().w - 250 , y : game.getWH2().h - 50
                });

                setTimeout(function () {
                    game.stop();
                    window.location.href = "https://dongor7.github.io/mage-game/";
                }, 1500);
            }

            if(key.isPress('SPACE')){
                game.setLoop('pause');
            }


        }
        else {

            pjs.system.setStyle( { background : 'url(resources/b.jpg)' } );

            brush.drawTextS({
                text : 'Loading... ' + pjs.resources.getProgress() + '%',
                color : 'black',
                size : 70,
                x : game.getWH2().w - 280 , y : game.getWH2().h - 80
            });

            setTimeout(() => preStart = true, 5000);
        }

        if(player.currentHealth <= 0){
            changeAnimationTo(player, playerDeathAnimation, 8);
            brush.drawTextS({
                text : 'YOU LOSE',
                color : 'red',
                size : 120,
                x : game.getWH2().w - 350 , y : game.getWH2().h - 80
            });

            setTimeout(function () {
                game.stop();
                window.location.href = "https://dongor7.github.io/mage-game/";
            }, 1150);

        }

    };

    this.entry = function () {
        walkAudio = pjs.wAudio.newAudio('resources/audio/walk.mp3');
        fireballAudio = pjs.wAudio.newAudio('resources/audio/fireball.mp3');

        let fonAudio = pjs.wAudio.newAudio('resources/audio/fon.mp3');
        game.setLoopSound('myGame', [fonAudio]);
    };

});

game.setLoop('myGame');
game.startLoop('myGame');