var config = {
    "style":{
        "topPanelColor":0xffff00,
        "bottomPanelColor":0x44ffff,
        "baseColor": 0xff0000,
        "panelAlpha":0.5,
        "font":"Impact, Verdana",
		"smallFont":"Verdana, Arial, sans-serif"
    },
    "control":{
        //Scale factor for joystick movement
        "sensitivity":0.02,
        "friction":0.95
    },
    "levels":[
        {
            "description":"Addition and Subtraction",
            "operators":["+","-"],
            "population":20,
            "range":10
            
        },
        {
            "description":"Addition and Subtraction",
            "operators":["+","-"],
            "population":35,
            "range":20
            
        },
        {
            "description":"Addition, Subtraction, Multiplication, and Division",
            "operators":["+","-","*","/"],
            "population":30,
            "range":30
            
        },
        {
            "description":"Addition, Subtraction, Multiplication, and Division",
            "operators":["+","-","*","/"],
            "population":35,
            "range":50
            
        },
        {
            "description":"Multiplication and Division",
            "operators":["*","/"],
            "population":40,
            "range":99
            
        }
    ]
};

//Renderer
var width = document.body.scrollWidth;
var height = document.body.scrollHeight;
var app = new PIXI.Application(width,height,{backgroundColor: 0x000000,antialias: true});
document.getElementById('main').appendChild(app.view);

//Main elements (offset by camera)
var main = new PIXI.Container();
main.pivot.set(0.5);
app.stage.addChild(main);

//Secondary elements (below main layer)
var secondary = new PIXI.Container();
secondary.pivot.set(0.5);
main.addChild(secondary);

//Hud (fixed position)
var hud = new PIXI.Container();
app.stage.addChild(hud);

//Panels
var panels = new PIXI.Container();
app.stage.addChild(panels);

//MiniMap
var minimap = new PIXI.Container();
panels.addChild(minimap);

var border = new PIXI.Sprite.fromImage('img/border.png');
border.width = app.view.width;
border.height = app.view.height;
border.alpha = 0.01;
hud.addChild(border);

function getDistance(x1,y1,x2,y2) {
    return Math.sqrt(Math.pow(y2-y1,2)+Math.pow(x2-x1,2));
}

//Key events
var keysTracked = [87,38,65,37,83,40,68,39,32];
var keysDown = [];
function readKey(e,state) {
    var key = e.which;
    if(keysTracked.includes(key)) {
        if(keysDown.includes(key)) {
            if(!state) {
                keysDown.splice(keysDown.indexOf(key),1);
            }
        } else {
            keysDown.push(key);
        }
    }
}
document.body.addEventListener('keydown',function(e) {
    readKey(e,true);
});
document.body.addEventListener('keyup',function(e) {
    readKey(e,false);
});

//Game things
var pause = false;
var blurFilter = new PIXI.filters.BlurFilter(5);

function togglePlay() {
    if(pause) {
        
    } else {
        
    }
}

var fadeOut = [],
	fadeIn = [];

//Environment size
var fieldSize = 5000;

//Background Stars
var stars = [];
var colors = ["red","green","blue"];
for(var i=0;i<fieldSize/10;i++) {
    var star = new PIXI.Sprite();
    var graphics = new PIXI.Graphics();
    graphics.beginFill(Math.floor(Math.random()*0xffffff),0.5);
    graphics.lineStyle(0);
    graphics.drawCircle(0,0,Math.random()*5+5);
    graphics.endFill();
    star.texture = graphics.generateTexture();
    star.anchor.set(0.5);
    star.position.set(Math.random()*(fieldSize+app.view.width)-app.view.width,Math.random()*(fieldSize+app.view.height))-app.view.height;
    star.baseX = star.position.x;
    star.baseY = star.position.y;
    star.offsetX = 0;
    star.offsetY = 0;
    stars.push(star);
    var color = new PIXI.Sprite.fromImage('img/' + colors[Math.floor(Math.random()*3)] + '.png');
    color.tint = 0xff0000;
    color.width = Math.round(Math.random()*400+200);
    color.height = Math.round(Math.random()*400+200);
    color.position.set(star.position.x,star.position.y);
    main.addChild(color);
    main.addChild(star);
}

//Camera data
var camera = {
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
    update: function() {
        
        camera.acceleration.x = camera.acceleration.y = 0;
        
        //Use the keyboard input
        if(keysDown.includes(87) || keysDown.includes(38)) {
            //Up
            camera.acceleration.y ++;
        }
        if(keysDown.includes(83) || keysDown.includes(40)) {
            //Down
            camera.acceleration.y --;
        }
        if(keysDown.includes(65) || keysDown.includes(37)) {
            //Left
            camera.acceleration.x ++;
        }
        if(keysDown.includes(68) || keysDown.includes(39)) {
            //Right
            camera.acceleration.x --;
        }
        
        //Normalize acceleration vector
        var mag = Math.sqrt(Math.pow(camera.acceleration.x,2)+Math.pow(camera.acceleration.y,2));
        if(mag > 0) {
            camera.acceleration.x *= 1/mag;
            camera.acceleration.y *= 1/mag;
        }
        
        if(-camera.x < -app.view.width/2) {
            if(camera.velocity.x > 0) {
                camera.velocity.x = 0;
            }
            if(camera.acceleration.x > 0) {
                camera.acceleration.x = 0;
            }
        } else if(-camera.x+app.view.width-app.view.width/2 > fieldSize) {
            if(camera.velocity.x < 0) {
                camera.velocity.x = 0;
            }
            if(camera.acceleration.x < 0) {
                camera.acceleration.x = 0;
            }
        }
        if(-camera.y < -app.view.height/2) {
            if(camera.velocity.y > 0) {
                camera.velocity.y = 0;
            }
            if(camera.acceleration.y > 0) {
                camera.acceleration.y = 0;
            }
        } else if(-camera.y+app.view.height-app.view.height/2 > fieldSize) {
            if(camera.velocity.y < 0) {
                camera.velocity.y = 0;
            }
            if(camera.acceleration.y < 0) {
                camera.acceleration.y = 0;
            }
        }
        
        //Apply acceleration
        camera.velocity.x += camera.acceleration.x;
        camera.velocity.y += camera.acceleration.y;
        
        //Apply velocity
        camera.x += camera.velocity.x;
        camera.y += camera.velocity.y;
        
        //Apply friction
        if(Math.sqrt(Math.pow(camera.velocity.x,2)+Math.pow(camera.velocity.y,2)) > 2) {
            camera.velocity.x *= camera.friction;
            camera.velocity.y *= camera.friction;
        }
        
        //Offset to camera
        main.position.x = camera.x;
        main.position.y = camera.y;
    }
};

