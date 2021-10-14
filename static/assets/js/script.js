"use strict";
// Check environment.
let host = "localhost";
let socketURL = "ws://localhost:3004?email=";

// Web cam config.
var webcamConfig = {
     audio: true,
     video: {
          aspectRatio: {
               ideal: 1.3
          }
     }
};

// Default values.
var callTo = null;
let transceiver = null;
let webcamStream = null;

// Send message to server.
function sendMessage(message) {
     user.socket.send(JSON.stringify(message));
}

// Initialize web socket.
function initializeWebSocket() {
     user.socket = new WebSocket(socketURL + user.emailAddress, "json");
     user.socket.onerror = function (e) {
          window.location = "/#/login";
     }
     user.socket.onmessage = function (evt) {
          var msg = JSON.parse(evt.data);
          switch (msg.type) {
               case "videoCall":
                    handleVideoCall(msg);
                    break;
               case "answerCall":
                    handleAnswerCall(msg);
                    break;
               case "userOnline":
                    callTo = msg.emailAddress;
                    makeCall();
                    break;
               case "alreadyOnline":
                    window.location = "/#/login";
                    break;
               case "newICECandidate":
                    handleNewICECandidate(msg);
                    break;
          }
     };
}

// Create peer connection.
async function createPeerConnection() {
     user.peerConnection = new RTCPeerConnection({
          iceServers: [
               {
                    urls: "turn:" + host,
                    username: "webrtc",
                    credential: "turnserver"
               }
          ]
     });
     user.peerConnection.onicecandidate = handleICECandidateEvent;
     user.peerConnection.oniceconnectionstatechange = handleICEConnectionStateChangeEvent;
     user.peerConnection.onsignalingstatechange = handleSignalingStateChangeEvent;
     user.peerConnection.onnegotiationneeded = handleNegotiationNeededEvent;
     user.peerConnection.ontrack = handleTrackEvent;
}

// Negotiation event.
async function handleNegotiationNeededEvent() {
     const callOffer = await user.peerConnection.createOffer();
     if (user.peerConnection.signalingState != "stable") {
          return;
     }
     await user.peerConnection.setLocalDescription(callOffer);
     sendMessage({
          emailAddress: user.emailAddress,
          to: callTo,
          type: "videoCall",
          sdp: user.peerConnection.localDescription
     });
}

// Track event.
function handleTrackEvent(event) {
     document.getElementById("other_video_id").srcObject = event.streams[0];
}

// Candidate event.
function handleICECandidateEvent(event) {
     if (event.candidate) {
          sendMessage({
               type: "newICECandidate",
               to: callTo,
               candidate: event.candidate
          });
     }
}

// State changed.
function handleICEConnectionStateChangeEvent(event) {
     switch (user.peerConnection.iceConnectionState) {
          case "closed":
          case "failed":
          case "disconnected":
               closeVideoCall();
               break;
     }
}

// Signaling state changed.
function handleSignalingStateChangeEvent(event) {
     switch (user.peerConnection.signalingState) {
          case "closed":
               closeVideoCall();
               break;
     }
}

// Close video call.
function closeVideoCall() {
     var localVideo = document.getElementById("my_video_id");
     if (user.peerConnection) {
          user.peerConnection.ontrack = null;
          user.peerConnection.onnicecandidate = null;
          user.peerConnection.oniceconnectionstatechange = null;
          user.peerConnection.onsignalingstatechange = null;
          user.peerConnection.onicegatheringstatechange = null;
          user.peerConnection.onnotificationneeded = null;
          user.peerConnection.getTransceivers().forEach(transceiver => {
               transceiver.stop();
          });
          if (localVideo.srcObject) {
               localVideo.pause();
               localVideo.srcObject.getTracks().forEach(track => {
                    track.stop();
               });
          }
          user.peerConnection.close();
          user.peerConnection = null;
          webcamStream = null;
     }
     callTo = null;
}

