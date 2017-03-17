/**
 * @fileOverview A fun math game for everyone.
 * @author <a href="mailto:carterschmalzle@gmail.com">Carter Schmalzle</a>
 *
 * @typedef {object} KeyEvent
 */
/**
 * Contains commonly changed, frequently used values
 * @constant
 * @type {Object}
 */
var config = {
    "style": {
        //Outside of dials
        "topPanelColor": 0xffff00,
        //Outside of controls
        "bottomPanelColor": 0x44ffff,
        //Sides of panels
        "baseColor": 0xff0000,
        "panelAlpha": 0.5,
        //Used for short strings
        "font": "Impact, Verdana",
        //Used for longer strings
        "smallFont": "Verdana, Arial, sans-serif"
    },
    "control": {
        //Scale factor for joystick movement
        "sensitivity": 0.02,
        //Restriction on drifting
        "friction": 0.95
    },
    "levels": [{
        "description": "Addition and Subtraction",
        "operators": ["+", "-"],
        "population": 20,
        "range": 10
    }, {
        "description": "Addition and Subtraction",
        "operators": ["+", "-"],
        "population": 35,
        "range": 20
    }, {
        "description": "Addition, Subtraction, Multiplication, and Division",
        "operators": ["+", "-", "*", "/"],
        "population": 30,
        "range": 30
    }, {
        "description": "Addition, Subtraction, Multiplication, and Division",
        "operators": ["+", "-", "*", "/"],
        "population": 35,
        "range": 50
    }, {
        "description": "Multiplication and Division",
        "operators": ["*", "/"],
        "population": 40,
        "range": 99
    }]
};
/**
 * Width of the page
 * @type {Number}
 */
var width = document.body.scrollWidth;
/**
 * Height of the page
 * @type {Number}
 */
var height = document.body.scrollHeight;
/** PixiJS App object - contains renderer, stage, view, and other important things
 * @type {Object}
 */
var app = new PIXI.Application( /** Number */ width, height, {
    backgroundColor: 0x000000,
    antialias: true
});
document.getElementById('main').appendChild(app.view);
/**
 * The container affected by the Camera movement
 * @type {Object}
 */
var main = new PIXI.Container();
main.pivot.set(0.5);
app.stage.addChild(main);
/**
 * Container for particles - tethered underneath main
 * @type {Object}
 */
var secondary = new PIXI.Container();
secondary.pivot.set(0.5);
main.addChild(secondary);
/**
 * The container used for fixed elements within the view
 * @type {Object}
 */
var hud = new PIXI.Container();
app.stage.addChild(hud);
/**
 * The menu panels on the top and bottom
 * {Object}
 */
var panels = new PIXI.Container();
app.stage.addChild(panels);
/**
 * Container for the minimap
 * @type {Object}
 */
var minimap = new PIXI.Container();
panels.addChild(minimap);
/**
 * Transparent white gradient around edges
 * @type {Object}
 */
var border = new PIXI.Sprite.fromImage('img/border.png');
border.width = app.view.width;
border.height = app.view.height;
border.alpha = 0.01;
hud.addChild(border);
/**
 * Get distance using the distance formula
 * @param {Number} x1 - First coordinate x
 * @param {Number} y1 - First coordinate y
 * @param {Number} x2 - Second coordinate x
 * @param {Number} y2 - Second coordinate y
 */
function getDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));
}
/**
 * Keys being listened to
 * @const
 * @type {Number[]}
 */
var keysTracked = [87, 38, 65, 37, 83,
    40, 68, 39, 32
];
/**
 * Stores the keys currently being pressed
 * @type {Number[]}
 */
var keysDown = [];
/**
 * Updates the keysDown array
 * @param {KeyEvent} e
 * @param {Boolean} state
 */
function readKey(e, state) {
    /**
     * The value of the given keycode
     * @type {String}
     */
    var key = e.which;
    if(keysTracked.includes(key)) {
        if(keysDown.includes(key)) {
            if(!state) {
                keysDown.splice(keysDown.indexOf(key), 1);
            }
        } else {
            keysDown.push(key);
        }
    }
}
document.body.addEventListener('keydown', function (e) {
    readKey(e, true);
});
document.body.addEventListener('keyup', function (e) {
    readKey(e, false);
});
/**
 * PixiJS blur filter for main - engaged when the menu is shown
 *
 */
var blurFilter = new PIXI.filters.BlurFilter(5);
/**
 * Fades out and hides PixiJS objects
 * @type {Object[]}
 */
var fadeOut = [],
    /**
     * Fades in and shows PixiJS objects
     * @type {Object[]}
     */
    fadeIn = [];
/**
 * The side length of the game's bounds
 * @const {Number}
 */
var fieldSize = 5000;
/**
 * The array of PixiJS sprites for the background
 * @type {Object[]}
 */
var stars = [];
/**
 * Decorative color splotches that move with background stars
 * @type {String[]}
 */
var colors = ["red", "green", "blue"];
for(var i = 0; i < fieldSize / 10; i++) {
    var star = new PIXI.Sprite();
    var graphics = new PIXI.Graphics();
    graphics.beginFill(Math.floor(Math.random() * 0xffffff), 0.5);
    graphics.lineStyle(0);
    graphics.drawCircle(0, 0, Math.random() * 5 + 5);
    graphics.endFill();
    star.texture = graphics.generateTexture();
    star.anchor.set(0.5);
    star.position.set(Math.random() * (fieldSize + app.view.width) - app.view.width, Math.random() * (fieldSize + app.view.height)) - app.view.height;
    star.baseX = star.position.x;
    star.baseY = star.position.y;
    star.offsetX = 0;
    star.offsetY = 0;
    stars.push(star);
    var color = new PIXI.Sprite.fromImage('img/' + colors[Math.floor(Math.random() * 3)] + '.png');
    color.tint = 0xff0000;
    color.width = Math.round(Math.random() * 400 + 200);
    color.height = Math.round(Math.random() * 400 + 200);
    color.position.set(star.position.x, star.position.y);
    main.addChild(color);
    main.addChild(star);
}
/**
 * The Camera - offsets containers to show elements beyond the screen size
 * @class Camera
 */
