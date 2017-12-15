game.newLoopFromConstructor('menu', function () {

    let base;
    let createMenu;

    this.update = function () {

    };

    this.entry = function () {

        closeMenu = function() {
            pjs.system.removeDOM(base);
        };

        createMenu = function() {
            base = pjs.system.newDOM('div', true);
            base.className = 'allthethings';
            base.innerHTML = `
	
                <div id="start" onclick="closeMenu(); game.startLoop('myGame')"></div>
                <div id="circle"></div>
            
            `;
        };

        createMenu();

    }

});

game.setLoop('menu');
