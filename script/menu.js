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
            base.className = 'base';
            base.innerHTML = `
	
                <h1>Game Name</h1>
        
                <div class="menu">
            
                    <span onclick="closeMenu(); game.startLoop('myGame')">New game</span>
                    <span>Options</span>
                    <span>About</span>
                
                </div>
            
            `;
        };

        createMenu();

    }

});

game.setLoop('menu');