var Camera = {
    //Focus point
    x: 0,
    y: 0,
    friction: config.control.friction,
    acceleration: {
        x: 0,
        y: 0
    },
    velocity: {
        x: 0,
        y: 0
    },
    scale: 1,
    /**
     * Update the camera position each iteration of the game loop
     * @memberof Camera
     */
    update: function () {
        Camera.acceleration.x = Camera.acceleration.y = 0;
        //Use the keyboard input
        if(keysDown.includes(87) || keysDown.includes(38)) {
            //Up
            Camera.acceleration.y++;
        }
        if(keysDown.includes(83) || keysDown.includes(40)) {
            //Down
            Camera.acceleration.y--;
        }
        if(keysDown.includes(65) || keysDown.includes(37)) {
            //Left
            Camera.acceleration.x++;
        }
        if(keysDown.includes(68) || keysDown.includes(39)) {
            //Right
            Camera.acceleration.x--;
        }
        /**
         * Total magnitude of the camera's acceleration vector
         * @type {Number}
         */
        var mag = Math.sqrt(Math.pow(Camera.acceleration.x, 2) + Math.pow(Camera.acceleration.y, 2));
        if(mag > 0) {
            Camera.acceleration.x *= 1 / mag;
            Camera.acceleration.y *= 1 / mag;
        }
        if(-Camera.x < -app.view.width / 2) {
            if(Camera.velocity.x > 0) {
                Camera.velocity.x = 0;
            }
            if(Camera.acceleration.x > 0) {
                Camera.acceleration.x = 0;
            }
        } else if(-Camera.x + app.view.width - app.view.width / 2 > fieldSize) {
            if(Camera.velocity.x < 0) {
                Camera.velocity.x = 0;
            }
            if(Camera.acceleration.x < 0) {
                Camera.acceleration.x = 0;
            }
        }
        if(-Camera.y < -app.view.height / 2) {
            if(Camera.velocity.y > 0) {
                Camera.velocity.y = 0;
            }
            if(Camera.acceleration.y > 0) {
                Camera.acceleration.y = 0;
            }
        } else if(-Camera.y + app.view.height - app.view.height / 2 > fieldSize) {
            if(Camera.velocity.y < 0) {
                Camera.velocity.y = 0;
            }
            if(Camera.acceleration.y < 0) {
                Camera.acceleration.y = 0;
            }
        }
        //Apply acceleration
        Camera.velocity.x += Camera.acceleration.x;
        Camera.velocity.y += Camera.acceleration.y;
        //Apply velocity
        Camera.x += Camera.velocity.x;
        Camera.y += Camera.velocity.y;
        //Apply friction
        if(Math.sqrt(Math.pow(Camera.velocity.x, 2) + Math.pow(Camera.velocity.y, 2)) > 2) {
            Camera.velocity.x *= Camera.friction;
            Camera.velocity.y *= Camera.friction;
        }
        //Offset to Camera
        main.position.x = Camera.x;
        main.position.y = Camera.y;
    }
};
/**
 * Determines whether the specified rectangle can be seen by the player
 * @param {Number} x
 * @param {Number} y
 * @param {Number} width
 * @param {Number} height
 */
function inView(x, y, width, height) {
    return x + width / 2 > -Camera.x && x - width / 2 < -Camera.x + app.view.width && y + height / 2 > -Camera.y && y - height / 2 < -Camera.y + app.view.height;
}
/**
 * The date - used by the timer system
 * @type {Object}
 */
var d = new Date();
/**
 * @class Timer
 */
var Timer = function (duration, action) {
    this.startTime = Date.now(),
        this.endTime = this.startTime + duration,
        this.action = action,
        this.active = true;
}
Timer.prototype.update = function () {
    var time = Date.now();
    if(time > this.endTime) {
        this.action();
        this.active = false;
    }
}
/**
 * List of all currently active timers
 * @type {<Timer>[]}
 */
var timers = [];
var Particle = function (x, y, velocityX, velocityY, radius, color, lifespan) {
    this.velocityX = velocityX,
        this.velocityY = velocityY,
        this.radius = radius,
        this.lifespan = lifespan,
        this.startTime = Date.now(),
        this.endTime = Date.now() + lifespan,
        this.body = new PIXI.Graphics(),
        this.active = true;
    this.body.beginFill(color, 0.5);
    this.body.lineStyle(0);
    this.body.drawCircle(x, y, radius);
    this.body.endFill();
    secondary.addChild(this.body);
}
Particle.prototype.update = function () {
    this.body.position.x += this.velocityX;
    this.body.position.y += this.velocityY;
    var now = Date.now();
    var progress = (this.endTime - now) / this.lifespan;
    if(now < this.endTime) {
        this.body.alpha = progress / 2;
    } else {
        this.active = false;
    }
}
/**
 * List of all currently active particles
 * @type {<Particle>[]}
 */
var particles = [];
/**
 * PixiJS sprite representing the rocket
 * @type {Object}
 */
var rocket = new PIXI.Sprite.fromImage('img/rocket.png'),
	/**
	 * Rocket's representation on the minimap
	 * @type {Object} - PixiJS Sprite
	 */
	miniRocket = new PIXI.Sprite(),
	miniRocketGraphics = new PIXI.Graphics();
rocket.anchor.set(0.5);
rocket.width = 100;
rocket.height = 150;
main.addChild(rocket);
miniRocket.anchor.set(0.5);
miniRocketGraphics.beginFill(0xff0000,1);
miniRocketGraphics.drawCircle(0,0,10);
miniRocketGraphics.endFill();
miniRocket.texture = miniRocketGraphics.generateTexture();
miniRocket.width = 10;
miniRocket.height = 10;
/**
 * Resets the rocket
 */
function resetRocket() {
    /**
     * Angle used for random position and trajectory back to center
     * @type {Number}
     */
    var angle = Math.random() * 2 * Math.PI;
    rocket.position.x = Camera.x + app.view.width / 2 + Math.cos(angle) * (Math.max(app.view.width, app.view.height));
    rocket.position.y = Camera.x + app.view.height / 2 + Math.sin(angle) * (Math.max(app.view.width, app.view.height));
    rocket.velocityX = -Math.cos(angle) * 10;
    rocket.velocityY = -Math.sin(angle) * 10;
    rocket.rotation = angle - Math.PI / 2;
    rocket.active = true;
    rocket.visible = false;
    rocket.seen = false;
    rocket.scale.set(0);
}
resetRocket();
/** @type {Number} */
var level = 1,
    levelText = new PIXI.Text(level, {
        font: '35px ' + config.style.font,
        fill: 0xffffff
    });
/**
 * Returns a reasonable radius for a circle with the given operator
 * @param {String} operator - The operator that this circle uses to combine
 * @returns {Number}
 */
function randomRadius(operator) {
    switch(operator) {
    case "+":
    case "-":
        return Math.round(Math.random() * config.levels[level - 1].range);
        break;
    case "*":
        return Math.round(((Math.random() - 0.5) * (config.levels[level - 1].range / (current != 0 ? current : 1))));
        break;
    case "/":
        /**
         * Stores all of the factors of the player's current number
         * @type {Number[]}
         */
        var options = [];
        for(var i = -current; i <= current; i++) {
            if(current % i == 0) {
                options.push(i);
            }
        }
        return options[Math.floor(Math.random() * options.length)];
        break;
    }
}
/**
 * Returns a random number within the level's range - avoids prime numbers and finds relatives of the current number
 * @returns {Number}
 */
function randomTarget() {
    if(config.levels[level - 1].operators.includes('+')) {
        return Math.round((Math.random() - 0.5) * config.levels[level - 1].range);
    } else {
        return Math.round(((Math.random() - 0.5) * (config.levels[level - 1].range)) / current) * current;
    }
}
/**
 * A list of all fill-size, labeled, PixiJS sprites representing the circles
 * @type {Object[]}
 */
var circles = [],
    /**
     * A list of all miniature, unlabeled PixiJS sprites representing circles on the minimap
     * @type {Object[]}
     */
    simpleCircles = [],
    /**
     * The height of the panels on the top and bottom - also used to size the widths of boxes within the panel
     * @type {Number}
     */
    panelHeight = Math.min(app.view.width / 4, 150);
