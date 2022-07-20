// Type definitions
class Screen {
    constructor(width, height) {
        this.height = height;
        this.width  = width;
        this.buffer = null;
      }
}

class Grid {
    constructor(xNumber, yNumber, initValue) {
        this.xNumber = xNumber;
        this.yNumber = yNumber;
        this.array2D = new Array(xNumber);
        for(let i=0; i<xNumber; i++) {
            this.array2D[i]    = new Array(yNumber);
            for(let j=0; j<yNumber; j++) {
                this.array2D[i][j] = initValue;
            }
        }
      }
}

class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
      }
}

class Player {
    constructor(x, y, dv, rs, r, color) {
        this.x      = x;
        this.y      = y;
        this.dv     = dv;
        this.rs     = rs;
        this.r      = r;
        this.color  = color;
    }
}

// Helper functions
// Vector calculation
function rotateVector(vector, alpha) {
    const X  = vector.x*Math.cos(alpha) - vector.y*Math.sin(alpha),
          Y  = vector.x*Math.sin(alpha) + vector.y*Math.cos(alpha);
    
    vector.x = X;
    vector.y = Y;
}

function lengthVector(vector) {
    return Math.sqrt(vector.x*vector.x + vector.y*vector.y);
}

function absVector(vector) {
    return Math.abs(vector.x*vector.x + vector.y*vector.y);
}


function normVector(vector, normValue) {
    const scaleFactor = normValue/(lengthVector(vector));
    vector.x         *= scaleFactor;
    vector.y         *= scaleFactor;
}

function returnNormVector(a, b, norm) {
    const returnVector = new Vector(a, b);
    normVector(returnVector, norm);
    return returnVector;
}

// Helper functions
// Convertions
function gridToScreen(x, y, grid, screen) {
    const screenX= x*(screen.width/grid.xNumber),
          screenY= y*(screen.height/grid.yNumber);

    return {
        x: screenX,
        y: screenY
    };
}

function screenToGrid(x, y, screen, grid) {
    const gridX = parseInt(x*grid.xNumber / screen.width),
          gridY = parseInt(y*grid.yNumber / screen.height);
    
    return {
        x: gridX,
        y: gridY
    };
}

// map to color mapping
function decodeMapElement(mapElement) {
    switch(mapElement) {
        case 0: return mapColors.white;
        case 1: return mapColors.red;
        case 2: return mapColors.green;
        case 3: return mapColors.blue;
        case 4: return mapColors.purple;
        case 5: return mapColors.yellow;
    }
    return mapColors.black;
}

// Helper functions
// Basic drawing 
function rectDrawer(x, y, xL, yL, r, g, b, buffer) {
    buffer.fill(r, g, b);
    buffer.rect(x, y, xL, yL);
}

function drawPlayer(player, screen) {
    screen.buffer.fill(... player.color);
    screen.buffer.circle(player.x, player.y, player.r);
}

// Helper functions
// Basic hit calculations
function isEmpty(x, y, map, screen, emptyIndicator) {
    const mapX = parseInt(x*map.xNumber / screen.width),
          mapY = parseInt(y*map.yNumber / screen.height);

    if(0 <= mapX && mapX < map.array2D.length) {
        const mapGridY = map.array2D[mapX];
        if(0 <= mapY && mapY < mapGridY.length) {
            return mapGridY[mapY] == emptyIndicator;
        } 
    }
    return false;
}

