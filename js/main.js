var config = {
    "style":{
        "topPanelColor":0xffff00,
        "bottomPanelColor":0x44ffff,
        "baseColor": 0xff0000,
        "panelAlpha":0.5,
        "font":"Verdana"
    },
    "control":{
        //Scale factor for joystick movement
        "sensitivity":0.03,
        "friction":0.95
    },
    "levels":[
        {
            "description":"Addition and Subtraction",
            "operators":["+","-"],
            "population":20,
            "range":55
            
        },
        {
            "description":"Addition and Subtraction",
            "operators":["+","-"],
            "population":15,
            "range":65
            
        },
        {
            "description":"Addition, Subtraction, Multiplication, and Division",
            "operators":["+","-","*","/"],
            "population":25,
            "range":75
            
        },
        {
            "description":"Addition, Subtraction, Multiplication, and Division",
            "operators":["+","-","*","/"],
            "population":25,
            "range":85
            
        },
        {
            "description":"Multiplication and Division",
            "operators":["*","/"],
            "population":15,
            "range":95
            
        }
    ]
};

//Renderer
var width = document.body.scrollWidth;
var height = document.body.scrollHeight;
var app = new PIXI.Application(width,height,{backgroundColor: 0x000000, antialias: true});
document.getElementById('main').appendChild(app.view);

//Main elements (offset by camera)
var main = new PIXI.Container();
main.pivot.set(0.5);
app.stage.addChild(main);

//Hud (fixed position)
var hud = new PIXI.Container();
app.stage.addChild(hud);

var border = new PIXI.Sprite.fromImage('img/border.png');
border.width = app.view.width;
border.height = app.view.height;
border.alpha = 0.01;
hud.addChild(border);

function getDistance(x1,y1,x2,y2) {
    return Math.sqrt(Math.pow(y2-y1,2)+Math.pow(x2-x1,2));
}

//Panels
var panels = new PIXI.Container();
app.stage.addChild(panels);

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
    return x+width > -camera.x && x < -camera.x+app.view.width && y+height > -camera.y && y < -camera.y+app.view.height;
}

//Start at level 1 or localStorage level
var level = 4;

function getRadius() {
    return Math.round((Math.random()-0.5)*config.levels[level-1].range);
}

