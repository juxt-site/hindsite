  // This is for extracting the access_token, if there is one,
  // from the URI fragment, displaying it and setting it in the
  // Authorization header for htmx requests.
  // const accessToken = new
  // URLSearchParams(location.hash.substring(1)).get("access_token");
  // if (accessToken) {
  // 	document.getElementById("access-token").setAttribute("value", accessToken);
  // }

  // for (const el of document.getElementsByClassName("authorized")) {
  // 	el.setAttribute("hx-headers",
  // 			JSON.stringify({"authorization": "Bearer " + accessToken}))
  // }

  // Configure your application and authorization server details
  const config = {
    client_id: "surveyor",
    redirect_uri: "https://surveyor.site.test/index.html",
    authorization_endpoint: "https://auth.site.test/oauth/authorize",
    token_endpoint: "https://auth.site.test/oauth/token",
    requested_scopes: ""
  };

  // Generate a secure random string using the browser crypto functions
  function generateRandomString() {
    const array = new Uint32Array(28);
    window.crypto.getRandomValues(array);
    return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
  }

  // Calculate the SHA256 hash of the input text.
  // Returns a promise that resolves to an ArrayBuffer
  function sha256(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return window.crypto.subtle.digest('SHA-256', data);
  }

  // Base64-urlencodes the input string
  function base64urlencode(str) {
    // Convert the ArrayBuffer to string using Uint8 array to convert to what btoa accepts.
    // btoa accepts chars only within ascii 0-255 and base64 encodes them.
    // Then convert the base64 encoded to base64url encoded
    //   (replace + with -, replace / with _, trim trailing =)
    return btoa(String.fromCharCode.apply(null, new Uint8Array(str)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  // Return the base64-urlencoded sha256 hash for the PKCE
  // challenge
  async function pkceChallengeFromVerifier(v) {
    const hashed = await sha256(v);
    return base64urlencode(hashed);
  }

  async function onClick() {

      // Create and store a random "state" value
    const initState = generateRandomString();
    localStorage.setItem("pkce_state", initState);
    console.log("initState:"+initState)

    // Create and store a new PKCE code_verifier (the plaintext random secret)
    const code_verifier = generateRandomString();
    localStorage.setItem("pkce_code_verifier", code_verifier);

    // Hash and base64-urlencode the secret to use as the challenge
    const code_challenge = await pkceChallengeFromVerifier(code_verifier);

    // Build the authorization URL
    const url = config.authorization_endpoint
      + "?response_type=code"
      + "&client_id="+encodeURIComponent(config.client_id)
      + "&state="+encodeURIComponent(initState)
      + "&scope="+encodeURIComponent(config.requested_scopes)
      + "&redirect_uri="+encodeURIComponent(config.redirect_uri)
      + "&code_challenge="+encodeURIComponent(code_challenge)
	  + "&code_challenge_method=S256";

    window.location = url;
  }

  // Make a POST request and parse the response as JSON
  // alx says use fetch
  export function sendPostRequest(url, params, success, error) {
    const request = new XMLHttpRequest();
    request.open('POST', url, true);
    request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    request.withCredentials = true;
    request.onload = function() {
        const body = {};
        try {
            body = JSON.parse(request.response);
        } catch(e) {}

        if (request.status >= 200 && request.status < 300) {
            success(request, body);
        } else {
            error(request, body);
        }
    }
    request.onerror = function() {
        error(request, {});
    }
    const body = Object.keys(params).map(key => key + '=' + params[key]).join('&');
    request.send(body);
  }

  document.getElementById("start").addEventListener("click", onClick);

  const params = new URLSearchParams(location.search.substring(1));

  const {error, code, state} = Object.fromEntries(params.entries());

  if (error) {
    alert("ERROR");
  }

  if (code) {

    console.log("state is"+ state);

  if(localStorage.getItem("pkce_state") !== state) {
    alert("Invalid state");
  } else {
    // Exchange the authorization code for an access token
    sendPostRequest(config.token_endpoint, {
      grant_type: "authorization_code",
      code: code,
      client_id: config.client_id,
      redirect_uri: config.redirect_uri,
      code_verifier: localStorage.getItem("pkce_code_verifier")
    }, function(request, body) {
      // Initialize your application now that you have an access token.
      // Here we just display it in the browser.
      alert("Token received!!!");
      document.getElementById("access_token").innerText = body.access_token;
      document.getElementById("start").classList = "hidden";
      document.getElementById("token").classList = "";

      // Replace the history entry to remove the auth code from the browser address bar
      window.history.replaceState({}, null, "/");

    }, function(request, error) {
      // This could be an error response from the OAuth server, or an error because the
      // request failed such as if the OAuth server doesn't allow CORS requests
      document.getElementById("error_details").innerText = error.error+"\n\n"+error.error_description;
      document.getElementById("error").classList = "";
    });
  }
}