/** The function to create a circle and add it to the circles array and its corresponding simple circle to the simple circles array */
function createCircle() {
    /** @type {Object} - PixiJS Sprite */
    var circle = new PIXI.Sprite(),
        /** @type {Object} - PixiJS Sprite */
        simpleCircle = new PIXI.Sprite(),
        /** @type {String[]} - The list of operators the level can contain */
        operators = config.levels[level - 1].operators,
        /** @type {String} - The operator for this circle */
        operator = operators[Math.floor(Math.random() * operators.length)],
        /** @type {Number} - The range of numbers the level can contain */
        range = Math.random() * config.levels[level - 1].range,
        /** @type {Number} - Value radius of the circle */
        radius = randomRadius(operator),
        /** @type {Number} - True radius of the displayed circle */
        displayRadius = Math.abs(radius) + 30,
        /** @type {Number} */
        alpha = Math.random() * 0.5 + 0.25;
    //Configure the circle
    circle.anchor.set(0.5);
    circle.position.x = Math.random() * fieldSize;
    circle.position.y = Math.random() * fieldSize;
    circle.velocityX = (Math.random() - 0.5) * 5;
    circle.velocityY = (Math.random() - 0.5) * 5;
    circle.operator = operator;
    circle.radius = radius;
    circle.color = Math.floor(Math.random() * 0xffffff);
    circle.active = true;
    circle.scale.set(0);
    /**
     * The PixiJS Text object that shows the radius
     * @type {Object} - PixiJS Text
     */
    var text = new PIXI.Text(radius > 0 ? circle.operator + radius : circle.operator + "(" + radius + ")", {
        font: '30px ' + config.style.font,
        fill: 0xffffff
    });
    displayRadius += text.width;
    text.position.x = -text.width / 2;
    text.position.y = -text.height / 2;
    /**
     * The graphics for this circle
     * @type {Object} - PixiJS Graphics
     */
    var graphics = new PIXI.Graphics();
    graphics.beginFill(circle.color, alpha);
    graphics.lineStyle(5, circle.color, 0.25);
    graphics.drawCircle(circle.position.x, circle.position.y, displayRadius);
    graphics.endFill();
	/**
	 * The graphics for this simple circle
	 * @type {Object} - PixiJS Graphics
	 */
	var simpleGraphics = new PIXI.Graphics();
	simpleGraphics.beginFill(circle.color, alpha);
    simpleGraphics.lineStyle(0);
    simpleGraphics.drawCircle(circle.position.x, circle.position.y, displayRadius);
    simpleGraphics.endFill();
    //Set the graphics as the sprite texture for the circle and simple circle
    circle.texture = graphics.generateTexture();
    simpleCircle.texture = simpleGraphics.generateTexture();
    circle.addChild(text);
    main.addChild(circle);
    //Configure the simple circle
    simpleCircle.position.x = circle.position.x * (panelHeight / fieldSize);
    simpleCircle.position.y = circle.position.y * (panelHeight / fieldSize);
    simpleCircle.anchor.set(0.5);
    simpleCircle.scale.set(panelHeight / fieldSize * 2);
    minimap.addChild(simpleCircle);
    circles.push(circle);
    simpleCircles.push(simpleCircle);
}
/**
 * The funciton for performing the specified mathematical operation on two given numbers - used for combining circles
 * @param {String} operator
 * @param {Number} num1 - The number to be operated on
 * @param {Number} num2
 */
function performOperation(operator, num1, num2) {
    switch(operator) {
    case "+":
        //Add
        return num1 + num2;
        break;
    case "-":
        //Subtract
        return num1 - num2;
        break;
    case "*":
        //Multiply
        return num1 * num2;
        break;
    case "/":
        //Divide
        return num1 / num2;
        break;
    }
}
/**
 * The player's current number
 * @type {Number}
 */
var current = 0,
    /**
     * The number the player is trying to get to for each round
     * @type {Number}
     */
    target = 0,
    /** @type {Object} - PixiJS Text */
    targetText = new PIXI.Text(target, {
        font: '35px ' + config.style.font,
        fill: 0xffffff
    }),
    /** @type {Object} - PixiJS Text */
    currentText = new PIXI.Text(current, {
        font: '30px ' + config.style.font,
        fill: 0xffffff
    }),
    /** @type {Boolean} */
    pause = true;
/** Updates the value and position of the text in the hud for the current number */
function updateCurrent() {
    currentText.setText(current);
    currentText.position.set((app.view.width - currentText.width) / 2, (app.view.height - currentText.height) / 2);
}
/** Resets all variable values associated with gameplay and repopulates list of circles */
function generateLevel() {
    //Level button text
    levelText.setText(level);
    levelText.position.x = (app.view.width - 2 * panelHeight - levelText.width) / 2;
    //Set beginning radius (different from current number)
    current = randomRadius("*");
    updateCurrent();
    do {
        target = randomTarget();
    } while (target == current);
    //Set target label
    targetText.setText(target);
    targetText.position.x = (app.view.width - targetText.width) / 2;
    //Generate random circles
    for(var i = 0; i < circles.length; i++) {
        circles[i].active = false;
    }
    /**
     * The index of the current level - Used to get values from the config object
     * @type {Number}
     */
    var index = level - 1;
    if(index >= 0 && index < config.levels.length) {
        /**
         * The number of bubbles allowed in this level
         * @type {Number}
         */
        var population = config.levels[index].population;
        //Generate circles
        for(var i = 0; i < population; i++) {
            createCircle();
        }
    } else {
        //Level out of range
        if(level < 0) {
            level = 0;
        } else {
            level = config.levels.length - 1;
        }
        generateLevel();
    }
}
generateLevel();
/**
 * The radius of the crosshair on the hud
 * @type {Number}
 */
var radius = Math.min(app.view.width, app.view.height) / 8;
/**
 * PixiJS Graphics of the circle connecting the crosshair
 * @type {Object}
 */
var indicator = new PIXI.Graphics();
indicator.beginFill(0xffffff, 0.1);
indicator.lineStyle(5, config.style.baseColor, 0.25);
indicator.drawCircle(app.view.width / 2, app.view.height / 2, radius);
indicator.endFill();
indicator.alpha = 0.5;
hud.addChild(indicator);
/**
 * The crosshair for the hud
 * @type {Object} - PixiJS Graphics
 */
var crosshair = new PIXI.Graphics();
//Inner lines
crosshair.lineStyle(2, 0xffffff, 0.5);
crosshair.moveTo(app.view.width / 2 - 40, app.view.height / 2);
crosshair.lineTo(app.view.width / 2 - radius - 20, app.view.height / 2);
crosshair.moveTo(app.view.width / 2 + 40, app.view.height / 2);
crosshair.lineTo(app.view.width / 2 + radius + 20, app.view.height / 2);
crosshair.moveTo(app.view.width / 2, app.view.height / 2 - 40);
crosshair.lineTo(app.view.width / 2, app.view.height / 2 - radius - 20);
crosshair.moveTo(app.view.width / 2, app.view.height / 2 + 40);
crosshair.lineTo(app.view.width / 2, app.view.height / 2 + radius + 20);
//Outer lines
crosshair.lineStyle(2, 0xff8888, 0.25);
crosshair.moveTo(app.view.width / 2 - radius - 30, app.view.height / 2);
crosshair.lineTo(app.view.width / 2 - radius * 2, app.view.height / 2);
crosshair.moveTo(app.view.width / 2 + radius + 30, app.view.height / 2);
crosshair.lineTo(app.view.width / 2 + radius * 2, app.view.height / 2);
crosshair.moveTo(app.view.width / 2, app.view.height / 2 - radius - 30);
crosshair.lineTo(app.view.width / 2, app.view.height / 2 - radius * 2);
crosshair.moveTo(app.view.width / 2, app.view.height / 2 + radius + 30);
crosshair.lineTo(app.view.width / 2, app.view.height / 2 + radius * 2);
crosshair.alpha = 0.5;
hud.addChild(crosshair);
//Position minimap
minimap.position.set(app.view.width / 2 - panelHeight / 2, app.view.height - panelHeight + 5);
var xCross = new PIXI.Graphics()
xCross.lineStyle(2, config.style.baseColor, 0.5);
xCross.moveTo((Camera.x + app.view.width / 2) * (panelHeight / fieldSize), 0);
xCross.lineTo((Camera.x + app.view.width / 2) * (panelHeight / fieldSize), fieldSize * (panelHeight / fieldSize));
minimap.addChild(xCross);
var yCross = new PIXI.Graphics();
yCross.lineStyle(1, config.style.baseColor, 0.5);
yCross.moveTo(0, (Camera.y + app.view.height / 2) * (panelHeight / fieldSize));
yCross.lineTo((fieldSize) * (panelHeight / fieldSize), (Camera.y + app.view.height / 2) * (panelHeight / fieldSize));
minimap.addChild(yCross);
minimap.addChild(miniRocket);
/**
 * Top panel - contains target, level, and pause
 * @type {Object} - PixiJS Sprite
 */