function inView(x,y,width,height) {
    return x+width/2 > -camera.x && x-width/2 < -camera.x+app.view.width && y+height/2 > -camera.y && y-height/2 < -camera.y+app.view.height;
}

//Timers
var timers = [],
    d = new Date();
var Timer = function(duration,action) {
    this.startTime = Date.now(),
        this.endTime = this.startTime+duration,
        this.action = action,
        this.active = true;
}
Timer.prototype.update = function() {
    var time = Date.now();
    if(time > this.endTime) {
        this.action();
        this.active = false;
    }
}

//Particles
var particles = [];
var Particle = function(x,y,velocityX,velocityY,radius,color,lifespan) {
        this.velocityX = velocityX,
        this.velocityY = velocityY,
        this.radius = radius,
        this.lifespan = lifespan,
        this.startTime = Date.now(),
        this.endTime = Date.now()+lifespan,
        this.body = new PIXI.Graphics(),
        this.active = true;
    this.body.beginFill(color,0.5);
    this.body.lineStyle(0);
    this.body.drawCircle(x,y,radius);
    this.body.endFill();
    secondary.addChild(this.body);
}
Particle.prototype.update = function() {
    this.body.position.x += this.velocityX;
    this.body.position.y += this.velocityY;
    var now = Date.now();
    var progress = (this.endTime-now)/this.lifespan;
    if(now < this.endTime) {
        this.body.alpha = progress/2;
    } else {
        this.active = false;
    }
}

//Rocket
var rocket = new PIXI.Sprite.fromImage('img/rocket.png');
rocket.anchor.set(0.5);
rocket.width = 100;
rocket.height = 150;
main.addChild(rocket);

function resetRocket() {
    var angle = Math.random()*2*Math.PI;
    rocket.position.x = camera.x+app.view.width/2+Math.cos(angle)*(Math.max(app.view.width,app.view.height));
    rocket.position.y = camera.x+app.view.height/2+Math.sin(angle)*(Math.max(app.view.width,app.view.height));
    rocket.velocityX = -Math.cos(angle)*10;
    rocket.velocityY = -Math.sin(angle)*10;
    rocket.rotation = angle-Math.PI/2;
    rocket.active = true;
    rocket.visible = false;
    rocket.scale.set(0);
}
resetRocket();

//Start at level 1
var level = 1,
    levelText = new PIXI.Text(level,{font: '35px ' + config.style.font,fill: 0xffffff});

function getRadius(operator) {
    if(!config.levels[level-1].operators.includes('+')) {
        return Math.round((Math.random()-0.5)*config.levels[level-1].range);
    } else {
        return Math.round(Math.random()*config.levels[level-1].range);
    }
    switch(operator) {
        case "+":
        case "-":
            return Math.round(Math.random()*config.levels[level-1].range);
            break;
        case "*":
            return Math.round((Math.random()-0.5)*config.levels[level-1].range/target);
            break;
        case "/":
            var options = [];
            for(var i=1;i<current/2;i++) {
                if(current % i == 0) {
                    options.push(i);
                }
            }
            return options[Math.floor(Math.random()*options.length)];
            break;
    }
}

//Create circles
var circles = [],
	simpleCircles = [],
	panelHeight = Math.min(app.view.width/4,150);

function createCircle() {
    
    var circle = new PIXI.Sprite(),
		simpleCircle = new PIXI.Sprite(),
        operators = config.levels[level-1].operators,
        operator = operators[Math.floor(Math.random()*operators.length)],
        range = Math.random()*config.levels[level-1].range,
        radius = getRadius(operator),
        displayRadius = Math.abs(radius)+30,
        alpha = Math.random()*0.5+0.25;
    
    circle.anchor.set(0.5);
    circle.position.x = Math.random()*fieldSize;
    circle.position.y = Math.random()*fieldSize;
    circle.velocityX = (Math.random()-0.5)*5;
    circle.velocityY = (Math.random()-0.5)*5;
    circle.operator = operator;
    circle.radius = radius;
	circle.color = Math.floor(Math.random()*0xffffff);
    circle.active = true;
    circle.scale.set(0);
    
    var text = new PIXI.Text(radius > 0 ? circle.operator + radius : circle.operator + "(" + radius + ")", {font: '30px ' + config.style.font, fill: 0xffffff});
    
    displayRadius += text.width;
    
    text.position.x = -text.width/2;
    text.position.y = -text.height/2;
    
    var graphics = new PIXI.Graphics();
    graphics.beginFill(circle.color,alpha);
    graphics.lineStyle(5,color,1);
    graphics.drawCircle(circle.position.x,circle.position.y,displayRadius);
    graphics.endFill();
    
    circle.texture = graphics.generateTexture();
	simpleCircle.texture = graphics.generateTexture();
    
    circle.addChild(text);
    
    main.addChild(circle);

	simpleCircle.position.x = circle.position.x*(panelHeight/fieldSize);
	simpleCircle.position.y = circle.position.y*(panelHeight/fieldSize);
	simpleCircle.anchor.set(0.5);
	simpleCircle.scale.set(panelHeight/fieldSize*2);
	minimap.addChild(simpleCircle);
    
    circles.push(circle);
	simpleCircles.push(simpleCircle);
    
}

