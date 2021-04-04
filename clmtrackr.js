var videoElement;
var canvasElement;
var canvasCtx;
var faceMesh;

var nodUp = false, nodDown = false;
var previousY;
var i = 1;
var startTime, timeDifference, len;
var rate_of_change;

var startLen;
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
  // верт. ось лица
  var v152 = {x: landmarks[152]["x"], y: landmarks[152]["y"]};
  var v10 =  {x: landmarks[10]["x"],  y: landmarks[10]["y"]};

  // горизон. ось лица
  var v234 = {x: landmarks[234]["x"], y: landmarks[234]["y"]};
  var v454 = {x: landmarks[454]["x"], y: landmarks[454]["y"]};

  const heightFace = Math.sqrt((v152.x - v10.x)*(v152.x - v10.x) + (v152.y - v10.y)*(v152.y - v10.y));
  const widthFace = Math.sqrt((v234.x - v454.x)*(v234.x - v454.x) + (v234.y - v454.y)*(v234.y - v454.y));

  // угол наклона вправо, влево 
  // v454 = {x: landmarks[454]["x"] - landmarks[234]["x"], y: landmarks[454]["y"] - landmarks[234]["y"]};
  // const productVector = v454.x * 0 + v454.y * 1;
  // const productLenVector = 1 * Math.sqrt(v454.x*v454.x + v454.y*v454.y);
  // var angleRotation = Math.acos(productVector / productLenVector);
  // angleRotation = (angleRotation * 180) / Math.PI;
  // console.log(angleRotation)
  // if (90 - angleRotation > 10)
  //   return "up";
  // if (90 - angleRotation < -10)
  //   return "down";


  if (i == 1){
    startLen = heightFace / widthFace;
  }
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
    rate_of_change = expo(rate_of_change);
    checkNod(rate_of_change, [len, heightFace / widthFace]);

    if (rate_of_change < 0.08 || rate_of_change > - 0.08){
      if (Math.abs(heightFace/widthFace - startLen) < 0.02 && nodUp == false){
        console.log("static head");
        //return 0;
      }
    }
    if (nodDown == nodUp){
      //return 0;
    }
    if (nodUp){
      console.log("up");
      //return "up";
    }
    if (nodDown){
      console.log("down");
      //return "down";
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

      if (faceRotation(landmarks) == "up")
        window.scrollTo({ top: pageYOffset-100, behavior: 'smooth' });
      if (faceRotation(landmarks) == "down")
        window.scrollTo({ top: pageYOffset+100, behavior: 'smooth' });
    
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

  videoElement.hidden = false;
  canvasElement.hidden = true;

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
