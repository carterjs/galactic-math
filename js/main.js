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
        "baseColor": 0x226666,
        "menuAlpha": 0.01,
        //Used for short strings
        "font": "\"Gruppo\",Verdana,sans-serif",
        //Resolution Scale
        "scale": 1.5
    },
    "control": {
        //Scale factor for joystick movement
        "sensitivity": 0.02,
        //Restriction on drifting
        "friction": 0.95
    },
    "levels": [{
        "description": "+  -",
        "operators": ["+", "-"],
        "population": 20,
        "range": 10
    }, {
        "description": "+  -",
        "operators": ["+", "-"],
        "population": 35,
        "range": 20
    }, {
        "description": "+  -  *  /",
        "operators": ["+", "-", "*", "/"],
        "population": 30,
        "range": 30
    }, {
        "description": "+  -  *  /",
        "operators": ["+", "-", "*", "/"],
        "population": 35,
        "range": 50
    }, {
        "description": "*  /",
        "operators": ["*", "/"],
        "population": 40,
        "range": 99
    }]
};
/**
 * Width of the page
 * @type {Number}
 */
var renderer = new PIXI.autoDetectRenderer(100,100,document.getElementById('game'));
renderer.view.style.position = 'absolute';
renderer.view.style.left = '0px';
renderer.view.style.top = '0px';
renderer.view.style.width = '100%';
renderer.view.style.height = '100%';
document.body.appendChild(renderer.view);
renderer.backgroundColor = 0x111111;
var width = 100,
height = 100,
scale = config.style.scale                ;
//Resize the canvas to the new window size
var resize = function() {
  width = window.innerWidth*scale;
  height = window.innerHeight*scale;
  renderer.resize(width,height);
}
resize();
//List of functions called when the window is resized
var resizeCallbacks = [resize];
function windowResized() {
  for(var i=0;i<resizeCallbacks.length;i++) {
    resizeCallbacks[i]();
  }
}
window.onresize = windowResized;
/**
 * The parent container
 * @type {Object}
 */
var main = new PIXI.Container();
var scene = new PIXI.Container();
scene.pivot.set(0.5);
main.addChild(scene);
/**
 * Container for particles - tethered underneath scene
 * @type {Object}
 */
var secondary = new PIXI.Container();
secondary.pivot.set(0.5);
scene.addChild(secondary);
/**
 * The menu panels on the top and bottom
 * {Object}
 */
var panels = new PIXI.Container();
main.addChild(panels);
/**
 * Container for the minimap
 * @type {Object}
 */
var minimap = new PIXI.Container();
/**
 * The container used for fixed elements within the view
 * @type {Object}
 */
var hud = new PIXI.Container();
panels.addChild(hud);
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
 * PixiJS blur filter for scene - engaged when the menu is shown
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
var fieldBorder = new PIXI.Graphics();
fieldBorder.beginFill(0);
fieldBorder.drawRect(0,0,fieldSize,fieldSize);
fieldBorder.endFill();
scene.addChild(fieldBorder);
scene.mask = fieldBorder;
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
    /*var star = new PIXI.Sprite();*/
    var graphics = new PIXI.Graphics();
    graphics.beginFill(Math.floor(Math.random() * 0xffffff), 0.5);
    graphics.lineStyle(0);
    graphics.drawCircle(0, 0, Math.random() * 5 + 5);
    graphics.endFill();
    var star = new PIXI.Sprite.fromImage('img/' + colors[Math.floor(Math.random() * 3)] + '.png');
    star.anchor.set(0.5);
    star.position.set(Math.random() * (fieldSize + width) - width, Math.random() * (fieldSize + height)) - height;
    star.baseX = star.position.x;
    star.baseY = star.position.y;
    star.offsetX = 0;
    star.offsetY = 0;
    star.addChild(graphics);
    scene.addChild(star);
    stars.push(star);
}
/**
 * The Camera - offsets containers to show elements beyond the screen size
 * @class Camera
 */
var Camera = {
    //Focus point
    x: -fieldSize/2+width/2,
    y: -fieldSize/2+height/2,
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
        if(-Camera.x < -width / 2) {
            if(Camera.velocity.x > 0) {
                Camera.velocity.x = 0;
            }
            if(Camera.acceleration.x > 0) {
                Camera.acceleration.x = 0;
            }
        } else if(-Camera.x + width - width / 2 > fieldSize) {
            if(Camera.velocity.x < 0) {
                Camera.velocity.x = 0;
            }
            if(Camera.acceleration.x < 0) {
                Camera.acceleration.x = 0;
            }
        }
        if(-Camera.y < -height / 2) {
            if(Camera.velocity.y > 0) {
                Camera.velocity.y = 0;
            }
            if(Camera.acceleration.y > 0) {
                Camera.acceleration.y = 0;
            }
        } else if(-Camera.y + height - height / 2 > fieldSize) {
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
        scene.position.x = Camera.x;
        scene.position.y = Camera.y;
    }
};
/**
 * Determines whether the specified rectangle can be seen by the player
 * @param {Number} x
 * @param {Number} y
 * @param {Number} width
 * @param {Number} height
 */