function cantPass(ray, player, emptyIndicator, screen, map, wall) {

    const boundsCheck = function() {
        if(ray.x + player.x <= 0) {
            return [true, outOfBound];
        } else if (ray.y + player.y  <= 0) {
            return [true, outOfBound];
        } else if(ray.x + player.x >= screen.width) {
            return [true, outOfBound];
        } else if(ray.y + player.y >= screen.height) {
            return [true, outOfBound];
        }
        return [false, emptyIndicator];
    }();


    // because of the map data structure
    // there is need to take care of the edges
    // by looking at the direction of the ray
    const dirX = ray.x>0 ? 10e-4 : -10e-4,
          dirY = ray.y>0 ? 10e-4 : -10e-4;

    // use probe for the edge because screenToGrid will return the result of an parseInt; 0-9/10 ->0
    const testPositionReal = screenToGrid(ray.x + player.x, ray.y + player.y, screen, map),
          testPositionProbe= screenToGrid(ray.x + player.x + dirX, ray.y + player.y + dirY, screen, map);

    const positionTester = (testPosition) => {
        if(testPosition.x < 0) {
            return [true, outOfBound];
        } else if( testPosition.x >= map.array2D.length) {
            return [true, outOfBound];
        } else if(testPosition.y < 0) {
            return [true, outOfBound];
        } else if(testPosition.y >= map.array2D[testPosition.x].length) {
            return [true, outOfBound];
        } else if(map.array2D[testPosition.x][testPosition.y]!=emptyIndicator) {
            return [true, map.array2D[testPosition.x][testPosition.y]];
        }
        return [false, emptyIndicator];
    }
    
    const hitReal = positionTester(testPositionReal),
          hitProbe= positionTester(testPositionProbe);

    // function return
    if(boundsCheck[0]) {
    return [true, outOfBound];
    } else if(hitReal[0]) {
    return [true, hitReal[1]]
    } else if(hitProbe[0]) {
    return [true, hitProbe[1]]
    }

    return [false, emptyIndicator];
}

// Helper functions
// Input logic
function movePlayer(map) {
    if (keyIsDown(DOWN_ARROW)) {
        const x = player.x - player.dv.x,
              y = player.y - player.dv.y;
        if(isEmpty(x,y, map, bottomScreen, mapEmpty)) {
            player.x= x;
            player.y= y;
        }
    } else if (keyIsDown(UP_ARROW)) {
        const x = player.x + player.dv.x,
              y = player.y + player.dv.y;
        if(isEmpty(x,y, map, bottomScreen, mapEmpty)) {
            player.x= x;
            player.y= y;
        }
    } else if (keyIsDown(LEFT_ARROW)) {
        rotateVector(
            player.dv, 
            -player.rs
            );
    } else if (keyIsDown(RIGHT_ARROW)) {
        rotateVector(
            player.dv, 
            player.rs
            );
    }
}

function addElementMap(x, y, map, screen, numberElements) {
    const XY            = screenToGrid(x, y, screen, map),
          prevElement   = map.array2D[XY.x][XY.y],
          nxtElement    = (prevElement + 1)%numberElements;

          map.array2D[XY.x][XY.y] = nxtElement;
}

// Screen cam
function returnCam(player, dst, width) {

    let camVector, a=0, b=0; 
    
    // x/y  -b/a
    if(player.dv.y != 0) {
        const relation = player.dv.x/player.dv.y;
        
        a = -1,
        b = relation;

    } else {
        const relation = player.dv.y/player.dv.x;

        b = -1,
        a = relation;
    }
    camVector = returnNormVector(a , b, width);

    const playerdV = returnNormVector(player.dv.x, player.dv.y, dst);
    
    return new Vector(player.x + playerdV.x - camVector.x, player.y + playerdV.y - camVector.y)
}

// DDA Algorithm
// needed for the init values of DDA algorithm
function rayToGrid(ray, player, screen, map) {
    let firstX = 0,
        firstY = 0,
        returnVector = new Vector(firstX, firstY),
        xGrid        = false;

    const mapPosition = screenToGrid(player.x, player.y, screen, map);

    const tX = ray.x/ray.y,
          tY = ray.y/ray.x;

    const dX = ray.y == 0 ? precision : tX,
          dY = ray.x == 0 ? precision : tY,
          xDr= ray.x > 0,
          yDr= ray.y > 0;

    if(xDr) {
        firstX = gridToScreen(mapPosition.x+1, mapPosition.y, map, screen).x - player.x;
    } else {
        firstX = gridToScreen(mapPosition.x, mapPosition.y, map, screen).x - player.x;
    }

    if(yDr) {
        firstY =  gridToScreen(mapPosition.x, mapPosition.y+1, map, screen).y - player.y;
    } else {
        firstY =  gridToScreen(mapPosition.x, mapPosition.y, map, screen).y - player.y;
    }

    const Y    = firstX*dY,
          X    = firstY*dX,
          absX = absVector(new Vector(firstX, Y)), // abs X hitpoint
          absY = absVector(new Vector(X, firstY)); // abs y hitpoint
    
    const minX = absX < absY;
    
    if(minX) {
        returnVector.x = firstX;
        returnVector.y = Y;  
        xGrid = true;   
    } else {
        returnVector.y = firstY;
        returnVector.x = X; 
        xGrid = false; 
    }
    return [
        returnVector, 
        xGrid, 
        xDr, 
        yDr, 
        dX,
        dY,
        (returnVector.x ), 
        (returnVector.y )
    ];
}