var topPanel = new PIXI.Sprite();
/**
 * PixiJS Graphics for the top panel
 * @type {Object}
 */
var topPanelGraphics = new PIXI.Graphics();
//Left angle
topPanelGraphics.beginFill(config.style.baseColor, config.style.panelAlpha);
topPanelGraphics.lineStyle(2, 0xffffff, 1);
topPanelGraphics.moveTo(0, 0);
topPanelGraphics.lineTo(app.view.width / 2 - 1.5 * panelHeight, panelHeight);
topPanelGraphics.lineTo(app.view.width / 2 - 1.5 * panelHeight, 0);
topPanelGraphics.endFill();
//Right angle
topPanelGraphics.beginFill(config.style.baseColor, config.style.panelAlpha);
topPanelGraphics.lineStyle(2, 0xffffff, 1);
topPanelGraphics.moveTo(app.view.width, 0);
topPanelGraphics.lineTo(app.view.width / 2 + 1.5 * panelHeight, panelHeight);
topPanelGraphics.lineTo(app.view.width / 2 + 1.5 * panelHeight, 0);
topPanelGraphics.endFill();
//Dial area
topPanelGraphics.beginFill(config.style.topPanelColor, config.style.panelAlpha);
topPanelGraphics.lineStyle(2, 0xffffff, 1);
topPanelGraphics.moveTo(app.view.width / 2 - 1.5 * panelHeight, 0);
topPanelGraphics.lineTo(app.view.width / 2 - 1.5 * panelHeight, panelHeight);
topPanelGraphics.lineTo(app.view.width / 2 - panelHeight / 2, panelHeight);
topPanelGraphics.lineTo(app.view.width / 2 - panelHeight / 2, 0);
topPanelGraphics.endFill();
//Level area
topPanelGraphics.lineTo(app.view.width / 2 + panelHeight / 2, 0);
topPanelGraphics.lineTo(app.view.width / 2 + panelHeight / 2, panelHeight);
topPanelGraphics.lineTo(app.view.width / 2 + 1.5 * panelHeight, panelHeight);
topPanelGraphics.lineTo(app.view.width / 2 + 1.5 * panelHeight, 0);
topPanelGraphics.endFill();
//Dial
topPanelGraphics.beginFill(0x000000, 0.5);
topPanelGraphics.lineStyle(2, 0x000000, 0.5);
topPanelGraphics.drawCircle((app.view.width - 2 * panelHeight) / 2, panelHeight / 2, panelHeight / 4);
topPanelGraphics.endFill();
//Target box
topPanelGraphics.beginFill(0x000000, config.style.panelAlpha);
topPanelGraphics.lineStyle(2, 0xffffff, 1);
topPanelGraphics.drawRect(app.view.width / 2 - panelHeight / 2, 0, panelHeight, panelHeight);
topPanelGraphics.endFill();
topPanel.texture = topPanelGraphics.generateTexture();
panels.addChild(topPanel);
panels.addChild(levelText);
levelText.position.y = (panelHeight - levelText.height) / 2;
/**
 * The smaller text 'Get to' for the target indicator
 * @type {Object} - PixiJS Text
 */
var targetLabel = new PIXI.Text("Get to", {
    font: '20px ' + config.style.font,
    fill: 0x888888
});
targetLabel.position.x = (app.view.width - targetLabel.width) / 2;
targetLabel.position.y = 10;
panels.addChild(targetLabel);
//Target text
targetText.position.y = targetLabel.height + (panelHeight - targetLabel.height - targetText.height) / 2;
panels.addChild(targetText);
/**
 * The bottom panel - contains the controls and the minimap
 * @type {Object} - PixiJS Sprite
 */
var bottomPanel = new PIXI.Sprite();
/**
 * PixiJS Graphics for the bottom panel
 * @type {Object} PixiJS Graphics
 */
var bottomPanelGraphics = new PIXI.Graphics();
//Left angle
bottomPanelGraphics.beginFill(config.style.baseColor, config.style.panelAlpha);
bottomPanelGraphics.lineStyle(2, 0xffffff, 1);
bottomPanelGraphics.moveTo(0, app.view.height);
bottomPanelGraphics.lineTo(app.view.width / 2 - 1.5 * panelHeight, app.view.height - panelHeight);
bottomPanelGraphics.lineTo(app.view.width / 2 - 1.5 * panelHeight, app.view.height);
bottomPanelGraphics.endFill();
//Right angle
bottomPanelGraphics.beginFill(config.style.baseColor, config.style.panelAlpha);
bottomPanelGraphics.lineStyle(2, 0xffffff, 1);
bottomPanelGraphics.moveTo(app.view.width, app.view.height);
bottomPanelGraphics.lineTo(app.view.width / 2 + 1.5 * panelHeight, app.view.height - panelHeight);
bottomPanelGraphics.lineTo(app.view.width / 2 + 1.5 * panelHeight, app.view.height);
bottomPanelGraphics.endFill();
//Shoot button area
bottomPanelGraphics.beginFill(config.style.bottomPanelColor, config.style.panelAlpha);
bottomPanelGraphics.lineStyle(2, 0xffffff, 1);
bottomPanelGraphics.moveTo(app.view.width / 2 - 1.5 * panelHeight, app.view.height);
bottomPanelGraphics.lineTo(app.view.width / 2 - 1.5 * panelHeight, app.view.height - panelHeight);
bottomPanelGraphics.lineTo(app.view.width / 2 - panelHeight / 2, app.view.height - panelHeight);
bottomPanelGraphics.lineTo(app.view.width / 2 - panelHeight / 2, app.view.height);
//Joystick area
bottomPanelGraphics.lineTo(app.view.width / 2 + panelHeight / 2, app.view.height);
bottomPanelGraphics.lineTo(app.view.width / 2 + panelHeight / 2, app.view.height - panelHeight);
bottomPanelGraphics.lineTo(app.view.width / 2 + 1.5 * panelHeight, app.view.height - panelHeight);
bottomPanelGraphics.lineTo(app.view.width / 2 + 1.5 * panelHeight, app.view.height);
bottomPanelGraphics.endFill();
//Left bottom
bottomPanelGraphics.beginFill(0x000000, 0.5);
bottomPanelGraphics.lineStyle(2, 0x000000, 0.5);
bottomPanelGraphics.drawCircle((app.view.width - 2 * panelHeight - 1) / 2, app.view.height - (panelHeight + 1) / 2, panelHeight / 4);
bottomPanelGraphics.endFill();
//Right bottom
bottomPanelGraphics.beginFill(0x000000, 0.5);
bottomPanelGraphics.lineStyle(2, 0x000000, 0.5);
bottomPanelGraphics.drawCircle((app.view.width + 2 * panelHeight) / 2, app.view.height - panelHeight / 2, panelHeight / 4);
bottomPanelGraphics.endFill();
//Minimap
bottomPanelGraphics.beginFill(0x000000, 0.1);
bottomPanelGraphics.lineStyle(2, 0xffffff, 1);
bottomPanelGraphics.drawRect(app.view.width / 2 - panelHeight / 2, app.view.height - panelHeight, panelHeight, panelHeight);
bottomPanelGraphics.endFill();
bottomPanel.position.y = app.view.height - panelHeight;
bottomPanel.texture = bottomPanelGraphics.generateTexture();
panels.addChild(bottomPanel);
//Current radius text (declared above generateLevel)
hud.addChild(currentText);
/**
 * The pause button
 * @type {Object} - PixiJS Sprite
 */
