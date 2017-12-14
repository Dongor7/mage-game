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