function inView(x, y, objectWidth, objectHeight) {
    //return x + width / 2 > -Camera.x && x - width / 2 < -Camera.x + width && y + height / 2 > -Camera.y && y - height / 2 < -Camera.y + height;
    //return true;
    return x + objectWidth/2 > -Camera.x && x - objectWidth/2  < -Camera.x + width && y + objectHeight/2 > -Camera.y && y - objectHeight/2 < -Camera.y + height;
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
scene.addChild(rocket);
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
    rocket.position.x = -Camera.x + width/2 + Math.cos(angle) * Math.min(width,height)/2;
    rocket.position.y = -Camera.y + height/2 + Math.sin(angle) * Math.min(width,height)/2;
    rocket.velocityX = -Math.cos(angle) * 20;
    rocket.velocityY = -Math.sin(angle) * 20;
    rocket.rotation = angle - Math.PI / 2;
    rocket.active = true;
    rocket.visible = false;
    rocket.scale.set(0);
}
resetRocket();
/** @type {Number} */
var level = 1,
    levelText = new PIXI.Text(level, {
        font: Math.round(35 * scale) + 'px ' + config.style.font,
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
        return Math.round(((Math.random() - 0.5) * (config.levels[level - 1].range)) / (current != 0 ? current : 1)) * current;
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
    panelHeight = Math.min(width / 4, 120 * scale);
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
    var text = new PIXI.Text(radius >= 0 ? circle.operator + radius : circle.operator + "(" + radius + ")", {
        font: Math.round(30 * scale) + 'px ' + config.style.font,
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
    scene.addChild(circle);
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
        font: Math.round(35 * scale) + 'px ' + config.style.font,
        fill: 0xffffff
    }),
    /** @type {Object} - PixiJS Text */
    currentText = new PIXI.Text(current, {
        font: Math.round(30 * scale) + 'px ' + config.style.font,
        fill: 0xffffff
    }),
    /** @type {Boolean} */
    pause = false;
/** Updates the value and position of the text in the hud for the current number */
function updateCurrent() {
    currentText.setText(current);
    currentText.position.set((width - currentText.width) / 2, (height - currentText.height) / 2);
}
/** Resets all variable values associated with gameplay and repopulates list of circles */
function generateLevel() {
    //Level button text
    levelText.setText(level);
    levelText.position.x = (width - 2 * panelHeight - levelText.width) / 2;
    //Set beginning radius (different from current number)
    current = randomRadius("*");
    updateCurrent();
    do {
        target = randomTarget();
    } while (target == current);
    //Set target label
    targetText.setText(target);
    targetText.position.x = (width - targetText.width) / 2;
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
var radius = Math.min(width, height) / 8;
/**
 * PixiJS Graphics of the circle connecting the crosshair
 * @type {Object}
 */
var indicator = new PIXI.Graphics();
indicator.beginFill(0xffffff, 0.1);
indicator.lineStyle(5, config.style.baseColor, 0.25);
indicator.drawCircle(width / 2, height / 2, radius);
indicator.endFill();
indicator.alpha = 0.5;
hud.addChild(indicator);
var decorations = new PIXI.Container();
var circle = new PIXI.Graphics();

hud.addChild(decorations);
/**
 * The crosshair for the hud
 * @type {Object} - PixiJS Graphics
 */
var crosshair = new PIXI.Graphics();
//Inner lines
crosshair.lineStyle(2, 0xffffff, 0.5);
crosshair.moveTo(width / 2 - 40, height / 2);
crosshair.lineTo(width / 2 - radius - 20, height / 2);
crosshair.moveTo(width / 2 + 40, height / 2);
crosshair.lineTo(width / 2 + radius + 20, height / 2);
crosshair.moveTo(width / 2, height / 2 - 40);
crosshair.lineTo(width / 2, height / 2 - radius - 20);
crosshair.moveTo(width / 2, height / 2 + 40);
crosshair.lineTo(width / 2, height / 2 + radius + 20);
//Outer lines
crosshair.lineStyle(2, 0xff8888, 0.25);
crosshair.moveTo(width / 2 - radius - 30, height / 2);
crosshair.lineTo(width / 2 - radius * 2, height / 2);
crosshair.moveTo(width / 2 + radius + 30, height / 2);
crosshair.lineTo(width / 2 + radius * 2, height / 2);
crosshair.moveTo(width / 2, height / 2 - radius - 30);
crosshair.lineTo(width / 2, height / 2 - radius * 2);
crosshair.moveTo(width / 2, height / 2 + radius + 30);
crosshair.lineTo(width / 2, height / 2 + radius * 2);
crosshair.alpha = 0.5;
hud.addChild(crosshair);
//Position minimap
minimap.position.set(width / 2 - panelHeight / 2, height - panelHeight);
//Mask minimap
var miniMask = new PIXI.Graphics();
miniMask.beginFill();
miniMask.drawRect(width/2-panelHeight/2,height-panelHeight,panelHeight,panelHeight);
miniMask.endFill();
minimap.mask = miniMask;
var xCross = new PIXI.Graphics()
xCross.lineStyle(2, 0xff0000, 0.5);
xCross.moveTo((Camera.x + width / 2) * (panelHeight / fieldSize), 0);
xCross.lineTo((Camera.x + width / 2) * (panelHeight / fieldSize), fieldSize * (panelHeight / fieldSize));
minimap.addChild(xCross);
var yCross = new PIXI.Graphics();
yCross.lineStyle(2, 0xff0000, 0.5);
yCross.moveTo(0, (Camera.y + height / 2) * (panelHeight / fieldSize));
yCross.lineTo((fieldSize) * (panelHeight / fieldSize), (Camera.y + height / 2) * (panelHeight / fieldSize));
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
topPanelGraphics.alpha = 0.5;
var controlStart = width/2-1.5*panelHeight;
var controlEnd = width - controlStart;
//Background
if(width-3*panelHeight > 2*panelHeight) {
  topPanelGraphics.beginFill(0xffffff,0.1);
  topPanelGraphics.lineStyle(2,0xffffff,0.1);
  topPanelGraphics.moveTo(0,0);
  topPanelGraphics.lineTo(controlStart/4,panelHeight/2);
  topPanelGraphics.lineTo(controlStart*(3/4),panelHeight/2);
  topPanelGraphics.lineTo(controlStart,panelHeight);
  topPanelGraphics.lineTo(controlEnd,panelHeight);
  topPanelGraphics.lineTo(controlEnd+(width-controlEnd)/4,panelHeight/2);
  topPanelGraphics.lineTo(controlEnd+(width-controlEnd)*(3/4),panelHeight/2);
  topPanelGraphics.lineTo(width,0);
  topPanelGraphics.endFill();
  for(var i=0;i<controlStart/2;i+=5) {
    topPanelGraphics.lineStyle(i%2*4+1,(i+1)%2*config.style.baseColor,0.05);
    topPanelGraphics.moveTo(controlStart/4+i,0);
    topPanelGraphics.lineTo(controlStart/4+i,panelHeight/2-1);
  }
  for(var i=0;i<(width-controlEnd)/2;i+=5) {
    topPanelGraphics.lineStyle(i%2*4+1,(i+1)%2*config.style.baseColor,0.05);
    topPanelGraphics.moveTo(controlEnd+(width-controlEnd)/4+i,0);
    topPanelGraphics.lineTo(controlEnd+(width-controlEnd)/4+i,panelHeight/2-1);
  }
} else {
  topPanelGraphics.beginFill(0xffffff,0.1);
  topPanelGraphics.lineStyle(2,0xffffff,0.1);
  topPanelGraphics.moveTo(0,0);
  topPanelGraphics.lineTo(0,panelHeight/2);
  topPanelGraphics.lineTo(controlStart,panelHeight);
  topPanelGraphics.lineTo(controlEnd,panelHeight);
  topPanelGraphics.lineTo(width,panelHeight/2);
  topPanelGraphics.lineTo(width,0);
  topPanelGraphics.endFill();
}
//Sector 1
topPanelGraphics.beginFill(0x000000,0.1);
topPanelGraphics.lineStyle(1,0xffffff,0.1);
topPanelGraphics.drawRect(width/2-1.5*panelHeight,0,panelHeight,panelHeight);
topPanelGraphics.endFill();
//Sector 2
topPanelGraphics.beginFill(0xffffff,0.1);
topPanelGraphics.lineStyle(1,0xffffff,0.1);
topPanelGraphics.drawRect((width-panelHeight)/2,0,panelHeight,panelHeight);
topPanelGraphics.endFill();
//Sector 3
topPanelGraphics.beginFill(0x000000,0.1);
topPanelGraphics.lineStyle(1,0xffffff,0.1);
topPanelGraphics.drawRect((width+panelHeight)/2,0,panelHeight,panelHeight);
topPanelGraphics.endFill();
panels.addChild(topPanelGraphics);
//Target box
panels.addChild(levelText);
levelText.position.y = (panelHeight - levelText.height) / 2;
/**
 * The smaller text 'Get to' for the target indicator
 * @type {Object} - PixiJS Text
 */
var targetLabel = new PIXI.Text("Get to", {
    font: Math.round(20 * scale) + 'px ' + config.style.font,
    fill: 0x888888
});
targetLabel.position.x = (width - targetLabel.width) / 2;
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
bottomPanelGraphics.alpha = 0.5;
if(width-3*panelHeight > 2*panelHeight) {
  bottomPanelGraphics.beginFill(0xffffff,0.1);
  bottomPanelGraphics.lineStyle(2,0xffffff,0.1);
  bottomPanelGraphics.moveTo(0,height);
  bottomPanelGraphics.lineTo(controlStart/4,height-panelHeight/2);
  bottomPanelGraphics.lineTo(controlStart*(3/4),height-panelHeight/2);
  bottomPanelGraphics.lineTo(controlStart,height-panelHeight);
  bottomPanelGraphics.lineTo(controlEnd,height-panelHeight);
  bottomPanelGraphics.lineTo(controlEnd+(width-controlEnd)/4,height-panelHeight/2);
  bottomPanelGraphics.lineTo(controlEnd+(width-controlEnd)*(3/4),height-panelHeight/2);
  bottomPanelGraphics.lineTo(width,height);
  bottomPanelGraphics.endFill();
  for(var i=0;i<controlStart/2;i+=5) {
    bottomPanelGraphics.lineStyle(i%2*4+1,(i+1)%2*config.style.baseColor,0.05);
    bottomPanelGraphics.moveTo(controlStart/4+i,height);
    bottomPanelGraphics.lineTo(controlStart/4+i,height-panelHeight/2+1);
  }
  for(var i=0;i<(width-controlEnd)/2;i+=5) {
    bottomPanelGraphics.lineStyle(i%2*4+1,(i+1)%2*config.style.baseColor,0.05);
    bottomPanelGraphics.moveTo(controlEnd+(width-controlEnd)/4+i,height);
    bottomPanelGraphics.lineTo(controlEnd+(width-controlEnd)/4+i,height-panelHeight/2+1);
  }
} else {
  bottomPanelGraphics.beginFill(0xffffff,0.1);
  bottomPanelGraphics.lineStyle(2,0xffffff,0.1);
  bottomPanelGraphics.moveTo(0,height);
  bottomPanelGraphics.lineTo(0,height-panelHeight/2);
  bottomPanelGraphics.lineTo(controlStart,height-panelHeight);
  bottomPanelGraphics.lineTo(controlEnd,height-panelHeight);
  bottomPanelGraphics.lineTo(width,height-panelHeight/2);
  bottomPanelGraphics.lineTo(width,height);
  bottomPanelGraphics.endFill();
}
//Sector 1
bottomPanelGraphics.beginFill(0x000000,0.1);
bottomPanelGraphics.lineStyle(1,0xffffff,0.1);
bottomPanelGraphics.drawRect(width/2-1.5*panelHeight,height-panelHeight,panelHeight,panelHeight);
bottomPanelGraphics.endFill();
//Sector 2
bottomPanelGraphics.beginFill(0x000000,0.5);
bottomPanelGraphics.lineStyle(1,0xffffff,0.1);
bottomPanelGraphics.drawRect((width-panelHeight)/2,height-panelHeight,panelHeight,panelHeight);
bottomPanelGraphics.endFill();
//Sector 3
bottomPanelGraphics.beginFill(0x000000,0.1);
bottomPanelGraphics.lineStyle(1,0xffffff,0.1);
bottomPanelGraphics.drawRect((width+panelHeight)/2,height-panelHeight,panelHeight,panelHeight);
bottomPanelGraphics.endFill();
panels.addChild(bottomPanelGraphics);
panels.addChild(minimap);
//Current radius text (declared above generateLevel)
hud.addChild(currentText);
hud.visible = false;
/**
 * The pause button
 * @type {Object} - PixiJS Sprite
 */
var pauseButton = new PIXI.Sprite();
pauseButton.interactive = true;
pauseButton.buttonMode = true;
pauseButton.on('pointerdown', togglePause);
pauseButton.position.set((width + 2 * panelHeight) / 2, panelHeight / 2);
pauseButton.anchor.set(0.5);
var pauseButtonWrapper = new PIXI.Graphics();
pauseButtonWrapper.beginFill(0xffffff,0.1);
pauseButtonWrapper.lineStyle(1,0xffffff,0.1);
pauseButtonWrapper.drawCircle(0,0,panelHeight/4);
pauseButtonWrapper.endFill();
pauseButton.addChild(pauseButtonWrapper);
/**
 * Pause button graphic
 * @type {Object} - PixiJS Graphics
 */
var pauseGraphic = new PIXI.Graphics();
pauseGraphic.beginFill(0xffffff, 0.2);
pauseGraphic.lineStyle(0);
pauseGraphic.drawRect(-panelHeight / 8 + 2, -panelHeight / 8, (panelHeight / 4) / 3, panelHeight / 4);
pauseGraphic.drawRect(-panelHeight / 8 + (panelHeight / 4) / 3 * 2 - 2, -panelHeight / 8, (panelHeight / 4) / 3, panelHeight / 4);
pauseGraphic.endFill();
pauseGraphic.visible = false;
pauseButton.addChild(pauseGraphic);
var playGraphic = new PIXI.Graphics();
playGraphic.beginFill(0xffffff, 0.2);
playGraphic.lineStyle(0);
playGraphic.moveTo(-panelHeight / 8 + 8, -panelHeight / 8);
playGraphic.lineTo(-panelHeight / 8 + 8, panelHeight / 8);
playGraphic.lineTo(panelHeight / 8 - 4, 0);
playGraphic.lineTo(-panelHeight / 8 + 8, -panelHeight / 8);
pauseButton.addChild(playGraphic);
/**
 * PixiJS Graphics for pause button
 * @type {Obect} - PixiJS Graphics
 */
panels.addChild(pauseButton);
//Shoot button graphic
var shootButtonGraphics = new PIXI.Graphics();
shootButtonGraphics.beginFill(0x880000,1);
shootButtonGraphics.lineStyle(2, 0x000000, 0.5);
shootButtonGraphics.drawCircle(0, 0, panelHeight / 3);
shootButtonGraphics.endFill();
shootButtonGraphics.lineStyle(1, 0x000000,0.5);
shootButtonGraphics.moveTo(0,-panelHeight/4+4);
shootButtonGraphics.lineTo(0,panelHeight/4-4);
shootButtonGraphics.moveTo(-panelHeight/4+4,0);
shootButtonGraphics.lineTo(panelHeight/4-4,0);
shootButtonGraphics.beginFill(0x000000,0.1);
shootButtonGraphics.lineStyle(2,0x000000,0.5);
shootButtonGraphics.drawCircle(0,0,panelHeight/8);
shootButtonGraphics.endFill();
shootButtonGraphics.lineStyle(5,0x000000,0.15);
shootButtonGraphics.drawCircle(0,0,panelHeight/3.5);
shootButtonGraphics.lineStyle(3,0x000000,0.1);
shootButtonGraphics.drawCircle(0,0,panelHeight/5);
//Shoot button
var shootButton = new PIXI.Sprite();
shootButton.anchor.set(0.5);
shootButton.texture = shootButtonGraphics.generateTexture();
shootButton.position.set((width - 2 * panelHeight) / 2, height - (panelHeight) / 2);
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
panels.addChild(shootButton);
//Joystick area
var joystickArea = new PIXI.Graphics();
joystickArea.beginFill(0x000000,0.1);
joystickArea.lineStyle(5,0xffffff,0.1);
joystickArea.drawCircle((width + 2 * panelHeight) / 2, height - (panelHeight) / 2,panelHeight/3);
joystickArea.endFill();
panels.addChild(joystickArea);
//Joystick graphic
var joystickGraphic = new PIXI.Graphics();
joystickGraphic.beginFill(0x008800,1);
joystickGraphic.lineStyle(2, 0x000000, 0.5);
joystickGraphic.drawCircle(0, 0, panelHeight/3);
joystickGraphic.endFill();
joystickGraphic.lineStyle(2,0x000000,0.25);
joystickGraphic.drawCircle(0,0,panelHeight/3.25);
joystickGraphic.lineStyle(1,0x000000,0.5);
joystickGraphic.drawCircle(0,0,panelHeight/3.5);
//Joystick
var joystick = new PIXI.Sprite();
joystick.anchor.set(0.5);
joystick.texture = joystickGraphic.generateTexture();
var basePosition = [(width + 2 * panelHeight) / 2, height - panelHeight / 2];
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
  if(index == 1) {
    changePane(0);
  } else {
  	if(menuBox.active && !fadeIn.includes(pauseGraphic) && !fadeOut.includes(pauseGraphic)) {
          pause = false;
          menuBox.active = false;
          fadeOut.push(menuBox);
          fadeOut.push(playGraphic);
          fadeIn.push(pauseGraphic);
          fadeIn.push(hud);
      } else if(!fadeIn.includes(playGraphic) && !fadeOut.includes(playGraphic)) {
          pause = true;
          menuBox.active = true;
          fadeIn.push(menuBox);
          fadeOut.push(pauseGraphic);
          fadeIn.push(playGraphic);
          fadeOut.push(hud);
      }
    }
}
var menuBoxGraphics = new PIXI.Graphics();
menuBoxGraphics.beginFill(config.style.baseColor, 0.01);
menuBoxGraphics.lineStyle(1,0xffffff,0.1);
menuBoxGraphics.drawRect(width / 2 - 1.5 * panelHeight, panelHeight, 3 * panelHeight, height - 2 * panelHeight);
menuBoxGraphics.endFill();
menuBoxGraphics.beginFill(0x000000, config.style.menuAlpha);
menuBoxGraphics.drawRect(width / 2 - 1.5 * panelHeight + 20, panelHeight + 20, 3 * panelHeight - 40, height - 2 * panelHeight - 40);
menuBoxGraphics.endFill();
menuBoxGraphics.moveTo(width / 2 - 1.5 * panelHeight + 20, panelHeight * 2);
menuBoxGraphics.lineTo(width / 2 + 1.5 * panelHeight - 20, panelHeight * 2);
//menuBox.texture = menuBoxGraphics.generateTexture();
menuBox.position.x = width / 2 - 1.5 * panelHeight;
menuBox.position.y = panelHeight;
menuBox.active = true;
panels.addChild(menuBox);
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
    var levelPaneGraphics = new PIXI.Graphics();
    levelPaneGraphics.beginFill(0xffffff,0.05);
    levelPaneGraphics.lineStyle(0,0xffffff,0.1);
    levelPaneGraphics.drawRect(0,-panelHeight,panelHeight*3,height-2*panelHeight);
    levelPaneGraphics.endFill();
    levelPane.addChild(levelPaneGraphics);
levelPane.position.set(0, panelHeight);
/**
 * The height of the level button - calculated to fit exactly the number of levels
 * @type {Number}
 */
var rowHeight = (height-3*panelHeight) / (config.levels.length+1);
var tutButton = new PIXI.Sprite();
tutButton.buttonMode = true;
tutButton.interactive = true;
tutButton.on('pointerdown',function() {
  changePane(1);
});
var tutText = new PIXI.Text("Tutorial",{
  font: Math.round(20 * scale) + "px " + config.style.font,
  fill: 0xffffff
});
tutText.anchor.set(0.5);
tutText.position.set(panelHeight/2,rowHeight/2);
tutText.alpha = 0.5;
tutButton.addChild(tutText);
var tutButtonGraphics = new PIXI.Graphics();
tutButtonGraphics.beginFill(0xffffff,0.05);
tutButtonGraphics.drawRect(0,0,panelHeight,rowHeight);
tutButtonGraphics.endFill();
tutButton.texture = tutButtonGraphics.generateTexture();
tutButton.position.x = 2*panelHeight;
levelPane.addChild(tutButton);
var tipText = new PIXI.Text("Choose a level", {
  font: Math.round(20 * scale) + "px " + config.style.font,
  fill: 0xffffff
});
tipText.anchor.set(0.5);
tipText.position.set(panelHeight,rowHeight/2);
levelPane.addChild(tipText);
tipGraphics = new PIXI.Graphics();
tipGraphics.beginFill(0x000000,0.2);
tipGraphics.drawRect(0,0,2*panelHeight,rowHeight);
tipGraphics.endFill();
levelPane.addChild(tipGraphics);
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
//Level pane
for(var i = 0; i < config.levels.length; i++) {
    levels.push(new PIXI.Sprite());
    /** The PixiJS Graphics for the level button */
    var graphics = new PIXI.Graphics();
    graphics.beginFill(0xff0000*((i+1)/config.levels.length), 0.25);
    graphics.lineStyle(0, 0xffffff, 0.05);
    graphics.drawRect(0, 0, 3 * panelHeight, rowHeight);
    graphics.endFill();
    levels[i].y = (i+1) * rowHeight;
    levels[i].interactive = true;
    levels[i].buttonMode = true;
    levels[i].level = i + 1;
    levelPane.addChild(levels[i]);
    /**
     * The title for the level button
     * @type {Object}
     */
    var text = new PIXI.Text("Level " + (i + 1), {
        font: Math.round(25 * scale) + 'px ' + config.style.font,
        fill: 0xffffff
    });
    text.alpha = 0.75;
    text.position.set(rowHeight/3, (rowHeight - text.height) / 2);
    graphics.addChild(text);
    /**
     * The description of the level
     * @type {Object}
     */
    var text2 = new PIXI.Text(config.levels[i].description, {
        font: Math.round(30 * scale) + 'px ' + config.style.font,
        fill: 0xffffff,
        wordWrap: true,
        wordWrapWidth: 3 * panelHeight - text.width - 60
    });
    text2.anchor.set(1,0.5);
    text2.alpha = 0.5;
    text2.position.set(3 * panelHeight - 40 - panelHeight/3, rowHeight/2);
    graphics.addChild(text2);
    levels[i].texture = graphics.generateTexture();
    levels[i].on('pointerdown', selectLevel).on('pointerup', endSelect).on('pointerupoutside', endSelect);
}
//Menu box title
var title = new PIXI.Sprite.fromImage('img/logo.png');
title.anchor.set(0.5);
title.height = panelHeight/2;
title.width = panelHeight*2;
title.position.x = panelHeight * 1.5;
title.position.y = -panelHeight/2;
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
decoRocket.position.set(panelHeight * 1.5-20, -panelHeight/2);
decoRocket.rotation = Math.PI / 3;
decoRocket.alpha = 0.5;
levelPane.addChild(decoRocket);
levelPane.addChild(title);
levelPane.visible = false;
levelPane.active = false;
panes.push(levelPane);
menuBox.addChild(levelPane);
/**
 * The pane (PixiJS Container) for holding the directions
 * @type {Object}
 */
var directionsPane = new PIXI.Container();
var startButton = new PIXI.Sprite();
startButton.buttonMode = true;
startButton.interactive = true;
startButton.on('pointerdown',function() {
  changePane(0);
});
var startButtonGraphics = new PIXI.Graphics();
startButtonGraphics.beginFill(0xffffff,0.05);
startButtonGraphics.lineStyle(1,0xffffff,0.1);
startButtonGraphics.drawRoundedRect(0,0,panelHeight*3,panelHeight,panelHeight/4);
startButtonGraphics.endFill();
startButton.texture = startButtonGraphics.generateTexture();
startButton.position.set(0,height/2-1.5*panelHeight);
var startText = new PIXI.Text("Tap here to begin",{
  font: Math.round(scale * 30) + "px " + config.style.font,
  fill: 0xffffff
});
startText.alpha = 0.5;
startText.position.set(panelHeight*1.5,panelHeight/2);
startText.anchor.set(0.5);
startButton.addChild(startText);

directionsPane.addChild(startButton);
/**
 * The PixiJS Graphics for the directions pane
 * @type {Object}
 */
var directionsGraphics = new PIXI.Graphics();
directionsGraphics.beginFill(0x000000, 0);
directionsGraphics.lineStyle(0, 0xffffff, 1);
directionsGraphics.drawRect(20, panelHeight, 3 * panelHeight - 40, height - 3 * panelHeight - 20);
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
var slideCircles = [new PIXI.Point(1.5 * panelHeight, -panelHeight / 2+10), new PIXI.Point(2.5 * panelHeight, height - 1.5 * panelHeight), new PIXI.Point(0.5 * panelHeight, height - 1.5 * panelHeight)];
/**
 * The center point of the menu box
 * @type {Object}
 */
var textCenter = new PIXI.Point(1.5 * panelHeight, (height - 2* panelHeight) / 2);
/**
 * The radian angle toward which the arrow should point and be offset from the center point
 * @type {Number[]}
 */
var offsets = [new PIXI.Point(0,panelHeight+10),new PIXI.Point(-panelHeight+(Math.min(1,(width-panelHeight*3)/(panelHeight*1.5+40*scale))*panelHeight),-panelHeight-20),new PIXI.Point(panelHeight-(Math.min(1,(width-panelHeight*3)/(panelHeight*1.5+40*scale))*panelHeight),-panelHeight-20)];
/** @type {Number} */
var currentSlide = 0;
/**
 * The current slide's text
 * @type {Object}
 */
var objectiveText = new PIXI.Text(slideText[currentSlide], {
    font: Math.round(20 * scale) + 'px ' + config.style.font,
    fill: 0xffffff,
    align: 'center',
    wordWrap: true,
    wordWrapWidth: 2.5 * panelHeight - 80
});
objectiveText.position.set(slideCircles[currentSlide].x+offsets[currentSlide].x,slideCircles[currentSlide].y+offsets[currentSlide].y);
objectiveText.anchor.set(0.5);
var objectiveBox = new PIXI.Graphics();
objectiveBox.beginFill(0xffffff,0.01);
objectiveBox.lineStyle(1,0xffffff,0.1);
objectiveBox.drawRoundedRect(-1.5*panelHeight+20,-panelHeight/2,3*panelHeight-40,panelHeight,panelHeight/4);
objectiveBox.endFill();
//var objectiveBox = new PIXI.RoundedRectangle(-1.5*panelHeight+20,-panelHeight/2,3*panelHeight-40,panelHeight,5);
objectiveText.addChild(objectiveBox);
//objectiveText.position.set((3 * panelHeight - objectiveText.width) / 2, (height - 1.5 * panelHeight - objectiveText.height) / 2);
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
circleGraphics.beginFill(0x00ff00, 0.1);
circleGraphics.lineStyle(0);
circleGraphics.drawCircle(0, 0, panelHeight - 10);
objectiveCircle.texture = circleGraphics.generateTexture();
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
        objectiveText.position.set(slideCircles[currentSlide].x + offsets[currentSlide].x, slideCircles[currentSlide].y + offsets[currentSlide].y);
        fadeIn.push(slideArea);
    }));
    timers.push(new Timer(5000, advanceSlide));
}
timers.push(new Timer(1000, advanceSlide));
directionsPane.addChild(slideArea);
slideArea.addChild(objectiveText);
slideArea.addChild(objectiveCircle);
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
    font: Math.round(30 * scale) + 'px ' + config.style.font,
    fill: 0xffffff
});
endText.position.set(textCenter.x - endText.width / 2, textCenter.y - panelHeight / 2 - endText.height / 2);
endPane.addChild(endText);
/**
 * The scene button at the bottom of the menu box
 * @type {Object}
 */