var pauseButton = new PIXI.Sprite();
pauseButton.interactive = true;
pauseButton.buttonMode = true;
pauseButton.on('pointerdown', togglePause);
pauseButton.position.set((app.view.width + 2 * panelHeight) / 2, panelHeight / 2);
pauseButton.anchor.set(0.5);
/**
 * Pause button graphic
 * @type {Object} - PixiJS Graphics
 */
var pauseGraphic = new PIXI.Graphics();
pauseGraphic.beginFill(0xffffff, 1);
pauseGraphic.lineStyle(1, 0x000000);
pauseGraphic.drawRect(-panelHeight / 8 + 2, -panelHeight / 8, (panelHeight / 4) / 3, panelHeight / 4);
pauseGraphic.drawRect(-panelHeight / 8 + (panelHeight / 4) / 3 * 2 - 2, -panelHeight / 8, (panelHeight / 4) / 3, panelHeight / 4);
pauseGraphic.endFill();
pauseGraphic.visible = false;
pauseButton.addChild(pauseGraphic);
var playGraphic = new PIXI.Graphics();
playGraphic.beginFill(0xffffff, 1);
playGraphic.lineStyle(1, 0x000000);
playGraphic.moveTo(-panelHeight / 8 + 8, -panelHeight / 8);
playGraphic.lineTo(-panelHeight / 8 + 8, panelHeight / 8);
playGraphic.lineTo(panelHeight / 8 - 4, 0);
playGraphic.lineTo(-panelHeight / 8 + 8, -panelHeight / 8);
pauseButton.addChild(playGraphic);
/**
 * PixiJS Graphics for pause button
 * @type {Obect} - PixiJS Graphics
 */
var pauseButtonGraphics = new PIXI.Graphics();
pauseButtonGraphics.beginFill(0x000000, 0.5);
pauseButtonGraphics.lineStyle(2, 0x000000, 0.5);
pauseButtonGraphics.drawCircle(0, 0, panelHeight / 4);
pauseButtonGraphics.endFill();
pauseButton.texture = pauseButtonGraphics.generateTexture();
panels.addChild(pauseButton);
//Shoot button graphic
var shootButtonGraphics = new PIXI.Graphics();
shootButtonGraphics.beginFill(0xff0000);
shootButtonGraphics.lineStyle(2, 0x000000, 0.5);
shootButtonGraphics.drawCircle(0, 0, panelHeight / 4);
shootButtonGraphics.endFill();
//Shoot button
var shootButton = new PIXI.Sprite();
shootButton.anchor.set(0.5);
shootButton.texture = shootButtonGraphics.generateTexture();
shootButton.position.set((app.view.width - 2 * panelHeight) / 2, app.view.height - (panelHeight) / 2);
shootButton.interactive = true;
shootButton.buttonMode = true;
//Button click event
shootButton.on('pointerdown', function () {
    shootButton.scale.set(0.95);
    shoot();
}).on('pointerup', function () {
    shootButton.scale.set(1);
}).on('pointerupoutside', function () {
    shootButton.scale.set(1);
});
//Text for button
var buttonText = new PIXI.Text("Shoot!", {
    font: '15px ' + config.style.font,
    fill: 0x000000
});
buttonText.position.set(-buttonText.width / 2, -buttonText.height / 2);
shootButton.addChild(buttonText);
panels.addChild(shootButton);
//Joystick graphic
var joystickGraphic = new PIXI.Graphics();
joystickGraphic.beginFill(0x00ff00);
joystickGraphic.lineStyle(2, 0x000000, 0.5);
joystickGraphic.drawCircle(0, 0, panelHeight / 5);
joystickGraphic.endFill();
//Joystick
var joystick = new PIXI.Sprite();
joystick.anchor.set(0.5);
joystick.texture = joystickGraphic.generateTexture();
var basePosition = [(app.view.width + 2 * panelHeight + 1) / 2, app.view.height - panelHeight / 2 + 1];
joystick.position.set(basePosition[0], basePosition[1]);
joystick.interactive = true;
joystick.buttonMode = true;
//Joystick movement
var pointer = [0, 0],
    base = [0, 0],
    down = false;
joystick.on('pointerdown', function (e) {
    down = true;
}).on('pointermove', function (e) {
    if(down) {
        var position = e.data.getLocalPosition(this.parent);
        pointer[0] = position.x;
        pointer[1] = position.y;
        if(getDistance(basePosition[0], basePosition[1], pointer[0], pointer[1]) < panelHeight / 6) {
            joystick.position.set(pointer[0], pointer[1]);
        } else {
            var angle = Math.atan2(pointer[1] - basePosition[1], pointer[0] - basePosition[0]);
            joystick.position.set(basePosition[0] + Math.cos(angle) * panelHeight / 6, basePosition[1] + Math.sin(angle) * panelHeight / 6);
        }
    }
}).on('pointerup', endMove).on('pointerupoutside', endMove);

function endMove() {
    down = false;
    joystick.position.x = basePosition[0];
    joystick.position.y = basePosition[1];
    offset = [0, 0];
}
panels.addChild(joystick);
//Menu box
var menuBox = new PIXI.Sprite();
/** Toggles shooting ability and shows menu */
function togglePause() {
	if(menuBox.active && !fadeIn.includes(pauseGraphic) && !fadeOut.includes(pauseGraphic)) {
        pause = false;
        menuBox.active = false;
        fadeOut.push(menuBox);
        fadeOut.push(playGraphic);
        fadeIn.push(pauseGraphic);
    } else if(!fadeIn.includes(playGraphic) && !fadeOut.includes(playGraphic)) {
        pause = true;
        menuBox.active = true;
        fadeIn.push(menuBox);
        fadeOut.push(pauseGraphic);
        fadeIn.push(playGraphic);
    }
}
var menuBoxGraphics = new PIXI.Graphics();
menuBoxGraphics.beginFill(config.style.baseColor, 0.25);
menuBoxGraphics.lineStyle(1, 0xffffff);
menuBoxGraphics.drawRect(app.view.width / 2 - 1.5 * panelHeight, panelHeight, 3 * panelHeight, app.view.height - 2 * panelHeight);
menuBoxGraphics.endFill();
menuBoxGraphics.beginFill(0x000000, 0.95);
menuBoxGraphics.drawRect(app.view.width / 2 - 1.5 * panelHeight + 20, panelHeight + 20, 3 * panelHeight - 40, app.view.height - 2 * panelHeight - 40);
menuBoxGraphics.endFill();
menuBoxGraphics.moveTo(app.view.width / 2 - 1.5 * panelHeight + 20, panelHeight * 2);
menuBoxGraphics.lineTo(app.view.width / 2 + 1.5 * panelHeight - 20, panelHeight * 2);
//Menu box title
var title = new PIXI.Sprite.fromImage('img/logo.png');
title.anchor.set(0.5);
title.position.x = panelHeight * 1.5;
title.position.y = panelHeight * 0.5+10;
title.alpha = 0.75;
/**
 * The light rocket behind the title in the menu box
 * @type {Object} - PixiJS Sprite
 */
