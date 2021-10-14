/*  Love Saroha
    lovesaroha1994@gmail.com (email address)
    https://www.lovesaroha.com (website)
    https://github.com/lovesaroha  (github)
*/
// All functions related to routing.
let appRoutes = {};

// Initialize router function.
function initializeRouter(e) {
     e.preventDefault();
     let url = window.location.toString().replace(window.location.origin, "").split("?");
     if (url[0] == "/") { url[0] = "/#/"; }
     if (appRoutes[url[0]] == undefined) {
          window.location = "/#/";
          return;
     }
     let urlParameters = {};
     if (url[1] != undefined) {
          // Assign url parameters values.
          let params = url[1].split("&");
          for (let k = 0; k < params.length; k++) {
               let paramsPair = params[k].split("=");
               if (paramsPair.length != 2) { continue; }
               urlParameters[paramsPair[0]] = paramsPair[1];
          }
     }
     // Prepare application.
     document.querySelector(`html`).scrollTop = 0;
     appRoutes[url[0]](urlParameters);
}

// Run router function on page change.
window.addEventListener("load", initializeRouter, false);
window.addEventListener("popstate", initializeRouter, false);
let view = document.getElementById("view_id");

// Home page.
appRoutes["/#/"] = function () {
     if (!isLogged()) { return; }
     view.innerHTML = document.getElementById("homePageTemplate_id").innerHTML;
     document.getElementById("userInfo_id").innerHTML = `<h3 class="text-subtitle mb-0 self-center truncate"><i class="fad fa-envelope icon-primary"></i> ${user.emailAddress}</h3><a class="self-center" href="/#/login">Change</a>`;
     initializeWebSocket();
}

// Login page.
appRoutes["/#/login"] = function () {
     view.innerHTML = document.getElementById("loginPageTemplate_id").innerHTML;
     setDefault();
}