//Math operators
function performOperation(operator, num1, num2) {
    switch(operator) {
        case "+":
            //Add
            return num1+num2;
            break;
        case "-":
            //Subtract
            return num1-num2;
            break;
        case "*":
            //Multiply
            return num1*num2;
            break;
        case "/":
            //Divide
            return num1/num2;
            break;
        default:
            console.log("IMPOSSIBLE!")
            return false;
    }
}

//Current radius and target radius
var current = 0,
    target = 0,
    targetText = new PIXI.Text(target,{font: '35px ' + config.style.font, fill: 0xffffff}),
	currentText = new PIXI.Text(current,{font: '30px ' + config.style.font, fill: 0xffffff});
function updateCurrent() {
    currentText.setText(current);
    currentText.position.set((app.view.width-currentText.width)/2,(app.view.height-currentText.height)/2);
}

//Start the level
function generateLevel() {
    //Level button text
    levelText.setText(level);
    levelText.position.set(-levelText.width/2,-levelText.height/2);
    //Set beginning radius (different from current number)
    current = getRadius();
	updateCurrent();
    do {
        target = getRadius();
    } while(target == current);
	//Set target label
    targetText.setText(target);
    targetText.position.x = (app.view.width-targetText.width)/2;
    //Generate random circles
    for(var i=0;i<circles.length;i++) {
        circles[i].active = false;
    }
	//Config level index
    var index = level-1;
    if(index >= 0 && index < config.levels.length) {
        var description = config.levels[index].description;
        var population = config.levels[index].population;
        console.log("Level " + level + " - " + description);
        //Generate circles
        for(var i=0;i<population;i++) {
            createCircle();
        }
    } else {
        //Level out of range
        console.log("Level out of range! Attempting to fix..");
        if(level < 0) {
            level = 0;
        } else {
            level = config.levels.length-1;
        }
        generateLevel();
    }
}
generateLevel();
//Draw hud
var radius = Math.min(app.view.width,app.view.height)/8;
//Indicator circle
var indicator = new PIXI.Graphics();
indicator.beginFill(0xffffff,0.1);
indicator.lineStyle(5,config.style.baseColor,0.25);
indicator.drawCircle(app.view.width/2,app.view.height/2,radius);
indicator.endFill();
indicator.alpha = 0.5;
hud.addChild(indicator);
var crosshair = new PIXI.Graphics();
//Inner lines
crosshair.lineStyle(2,0xffffff,0.5);
crosshair.moveTo(app.view.width/2-40,app.view.height/2);
crosshair.lineTo(app.view.width/2-radius-20,app.view.height/2);
crosshair.moveTo(app.view.width/2+40,app.view.height/2);
crosshair.lineTo(app.view.width/2+radius+20,app.view.height/2);
crosshair.moveTo(app.view.width/2,app.view.height/2-40);
crosshair.lineTo(app.view.width/2,app.view.height/2-radius-20);
crosshair.moveTo(app.view.width/2,app.view.height/2+40);
crosshair.lineTo(app.view.width/2,app.view.height/2+radius+20);
//Outer lines
crosshair.lineStyle(2,0xff8888,0.25);
crosshair.moveTo(app.view.width/2-radius-30,app.view.height/2);
crosshair.lineTo(app.view.width/2-radius*2,app.view.height/2);
crosshair.moveTo(app.view.width/2+radius+30,app.view.height/2);
crosshair.lineTo(app.view.width/2+radius*2,app.view.height/2);
crosshair.moveTo(app.view.width/2,app.view.height/2-radius-30);
crosshair.lineTo(app.view.width/2,app.view.height/2-radius*2);
crosshair.moveTo(app.view.width/2,app.view.height/2+radius+30);
crosshair.lineTo(app.view.width/2,app.view.height/2+radius*2);

crosshair.alpha = 0.5;

hud.addChild(crosshair);

//Position minimap
minimap.width = panelHeight;
minimap.height = panelHeight;
minimap.position.set(app.view.width/2-panelHeight/2,app.view.height-panelHeight+5);

var xCross = new PIXI.Graphics()
xCross.lineStyle(2,config.style.baseColor,0.5);
xCross.moveTo((camera.x+app.view.width/2)*(panelHeight/fieldSize),0);
xCross.lineTo((camera.x+app.view.width/2)*(panelHeight/fieldSize),fieldSize*(panelHeight/fieldSize));

minimap.addChild(xCross);

var yCross = new PIXI.Graphics();
yCross.lineStyle(1,config.style.baseColor,0.5);
yCross.moveTo(0,(camera.y+app.view.height/2)*(panelHeight/fieldSize));
yCross.lineTo((fieldSize)*(panelHeight/fieldSize),(camera.y+app.view.height/2)*(panelHeight/fieldSize));

minimap.addChild(yCross);

