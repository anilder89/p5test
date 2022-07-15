// globals
const global = {
    windowHeight: 800,
    windowWidth: 800,
};

const colorPlate = {
    black: [0, 0, 0],
    white: [255, 255, 255],
    red: [255, 0, 0],
    blue: [0, 0, 255]
};

let map = {
    gridNumberX: 50,
    gridNumberY: 25,
    windowHeight: 400,
    windowWidth: 800,
    stepsX: 0,
    stepsY: 0,
    empty: 0,
    wall: 1,
    player: 2,
    startX: 0,
    startY: 400
};

let upBuffer, downBuffer;

let gameImage = {
    windowWidth: 800,
    windowHeight: 400,
    gridNumberX: 150,
    gridNumberY: 75,
    startX: 0,
    startY: 0
}

gameImage.stepsX = gameImage.windowWidth / gameImage.gridNumberX;
gameImage.stepsY = gameImage.windowHeight / gameImage.gridNumberY;

let rays = {
    numberOfRays: gameImage.gridNumberX
};

rays.rSteps = (2 * Math.PI / (8 * rays.numberOfRays));

let player = {
    x: 0,
    y: 0,
    gridNumberX: 200,
    gridNumberY: 100,
    direction: Math.PI / 6,
    rSteps: 8 * rays.rSteps,
    stepsX: 0,
    stepsY: 0
};



map.stepsX = map.windowWidth / map.gridNumberX;
map.stepsY = map.windowHeight / map.gridNumberY;
player.stepsX = map.windowWidth / player.gridNumberX;
player.stepsY = map.windowHeight / player.gridNumberY;

// world
let world = [];

for (let i = 0; i < map.gridNumberX; i++) {
    let worldy = [];
    for (let j = 0; j < map.gridNumberY; j++) {
        worldy[j] = 0;
    }
    world[i] = worldy;

}

map.world = world;

// helpers
function wCheck(x, y, larray) {
    if (0 <= x && x <= larray.length) {
        if (larray[x] != undefined) {
            if (0 <= y && y <= larray[x].length) {
                return true;
            }
        }
    }
    return false;
}

function flipWall(x, y) {
    const clickXY = coordToWorld(x, y);
    map.set(clickXY.x, clickXY.y, map.get(clickXY.x, clickXY.y) == map.empty ? map.wall : map.empty);
}

function coordToWorld(x, y) {
    let worldX = parseInt(x / map.stepsX),
        worldY = parseInt(y / map.stepsY);
    return {
        x: worldX,
        y: worldY
    };
}

function playerToWorld(x, y) {
    let worldX = parseInt(map.gridNumberX * x / player.gridNumberX),
        worldY = parseInt(map.gridNumberY * y / player.gridNumberY);
    return {
        x: worldX,
        y: worldY
    };
}

map.get = (x, y) => {
    if (wCheck(x, y, map.world)) {
        return map.world[x][y];
    }
}
map.set = (x, y, v) => {
    if (wCheck(x, y, map.world)) {
        map.world[x][y] = v;
    }
}

map.set(player.x, player.y, map.player);

player.setX = (x) => {
    let worldXY = playerToWorld(x, player.y);

    if (map.get(worldXY.x, worldXY.y) != map.wall) {
        if (x >= 0 && x <= player.gridNumberX) {
            player.x = x;
        }
    }
}

player.setY = (y) => {
    let worldXY = playerToWorld(player.x, y);

    if (map.get(worldXY.x, worldXY.y) != map.wall) {
        if (y >= 0 && y <= player.gridNumberY) {
            player.y = y;
        }
    }
}

player.setXY = (x, y) => {
    player.setX(x);
    player.setY(y);
}

player.directionPoint = (x, y, direction, steps) => {
    let x2 = Math.sin(direction + Math.PI / 4) * steps + x,
        y2 = Math.cos(direction + Math.PI / 4) * steps + y;

    return {
        x: x2,
        y: y2
    };
}

rays.directionPoint = (x, y, direction, steps) => {
    let x2 = Math.sin(direction) * steps + x,
        y2 = Math.cos(direction) * steps + y;

    return {
        x: x2,
        y: y2
    };
}

function keyInputLogic(keyCode) {
    // empty space where player was
    let worldXY = playerToWorld(player.x, player.y);
    map.set(worldXY.x, worldXY.y, map.empty);

    let newPosition = {
        x: player.x,
        y: player.y
    };

    if (keyIsDown(DOWN_ARROW)) {
        newPosition = player.directionPoint(player.x, player.y, player.direction - Math.PI, 1);
        player.setXY(newPosition.x, newPosition.y);
    } else if (keyIsDown(UP_ARROW)) {
        newPosition = player.directionPoint(player.x, player.y, player.direction, 1);
        player.setXY(newPosition.x, newPosition.y);
    } else if (keyIsDown(LEFT_ARROW)) {
        player.direction += player.rSteps;
    } else if (keyIsDown(RIGHT_ARROW)) {
        player.direction -= player.rSteps;
    }
    // full space where player is
    worldXY = playerToWorld(player.x, player.y);
    map.set(worldXY.x, worldXY.y, map.player);
}