var decoRocket = new PIXI.Sprite.fromImage('img/rocket.png');
decoRocket.width = 66;
decoRocket.height = 99;
decoRocket.tint = 0x888888;
decoRocket.anchor.set(0.5);
decoRocket.position.set(panelHeight * 1.5, 0.5 * panelHeight + 5);
decoRocket.rotation = Math.PI / 3;
decoRocket.alpha = 0.5;
menuBox.addChild(decoRocket);
menuBox.addChild(title);
menuBox.texture = menuBoxGraphics.generateTexture();
menuBox.position.x = app.view.width / 2 - 1.5 * panelHeight;
menuBox.position.y = panelHeight;
menuBox.active = true;
/**
 * The main button at the bottom of the menu box
 * @type {Object}
 */
var button = new PIXI.Sprite();
/**
 * The PixiJS Graphics for the main button
 * @type {Object}
 */
var buttonGraphics = new PIXI.Graphics();
buttonGraphics.beginFill(0x00ff00, 0.25);
buttonGraphics.lineStyle(1, 0xffffff, 1);
buttonGraphics.drawRect(0, 0, 3 * panelHeight - 40, panelHeight / 2);
buttonGraphics.endFill();
/**
 * The text for the main button - will be changed based on menu state
 * @type {Object} - PixiJS Text
 */
var buttonText = new PIXI.Text("Next", {
    font: '20px ' + config.style.font,
    fill: 0xffffff
});
buttonText.position.set((3 * panelHeight - buttonText.width - 40) / 2, 0.25 * panelHeight - buttonText.height / 2);
button.addChild(buttonText);
button.texture = buttonGraphics.generateTexture();
button.position.set(20, app.view.height - 2.5 * panelHeight - 20);
button.interactive = true;
button.buttonMode = true;
button.on('pointerdown', toggleButton);
/** Determines the correct value for the main button */
function updateButton() {
    if(!levelPane.active) {
        buttonText.setText("Levels");
    } else {
        buttonText.setText("Directions");
    }
    buttonText.position.x = (3 * panelHeight - buttonText.width - 40) / 2;
}
/** Performs the correct function for the main button */
function toggleButton() {
    if(buttonText.text == "Directions") {
        changePane(1);
    } else {
        changePane(0);
    }
    updateButton();
}
menuBox.addChild(button);
hud.addChild(menuBox);
menuBox.alpha = 1;
menuBox.visible = true;
menuBox.active = true;
/**
 * A list of the PixiJS Sprites being used as buttons for each level
 * @type {Object[]}
 */
var levels = [],
    /**
     * The pane (PixiJS Container) shown when choosing levels
     *
     */
    levelPane = new PIXI.Container();
levelPane.position.set(20, panelHeight);
/** Changes to the level clicked - called on the firing of the 'pointerdown' event on the level button */
function selectLevel() {
	togglePause();
    level = this.level;
    generateLevel();
    menuBox.active = false;
    fadeOut.push(menuBox);
    this.alpha = 0.5;
}
/** Changes the button's back to its full opacity */
function endSelect() {
    this.alpha = 1;
}
/**
 * A list of panes (PixiJS Containers)
 * @type {Object[]}
 */
var panes = [],
    index = 1;
/**
 * Changes the active pane and changes the states accordingly
 * @param {Number} newIndex - The id of the pane to change to
 */
function changePane(newIndex) {
    if(fadeOut.indexOf(panes[index] < 0 && fadeIn.indexOf(panes[index])) < 0 && fadeOut.indexOf(panels[newIndex]) < 0 && fadeIn.indexOf(panels[newIndex]) < 0) {
        fadeOut.push(panes[index]);
        panes[index].active = false;
        index = newIndex;
        fadeIn.push(panes[index]);
        panes[index].active = true;
    }
}
/**
 * The height of the level button - calculated to fit exactly the number of levels
 * @type {Number}
 */
var rowHeight = (app.view.height - 3.5 * panelHeight - 20) / config.levels.length;
//Level pane
for(var i = 0; i < config.levels.length; i++) {
    levels.push(new PIXI.Sprite());
    /** The PixiJS Graphics for the level button */
    var graphics = new PIXI.Graphics();
    graphics.beginFill(Math.floor(Math.random() * 0x111111), 0.25);
    graphics.lineStyle(1, 0xffffff);
    graphics.drawRect(0, 0, 3 * panelHeight - 40, rowHeight);
    graphics.endFill();
    levels[i].y = i * rowHeight;
    levels[i].interactive = true;
    levels[i].buttonMode = true;
    levels[i].level = i + 1;
    levelPane.addChild(levels[i]);
    /**
     * The title for the level button
     * @type {Object}
     */
    var text = new PIXI.Text("Level " + (i + 1), {
        font: '20px ' + config.style.font,
        fill: 0xffffff
    });
    text.position.set(10, (rowHeight - text.height) / 2);
    graphics.addChild(text);
    /**
     * The description of the level
     * @type {Object}
     */
    var text2 = new PIXI.Text(config.levels[i].description, {
        font: '15px ' + config.style.smallFont,
        fill: 0xffffff,
        wordWrap: true,
        wordWrapWidth: 3 * panelHeight - text.width - 60
    });
    text2.alpha = 0.5;
    text2.position.set(3 * panelHeight - 40 - text2.width - 10, (rowHeight - text2.height) / 2);
    graphics.addChild(text2);
    levels[i].texture = graphics.generateTexture();
    levels[i].on('pointerdown', selectLevel).on('pointerup', endSelect).on('pointerupoutside', endSelect);
}
levelPane.visible = false;
levelPane.active = false;
panes.push(levelPane);
menuBox.addChild(levelPane);
/**
 * The pane (PixiJS Container) for holding the directions
 * @type {Object}
 */
var directionsPane = new PIXI.Container();
/**
 * The PixiJS Graphics for the directions pane
 * @type {Object}
 */
var directionsGraphics = new PIXI.Graphics();
directionsGraphics.beginFill(0x000000, 0.1);
directionsGraphics.lineStyle(0, 0xffffff, 1);
directionsGraphics.drawRect(20, panelHeight, 3 * panelHeight - 40, app.view.height - 3 * panelHeight - 20);
directionsGraphics.endFill();
/**
 * The PixiJS Container to hold the slides
 * @type {Object}
 */
var slideArea = new PIXI.Container();
/**
 * The text displayed at the center of the menu box for each slide
 * @type {String[]}
 */
var slideText = ["Shoot bubbles to get to this number.", "Use the green joystick to move around.", "Press the red button to shoot."];
var slideCircles = [new PIXI.Point(1.5 * panelHeight, -panelHeight / 2 + 10), new PIXI.Point(2.5 * panelHeight, app.view.height - 1.5 * panelHeight), new PIXI.Point(0.5 * panelHeight, app.view.height - 1.5 * panelHeight)];
/**
 * The center point of the menu box
 * @type {Object}
 */
var textCenter = new PIXI.Point(1.5 * panelHeight, (app.view.height - 1.5 * panelHeight) / 2);
/**
 * The radian angle toward which the arrow should point and be offset from the center point
 * @type {Number[]}
 */
var arrowDirections = [];
for(var i = 0; i < slideCircles.length; i++) {
    arrowDirections.push(Math.atan2(slideCircles[i].y - textCenter.y, slideCircles[i].x - textCenter.x));
}
/** @type {Number} */
var currentSlide = 0;
/**
 * The current slide's text
 * @type {Object}
 */
var objectiveText = new PIXI.Text(slideText[currentSlide], {
    font: '20px ' + config.style.smallFont,
    fill: 0xffffff,
    align: 'center',
    wordWrap: true,
    wordWrapWidth: 3 * panelHeight - 80
});
objectiveText.position.set((3 * panelHeight - objectiveText.width) / 2, (app.view.height - 1.5 * panelHeight - objectiveText.height) / 2);
/**
 * The circle for highlighting the current slide's subject
 * @type {object}
 */
