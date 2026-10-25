const HTTPMethod = Object.freeze({
  POST : 'POST',
	GET : 'GET',
});

/**
 * @param {string} topic - Topic = kind of event
 * @param {any} requestContent - Request parameter to be converted in JSON
 */
function buildHttpPost(topic, requestContent, path){
  //TODO - Use enum for method parameter
  return buildhttpRequest('POST', path, topic, requestContent);
}

/**
 * @param {string} path - Topic = kind of event
 */
function buildHttpGet(topic, path){
  return buildhttpRequest('GET', path, topic);
}

/**
 * @param {HTTPMethod} httpMethod - Http method
 * @param {string} topic - Topic = kind of event
 */
function buildhttpRequest(httpMethod, path, topic, jsonFile){

  var xhr = new XMLHttpRequest();
  // Mismo origen: smacly-web reenvía /webhook a n8n (server.js)
  var url = '/webhook'.concat(path);
  
  xhr.open(httpMethod, url, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  /*xhr.setRequestHeader("access-control-allow-origin","*");
  
  xhr.setRequestHeader('Access-Control-Allow-Origin', '*');*/
  var message = new NodeRedEvent(jsonFile, topic);
  var postData = JSON.stringify(message);
  xhr.onload = () => {
    if (xhr.readyState == 4 && xhr.status == 200) {
      //console.log(JSON.parse(xhr.responseText));
      return xhr.response;
    } else {
      console.log(`Error: ${xhr.status}`);
      return xhr.response;
    }
  };
  console.log(topic +' sent');
  xhr.send(postData);
}


class NodeRedEvent{
  constructor (payload, topic) {
    this.topic = topic;
    this.payload = payload;       
  }
}