var button = new PIXI.Sprite();
/**
 * The PixiJS Graphics for the scene button
 * @type {Object}
 */
var buttonGraphics = new PIXI.Graphics();
buttonGraphics.beginFill(config.style.baseColor, config.style.menuGraphics);
buttonGraphics.lineStyle(0);
buttonGraphics.drawRect(0, 0, 3 * panelHeight, panelHeight / 2);
buttonGraphics.endFill();
/**
 * The text for the scene button - will be changed based on menu state
 * @type {Object} - PixiJS Text
 */
var buttonText = new PIXI.Text("Menu", {
    font: Math.round(20 * scale) + 'px ' + config.style.font,
    fill: 0xffffff
});
buttonText.anchor.set(0.5);
buttonText.position.set(1.5*panelHeight, panelHeight/4);
button.addChild(buttonText);
button.texture = buttonGraphics.generateTexture();
button.position.set(0, height-2.5*panelHeight);
button.interactive = true;
button.buttonMode = true;
button.on('pointerdown', function() {
  changePane(0);
});
endPane.addChild(button);
/**
 * The replay button - positioned above the scene button within the menu
 * @type {Object}
 */
var replayButton = new PIXI.Sprite();
replayButton.position.set(0, height - 3 * panelHeight);
//Graphics for the replay button
var replayButtonGraphics = new PIXI.Graphics();
replayButtonGraphics.beginFill(config.style.baseColor, 0.5);
replayButtonGraphics.lineStyle(0);
replayButtonGraphics.drawRect(0, 0, 3 * panelHeight, panelHeight / 2);
replayButtonGraphics.endFill();
replayButton.texture = replayButtonGraphics.generateTexture();
replayButton.interactive = true;
replayButton.buttonMode = true;
replayButton.on('pointerdown', function () {
    generateLevel();
    togglePause();
});
//Text for the replay button
var replayButtonText = new PIXI.Text("Play Again", {
    font: Math.round(20 * scale) + 'px ' + config.style.font,
    fill: 0xffffff
});
replayButtonText.anchor.set(0.5);
replayButtonText.position.set(1.5*panelHeight, (panelHeight / 2) / 2);
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
			      togglePause();
        } else {
            //Check for loss
            if(Math.abs(current) > 500 || (current == 0 && !config.levels[level - 1].operators.includes('+'))) {
                endText.setText("You lost!");
                endText.position.x = textCenter.x - endText.width / 2;
                changePane(2);
                levelPane.visible = directionsPane.visible = false;
				        togglePause();
            }
        }
        indicator.alpha = 1;
        updateCurrent();
        if(getDistance(rocket.position.x, rocket.position.y, -Camera.x + width / 2, -Camera.y + height / 2) < radius + rocket.width) {
            //Hit the rocket
            for(var i=0;i<circles.length;i++) {
	             circles[i].active = false;
	          }
        }
    }
}
/**
 * Used for pulsating rocket and indicator circle
 * @type {Boolean}
 */