//Top panel
var topPanelGraphics = new PIXI.Graphics();
//Left angle
topPanelGraphics.beginFill(config.style.baseColor,config.style.panelAlpha);
topPanelGraphics.lineStyle(2,0xffffff,1);
topPanelGraphics.moveTo(0,0);
topPanelGraphics.lineTo(app.view.width/2-1.5*panelHeight,panelHeight);
topPanelGraphics.lineTo(app.view.width/2-1.5*panelHeight,0);
topPanelGraphics.endFill();
//Right angle
topPanelGraphics.beginFill(config.style.baseColor,config.style.panelAlpha);
topPanelGraphics.lineStyle(2,0xffffff,1);
topPanelGraphics.moveTo(app.view.width,0);
topPanelGraphics.lineTo(app.view.width/2+1.5*panelHeight,panelHeight);
topPanelGraphics.lineTo(app.view.width/2+1.5*panelHeight,0);
topPanelGraphics.endFill();
//Dial area
topPanelGraphics.beginFill(config.style.topPanelColor,config.style.panelAlpha);
topPanelGraphics.lineStyle(2,0xffffff,1);
topPanelGraphics.moveTo(app.view.width/2-1.5*panelHeight,0);
topPanelGraphics.lineTo(app.view.width/2-1.5*panelHeight,panelHeight);
topPanelGraphics.lineTo(app.view.width/2-panelHeight/2,panelHeight);
topPanelGraphics.lineTo(app.view.width/2-panelHeight/2,0);
topPanelGraphics.endFill();
//Level area
topPanelGraphics.lineTo(app.view.width/2+panelHeight/2,0);
topPanelGraphics.lineTo(app.view.width/2+panelHeight/2,panelHeight);
topPanelGraphics.lineTo(app.view.width/2+1.5*panelHeight,panelHeight);
topPanelGraphics.lineTo(app.view.width/2+1.5*panelHeight,0);
topPanelGraphics.endFill();
//Dial
topPanelGraphics.beginFill(0x000000,0.5);
topPanelGraphics.lineStyle(2,0x000000,0.5);
topPanelGraphics.drawCircle((app.view.width-2*panelHeight)/2,panelHeight/2,panelHeight/4);
topPanelGraphics.endFill();
//Target box
topPanelGraphics.beginFill(0x000000,config.style.panelAlpha);
topPanelGraphics.lineStyle(2,0xffffff,1);
topPanelGraphics.drawRect(app.view.width/2-panelHeight/2,0,panelHeight,panelHeight);
topPanelGraphics.endFill();

var topPanel = new PIXI.Sprite();
topPanel.texture = topPanelGraphics.generateTexture();

panels.addChild(topPanel);

//Target label
var targetLabel = new PIXI.Text("Get to",{font: '20px ' + config.style.font, fill: 0x888888});
targetLabel.position.x = (app.view.width-targetLabel.width)/2;
targetLabel.position.y = 10;
panels.addChild(targetLabel);
//Target text
targetText.position.y = targetLabel.height+(panelHeight-targetLabel.height-targetText.height)/2;

panels.addChild(targetText);

//Bottom panel
var bottomPanelGraphics = new PIXI.Graphics();
//Left angle
bottomPanelGraphics.beginFill(config.style.baseColor,config.style.panelAlpha);
bottomPanelGraphics.lineStyle(2,0xffffff,1);
bottomPanelGraphics.moveTo(0,app.view.height);
bottomPanelGraphics.lineTo(app.view.width/2-1.5*panelHeight,app.view.height-panelHeight);
bottomPanelGraphics.lineTo(app.view.width/2-1.5*panelHeight,app.view.height);
bottomPanelGraphics.endFill();
//Right angle
bottomPanelGraphics.beginFill(config.style.baseColor,config.style.panelAlpha);
bottomPanelGraphics.lineStyle(2,0xffffff,1);
bottomPanelGraphics.moveTo(app.view.width,app.view.height);
bottomPanelGraphics.lineTo(app.view.width/2+1.5*panelHeight,app.view.height-panelHeight);
bottomPanelGraphics.lineTo(app.view.width/2+1.5*panelHeight,app.view.height);
bottomPanelGraphics.endFill();
//Shoot button area
bottomPanelGraphics.beginFill(config.style.bottomPanelColor,config.style.panelAlpha);
bottomPanelGraphics.lineStyle(2,0xffffff,1);
bottomPanelGraphics.moveTo(app.view.width/2-1.5*panelHeight,app.view.height);
bottomPanelGraphics.lineTo(app.view.width/2-1.5*panelHeight,app.view.height-panelHeight);
bottomPanelGraphics.lineTo(app.view.width/2-panelHeight/2,app.view.height-panelHeight);
bottomPanelGraphics.lineTo(app.view.width/2-panelHeight/2,app.view.height);
//Joystick area
bottomPanelGraphics.lineTo(app.view.width/2+panelHeight/2,app.view.height);
bottomPanelGraphics.lineTo(app.view.width/2+panelHeight/2,app.view.height-panelHeight);
bottomPanelGraphics.lineTo(app.view.width/2+1.5*panelHeight,app.view.height-panelHeight);
bottomPanelGraphics.lineTo(app.view.width/2+1.5*panelHeight,app.view.height);
bottomPanelGraphics.endFill();
//Left bottom
bottomPanelGraphics.beginFill(0x000000,0.5);
bottomPanelGraphics.lineStyle(2,0x000000,0.5);
bottomPanelGraphics.drawCircle((app.view.width-2*panelHeight-1)/2,app.view.height-(panelHeight+1)/2,panelHeight/4);
bottomPanelGraphics.endFill();
//Right bottom
bottomPanelGraphics.beginFill(0x000000,0.5);
bottomPanelGraphics.lineStyle(2,0x000000,0.5);
bottomPanelGraphics.drawCircle((app.view.width+2*panelHeight)/2,app.view.height-panelHeight/2,panelHeight/4);
bottomPanelGraphics.endFill();
//Minimap
bottomPanelGraphics.beginFill(0x000000,0.1);
bottomPanelGraphics.lineStyle(2,0xffffff,1);
bottomPanelGraphics.drawRect(app.view.width/2-panelHeight/2,app.view.height-panelHeight,panelHeight,panelHeight);
bottomPanelGraphics.endFill();