var objectiveCircle = new PIXI.Sprite();
objectiveCircle.anchor.set(0.5);
objectiveCircle.position.set(slideCircles[currentSlide].x, slideCircles[currentSlide].y);
/**
 * The PixiJS Graphics for the circle
 * @type {Object}
 */
var circleGraphics = new PIXI.Graphics();
circleGraphics.beginFill(0x00ff00, 0.5);
circleGraphics.lineStyle(5, 0x00ff00, 0.75);
circleGraphics.drawCircle(0, 0, panelHeight / 2 - 10);
objectiveCircle.texture = circleGraphics.generateTexture();
/**
 * The image (PixiJS Sprite) of an arrow
 * @type {Object}
 */
var arrow = new PIXI.Sprite();
arrow.anchor.set(0.5);
arrow.position.set(textCenter.x, textCenter.y - 10);
/**
 * The PixiJS Graphics for the arrow - added as a texture
 * @type {Object}
 */
var arrowGraphics = new PIXI.Graphics();
/**
 * The size of the arrow
 * @type {Number}
 */
var arrowSize = textCenter.y / 4;
arrowGraphics.beginFill(0x00ff00, 0.25);
arrowGraphics.lineStyle(5, 0x00ff00, 0.5);
arrowGraphics.moveTo(0.25 * arrowSize, 0);
arrowGraphics.lineTo(arrowSize * 0.75, 0);
arrowGraphics.lineTo(arrowSize * 0.75, -arrowSize / 2);
arrowGraphics.lineTo(arrowSize, -arrowSize / 2);
arrowGraphics.lineTo(arrowSize / 2, -arrowSize);
arrowGraphics.lineTo(0, -arrowSize / 2);
arrowGraphics.lineTo(arrowSize * 0.25, -arrowSize / 2);
arrowGraphics.lineTo(0.25 * arrowSize, 0);
arrowGraphics.endFill();
arrow.texture = arrowGraphics.generateTexture();
arrow.rotation = arrowDirections[currentSlide] + Math.PI / 2;
arrow.position.set(textCenter.x + Math.cos(arrowDirections[currentSlide]) * (arrowSize + 10), textCenter.y + Math.sin(arrowDirections[currentSlide]) * (arrowSize + 10));
/**
 * Increments the current slide and animates transitions
 */
function advanceSlide() {
    currentSlide++;
    if(currentSlide > slideText.length - 1) {
        currentSlide = 0;
    }
    fadeOut.push(slideArea);
    timers.push(new Timer(250, function () {
        objectiveText.setText(slideText[currentSlide]);
        objectiveText.position.x = (3 * panelHeight - objectiveText.width) / 2;
        objectiveCircle.position.set(slideCircles[currentSlide].x, slideCircles[currentSlide].y);
        arrow.rotation = arrowDirections[currentSlide] + Math.PI / 2;
        arrow.position.set(textCenter.x + Math.cos(arrowDirections[currentSlide]) * (arrowSize + 20), textCenter.y + Math.sin(arrowDirections[currentSlide]) * (arrowSize + 20));
        fadeIn.push(slideArea);
    }));
    timers.push(new Timer(5000, advanceSlide));
}
timers.push(new Timer(1000, advanceSlide));
directionsPane.addChild(slideArea);
slideArea.addChild(objectiveText);
slideArea.addChild(objectiveCircle);
slideArea.addChild(arrow);
//Configure directions pane
directionsPane.addChild(directionsGraphics);
directionsPane.active = true;
menuBox.addChild(directionsPane);
panes.push(directionsPane);
/**
 * The pane (PixiJS Container) to be shown when the game is over (win or lose)
 * @type {Object}
 */
var endPane = new PIXI.Container();
/**
 * Text for end pane - centered vertically and horizontally
 * @type {Object}
 */
var endText = new PIXI.Text("You won!", {
    font: '30px ' + config.style.font,
    fill: 0xffffff
});
endText.position.set(textCenter.x - endText.width / 2, textCenter.y - panelHeight / 2 - endText.height / 2);
endPane.addChild(endText);
/**
 * The replay button - positioned above the main button within the menu
 * @type {Object}
 */
var replayButton = new PIXI.Sprite();
replayButton.position.set(20, app.view.height - 3 * panelHeight - 20);
//Graphics for the replay button
var replayButtonGraphics = new PIXI.Graphics();
replayButtonGraphics.beginFill(config.style.baseColor, 0.5);
replayButtonGraphics.lineStyle(1, 0xffffff, 1);
replayButtonGraphics.drawRect(0, 0, 3 * panelHeight - 40, panelHeight / 2);
replayButtonGraphics.endFill();
replayButton.texture = replayButtonGraphics.generateTexture();
replayButton.interactive = true;
replayButton.buttonMode = true;
replayButton.on('pointerdown', function () {
    generateLevel();
    fadeOut.push(menuBox);
    menuBox.active = false;
    toggleButton();
	togglePause();
});
//Text for the replay button
var replayButtonText = new PIXI.Text("Play Again", {
    font: '20px ' + config.style.font,
    fill: 0xffffff
});
replayButtonText.position.set((3 * panelHeight - 40 - replayButtonText.width) / 2, (panelHeight / 2 - replayButtonText.height) / 2);
//Set up the end pane
replayButton.addChild(replayButtonText);
endPane.addChild(replayButton);
endPane.active = false;
endPane.visible = false;
endPane.alpha = 0;
menuBox.addChild(endPane);
panes.push(endPane);
//List of circles currently colliding with the crosshair
var collidingCircles = [];
//Shoot
function shoot() {
    if(!pause) {
        //All colliding circles
        for(var i = 0; i < collidingCircles.length; i++) {
            if(collidingCircles[i].active) {
                current = performOperation(collidingCircles[i].operator, current, collidingCircles[i].radius);
                collidingCircles[i].active = false;
                for(var j = 0; j < 10; j++) {
                    particles.push(new Particle(collidingCircles[i].x, collidingCircles[i].y, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, Math.random() * collidingCircles[i].width / 2, collidingCircles[i].color, 500));
                }
            }
        }
        //Check for a win
        if(current == target) {
            changePane(2);
            levelPane.visible = directionsPane.visible = false;
            updateButton();
			togglePause();
        } else {
            //Check for loss
            if(Math.abs(current) > 500 || (current == 0 && !config.levels[level - 1].operators.includes('+'))) {
                endText.setText("You lost!");
                endText.position.x = textCenter.x - endText.width / 2;
                changePane(2);
                levelPane.visible = directionsPane.visible = false;
                updateButton();
				togglePause();
            }
        }
        indicator.alpha = 1;
        updateCurrent();
        if(getDistance(rocket.position.x, rocket.position.y, Camera.x + app.view.width / 2, Camera.y + app.view.height / 2) < radius) {
            //Hit the rocket
            changePane(1);
            fadeIn.push(menuBox);
        }
    }
}
/**
 * Used for pulsating rocket and indicator circle
 * @type {Boolean}
 */
var pulse = true;
var timerSet = false;
/**
 * Update everything - called later by the game loop
 */