//Create circles
var circles = [];
function createCircle() {
    
    var circle = new PIXI.Sprite(),
        operators = config.levels[level-1].operators,
        range = Math.random()*config.levels[level-1].range,
        radius = getRadius(),
        displayRadius = Math.abs(radius)+30,
        color = Math.floor(Math.random()*0xffffff),
        alpha = Math.random()*0.5+0.25;
    
    circle.position.x = Math.random()*fieldSize;
    circle.position.y = Math.random()*fieldSize;
    circle.velocityX = (Math.random()-0.5)*5;
    circle.velocityY = (Math.random()-0.5)*5;
    circle.operator = operators[Math.floor(Math.random()*operators.length)];
    circle.radius = radius;
    circle.active = true;
    
    var text = new PIXI.Text(radius > 0 ? circle.operator + radius : circle.operator + "(" + radius + ")", {font: 'bold 30px ' + config.style.font + '', fill: 0xffffff});
    
    displayRadius += text.width;
    
    text.position.x += displayRadius-text.width/2;
    text.position.y += displayRadius-text.height/2;
    
    var graphics = new PIXI.Graphics();
    graphics.beginFill(color,alpha);
    graphics.lineStyle(5,color,1);
    graphics.drawCircle(circle.position.x,circle.position.y,displayRadius);
    graphics.endFill();
    
    circle.texture = graphics.generateTexture();
    
    circle.addChild(text);
    
    main.addChild(circle);
    
    return circle;
    
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
        case "*":
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
    targetText = new PIXI.Text(target,{font: 'bold 35px ' + config.style.font + '', fill: 0xffffff});

//Start the level
function generateLevel() {
    current = getRadius();
    do {
        target = getRadius();
    } while(target == current);
    targetText.setText(target);
    
    for(var i=0;i<circles.length;i++) {
        circles[i].active = false;
    }
    var index = level-1;
    if(index >= 0 && index < config.levels.length) {
        var description = config.levels[index].description;
        var population = config.levels[index].population;
        console.log("Level " + level + " - " + description);
        //Generate circles
        for(var i=0;i<population;i++) {
            circles.push(createCircle());
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
var crosshair = new PIXI.Graphics();
var radius = Math.min(app.view.width,app.view.height)/8;
//Circle
crosshair.beginFill(0x000000,0.5);
crosshair.lineStyle(5,config.style.baseColor,0.25);
crosshair.drawCircle(app.view.width/2,app.view.height/2,radius);
crosshair.endFill();
//Inner lines
crosshair.lineStyle(3,0xffffff,0.5);
crosshair.moveTo(app.view.width/2-40,app.view.height/2);
crosshair.lineTo(app.view.width/2-radius-20,app.view.height/2);
crosshair.moveTo(app.view.width/2+40,app.view.height/2);
crosshair.lineTo(app.view.width/2+radius+20,app.view.height/2);
crosshair.moveTo(app.view.width/2,app.view.height/2-40);
crosshair.lineTo(app.view.width/2,app.view.height/2-radius-20);
crosshair.moveTo(app.view.width/2,app.view.height/2+40);
crosshair.lineTo(app.view.width/2,app.view.height/2+radius+20);
//Outer lines
crosshair.lineStyle(3,0xff8888,0.25);
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

var panelHeight = Math.min(app.view.width/4,150);

//Top panel
var topPanel = new PIXI.Graphics();
//Left angle
topPanel.beginFill(config.style.baseColor,config.style.panelAlpha);
topPanel.lineStyle(2,0xffffff,1);
topPanel.moveTo(0,0);
topPanel.lineTo(app.view.width/2-1.5*panelHeight,panelHeight);
topPanel.lineTo(app.view.width/2-1.5*panelHeight,0);
topPanel.endFill();
//Right angle
topPanel.beginFill(config.style.baseColor,config.style.panelAlpha);
topPanel.lineStyle(2,0xffffff,1);
topPanel.moveTo(app.view.width,0);
topPanel.lineTo(app.view.width/2+1.5*panelHeight,panelHeight);
topPanel.lineTo(app.view.width/2+1.5*panelHeight,0);
topPanel.endFill();
//Dial area
topPanel.beginFill(config.style.topPanelColor,config.style.panelAlpha);
topPanel.lineStyle(3,0xffffff,1);
topPanel.moveTo(app.view.width/2-1.5*panelHeight,0);
topPanel.lineTo(app.view.width/2-1.5*panelHeight,panelHeight);
topPanel.lineTo(app.view.width/2-panelHeight/2,panelHeight);
topPanel.lineTo(app.view.width/2-panelHeight/2,0);
//Level area
topPanel.lineTo(app.view.width/2+panelHeight/2,0);
topPanel.lineTo(app.view.width/2+panelHeight/2,panelHeight);
topPanel.lineTo(app.view.width/2+1.5*panelHeight,panelHeight);
topPanel.lineTo(app.view.width/2+1.5*panelHeight,0);
topPanel.endFill();
//Target box
topPanel.beginFill(0x000000,config.style.panelAlpha);
topPanel.lineStyle(3,0xffffff,1);
topPanel.drawRect(app.view.width/2-panelHeight/2,0,panelHeight,panelHeight);
topPanel.endFill();

panels.addChild(topPanel);

//Target label
var targetLabel = new PIXI.Text("Get to",{font: 'bold 20px ' + config.style.font + '', fill: 0x888888});
targetLabel.position.x = (app.view.width-targetLabel.width)/2;
targetLabel.position.y = 10;
panels.addChild(targetLabel);
//Target text
targetText.position.x = (app.view.width-targetText.width)/2;
targetText.position.y = targetLabel.height+(panelHeight-targetLabel.height-targetText.height)/2;

panels.addChild(targetText);

//Bottom panel
var bottomPanel = new PIXI.Graphics();
//Left angle
bottomPanel.beginFill(config.style.baseColor,config.style.panelAlpha);
bottomPanel.lineStyle(2,0xffffff,1);
bottomPanel.moveTo(0,app.view.height);
bottomPanel.lineTo(app.view.width/2-1.5*panelHeight,app.view.height-panelHeight);
bottomPanel.lineTo(app.view.width/2-1.5*panelHeight,app.view.height);
bottomPanel.endFill();
//Right angle
bottomPanel.beginFill(config.style.baseColor,config.style.panelAlpha);
bottomPanel.lineStyle(2,0xffffff,1);
bottomPanel.moveTo(app.view.width,app.view.height);
bottomPanel.lineTo(app.view.width/2+1.5*panelHeight,app.view.height-panelHeight);
bottomPanel.lineTo(app.view.width/2+1.5*panelHeight,app.view.height);
bottomPanel.endFill();
//Shoot button area
bottomPanel.beginFill(config.style.bottomPanelColor,config.style.panelAlpha);
bottomPanel.lineStyle(2,0xffffff,1);
bottomPanel.moveTo(app.view.width/2-1.5*panelHeight,app.view.height);
bottomPanel.lineTo(app.view.width/2-1.5*panelHeight,app.view.height-panelHeight);
bottomPanel.lineTo(app.view.width/2-panelHeight/2,app.view.height-panelHeight);
bottomPanel.lineTo(app.view.width/2-panelHeight/2,app.view.height);
//Joystick area
bottomPanel.lineTo(app.view.width/2+panelHeight/2,app.view.height);
bottomPanel.lineTo(app.view.width/2+panelHeight/2,app.view.height-panelHeight);
bottomPanel.lineTo(app.view.width/2+1.5*panelHeight,app.view.height-panelHeight);
bottomPanel.lineTo(app.view.width/2+1.5*panelHeight,app.view.height);
bottomPanel.endFill();
//Minimap
bottomPanel.beginFill(0x000000,1);
bottomPanel.lineStyle(2,0xffffff,1);
bottomPanel.drawRect(app.view.width/2-panelHeight/2,app.view.height-panelHeight,panelHeight,panelHeight);
bottomPanel.endFill();

panels.addChild(bottomPanel);

//Current radius text
var currentText = new PIXI.Text(current,{font: 'bold 30px ' + config.style.font + '', fill: 0xffffff});
function updateCurrent() {
    currentText.setText(current);
    currentText.position.set((app.view.width-currentText.width)/2,(app.view.height-currentText.height)/2);
}
updateCurrent();
hud.addChild(currentText);

//Dials
var dials = new PIXI.Graphics();
//Left top
dials.beginFill(0x000000,0.5);
dials.lineStyle(2,0x000000,0.5);
dials.drawCircle((app.view.width-2*panelHeight)/2,panelHeight/2,panelHeight/4);
dials.endFill();
//Right top
dials.beginFill(0x000000,0.5);
dials.lineStyle(2,0x000000,0.5);
dials.drawCircle((app.view.width+2*panelHeight)/2,panelHeight/2,panelHeight/4);
dials.endFill();
//Left bottom
dials.beginFill(0xffffff,0.5);
dials.lineStyle(2,0x000000,0.5);
dials.drawCircle((app.view.width-2*panelHeight)/2,app.view.height-panelHeight/2,panelHeight/4);
dials.endFill();
//Right bottom
dials.beginFill(0x00ff00,0.5);
dials.lineStyle(2,0x000000,0.5);
dials.drawCircle((app.view.width+2*panelHeight)/2,app.view.height-panelHeight/2,panelHeight/4);
dials.endFill();

panels.addChild(dials);

//Shoot button graphic
var buttonGraphics = new PIXI.Graphics();
buttonGraphics.beginFill(0xff0000);
buttonGraphics.lineStyle(3,0x000000,0.5);
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
});

//Text for button
var buttonText = new PIXI.Text("Shoot!",{font: 'bold 15px ' + config.style.font, fill: 0x000000});
buttonText.position.set(-buttonText.width/2,-buttonText.height/2);

shootButton.addChild(buttonText);
panels.addChild(shootButton);

//Joystick graphic
var joystickGraphic = new PIXI.Graphics();
joystickGraphic.beginFill(0x00ff00);
joystickGraphic.lineStyle(3,0x000000,0.5);
joystickGraphic.drawCircle(0,0,panelHeight/4);
joystickGraphic.endFill();

//Joystick
var joystick = new PIXI.Sprite();
joystick.anchor.set(0.5);
joystick.texture = joystickGraphic.generateTexture();
var basePosition = [(app.view.width+2*panelHeight)/2,app.view.height-panelHeight/2];
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

//List of circles currently colliding with the crosshair
var collidingCircles = [];

//Shoot
function shoot() {
    for(var i=0;i<collidingCircles.length;i++) {
        if(collidingCircles[i].active) {
            current = performOperation(collidingCircles[i].operator,current,collidingCircles[i].radius);
            collidingCircles[i].active = false;
        }
    }
    updateCurrent();
}

//Update everything
function update() {
    
    //Shoot
    if(keysDown.includes(32)) {
        shoot();
    }
    
    //Move
    camera.velocity.x += (basePosition[0]-joystick.position.x)*config.control.sensitivity;
    camera.velocity.y += (basePosition[1]-joystick.position.y)*config.control.sensitivity;
    
    //Update camera (use key input, move, offset)
    camera.update();
    
    //Update circles
    for(var i=0;i<circles.length;i++) {
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
            if(getDistance(app.view.width/2,app.view.height/2,(circles[i].x+circles[i].width/2)+camera.x,(circles[i].y+circles[i].height/2)+camera.y) < radius + circles[i].width/2) {
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
                circles.splice(i,1);
                //Replace
                circles.push(createCircle());
            } else {
                //Decrease opacity
                circles[i].alpha *= 0.9;
                circles[i].position.x += circles[i].width/2;
                circles[i].position.y += circles[i].height/2;
                circles[i].scale.set(0.95*circles[i].scale.x);
                circles[i].position.x -= circles[i].width/2;
                circles[i].position.y -= circles[i].height/2;
            }
        }
    }
    
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