// implements kind of DDA algorithm
function gridToGrid(ray, xGrid, xDr, yDr, dX, dY, positionX, positionY, screen, map) {
    let returnVector= new Vector(0, 0);

    const gridBounds = gridToScreen(1, 1, map, screen);

    let hX=0, hY=0;

    const drX = dX > 0 ? 1 : -1,
          drY = dY > 0 ? 1 : -1,
          drGX= xDr ? 1 : -1,
          drGY= yDr ? 1 : -1;

    positionX = positionX%gridBounds.x;
    positionY = positionY%gridBounds.y;

    hY= drGX*dX > 0 ? gridBounds.y - positionY : positionY;
    hX= drGY*dY > 0 ? gridBounds.x - positionX : positionX;

    // x = 40 || x = 0
    if(xGrid) {
        const xMove = hY*dX;
        if(Math.abs(xMove) < Math.abs(gridBounds.x)) { // xMove cannot be bigger than gridBounds.x
            returnVector.x = drGX*drX*xMove;
            returnVector.y = drGX*drX*hY;
            // hit on y
            xGrid = false;
        } else {
            // hit again on x
            xGrid = true;
            returnVector.x = drGX*gridBounds.x;
            returnVector.y = drGX*gridBounds.x*dY;  
        }
    // y = 40 || y = 0
    } else {
        const yMove = hX*dY;
        if(Math.abs(yMove) < Math.abs(gridBounds.y)) {
            returnVector.y = drGY*drY*yMove;
            returnVector.x = drGY*drY*hX;
            // hit on x
            xGrid = true;
        } else {
            // hit again on y
            xGrid = false;
            returnVector.y = drGY*gridBounds.y;
            returnVector.x = drGY*gridBounds.y*dX;  
        }
    }
    // check for the case that return vector has no direction
    if(returnVector.x ==0 && returnVector.y ==0) {
        returnVector.x = drGX;
        returnVector.y = drGY;
        normVector(returnVector, 1); // normalize
    }
    return [
        new Vector((returnVector.x + ray.x), (returnVector.y + ray.y)), 
        xGrid,
        xDr,
        yDr,
        dX,
        dY,
        (returnVector.x + ray.x), 
        (returnVector.y + ray.y)
    ];
}

// transform ray to world coords
function transHitWorld(ray, player) {
    return [
        ray[0],
        ray[1],
        ray[2],
        ray[3],
        ray[4],
        ray[5],
        ray[6] + player.x, 
        ray[7] + player.y
    ];
}

// Ray hits
function detectSurface(ray, player, map, screen) {
    let nextRay = rayToGrid(ray, player, screen, map);

    let hit = false, testPoint, reason=mapEmpty;
    while(!hit) {

        testPoint = new Vector(nextRay[6], nextRay[7]);

        const testPass = cantPass(testPoint, player, mapEmpty, screen, map, mapWall),
              passed   = !testPass[0];
        reason   =  testPass[1];

        if(!passed) {
            hit = true;
            screen.buffer.circle(testPoint.x + player.x, testPoint.y + player.y, 5); 
            continue;
        } 

        // nextRay will be in a "grid", 0 < x < gridWidth && 0 < y < gridHeight
        // we need the player position to tranform nextRay (x,y) to world coordinates (x+player.x, y+player.y)
        nextRay = gridToGrid(...transHitWorld(nextRay, player), screen, map);
    }

    return [nextRay[6], nextRay[7], reason] 
}

