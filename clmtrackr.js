var videoElement;
var canvasElement;
var canvasCtx;
var faceMesh;

var nodUp = false, nodDown = false;
var previousY;
var i = 1;
var startTime, timeDifference, len;
var rate_of_change;

/*

Сделать статические значения длинны оси лица, чтобы оно не скакало при
отведение головы назад.

Разобраться как определить наклон головы вперед

*/


function expo(x, f) {
  return Number.parseFloat(x).toExponential(f);
}

function checkNod(speed, len){
  //кивок вверх
  if (speed < 0 && len[0] < len[1]){
    nodUp = true;
  }
  //кивок вниз
  if (speed > 0 && len[0] > len[1]){
    nodDown = true;
  }
  return;
}

function faceRotation(landmarks)
{
  // v - vertex
  var v152 = {x: landmarks[152]["x"], y: landmarks[152]["y"]};
  var v10 =  {x: landmarks[10]["x"],  y: landmarks[10]["y"]};

  var v234 = {x: landmarks[234]["x"], y: landmarks[234]["y"]};
  var v454 = {x: landmarks[454]["x"], y: landmarks[454]["y"]};

  const heightFace = Math.sqrt((v152.x - v10.x)*(v152.x - v10.x) + (v152.y - v10.y)*(v152.y - v10.y));
  const widthFace = Math.sqrt((v234.x - v454.x)*(v234.x - v454.x) + (v234.y - v454.y)*(v234.y - v454.y));

  if((i+2) % 3 == 0){
    startTime = new Date().getTime(); 
    previousY = landmarks[152]["y"];
    len = heightFace / widthFace;
  } 

  if (i % 3 == 0){
    timeDifference = new Date().getTime() - startTime;
    timeDifference /= 1000;
    rate_of_change = (landmarks[152]["y"] - previousY) / timeDifference;
    
    //results.push([i, Number(expo(rate_of_change))]);
    //console.log(JSON.stringify(results));


    nodDown = false;
    nodUp = false;
    if (rate_of_change > 0.06 || rate_of_change < - 0.06){
      rate_of_change = expo(rate_of_change);
      //console.log(rate_of_change * 1000);
      checkNod(rate_of_change, [len, heightFace / widthFace]);
      console.log(nodUp, nodDown);
      if (nodUp != nodDown)
        return rate_of_change * 1000;
    }
  }

  i += 1;
  return 0;
}

function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  if (results.multiFaceLandmarks) {
    for (const landmarks of results.multiFaceLandmarks) {

      window.scrollTo({ top: pageYOffset+faceRotation(landmarks), behavior: 'smooth' });
    
      drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION,
                     {color: '#C0C0C070', lineWidth: 1});
      drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYE, {color: '#FF3030'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYEBROW, {color: '#FF3030'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYE, {color: '#30FF30'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYEBROW, {color: '#30FF30'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_FACE_OVAL, {color: '#E0E0E0'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_LIPS, {color: '#E0E0E0'});
    }
  }

  canvasCtx.restore();
}
$(document).ready(function() {
  videoElement = document.getElementsByClassName('input_video')[0];
  canvasElement = document.getElementsByClassName('output_canvas')[0];
  canvasCtx = canvasElement.getContext('2d');

  videoElement.hidden = true;
  canvasElement.hidden = false;

  faceMesh = new FaceMesh({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
  }});
  faceMesh.setOptions({
    maxNumFaces: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });
  faceMesh.onResults(onResults);

  const camera = new Camera(videoElement, {
    onFrame: async () => {
      await faceMesh.send({image: videoElement});
    },
    width: 500,
    height: 500
  });
  camera.start();
});
