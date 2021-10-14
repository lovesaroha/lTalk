/*  Love Saroha
    lovesaroha1994@gmail.com (email address)
    https://www.lovesaroha.com (website)
    https://github.com/lovesaroha  (github)
*/
// All functions related to user.
// User and default variables defined.
let user = { emailAddress: "", _id: 0, socket: {}, peerConnection: null };

// Get user email from local storage.
if (localStorage.getItem("user-data") != null) {
     user.emailAddress = JSON.parse(localStorage.getItem("user-data")).emailAddress;
}

// Check if user is logged.
function isLogged() {
     if (!isEmail(user.emailAddress)) {
          // User not logged in.
          window.location = "/#/login";
          return false;
     }
     return true;
}

// User sign in function to register user's email address.
function signIn(e) {
     e.preventDefault();
     user.emailAddress = e.target.emailAddress.value;
     localStorage.setItem("user-data", JSON.stringify({ emailAddress: user.emailAddress }));
     window.location = '/#/';
}

// Set default.
function setDefault() {
     user = { emailAddress: "", _id: 0, socket: {}, peerConnection: null };
     callTo = null;
     transceiver = null;
     webcamStream = null;
}