function getHitAbsDr(player, grid, screen) {

    // dst=width => fov=90
    const cam = returnCam(player, stepSz*numberOfRays, stepSz*numberOfRays),
          playerdV = returnNormVector(player.dv.x, player.dv.y, stepSz*numberOfRays),
          step     = returnNormVector(player.x + playerdV.x - cam.x, player.y + playerdV.y - cam.y, stepSz),
          xDr      = playerdV.x > 0 ? 1 : -1,
          yDr      = playerdV.y > 0 ? 1 : -1,
          sign     = xDr + yDr;

    let AbsDrR= [];
    for(let i= -numberOfRays; i<numberOfRays; i++) {

        // use fov to generate normalized direction vectors
        // we need to differentiate between "up"/"down" bc ray steps in one "direction"
        const scanline = playerdV.y > 0 && playerdV.x < 0 || playerdV.y > 0 && playerdV.x > 0 ? 
                         new Vector(i*step.x+ playerdV.x, i*step.y+ playerdV.y) : 
                         new Vector(-i*step.x+ playerdV.x, -i*step.y+ playerdV.y);

        const hitPoint = detectSurface(scanline, player, grid, screen),
              hitPointVector = new Vector(hitPoint[0], hitPoint[1]);

              if(lengthVector(hitPointVector)>lengthVector(scanline)) {
                const realAbs = lengthVector(new Vector(hitPointVector.x - scanline.x, hitPointVector.y - scanline.y));

                const scalar = lengthVector(hitPointVector)*lengthVector(playerdV),
                    projection = Math.acos((hitPointVector.x*playerdV.x+hitPointVector.y*playerdV.y)/scalar),
                    safeProjection = isNaN(projection) ? 0 : projection,
                    projectedVector = Math.cos(safeProjection)*realAbs;

                AbsDrR.push(
                    [
                        scanline , 
                        projectedVector, 
                        hitPoint[2]
                    ]
                    );
              }
            }
            return AbsDrR;
        }

// Draw functions
function drawMapToScreen(map, screen, colors) {
    for(let i=0; i<map.array2D.length; i++) {
        for(let j=0; j<map.array2D[i].length; j++) {
            const originToDraw    = gridToScreen(i, j, map, screen),
                    mapElement    = map.array2D[i][j],
                    decodeElement = decodeMapElement(mapElement);

            rectDrawer(
                originToDraw.x, 
                originToDraw.y, 
                (screen.width/map.xNumber),          // dX
                (screen.height/map.yNumber),         // dY
                ... decodeElement,
                screen.buffer
                );
        }
    }
}

function drawScreensToCanvas(tScrn, bScrn) {
    image(tScrn.buffer, 0, 0);             // start up-left
    image(bScrn.buffer, 0, tScrn.height);  // start at the end of first screen
}

function renderRays(raysToRender, player, grid, screen) {
    raysToRender.forEach(ray=> {
        const   Dr = ray[0],
                Abs= ray[1],
            startPs= new Vector(player.x + Dr.x, player.y + Dr.y);

        drawVector = returnNormVector(Dr.x, Dr.y, Abs);
        screen.buffer.line(startPs.x, startPs.y, drawVector.x + startPs.x, drawVector.y + startPs.y);
    });
}

function Pixels(raysToRender, player, grid, screen) {
    let returnPixels= [];
        for(let pixelX=0; pixelX<raysToRender.length; pixelX++) {
                const ray    = raysToRender[pixelX],
                      abs    = ray[1]
                      reason = ray[2],
                      pixelColor  = decodeMapElement(reason);
  
                returnPixels.push([abs, pixelColor]);
        }
    return returnPixels;
}