// drawing
function setMapPixel(x, y, r, g, b) {
    downBuffer.fill(r, g, b);
    downBuffer.rect(x, y, map.stepsX, map.stepsY);
}

function drawMapPixel(x, y) {
    let XY = coordToWorld(x, y),
        worldXY = map.get(XY.x, XY.y),
        drawColor = colorPlate.white;

    if (worldXY == map.wall) {
        drawColor = colorPlate.blue;
    } else if (worldXY == map.player) {
        drawColor = colorPlate.red;
    }
    setMapPixel(x, y, ...drawColor);
}

function drawMap(h, w) {
    for (i = 0; i < h; i += map.stepsX) {
        for (j = 0; j < w; j += map.stepsY) {
            drawMapPixel(i, j);
        }
    }
}

function outOfBound(x, y) {
    return (x >= map.gridNumberX || y >= map.gridNumberY) || (x < 0 || y < 0);
}

// rays
let rayCollusionPoints = [];

function drawMapRays(x1, y1) {
    let rayInternCollusionPoints = [];
    for (let i = player.direction; i <= (2 * Math.PI) / 8 + player.direction; i += rays.rSteps) {
        let surface = true,
            abs = 0,
            x2 = 0,
            y2 = 0,
            mapCoord;

        // surface detection
        while (surface) {
            abs += 1;
            let newPoint = rays.directionPoint(x1 * player.stepsX, y1 * player.stepsY, i, abs);
            x2 = newPoint.x;
            y2 = newPoint.y;
            mapCoord = coordToWorld(x2, y2);
            if (map.get(mapCoord.x, mapCoord.y) == map.wall || outOfBound(mapCoord.x, mapCoord.y))
                surface = false;
        }

        downBuffer.line(player.x * player.stepsX, player.y * player.stepsY, x2, y2);
        rayInternCollusionPoints.push([x2, y2, outOfBound(mapCoord.x, mapCoord.y)]);
    }
    rayCollusionPoints = [...rayInternCollusionPoints]; // copy collusion points
}

function setImagePixel(x, y, r, g, b) {
    upBuffer.fill(r, g, b);
    upBuffer.rect(x, y, gameImage.stepsX, gameImage.stepsY);
}

function renderImage(playerX, playerY) {
    let absList = rayCollusionPoints.map(
        (element) => [Math.max(0.1, Math.sqrt((element[0] - playerX) * (element[0] - playerX) + (element[1] - playerY) * (element[1] - playerY))), element[2]]);

    for (let x = 0; x < gameImage.gridNumberX; x++) {

        let drawPixelColor = colorPlate.black;
        setImagePixel(x * gameImage.stepsX, 0 * gameImage.stepsY, ...drawPixelColor);
        for (y = 0; y < gameImage.gridNumberY; y++) {
            // draw by default black
            setImagePixel(x * gameImage.stepsX, y * gameImage.stepsY, ...drawPixelColor);

            if (absList[gameImage.gridNumberX - x] != undefined) {
                if (!absList[gameImage.gridNumberX - x][1]) {
                    // wall collusion

                    let yMiddle = parseInt(gameImage.gridNumberY / 2);
                    let yMinMax = 10 * (yMiddle / (absList[gameImage.gridNumberX - x][0] / 4));

                    if (parseInt(yMiddle - yMinMax) <= y && y <= parseInt(yMiddle + yMinMax)) {
                        drawPixelColor = colorPlate.blue;
                        setImagePixel(x * gameImage.stepsX, yMiddle + y * gameImage.stepsY, ...drawPixelColor);
                    } else
                        drawPixelColor = colorPlate.black;
                }
            }
        }
    }
}

// p5
function setup() {
    let canvas = createCanvas(global.windowHeight, global.windowWidth);
    canvas.parent('gameWindow');

    upBuffer = createGraphics(global.windowWidth, gameImage.windowHeight);
    downBuffer = createGraphics(global.windowWidth, map.windowHeight);

}

function draw() {
    drawMap(height, width);
    keyInputLogic(keyCode);
    drawMapRays(player.x, player.y);
    renderImage(player.x, player.y);

    image(upBuffer, gameImage.startX, gameImage.startY);
    image(downBuffer, map.startX, map.startY);
}


function mouseReleased() {
    flipWall(mouseX, (mouseY - gameImage.windowHeight));
}
