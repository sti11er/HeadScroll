var videoElement;
var canvasElement;
var canvasCtx;
var faceMesh;

function faceRotation(landmarks)
{
  // горизон. ось лица
  var v454 = {x: landmarks[454]["x"], y: landmarks[454]["y"]};

  // угол наклона вправо, влево 
  v454 = {x: landmarks[454]["x"] - landmarks[234]["x"], y: landmarks[454]["y"] - landmarks[234]["y"]};
  const productVector = v454.x * 0 + v454.y * 1;
  const productLenVector = 1 * Math.sqrt(v454.x*v454.x + v454.y*v454.y);
  var angleRotation = Math.acos(productVector / productLenVector);
  angleRotation = (angleRotation * 180) / Math.PI;
  if (90 - angleRotation > 10)
    return "up";
  if (90 - angleRotation < -10)
    return "down";
  return 0;
}

function onResults(results) {

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  if (results.multiFaceLandmarks) {
    for (const landmarks of results.multiFaceLandmarks) {

      if (faceRotation(landmarks) == "up")
        window.scrollTo({ top: pageYOffset-50, behavior: 'smooth' });
      if (faceRotation(landmarks) == "down")
        window.scrollTo({ top: pageYOffset+50, behavior: 'smooth' });
    
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