function renderImage(raysToRender, player, grid, screen) {
    const pixels = Pixels(raysToRender, player, grid, screen);
    const middle = screen.height/2;
    
        for(let pixelX=0; pixelX<pixels.length; pixelX++) {
            const pixelAbs = pixels[pixelX][0],
                  pixelColor = pixels[pixelX][1];

            // draw middle line
            rectDrawer(pixelX*stepsX, middle, stepsX, stepsY, ...pixelColor, screen.buffer);

            // use pixelAbs to determine how much strech
            // draw up/down from the middle
            const strech = parseInt(middle)/pixelAbs;

            for(let pixelY=stepsY; pixelY<parseInt(middle); pixelY+=stepsY) {
                if(pixelY < 32*strech) {
                    rectDrawer(pixelX*stepsX, middle + pixelY, stepsX, stepsY, ...pixelColor, screen.buffer);
                    rectDrawer(pixelX*stepsX, middle - pixelY, stepsX, stepsY, ...pixelColor, screen.buffer);
                }
                else {
                    rectDrawer(pixelX*stepsX, middle + pixelY, stepsX, stepsY, ...mapColors.black, screen.buffer);
                    rectDrawer(pixelX*stepsX, middle - pixelY, stepsX, stepsY, ...mapColors.black, screen.buffer);
                }
            }
        }
    
}

// Global definitions
const topScreen     = new Screen(800, 400), 
      bottomScreen  = new Screen(800, 400),
      combiScreen   = new Screen(800, 800);

const mapEmpty      = 0,
      mapWall       = 1,
      outOfBound    = 5;

const precision     = 10e10;

let mapGrid         = new Grid(20, 10, mapEmpty);

// load test level
mapGrid.array2D =[
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 3, 0, 0, 0, 0, 2, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 2, 3, 2, 0, 0, 3, 2, 3, 1],
    [1, 0, 0, 0, 0, 0, 2, 3, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 4, 0, 0, 1, 0, 2],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    [1, 0, 0, 0, 0, 0, 0, 5, 0, 2],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 3, 3, 0, 0, 0, 0, 1],
    [1, 0, 0, 3, 3, 0, 0, 0, 0, 1],
    [1, 0, 0, 3, 3, 0, 0, 0, 0, 1],
    [1, 0, 0, 3, 3, 0, 0, 1, 0, 2],
    [1, 0, 0, 3, 3, 0, 0, 0, 0, 2],
    [1, 0, 0, 0, 0, 0, 0, 1, 0, 2],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    [1, 1, 1, 1, 1, 1, 2, 2, 2, 2]];

const mapColors = {
    black : [0,     0,      0],
    red   : [255,   0,      0],
    green : [0,     255,    0],
    blue  : [0,     0,    255],
    white : [255,   255,  255],
    purple: [255,   0,    255],
    yellow: [255,   255,    0]
};

const playerStartPosition = {
    x: 100,
    y: 200
}

let player = new Player(
    playerStartPosition.x, 
    playerStartPosition.y, 
    new Vector(3, 0),     // start vector for the player
    Math.PI/64,           // rotation speed
    5,                    // diameter of the player circle on the map
    [0, 255, 0]           // color player on map
    );

// rendering settings
const stepsX = 10, // pixel size in x direction
      stepsY = 5,  // pixel size in y direction
      stepSz = 0.125, // ray steps
      numberOfRays = 40; // number of rays

// P5 entrypoints for canvas and input
function setup() {
    let canvas = createCanvas(combiScreen.height, combiScreen.width);
    canvas.parent('gameWindow');

    // init buffer
    topScreen.buffer    = createGraphics(topScreen.width, topScreen.height); 
    bottomScreen.buffer = createGraphics(bottomScreen.width, bottomScreen.height);

}

function draw() {
    drawMapToScreen(mapGrid, bottomScreen, mapColors);
    drawPlayer(player, bottomScreen);

    const raysToRender = getHitAbsDr(player, mapGrid, bottomScreen);
    renderRays(raysToRender, player, mapGrid, bottomScreen);
    renderImage(raysToRender, player, mapGrid, topScreen); 

    drawScreensToCanvas(topScreen , bottomScreen);
    movePlayer(mapGrid);
}

function mouseReleased() {
    addElementMap( 
        mouseX, 
        (mouseY - topScreen.height), // check clicks on the bottom screen
        mapGrid,
        bottomScreen,
        Object.keys(mapColors).length           // use mapColors to circle
        );
}