var bottomPanel = new PIXI.Sprite();
bottomPanel.position.y = app.view.height-panelHeight;
bottomPanel.texture = bottomPanelGraphics.generateTexture();

panels.addChild(bottomPanel);

//Current radius text (declared above generateLevel)
hud.addChild(currentText);

//Level button
var levelButton = new PIXI.Sprite();
levelButton.position.set((app.view.width+2*panelHeight)/2,panelHeight/2);
levelButton.anchor.set(0.5);
//Text for button
levelButton.addChild(levelText);
//Graphics for button
var levelGraphics = new PIXI.Graphics();
levelGraphics.beginFill(0x000000,0.5);
levelGraphics.lineStyle(2,0x000000,0.5);
levelGraphics.drawCircle(0,0,panelHeight/4);
levelGraphics.endFill();

levelButton.texture = levelGraphics.generateTexture();

levelButton.interactive = true;
levelButton.on('pointerdown',function() {
	fadeIn.push(menuBox);
    menuBox.active = true;
	toggleButton();
});

panels.addChild(levelButton);


//Shoot button graphic
var buttonGraphics = new PIXI.Graphics();
buttonGraphics.beginFill(0xff0000);
buttonGraphics.lineStyle(2,0x000000,0.5);
buttonGraphics.drawCircle(0,0,panelHeight/4);
buttonGraphics.endFill();

//Shoot button
var shootButton = new PIXI.Sprite();
shootButton.anchor.set(0.5);
shootButton.texture = buttonGraphics.generateTexture();
shootButton.position.set((app.view.width-2*panelHeight)/2,app.view.height-(panelHeight)/2);
shootButton.interactive = true;
shootButton.buttonMode = true;

//Button click event
shootButton.on('pointerdown',function() {
    shootButton.scale.set(0.95);
    shoot();
}).on('pointerup',function() {
    shootButton.scale.set(1);
}).on('pointerupoutside',function() {
    shootButton.scale.set(1);
});

//Text for button
var buttonText = new PIXI.Text("Shoot!",{font: '15px ' + config.style.font, fill: 0x000000});
buttonText.position.set(-buttonText.width/2,-buttonText.height/2);

shootButton.addChild(buttonText);
panels.addChild(shootButton);

//Joystick graphic
var joystickGraphic = new PIXI.Graphics();
joystickGraphic.beginFill(0x00ff00);
joystickGraphic.lineStyle(2,0x000000,0.5);
joystickGraphic.drawCircle(0,0,panelHeight/5);
joystickGraphic.endFill();

//Joystick
var joystick = new PIXI.Sprite();
joystick.anchor.set(0.5);
joystick.texture = joystickGraphic.generateTexture();
var basePosition = [(app.view.width+2*panelHeight+1)/2,app.view.height-panelHeight/2+1];
joystick.position.set(basePosition[0],basePosition[1]);
joystick.interactive = true;
joystick.buttonMode = true;

//Joystick movement
var pointer = [0,0],
    base = [0,0],
    down = false;
joystick.on('pointerdown',function(e) {
    down = true;
}).on('pointermove',function(e) {
    if(down) {
        var position = e.data.getLocalPosition(this.parent);
        pointer[0] = position.x;
        pointer[1] = position.y;
        if(getDistance(basePosition[0],basePosition[1],pointer[0],pointer[1]) < panelHeight/6) {
            joystick.position.set(pointer[0],pointer[1]);
        } else {
            var angle = Math.atan2(pointer[1]-basePosition[1],pointer[0]-basePosition[0]);
            joystick.position.set(basePosition[0] + Math.cos(angle) * panelHeight/6,basePosition[1] + Math.sin(angle) * panelHeight/6);
        }
    }
}).on('pointerup', endMove).on('pointerupoutside',endMove);
function endMove() {
    down = false;
    joystick.position.x = basePosition[0];
    joystick.position.y = basePosition[1];
    offset = [0,0];
}

panels.addChild(joystick);

//Menu box
var menuBox = new PIXI.Sprite();
var menuBoxGraphics = new PIXI.Graphics();
menuBoxGraphics.beginFill(config.style.baseColor,0.25);
menuBoxGraphics.lineStyle(1,0xffffff);
menuBoxGraphics.drawRect(app.view.width/2-1.5*panelHeight,panelHeight,3*panelHeight,app.view.height-2*panelHeight);
menuBoxGraphics.endFill();
menuBoxGraphics.beginFill(0x000000,0.95);
menuBoxGraphics.drawRect(app.view.width/2-1.5*panelHeight+20,panelHeight+20,3*panelHeight-40,app.view.height-2*panelHeight-40);
menuBoxGraphics.endFill();
menuBoxGraphics.moveTo(app.view.width/2-1.5*panelHeight+20,panelHeight*2);
menuBoxGraphics.lineTo(app.view.width/2+1.5*panelHeight-20,panelHeight*2);

