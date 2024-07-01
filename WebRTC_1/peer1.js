let localStream;
let remoteStream;
let peerConnection;
const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');

startButton.onclick = async () => {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;
};

callButton.onclick = async () => {
    peerConnection = new RTCPeerConnection(configuration);
    peerConnection.onicecandidate = ({ candidate }) => {
        candidate && console.log(candidate);
        candidate && sendSignal({ candidate });
    };
    peerConnection.ontrack = event => remoteVideo.srcObject = event.streams[0];
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    sendSignal({ description: peerConnection.localDescription });
};

hangupButton.onclick = () => {
    peerConnection.close();
};

const sendSignal = async (message) => {
    // Simulating signaling server with localStorage
    localStorage.setItem('peer1', JSON.stringify(message));
};

// Listen for signaling messages
window.addEventListener('storage', async (event) => {
    if (event.key === 'peer2') {
        const message = JSON.parse(event.newValue);
        if (message.description) {
            await peerConnection.setRemoteDescription(message.description);
            if (message.description.type === 'offer') {
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);
                sendSignal({ description: peerConnection.localDescription });
            }
        } else if (message.candidate) {
            await peerConnection.addIceCandidate(message.candidate);
        }
    }
});