var pulse = true;
var timerSet = false;
var rocketQueued = false;
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
        if(index != 1) {
          scene.filters = [blurFilter];
          hud.filters = [blurFilter];
          if(blurFilter.blur < 5) {
              blurFilter.blur += 0.5;
          }
        } else {
          if(blurFilter.blur > 0) {
              blurFilter.blur -= 0.5;
          } else {
              scene.filters = [];
              hud.filters = [];
          }
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
            scene.filters = [];
            hud.filters = [];
        }
    }
    //Scale in rocket
    if(rocket.scale.x < 0.5 && rocket.active) {
        rocket.scale.set(rocket.scale.x + 0.01);
    }
    //Scale out rocket
    if(!rocket.active && rocket.scale > 0) {
        rocket.scale.set(rocket.scale.x - 0.01);
    }
    //Fade in rocket
    if(rocket.alpha < 1) {
        rocket.alpha += 0.01;
    }
    //Fade out rocket
    if(!rocket.active) {
       if(rocket.alpha > 0) {
	   rocket.alpha -= 0.01;
       }
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
        } else {
          if(!rocketQueued) {
            rocketQueued = true;
            timers.push(new Timer(Math.random()*10000+5000,function() {
              rocketQueued = false;
              if(!inView(rocket.x, rocket.y - rocket.height / 2, rocket.height, rocket.height)) {
                resetRocket();
              }
            }));
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
            if(getDistance(width / 2, height / 2, circles[i].x + Camera.x, circles[i].y + Camera.y) < radius + circles[i].width / 2 && hud.visible) {
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
        simpleCircles[i].alpha = circles[i].alpha / (getDistance(circles[i].position.x, circles[i].position.y, -Camera.x + width / 2, -Camera.y + height / 2) / width / 2);
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
                scene.removeChild(circles[i]);
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
    xCross.position.x = ((-Camera.x-width/2)/fieldSize) * panelHeight+panelHeight/2;
    yCross.position.y = ((-Camera.y-height/2)/fieldSize) * panelHeight+panelHeight/2;
    //Update stars
    for(var i = 0; i < stars.length; i++) {
        stars[i].offsetX = (Camera.x / (fieldSize + width)) * i / (stars.length - 1) * (width);
        stars[i].offsetY = (Camera.y / (fieldSize + height)) * i / (stars.length - 1) * (width);
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
    renderer.render(main);
    //Keep on running
    window.requestAnimationFrame(loop);
}
loop();