//Menu box title
var title = new PIXI.Text("Galactic Math",{font: '35px ' + config.style.font, fill: [0x880000,0x884444], stroke: 0xffffff, strokeThickness: 2});
title.position.x = panelHeight*1.5-title.width/2;
title.position.y = panelHeight*0.5-10;
title.alpha = 0.75;

//Title rocket
var decoRocket = new PIXI.Sprite.fromImage('img/rocket.png');
decoRocket.width = 66;
decoRocket.height = 99;
decoRocket.tint = 0x888888;
decoRocket.anchor.set(0.5);
decoRocket.position.set(panelHeight*1.5,0.5*panelHeight+5);
decoRocket.rotation = Math.PI/3;
decoRocket.alpha = 0.5;

menuBox.addChild(decoRocket);

menuBox.addChild(title);

menuBox.texture = menuBoxGraphics.generateTexture();

menuBox.position.x = app.view.width/2-1.5*panelHeight;
menuBox.position.y = panelHeight;

var button = new PIXI.Sprite();
var buttonGraphics = new PIXI.Graphics();
buttonGraphics.beginFill(0x00ff00,0.25);
buttonGraphics.lineStyle(1,0xffffff,1);
buttonGraphics.drawRect(0,0,3*panelHeight-40,panelHeight/2);
buttonGraphics.endFill();

var buttonText = new PIXI.Text("Next",{font: '20px ' + config.style.font,fill: 0xffffff});
buttonText.position.set((3*panelHeight-buttonText.width-40)/2,0.25*panelHeight-buttonText.height/2);
button.addChild(buttonText);

button.texture = buttonGraphics.generateTexture();
button.position.set(20,app.view.height-2.5*panelHeight-20);
button.interactive = true;
button.buttonMode = true;

button.on('pointerdown',toggleButton);
var toggle = false;
function toggleButton() {
	if(toggle) {
		changePane(1);
		buttonText.setText("Levels");
		buttonText.position.x = (3*panelHeight-buttonText.width-40)/2;
	} else {
		changePane(0);
		buttonText.setText("Directions");
		buttonText.position.x = (3*panelHeight-buttonText.width-40)/2;
	}
	toggle = !toggle;
}

menuBox.addChild(button);

hud.addChild(menuBox);

menuBox.alpha = 1;
menuBox.visible = true;
menuBox.active = true;

//Levels
var levels = [];
var levelPane = new PIXI.Container();
levelPane.position.set(20,panelHeight);

function selectLevel() {
    level = this.level;
    generateLevel();
	toggleButton();
    menuBox.active = false;
	fadeOut.push(menuBox);
    this.alpha = 0.5;
}

function endSelect() {
    this.alpha = 1;
}

//Changing panes
var panes = [],
	index = 1;
function changePane(newIndex) {
	if(fadeOut.indexOf(panes[index] < 0 && fadeIn.indexOf(panes[index])) < 0 && fadeOut.indexOf(panels[newIndex]) < 0 && fadeIn.indexOf(panels[newIndex]) < 0) {
		fadeOut.push(panes[index]);
		panes[index].active = false;
		index = newIndex;
		fadeIn.push(panes[index]);
		panes[index].active = true;
	}
}

var rowHeight = (app.view.height-3.5*panelHeight-20)/config.levels.length;

//Level pane
for(var i=0;i<config.levels.length;i++) {
    levels.push(new PIXI.Sprite());
    var graphics = new PIXI.Graphics();
    graphics.beginFill(Math.floor(Math.random()*0x111111), 0.25);
    graphics.lineStyle(1,0xffffff);
    graphics.drawRect(0,0,3*panelHeight-40,rowHeight);
    graphics.endFill();
    levels[i].y = i*rowHeight;
    levels[i].interactive = true;
    levels[i].buttonMode = true;
    levels[i].level = i+1;
    levelPane.addChild(levels[i]);
    var text = new PIXI.Text("Level " + (i+1),{font: '20px ' + config.style.font, fill: 0xffffff});
    text.position.set(20,(rowHeight-text.height)/2);
    graphics.addChild(text);
    var text2 = new PIXI.Text(config.levels[i].description,{font: '15px ' + config.style.smallFont, fill: 0xffffff, wordWrap: true, wordWrapWidth: 1.5*panelHeight});
    text2.alpha = 0.5;
    text2.position.set(3*panelHeight-40-text2.width-20,(rowHeight-text2.height)/2);
    graphics.addChild(text2);
    levels[i].texture = graphics.generateTexture();
    levels[i]
        .on('pointerdown',selectLevel)
    .on('pointerup',endSelect)
    .on('pointerupoutside',endSelect);
}

levelPane.visible = false;
levelPane.active = false;
panes.push(levelPane);
menuBox.addChild(levelPane);

var directionsPane = new PIXI.Container();
var directionsGraphics = new PIXI.Graphics();
directionsGraphics.beginFill(0x000000,0.1);
directionsGraphics.lineStyle(0,0xffffff,1);
directionsGraphics.drawRect(20,panelHeight,3*panelHeight-40,app.view.height-3*panelHeight-20);
directionsGraphics.endFill();

//Slide data
var slideArea = new PIXI.Container();
var slideText = ["Get to this number.","Use the green joystick to move.","Use the red button to shoot."];
var slideCircles = [new PIXI.Point(1.5*panelHeight,-panelHeight/2+10),new PIXI.Point(2.5*panelHeight,app.view.height-1.5*panelHeight),new PIXI.Point(0.5*panelHeight,app.view.height-1.5*panelHeight)];
var textCenter = new PIXI.Point(1.5*panelHeight,(app.view.height-1.5*panelHeight)/2);
var arrowDirections = [];
for(var i=0;i<slideCircles.length;i++) {
	arrowDirections.push(Math.atan2(slideCircles[i].y-textCenter.y,slideCircles[i].x-textCenter.x));
}
var currentSlide = 0;

