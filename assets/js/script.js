/* eyesSVG */
const eyesSVG = document.querySelector('#eyes');
const eyes = [
  {
    eye: eyesSVG.querySelector('#eye-left'),
    pupil: eyesSVG.querySelector('#pupil-left'),
    offsetX: 0
  },
  {
    eye: eyesSVG.querySelector('#eye-right'),
    pupil: eyesSVG.querySelector('#pupil-right'),
    offsetX: 0
  }
];

const updateEye = (ev, {eye, pupil, offsetX}) => {
  const eyeRect = eye.getBoundingClientRect();
  const centerX = eyeRect.left + eyeRect.width / 2;
  const centerY = eyeRect.top + eyeRect.height / 2;

  const distX = ev.clientX - centerX;
  const distY = ev.clientY - centerY;

  const pupilRect = pupil.getBoundingClientRect();
  const maxDistX = pupilRect.width / 2;
  const maxDistY = pupilRect.height / 2;

  const angle = Math.atan2(distY, distX);

  const newPupilX = offsetX + Math.min(maxDistX, Math.max(-maxDistX, Math.cos(angle) * maxDistX));
  const newPupilY = Math.min(maxDistY, Math.max(-maxDistY, Math.sin(angle) * maxDistY));
  
  const svgCTM = eyesSVG.getScreenCTM();
  const scaledPupilX = newPupilX / svgCTM.a; 
  const scaledPupilY = newPupilY / svgCTM.d;

  pupil.setAttribute('transform', `translate(${scaledPupilX}, ${scaledPupilY})`);
}

// Pupil position starts off-centre on the X axis
const calcOffset = () => {
  for (const props of eyes) {
    props.pupil.removeAttribute('transform');
    const eyeRect = props.eye.getBoundingClientRect();
    const pupilRect = props.pupil.getBoundingClientRect();
    props.offsetX = ((eyeRect.right - pupilRect.right) - (pupilRect.left - eyeRect.left)) / 2;
  }
}
calcOffset();

globalThis.addEventListener('resize', () => {
  calcOffset();
});

let frame = 0;
globalThis.addEventListener('mousemove', (ev) => {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    for (const eye of eyes) {
      updateEye(ev, eye);
    }
  });
});

