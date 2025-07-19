const HTTPMethod = Object.freeze({
  POST : 'POST',
	GET : 'GET',
});

/** 
 * @param {string} hostName - Host Name
 * @param {number} port - Port 
 * @param {string} topic - Topic = kind of event 
 * @param {any} requestContent - Request parameter to be converted in JSON 
 */
function buildHttpPost(hostName, port, topic, requestContent, path){
  //TODO - Use enum for method parameter
  return buildhttpRequest('POST', hostName, path, port, topic, requestContent);
}

/** 
 * @param {string} hostName - Host Name
 * @param {number} port - Port 
 * @param {string} path - Topic = kind of event  
 */
function buildHttpGet(hostName, port, topic, path){
  return buildhttpRequest('GET', hostName, path, port, topic);
}

/**
 * @param {HTTPMethod} httpMethod - Http method
 * @param {string} hostName - Host Name
 * @param {number} port - Port 
 * @param {string} topic - Topic = kind of event 
 */
function buildhttpRequest(httpMethod, hostName, path, port, topic, jsonFile){
  
  var xhr = new XMLHttpRequest();
  var url = 'http://'.concat(hostName,':', port, path);
  
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