//Slide text
var objectiveText = new PIXI.Text(slideText[currentSlide],{font: '20px ' + config.style.smallFont,fill: 0xffffff});
objectiveText.position.set((3*panelHeight-objectiveText.width)/2,(app.view.height-1.5*panelHeight-objectiveText.height)/2);

//Circle to highlight subject
var objectiveCircle = new PIXI.Sprite();
objectiveCircle.anchor.set(0.5);
objectiveCircle.position.set(slideCircles[currentSlide].x,slideCircles[currentSlide].y);
var circleGraphics = new PIXI.Graphics();
circleGraphics.beginFill(0x00ff00,0.5);
circleGraphics.lineStyle(5,0x00ff00,0.75);
circleGraphics.drawCircle(0,0,panelHeight/2-10);
objectiveCircle.texture = circleGraphics.generateTexture();

//Arrow to circle
var arrow = new PIXI.Sprite();
arrow.anchor.set(0.5);
arrow.position.set(textCenter.x,textCenter.y-10);
var arrowGraphics = new PIXI.Graphics();
var arrowSize = textCenter.y/4;
arrowGraphics.beginFill(0x00ff00,0.25);
arrowGraphics.lineStyle(5,0x00ff00,0.5);
arrowGraphics.moveTo(0.25*arrowSize,0);
arrowGraphics.lineTo(arrowSize*0.75,0);
arrowGraphics.lineTo(arrowSize*0.75,-arrowSize/2);
arrowGraphics.lineTo(arrowSize,-arrowSize/2);
arrowGraphics.lineTo(arrowSize/2,-arrowSize);
arrowGraphics.lineTo(0,-arrowSize/2);
arrowGraphics.lineTo(arrowSize*0.25,-arrowSize/2);
arrowGraphics.lineTo(0.25*arrowSize,0);
arrowGraphics.endFill();

arrow.texture = arrowGraphics.generateTexture();

arrow.rotation = arrowDirections[currentSlide]+Math.PI/2;	arrow.position.set(textCenter.x+Math.cos(arrowDirections[currentSlide])*arrowSize,textCenter.y+Math.sin(arrowDirections[currentSlide])*arrowSize);

function advanceSlide() {
	currentSlide++;
	if(currentSlide > slideText.length-1) {
		currentSlide = 0;

	}
	fadeOut.push(slideArea);
	timers.push(new Timer(250, function() {
		objectiveText.setText(slideText[currentSlide]);
		objectiveText.position.x = (3*panelHeight-objectiveText.width)/2;
		objectiveCircle.position.set(slideCircles[currentSlide].x,slideCircles[currentSlide].y);
		arrow.rotation = arrowDirections[currentSlide]+Math.PI/2;	arrow.position.set(textCenter.x+Math.cos(arrowDirections[currentSlide])*arrowSize,textCenter.y+Math.sin(arrowDirections[currentSlide])*arrowSize);
		fadeIn.push(slideArea);
	}));
	timers.push(new Timer(5000,advanceSlide));
}

timers.push(new Timer(5000,advanceSlide));

directionsPane.addChild(slideArea);

slideArea.addChild(objectiveText);
slideArea.addChild(objectiveCircle);
slideArea.addChild(arrow);

directionsPane.addChild(directionsGraphics);
directionsPane.active = true;
menuBox.addChild(directionsPane);
panes.push(directionsPane);

//Win pane
var winPane = new PIXI.Container();

var winText = new PIXI.Text("You won!", {font: '30px ' + config.style.font,fill: 0xffffff});
winText.position.set(textCenter.x-winText.width/2,textCenter.y-winText.height/2);

winPane.addChild(winText);

winPane.active = false;
winPane.visible = false;
winPane.alpha = 0;
menuBox.addChild(winPane);
panes.push(winPane);

//List of circles currently colliding with the crosshair
var collidingCircles = [];

//Shoot
function shoot() {
    //All colliding circles
    for(var i=0;i<collidingCircles.length;i++) {
        if(collidingCircles[i].active) {
            current = performOperation(collidingCircles[i].operator,current,collidingCircles[i].radius);
            collidingCircles[i].active = false;
			for(var j=0;j<10;j++) {
				particles.push(new Particle(collidingCircles[i].x,collidingCircles[i].y,(Math.random()-0.5)*10,(Math.random()-0.5)*10,Math.random()*collidingCircles[i].width/2,collidingCircles[i].color,500));
			}
        }
    }
	//Check for a win
	if(current == target) {
		changePane(2);
		timers.push(new Timer(10,function() {
			fadeIn.push(menuBox);
			menuBox.active = true;
		}));
	}
	//Check for loss
	if(current > 200) {
		console.log("You lose, winner");
	} else if(current == 0 && !config.levels[level-1].operators.includes('+')) {
		console.log("You lose, loser");
	}
    indicator.alpha = 1;
    updateCurrent();
    if(getDistance(rocket.position.x,rocket.position.y,camera.x+app.view.width/2,camera.y+app.view.height/2) < radius) {
        //Hit the rocket
		changePane(1);
		fadeIn.push(menuBox);
    }
}

var pulse = true;