// Make video call.
async function makeCall() {
     if (user.peerConnection) { return; }
     document.getElementById("makeCall_id").className = "hidden";
     closeModal();
     createPeerConnection();
     try {
          webcamStream = await navigator.mediaDevices.getUserMedia(webcamConfig);
          document.getElementById("my_video_id").srcObject = webcamStream;
     } catch (err) {
          handleWebcamError(err);
          return;
     }
     try {
          webcamStream.getTracks().forEach(
               transceiver = track => user.peerConnection.addTransceiver(track, { streams: [webcamStream] })
          );
     } catch (err) {
          handleWebcamError(err);
     }
}

// Handle video call.
async function handleVideoCall(msg) {
     callTo = msg.emailAddress;
     if (!user.peerConnection) {
          createPeerConnection();
     }
     var desc = new RTCSessionDescription(msg.sdp);
     if (user.peerConnection.signalingState != "stable") {
          await Promise.all([
               user.peerConnection.setLocalDescription({ type: "rollback" }),
               user.peerConnection.setRemoteDescription(desc)
          ]);
          return;
     }
     await user.peerConnection.setRemoteDescription(desc);
     if (!webcamStream) {
          try {
               webcamStream = await navigator.mediaDevices.getUserMedia(webcamConfig);
          } catch (err) {
               handleWebcamError(err);
               return;
          }
          document.getElementById("my_video_id").srcObject = webcamStream;
          try {
               webcamStream.getTracks().forEach(
                    transceiver = track => user.peerConnection.addTransceiver(track, { streams: [webcamStream] })
               );
          } catch (err) {
               handleWebcamError(err);
          }
     }
     await user.peerConnection.setLocalDescription(await user.peerConnection.createAnswer());
     sendMessage({
          emailAddress: user.emailAddress,
          to: callTo,
          type: "answerCall",
          sdp: user.peerConnection.localDescription
     });
}

// Answer video call.
async function handleAnswerCall(msg) {
     document.getElementById("makeCall_id").className = "hidden";
     var desc = new RTCSessionDescription(msg.sdp);
     await user.peerConnection.setRemoteDescription(desc).catch(reportError);
}

async function handleNewICECandidate(msg) {
     var candidate = new RTCIceCandidate(msg.candidate);
     try {
          await user.peerConnection.addIceCandidate(candidate)
     } catch (err) {
          console.log(err);
     }
}

// Handle webcam error.
function handleWebcamError(e) {
     switch (e.name) {
          case "NotFoundError":
               showModal(`<div class="bg-modal fade-in modal-content mx-auto mt-10 overflow-hidden p-4 shadow-xl sm:max-w-lg sm:w-full"><center>
               <i class="fad fa-envelope fa-5x mb-1 text-primary"></i> <h1 class="mb-0 font-bold">Error</h1>
               <h4 class="text-subtitle">Unable to open your call because no camera and/or microphone: ${e.message}</h4></center></div>`);
               break;
          case "SecurityError":
          case "PermissionDeniedError":
               break;
          default:
               showModal(`<div class="bg-modal fade-in modal-content mx-auto mt-10 overflow-hidden p-4 shadow-xl sm:max-w-lg sm:w-full"><center>
               <i class="fad fa-envelope fa-5x mb-1 text-primary"></i> <h1 class="mb-0 font-bold">Error</h1>
               <h4 class="text-subtitle">Error opening your camera and/or microphone: ${e.message}</h4></center></div>`);
               break;
     }
     closeVideoCall();
}

// This function shows make call form.
function showMakeCallForm() {
     showModal(`<div class="bg-modal fade-in modal-content mx-auto mt-10 overflow-hidden p-4 shadow-xl sm:max-w-lg sm:w-full">
     <form onsubmit="javascript: makeCallTo(event);">
     <div class="bg-light max-w-md p-2 mb-2">
     <h4 class="text-gray mb-0">Enter email address to make a call</h4>
     </div>
     <input class="w-full mb-2" type="email" placeholder="Email address.." name="emailAddress">
     <button name="submit" type="submit">Call</button>
     </form></div>`);
}

// This function make call and check user is online.
function makeCallTo(e) {
     e.preventDefault();
     sendMessage({ type: "isOnline", emailAddress: e.target.emailAddress.value });
}