function update() {
    //Fade out and hide elements in the fadeOut list
    for(var i = 0; i < fadeOut.length; i++) {
        if(fadeOut[i].alpha > 0 && fadeIn.indexOf(fadeOut[i]) < 0) {
            fadeOut[i].alpha -= 0.1;
        } else {
            fadeOut[i].visible = false;
            fadeOut[i].alpha = 0;
            fadeOut.splice(i, 1);
        }
    }
    //Fade in and set visible elements in the fadeIn list
    for(var i = 0; i < fadeIn.length; i++) {
        fadeIn[i].visible = true;
        if(fadeIn[i].alpha <= 1 && fadeOut.indexOf(fadeIn[i]) < 0) {
            fadeIn[i].alpha += 0.1;
        } else {
            fadeIn[i].alpha = 1;
            fadeIn.splice(i, 1);
        }
    }
    //Apply background blur
    if(menuBox.active) {
        main.filters = [blurFilter];
        if(blurFilter.blur < 10) {
            blurFilter.blur += 0.5;
        }
        //Rocket and circle pulse
        if(pulse) {
            decoRocket.scale.set(decoRocket.scale.x * 1.01);
            objectiveCircle.scale.set(objectiveCircle.scale.x * 1.01);
        } else {
            decoRocket.scale.set(decoRocket.scale.x * 0.99);
            objectiveCircle.scale.set(objectiveCircle.scale.x * 0.99);
        }
        if(decoRocket.scale.x > 0.2) {
            pulse = false;
        } else if(decoRocket.scale.x < 0.1) {
            pulse = true;
        }
    } else {
        if(blurFilter.blur > 0) {
            blurFilter.blur -= 0.5;
        } else {
            main.filters = [];
        }
    }
    //Scale in rocket
    if(rocket.scale.x < 0.5 && rocket.active) {
        rocket.scale.set(rocket.scale.x + 0.01);
    }
    //Fade in rocket
    if(rocket.alpha < 1) {
        rocket.alpha += 0.01;
    }
    //Shoot
    if(keysDown.includes(32)) {
        shoot();
    }
    //Fade back
    if(indicator.alpha > 0.5) {
        indicator.alpha *= 0.95;
    }
    //Update timers
    for(var i = 0; i < timers.length; i++) {
        timers[i].update();
        if(!timers[i].active) {
            timers.splice(i, 1);
        }
    }
    //Update particles
    for(var i = 0; i < particles.length; i++) {
        particles[i].update();
        if(!particles[i].active) {
            secondary.removeChild(particles[i].body);
            particles.splice(i, 1);
        }
    }
    //Update rocket
    if(rocket.active) {
        particles.push(new Particle(rocket.x, rocket.y, Math.random() - 0.5, Math.random() - 0.5, Math.random() * 10 + 10, Math.floor(Math.random() * 0xffffff), 500));
        rocket.position.x += rocket.velocityX;
        rocket.position.y += rocket.velocityY;
        //Culling and respawning
        if(inView(rocket.x, rocket.y - rocket.height / 2, rocket.height, rocket.height)) {
            rocket.visible = true;
            timers.push(new Timer(200,function() {
                rocket.seen = true;
            }));
        } else {
            if(rocket.seen) {
                rocket.active = false;
            }
        }
    } else {
        if(rocket.scale.x > 0) {
            rocket.scale.set(rocket.scale.x - 0.1);
        } else {
            rocket.visible = false;
            if(!timerSet) {
                timers.push(new Timer(Math.random()* 5000 + 5000, function () {
                    console.log("Rocket inbound");
                    resetRocket();
                    timerSet = false;
                }));
                timerSet = true;
            }
        }
    }
	//Update rocket on minimap
	miniRocket.position.set(rocket.position.x*(panelHeight/fieldSize),rocket.position.y*(panelHeight/fieldSize));
    miniRocket.visible = rocket.visible;
    //Move
    Camera.velocity.x += (basePosition[0] - joystick.position.x) * config.control.sensitivity;
    Camera.velocity.y += (basePosition[1] - joystick.position.y) * config.control.sensitivity;
    //Update Camera (use key input, move, offset)
    Camera.update();
    //Update circles
    for(var i = 0; i < circles.length; i++) {
        //Fade in
        if(circles[i].scale.x < 1) {
            circles[i].scale.set(circles[i].scale.x += 0.01);
        }
        //Apply velocity
        circles[i].x += circles[i].velocityX;
        circles[i].y += circles[i].velocityY;
        //Keep in bounds
        if(circles[i].x < 0) {
            circles[i].velocityX = Math.abs(circles[i].velocityX);
        } else if(circles[i].x > fieldSize) {
            circles[i].velocityX = -Math.abs(circles[i].velocityX);
        }
        if(circles[i].y < 0) {
            circles[i].velocityY = Math.abs(circles[i].velocityY);
        } else if(circles[i].y > fieldSize) {
            circles[i].velocityY = -Math.abs(circles[i].velocityY);
        }
        //Culling and collision with crosshair
        if(inView(circles[i].x, circles[i].y, circles[i].width, circles[i].height)) {
            if(!circles[i].visible) {
                circles[i].visible = true;
            }
            //Collision detection
            if(getDistance(app.view.width / 2, app.view.height / 2, circles[i].x + Camera.x, circles[i].y + Camera.y) < radius + circles[i].width / 2) {
                if(!collidingCircles.includes(circles[i])) {
                    collidingCircles.push(circles[i]);
                    circles[i].tint = 0x888888;
                }
            } else if(collidingCircles.includes(circles[i])) {
                collidingCircles.splice(collidingCircles.indexOf(circles[i]), 1);
                circles[i].tint = 0xffffff;
            }
        } else {
            circles[i].visible = false;
        }
        //Update on minimap
        simpleCircles[i].position.set(circles[i].position.x * (panelHeight / fieldSize), circles[i].position.y * (panelHeight / fieldSize));
        simpleCircles[i].alpha = circles[i].alpha / (getDistance(circles[i].position.x, circles[i].position.y, -Camera.x + app.view.width / 2, -Camera.y + app.view.height / 2) / app.view.width / 2);
        //Deactivate dividing bubbles resulting in fractions
        if(circles[i].operator == "/") {
            if(current % circles[i].radius != 0) {
                circles[i].active = false;
            }
        }
        //Remove inactive circles (and replace)
        if(!circles[i].active) {
            if(circles[i].alpha < 0.01) {
                //Remove
                main.removeChild(circles[i]);
                minimap.removeChild(simpleCircles[i]);
                circles.splice(i, 1);
                simpleCircles.splice(i, 1);
                //Replace
                if(circles.length < config.levels[level - 1].population) {
                    createCircle();
                }
            } else {
                //Decrease opacity
                circles[i].alpha *= 0.9;
                circles[i].scale.set(1.01 * circles[i].scale.x);
            }
        }
    }
    //Update minimap crosshair
    xCross.position.x = (-Camera.x) * (panelHeight / fieldSize);
    yCross.position.y = (-Camera.y) * (panelHeight / fieldSize);
    //Update stars
    for(var i = 0; i < stars.length; i++) {
        stars[i].offsetX = (Camera.x / (fieldSize + app.view.width)) * i / (stars.length - 1) * (app.view.width / 2);
        stars[i].offsetY = (Camera.y / (fieldSize + app.view.height)) * i / (stars.length - 1) * (app.view.width / 2);
        stars[i].position.set(stars[i].baseX + stars[i].offsetX, stars[i].baseY + stars[i].offsetY);
        if(inView(stars[i].position.x, stars[i].position.y, stars[i].width, stars[i].height)) {
            if(!stars[i].visible) {
                stars[i].visible = true;
            }
        } else {
            stars[i].visible = false;
        }
    }
}
/**
 * Updates everything at about 60fps using requestAnimationFrame();
 */
function loop() {
    //Update everything
    update();
    //Keep on running
    window.requestAnimationFrame(loop);
}
loop();