//Update everything
function update() {

	for(var i=0;i<fadeOut.length;i++) {
		if(fadeOut[i].alpha  > 0 && fadeIn.indexOf(fadeOut[i]) < 0) {
			fadeOut[i].alpha -= 0.1;
		} else {
			fadeOut[i].visible = false;
			fadeOut[i].alpha = 0;
			fadeOut.splice(i,1);
		}
	}
	for(var i=0;i<fadeIn.length;i++) {
		fadeIn[i].visible = true;
		if(fadeIn[i].alpha  <= 1 && fadeOut.indexOf(fadeIn[i]) < 0) {
			fadeIn[i].alpha += 0.1;
		} else {
			fadeIn[i].alpha = 1;
			fadeIn.splice(i,1);
		}
	}

    //Blur
    if(menuBox.active) {
        main.filters = [blurFilter];
        if(blurFilter.blur < 10) {
            blurFilter.blur += 0.5;
        }
        //Rocket and circle pulse
        if(pulse) {
            decoRocket.scale.set(decoRocket.scale.x*1.01);
			objectiveCircle.scale.set(objectiveCircle.scale.x*1.01);
        } else {
            decoRocket.scale.set(decoRocket.scale.x*0.99);
			objectiveCircle.scale.set(objectiveCircle.scale.x*0.99);
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
    if(rocket.scale.x < 0.5) {
        rocket.scale.set(rocket.scale.x+0.01);
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
    for(var i=0;i<timers.length;i++) {
        timers[i].update();
        if(!timers[i].active) {
            timers.splice(i,1);
        }
    }

    //Update particles
    for(var i=0;i<particles.length;i++) {
        particles[i].update();
        if(!particles[i].active) {
            secondary.removeChild(particles[i].body);
            particles.splice(i,1);
        }
    }
    
    //Update rocket
    if(rocket.active) {
        particles.push(new Particle(rocket.x,rocket.y,Math.random()-0.5,Math.random()-0.5,Math.random()*10+10,Math.floor(Math.random()*0xffffff),500));
        rocket.position.x += rocket.velocityX;
        rocket.position.y += rocket.velocityY;
        //Culling and respawning
        if(inView(rocket.x,rocket.y-rocket.height/2,rocket.height,rocket.height)) {
            rocket.visible = true;
        } else {
            if(rocket.active && (rocket.x+rocket.height/2<0||rocket.x-rocket.height/2>fieldSize||rocket.y+rocket.height/2<0||rocket.y-rocket.height/2>fieldSize)) {
				rocket.active = false;
                if(rocket.scale.x < 0.1) {
                    timers.push(new Timer(Math.random()*Math.random()*10000,function() {
                        resetRocket();
                    }));
                } else {
                    rocket.scale.set(rocket.scale.x-0.05);
                }
            }
        }
    } else {
		if(rocket.alpha > 0) {
			rocket.alpha -= 0.1;
		}
	}

    //Move
    camera.velocity.x += (basePosition[0]-joystick.position.x)*config.control.sensitivity;
    camera.velocity.y += (basePosition[1]-joystick.position.y)*config.control.sensitivity;
    
    //Update camera (use key input, move, offset)
    camera.update();
    
    //Update circles
    for(var i=0;i<circles.length;i++) {
        //Fade in
        if(circles[i].scale.x < 1) {
            circles[i].scale.set(circles[i].scale.x+=0.01);
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
        if(inView(circles[i].x,circles[i].y,circles[i].width,circles[i].height)) {
            if(!circles[i].visible) {
                circles[i].visible = true;
            }
            //Collision detection
            if(getDistance(app.view.width/2,app.view.height/2,circles[i].x+camera.x,circles[i].y+camera.y) < radius + circles[i].width/2) {
                if(!collidingCircles.includes(circles[i])) {
                    collidingCircles.push(circles[i]);
                    circles[i].tint = 0x888888;
                }
            } else if(collidingCircles.includes(circles[i])) {
                collidingCircles.splice(collidingCircles.indexOf(circles[i]),1);
                circles[i].tint = 0xffffff;
            }
        } else {
            circles[i].visible = false;
        }

		//Update on minimap
		simpleCircles[i].position.set(circles[i].position.x*(panelHeight/fieldSize),circles[i].position.y*(panelHeight/fieldSize));
		simpleCircles[i].alpha = circles[i].alpha/(getDistance(circles[i].position.x,circles[i].position.y,-camera.x+app.view.width/2,-camera.y+app.view.height/2)/app.view.width);

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
                circles.splice(i,1);
				simpleCircles.splice(i,1);
                //Replace
				if(circles.length < config.levels[level-1].population) {
                	createCircle();
				}
            } else {
                //Decrease opacity
                circles[i].alpha *= 0.9;
                circles[i].scale.set(1.01*circles[i].scale.x);
            }
        }
    }

	//Update minimap crosshair
	xCross.position.x = (-camera.x)*(panelHeight/fieldSize);
	yCross.position.y = (-camera.y)*(panelHeight/fieldSize);

    //Update stars
    for(var i=0;i<stars.length;i++) {
        stars[i].offsetX = (camera.x/(fieldSize+app.view.width)) * i/(stars.length-1) * (app.view.width/2);
        stars[i].offsetY = (camera.y/(fieldSize+app.view.height)) * i/(stars.length-1) * (app.view.width/2);
        stars[i].position.set(stars[i].baseX+stars[i].offsetX,stars[i].baseY+stars[i].offsetY);
        if(inView(stars[i].position.x,stars[i].position.y,stars[i].width,stars[i].height)) {
            if(!stars[i].visible) {
                stars[i].visible = true;
            }
        } else {
            stars[i].visible = false;
        }
    }
}

//Game loop
function loop() {
    
    //Update everything
    if(!pause) {
        update();
    }
    
    //Keep on running
    window.requestAnimationFrame(loop);
    
}



loop();