/* ------------------------------------------------------------------- */
/* point-line */
function canvas() {
    // JavaScript Document
    var requestAnimationFrame = window.requestAnimationFrame || function (callback) {
        window.setTimeout(callback, 1000 / 60)
    };
    var canvas = document.getElementsByTagName("canvas")[0];
    var ctx = canvas.getContext("2d");
    var maximumPossibleDistance;
    var centerX;
    var centerY;
    var mousePositionX;
    var mousePositionY;
    var mouseElement;
    var isRunning;
    var lines = 0;
    var objects = [];
    var initAnimation = function () {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        maximumPossibleDistance = Math.round(Math.sqrt((canvas.width * canvas.width) + (canvas.height * canvas.height)));
        centerX = Math.floor(canvas.width / 2);
        centerY = Math.floor(canvas.height / 2);
        objects.length = 0;
        clearCanvas();
        createParticles();
    };
    window.addEventListener("resize", function () {
        initAnimation();
    }, false);
    var options = {
        particlesNumber: 100,
        initialSize: 3,
        moveLimit: 50,
        durationMin: 50,
        durationMax: 300,
        drawConnections: true,
        mouseInteractionDistance: 200,
        mouseGravity: true,
        drawMouseConnections: true,
        red: Math.floor(Math.random() * 256 + 1),
        green: Math.floor(Math.random() * 255),
        blue: Math.floor(Math.random() * 256),
        opacity: 1,
        connectionRed: Math.floor(Math.random() * 256 + 1),
        connectionGreen: Math.floor(Math.random() * 255),
        connectionBlue: Math.floor(Math.random() * 256),
        connectionOpacity: 0.1,
        mouseConnectionRed: Math.floor(Math.random() * 256 + 1),
        mouseConnectionGreen: Math.floor(Math.random() * 255),
        mouseConnectionBlue: Math.floor(Math.random() * 256),
        mouseConnectionOpacity: 0.1
    }
    // ----------------------------------------------------
    // Helper functions //
    //-----------------------------------------------------
    var getRandomBetween = function (a, b) {
        return Math.floor(Math.random() * b) + a;
    };
    var hitTest = function (object1, object2) {
        if ((object1.positionX < object2.positionX + object2.size) && (object1.positionX + object2.size > object2.positionX) &&
            (object1.positionY < object2.positionY + object2.size) && (object1.positionY > object2.positionY)) {
            return true;
        } else {
            return false;
        };
    };
    // Get distance between particles by using Pythagorean theorem
    var getDistance = function (element1, element2) {
        var difX = Math.round(Math.abs(element1.positionX - element2.positionX));
        var difY = Math.round(Math.abs(element1.positionY - element2.positionY));
        return Math.round(Math.sqrt((difX * difX) + (difY * difY)));
    };
    // ----------------------------------------------------
    // Particle constructor function //
    //-----------------------------------------------------
    function Particle(positionX, positionY, size, red, green, blue, opacity) {
        this.positionX = positionX;
        this.positionY = positionY;
        this.size = size;
        this.duration = getRandomBetween(options.durationMin, options.durationMax);
        this.limit = options.moveLimit
        this.timer = 0;
        this.red = red
        this.green = green
        this.blue = blue
        this.opacity = opacity
        this.color = "rgba(" + this.red + "," + this.green + "," + this.blue + ",+" + this.opacity + ")";
    };
    // ----------------------------------------------------
    // Mouse Particle constructor function //
    //-----------------------------------------------------
    function MouseParticle(positionX, positionY, size, red, green, blue, opacity) {
        this.positionX = mousePositionX;
        this.positionY = mousePositionY;
        this.size = size;
        this.red = red
        this.green = green
        this.blue = blue
        this.opacity = opacity
        this.color = "rgba(" + this.red + "," + this.green + "," + this.blue + ",+" + this.opacity + ")";
    };
    Particle.prototype.animateTo = function (newX, newY) {
        var duration = this.duration;
        var animatePosition = function (newPosition, currentPosition) {
            if (newPosition > currentPosition) {
                var step = (newPosition - currentPosition) / duration;
                newPosition = currentPosition + step;
            } else {
                var step = (currentPosition - newPosition) / duration;
                newPosition = currentPosition - step;
            };
            return newPosition;
        }
        this.positionX = animatePosition(newX, this.positionX)
        this.positionY = animatePosition(newY, this.positionY)
        // generate new vector
        if (this.timer == this.duration) {
            this.calculateVector();
            this.timer = 0;
        } else {
            this.timer++;
        }
    };
    Particle.prototype.updateColor = function () {
        this.color = "rgba(" + this.red + "," + this.green + "," + this.blue + ",+" + this.opacity + ")";
    };
    Particle.prototype.calculateVector = function () {
        var distance
        var newPosition = {};
        var particle = this;
        var getCoordinates = function () {
            newPosition.positionX = getRandomBetween(0, window.innerWidth);
            newPosition.positionY = getRandomBetween(0, window.innerHeight);
            distance = getDistance(particle, newPosition);
        };
        while ((typeof distance === "undefined") || (distance > this.limit)) {
            getCoordinates();
        }
        this.vectorX = newPosition.positionX;
        this.vectorY = newPosition.positionY;
    };
    Particle.prototype.testInteraction = function () {
        if (!options.drawConnections) return;
        var closestElement;
        var distanceToClosestElement = maximumPossibleDistance;
        for (var x = 0; x < objects.length; x++) {
            var testedObject = objects[x];
            var distance = getDistance(this, testedObject)
            if ((distance < distanceToClosestElement) && (testedObject !== this)) {
                distanceToClosestElement = distance;
                closestElement = testedObject;
            }
        };
        if (closestElement) {
            ctx.beginPath();
            ctx.moveTo(this.positionX + this.size / 2, this.positionY + this.size / 2);
            ctx.lineTo(closestElement.positionX + closestElement.size * 0.5, closestElement.positionY + closestElement.size * 0.5);
            ctx.strokeStyle = "rgba(" + options.connectionRed + "," + options.connectionGreen + "," + options.connectionBlue + "," + options.connectionOpacity + ")";
            ctx.stroke();
            lines++
        }
    };
    MouseParticle.prototype.testInteraction = function () {
        if (options.mouseInteractionDistance === 0) return;
        var closestElements = []
        var distanceToClosestElement = maximumPossibleDistance;
        for (var x = 0; x < objects.length; x++) {
            var testedObject = objects[x];
            var distance = getDistance(this, testedObject)
            if ((distance < options.mouseInteractionDistance) && (testedObject !== this)) {
                closestElements.push(objects[x])
            }
        }
        for (var x = 0; x < closestElements.length; x++) {
            if (options.drawMouseConnections) {
                var element = closestElements[x]
                ctx.beginPath();
                ctx.moveTo(this.positionX, this.positionY);
                ctx.lineTo(element.positionX + element.size * 0.5, element.positionY + element.size * 0.5);
                ctx.strokeStyle = "rgba(" + options.mouseConnectionRed + "," + options.mouseConnectionGreen + "," + options.mouseConnectionBlue + "," + options.mouseConnectionOpacity + ")";
                ctx.stroke();
                lines++
            }
            if (options.mouseGravity) {
                closestElements[x].vectorX = this.positionX;
                closestElements[x].vectorY = this.positionY;
            }
        }
    };
    Particle.prototype.updateAnimation = function () {
        this.animateTo(this.vectorX, this.vectorY);
        this.testInteraction();
        ctx.fillStyle = this.color;
        ctx.fillRect(this.positionX, this.positionY, this.size, this.size);
    };
    MouseParticle.prototype.updateAnimation = function () {
        this.positionX = mousePositionX;
        this.positionY = mousePositionY;
        this.testInteraction();
    };
    var createParticles = function () {
        // create mouse particle
        mouseElement = new MouseParticle(0, 0, options.initialSize, 255, 255, 255)
        for (var x = 0; x < options.particlesNumber; x++) {
            var randomX = Math.floor((Math.random() * window.innerWidth) + 1);
            var randomY = Math.floor((Math.random() * window.innerHeight) + 1);
            var particle = new Particle(randomX, randomY, options.initialSize, options.red, options.green, options.blue, options.opacity)
            particle.calculateVector()
            objects.push(particle)
        }
    };
    var updatePosition = function () {
        for (var x = 0; x < objects.length; x++) {
            objects[x].updateAnimation()
        }
        // handle mouse 
        mouseElement.updateAnimation()
    };
    window.onmousemove = function (e) {
        mousePositionX = e.clientX;
        mousePositionY = e.clientY;
    }
    var clearCanvas = function () {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
    };
    var stopAnimation = function () {
        window.cancelAnimationFrame(myAnimation)
        isRunning = false;
    };
    // ----------------------------------------------------
    // FPS //
    //-----------------------------------------------------
    var lastCalledTime
    var fps
    var averageFps;
    var averageFpsTemp = 0;
    var averageFpsCounter = 0;

    function requestFps() {
        if (!lastCalledTime) {
            lastCalledTime = Date.now();
            fps = 0;
            return;
        }
        delta = (new Date().getTime() - lastCalledTime) / 1000;
        lastCalledTime = Date.now();
        fps = Math.floor(1 / delta);
        averageFpsTemp = averageFpsTemp + fps;
        averageFpsCounter++;
        if (averageFpsCounter === 5) {
            averageFps = Math.floor(averageFpsTemp / 5)
            averageFpsCounter = 0;
            averageFpsTemp = 0;
        }
        if (!averageFps) {
            return;
        } else if (averageFps < 10) {}
    }
    // ----------------------------------------------------
    // Init! //
    //-----------------------------------------------------
    var loop = function () {
        clearCanvas();
        updatePosition();
        // ctx.fillStyle = "transparent";
        ctx.fillStyle = "#333";
        // ctx.fillText("FPS: " + fps + " lines: " + lines + " Average FPS: " + averageFps, 10, 20);
        lines = 0;
        myAnimation = requestAnimationFrame(loop);
        isRunning = true;
        // requestFps();
    };
    initAnimation();
    loop();
}
canvas();
