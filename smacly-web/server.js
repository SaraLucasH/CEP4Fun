const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();
const bodyparser = require('body-parser');

//Require by toastr
const toastr = require('express-toastr');
const flash = require('connect-flash');
const session = require('express-session');
const cookieParser = require('cookie-parser');

//Reload index with every http request
const socketIo = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Log
const fs = require('fs');

const logStream = fs.createWriteStream(path.join(__dirname+ '/logs/', `${new Date().toISOString().split('T')[0]}_server.log`), { flags: 'a', autoClose: true });

const originalLog = console.log;
const originalError = console.error;

console.log = function (...args) {
  logStream.write(`[LOG ${new Date().toISOString()}] ${args.join(' ')}\n`);
  originalLog.apply(console, args); // también imprime por consola
};

console.error = function (...args) {
  logStream.write(`[ERROR ${new Date().toISOString()}] ${args.join(' ')}\n`);
  originalError.apply(console, args); // también imprime por consola
};

app.use(bodyparser.json());

app.use(toastr());
app.use(express.static(path.join(__dirname)));
app.use('/scripts', express.static(__dirname + '/node_modules/http/'));


//Toaster
app.use(cookieParser('secret'));
app.use(session({
  secret: 'secret',
  saveUninitialized: true,
  resave: true
}));
app.use(flash());

app.use((req, res, next) => {
  // Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE",
  );

  // Request headers you wish to allow
  res.setHeader("Access-Control-Allow-Headers", "*");

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);

  res.locals.toasts = req.toastr.render();

  // Pass to next layer of middleware
  next();
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

//************DEP001************************** */

app.post('/validation-dep001', (req, res) => {
  JSON.safeStringify = (obj, indent = 2) => {
    let cache = [];
    const retVal = JSON.stringify(
      obj,
      (key, value) =>
        typeof value === "object" && value !== null
          ? cache.includes(value)
            ? undefined // Duplicate reference found, discard key
            : cache.push(value) && value // Store value in our collection
          : value,
      indent
    );
    cache = null;
    return retVal;
  };  
  var postBody = req.body;  
  
  Dep001_PostProcess(postBody); 

  //Response to external app
  res.sendStatus(200);
});


//TODO - Make this part of a different module
class PostProcessEventDep001 {
  constructor(e) {
    this.Timestamp = e.SmaclyDep001.Timestamp;
    this.IdSession = e.SmaclyDep001.IdSession;
    this.VersionDeprecated = e.SmaclyDep001.VersionDeprecated;
  }
}

function Dep001_PostProcess(jsonObj) {
  var result = new PostProcessEventDep001(jsonObj);

  console.log('Dep001 received: '+ JSON.stringify(result));
  // Emitir el mensaje a todos los clientes conectados
  if (result.VersionDeprecated == 1) io.emit('Toasts', { type : 'Warning', message:  'Compiler version is deprecated! Please use one greater than 0.5.0'});
}

//************ntd001************************** */

app.post('/validation-ntd001', (req, res) => {
  JSON.safeStringify = (obj, indent = 2) => {
    let cache = [];
    const retVal = JSON.stringify(
      obj,
      (key, value) =>
        typeof value === "object" && value !== null
          ? cache.includes(value)
            ? undefined // Duplicate reference found, discard key
            : cache.push(value) && value // Store value in our collection
          : value,
      indent
    );
    cache = null;
    return retVal;
  };
  var postBody = req.body;
  
  Ntd001_PostProcess(postBody); 

  //Response to external app
  res.sendStatus(200);
});

function Ntd001_PostProcess(jsonObj) {
  var result = new PostProcessEventNtd001(jsonObj);
  console.log('Ntd001 received: '+ JSON.stringify(result));

  if (result.State == 1){    
    io.emit('Toasts', { type : 'Warning', message:  'Var expression "'+ result.Name +'" does not have a value assigned. Please, assign a value to it.'});
    io.emit('Points', -5);
  } else if (result.State == 2){
    io.emit('Points', 20);
  }    
}

class PostProcessEventNtd001 {
  constructor(e) {
    this.Timestamp = e.SmaCly_ntd001.Timestamp;
    this.IdSession = e.SmaCly_ntd001.IdSession;
    this.Name = e.SmaCly_ntd001.Param1;
    this.State = e.SmaCly_ntd001.State;
  }
}

//************ntd002************************** */

app.post('/validation-ntd002', (req, res) => {
  JSON.safeStringify = (obj, indent = 2) => {
    let cache = [];
    const retVal = JSON.stringify(
      obj,
      (key, value) =>
        typeof value === "object" && value !== null
          ? cache.includes(value)
            ? undefined // Duplicate reference found, discard key
            : cache.push(value) && value // Store value in our collection
          : value,
      indent
    );
    cache = null;
    return retVal;
  };
  var postBody = req.body;

  Ntd002_PostProcess(postBody); 

  //Response to external app
  res.sendStatus(200);
});


//TODO - Make this part of a different module
class PostProcessEventNtd002 {
  constructor(e) {
    this.Timestamp = e.SmaCly_ntd002.Timestamp;
    this.IdSession = e.SmaCly_ntd002.IdSession;
    this.State = e.SmaCly_ntd002.State;
  }
}

function Ntd002_PostProcess(jsonObj) {
  var result = new PostProcessEventNtd002(jsonObj);
  console.log('Ntd002 received: '+  JSON.stringify(result));

  // Emitir el mensaje a todos los clientes conectados
  if (result.State == 1){
    io.emit('Toasts', { type : 'Info', message:  'More than 4 public functions. Please, review if they should be public.'});
    io.emit('Points', -10);
  } else if (result.State == 2){
    io.emit('Points', 50);
  }
}

//************ntd003************************** */

app.post('/validation-ntd003', (req, res) => {
  JSON.safeStringify = (obj, indent = 2) => {
    let cache = [];
    const retVal = JSON.stringify(
      obj,
      (key, value) =>
        typeof value === "object" && value !== null
          ? cache.includes(value)
            ? undefined // Duplicate reference found, discard key
            : cache.push(value) && value // Store value in our collection
          : value,
      indent
    );
    cache = null;
    return retVal;
  };
  var postBody = req.body;

  Ntd003_PostProcess(postBody); 

  //Response to external app
  res.sendStatus(200);
});


//TODO - Make this part of a different module
class PostProcessEventNtd003 {
  constructor(e) {
    this.Timestamp = e.SmaCly_ntd003.Timestamp;
    this.IdSession = e.SmaCly_ntd003.IdSession;
    this.Name = e.SmaCly_ntd003.Param1;
    this.State = e.SmaCly_ntd003.State;
  }
}

function Ntd003_PostProcess(jsonObj) {
  var result = new PostProcessEventNtd003(jsonObj);  
  console.log('Ntd003 received: '+ JSON.stringify(result));

  if (result.State == 1){
    io.emit('Toasts', { type : 'Error', message:  'Contract is not properly inheriting from interface.'});
    io.emit('Points', -10);
  } else if (result.State == 2){
    io.emit('Points', 50);
  }
}

//************ntd004************************** */

app.post('/validation-ntd004', (req, res) => {
  JSON.safeStringify = (obj, indent = 2) => {
    let cache = [];
    const retVal = JSON.stringify(
      obj,
      (key, value) =>
        typeof value === "object" && value !== null
          ? cache.includes(value)
            ? undefined // Duplicate reference found, discard key
            : cache.push(value) && value // Store value in our collection
          : value,
      indent
    );
    cache = null;
    return retVal;
  };
  var postBody = req.body;

  Ntd004_PostProcess(postBody); 

  //Response to external app
  res.sendStatus(200);
});


//TODO - Make this part of a different module
class PostProcessEventNtd004 {
  constructor(e) {
    this.Timestamp = e.SmaCly_ntd004.Timestamp;
    this.IdSession = e.SmaCly_ntd004.IdSession;
    this.Name = e.SmaCly_ntd004.Param1;
    this.State = e.SmaCly_ntd004.State;
  }
}

function Ntd004_PostProcess(jsonObj) {
  var result = new PostProcessEventNtd004(jsonObj);  
  console.log('Ntd004 received: '+ JSON.stringify(result));

  if (result.State == 1){    
    io.emit('Toasts', { type : 'Error', message:  'Contract is not properly inheriting from abstract contract.'});
    io.emit('Points', -10);
  } else if (result.State == 2){
    io.emit('Points', 50);
  }   
}

//************prg001************************** */

app.post('/validation-prg001', (req, res) => {
  JSON.safeStringify = (obj, indent = 2) => {
    let cache = [];
    const retVal = JSON.stringify(
      obj,
      (key, value) =>
        typeof value === "object" && value !== null
          ? cache.includes(value)
            ? undefined // Duplicate reference found, discard key
            : cache.push(value) && value // Store value in our collection
          : value,
      indent
    );
    cache = null;
    return retVal;
  };
  var postBody = req.body;
  if(postBody.Response == '1'){
    io.emit('Toasts', { type : 'Info', message:  'Are you still there?. Please, review the documentation or ask your tutor if you have any questions.'});
  }
  
  //Response to external app
  res.sendStatus(200);
});

//************prg002************************** */

app.post('/validation-prg002', (req, res) => {
  JSON.safeStringify = (obj, indent = 2) => {
    let cache = [];
    const retVal = JSON.stringify(
      obj,
      (key, value) =>
        typeof value === "object" && value !== null
          ? cache.includes(value)
            ? undefined // Duplicate reference found, discard key
            : cache.push(value) && value // Store value in our collection
          : value,
      indent
    );
    cache = null;
    return retVal;
  };

  var postBody = req.body;
  
  Prg002_PostProcess(postBody.SmaCly_prg002); 

  //Response to external app
  res.sendStatus(200);
});

function Prg002_PostProcess(jsonObj) {
  var result = new PostProcessEventPrg00X(jsonObj);
  console.log('Prg002 received: '+ JSON.stringify(result));

  if (result.State == 1){    
    io.emit('Toasts', { type : 'Info', message:  'Compiler version should be defined.'});
    io.emit('Points', -5);
  } else if (result.State == 2){
    io.emit('Points', 20);
  }  
}


//************prg003************************** */

app.post('/validation-prg003', (req, res) => {
  JSON.safeStringify = (obj, indent = 2) => {
    let cache = [];
    const retVal = JSON.stringify(
      obj,
      (key, value) =>
        typeof value === "object" && value !== null
          ? cache.includes(value)
            ? undefined // Duplicate reference found, discard key
            : cache.push(value) && value // Store value in our collection
          : value,
      indent
    );
    cache = null;
    return retVal;
  };

  var postBody = req.body;

  Prg003_PostProcess(postBody.SmaCly_prg003); 

  //Response to external app
  res.sendStatus(200);
});

function Prg003_PostProcess(jsonObj) {
  var result = new PostProcessEventPrg00X(jsonObj);
  console.log('Prg003 received: '+ JSON.stringify(result));

  if (result.State == 1){
    io.emit('Toasts', { type : 'Warning', message:  'Function "'+ result.Name +'" does not have a body assigned. Please, assign a value to it.'});
    io.emit('Points', -5);
  } else if (result.State == 2){
    io.emit('Points', 30);
  }  
}

class PostProcessEventPrg00X {
  constructor(e) {
    this.Timestamp = e.Timestamp;
    this.IdSession = e.IdSession;
    this.Name = e.Param1;
    this.State = e.State;
  }
}

//************prg004************************** */

app.post('/validation-prg004', (req, res) => {
  JSON.safeStringify = (obj, indent = 2) => {
    let cache = [];
    const retVal = JSON.stringify(
      obj,
      (key, value) =>
        typeof value === "object" && value !== null
          ? cache.includes(value)
            ? undefined // Duplicate reference found, discard key
            : cache.push(value) && value // Store value in our collection
          : value,
      indent
    );
    cache = null;
    return retVal;
  };
  var postBody = req.body;

  Prg004_PostProcess(postBody.SmaCly_prg004); 

  //Response to external app
  res.sendStatus(200);
});

function Prg004_PostProcess(jsonObj) {
  var result = new PostProcessEventPrg00X(jsonObj);
  console.log('Prg004 received: '+ JSON.stringify(result));

  if (result.State == 1){
    io.emit('Toasts', { type : 'Warning', message:  'Modifier "'+ result.Name +'" does not have a body assigned. Please, assign a value to it.'});
    io.emit('Points', -5);
  } else if (result.State == 2){
    io.emit('Points', 30);
  }    
}

//************ SYE001 SYE002 SYE003 SYE004 ************************** */

app.post('/validation-sye001', (req, res) => {
  JSON.safeStringify = (obj, indent = 2) => {
    let cache = [];
    const retVal = JSON.stringify(
      obj,
      (key, value) =>
        typeof value === "object" && value !== null
          ? cache.includes(value)
            ? undefined // Duplicate reference found, discard key
            : cache.push(value) && value // Store value in our collection
          : value,
      indent
    );
    cache = null;
    return retVal;
  };
  var postBody = req.body;

  Sye001_PostProcess(postBody); 

  //Response to external app
  res.sendStatus(200);
});

function Sye001_PostProcess(jsonObj) {
  var result = new PostProcessEventSye001(jsonObj);  
  console.log('Sye001 received: '+ JSON.stringify(result));

  if (result.State == 1){    
    io.emit('Toasts', { type : 'Error', message:  'Invalid compiler version. Please you should define one.'});
    io.emit('Points', -5);
  } else if (result.State == 2){
    io.emit('Points', 20);
  }    
}

class PostProcessEventSye001 {
  constructor(e) {
    this.Timestamp = e.SmaCly_sye001.Timestamp;
    this.IdSession = e.SmaCly_sye001.IdSession;
    this.Name = e.SmaCly_sye001.Param1;
    this.State = e.SmaCly_sye001.State;
  }
}

app.post('/validation-sye002', (req, res) => {
  JSON.safeStringify = (obj, indent = 2) => {
    let cache = [];
    const retVal = JSON.stringify(
      obj,
      (key, value) =>
        typeof value === "object" && value !== null
          ? cache.includes(value)
            ? undefined // Duplicate reference found, discard key
            : cache.push(value) && value // Store value in our collection
          : value,
      indent
    );
    cache = null;
    return retVal;
  };
  var postBody = req.body;
  
  SyeEvent_ItemDuplicated_PostProcess(postBody.SmaCly_sye002, "interface", "Sye002"); 

  //Response to external app
  res.sendStatus(200);
});

app.post('/validation-sye003', (req, res) => {
  JSON.safeStringify = (obj, indent = 2) => {
    let cache = [];
    const retVal = JSON.stringify(
      obj,
      (key, value) =>
        typeof value === "object" && value !== null
          ? cache.includes(value)
            ? undefined // Duplicate reference found, discard key
            : cache.push(value) && value // Store value in our collection
          : value,
      indent
    );
    cache = null;
    return retVal;
  };
  var postBody = req.body;

  SyeEvent_ItemDuplicated_PostProcess(postBody.SmaCly_sye003, "library", "Sye003"); 

  //Response to external app
  res.sendStatus(200);
});

app.post('/validation-sye004', (req, res) => {
  JSON.safeStringify = (obj, indent = 2) => {
    let cache = [];
    const retVal = JSON.stringify(
      obj,
      (key, value) =>
        typeof value === "object" && value !== null
          ? cache.includes(value)
            ? undefined // Duplicate reference found, discard key
            : cache.push(value) && value // Store value in our collection
          : value,
      indent
    );
    cache = null;
    return retVal;
  };
  var postBody = req.body;

  SyeEvent_ItemDuplicated_PostProcess(postBody.SmaCly_sye004, "contract","Sye004"); 

  //Response to external app
  res.sendStatus(200);
});

function SyeEvent_ItemDuplicated_PostProcess(jsonObj, type, topic) {
  var result = new PostProcessEventSyeDuplicatedItem(jsonObj);
  console.log(`${topic} received: ` + JSON.stringify(result));

  if (result.State == 1){
    io.emit('Toasts', { type : 'Warning', message:  `"${result.Name}" ${type} is duplicated. Please, rename these items.`});
    io.emit('Points', -5);
  } else if (result.State == 2){
    io.emit('Points', 30);
  }
}

class PostProcessEventSyeDuplicatedItem {
  constructor(e) {
    this.Timestamp = e.Timestamp;
    this.IdSession = e.IdSession;
    this.Name = e.Param1;
    this.State = e.State;
  }
}

//********* END SYE00X */

//************* SCE00X */
app.post('/validation-sce002', (req, res) => {
  JSON.safeStringify = (obj, indent = 2) => {
    let cache = [];
    const retVal = JSON.stringify(
      obj,
      (key, value) =>
        typeof value === "object" && value !== null
          ? cache.includes(value)
            ? undefined // Duplicate reference found, discard key
            : cache.push(value) && value // Store value in our collection
          : value,
      indent
    );
    cache = null;
    return retVal;
  };
  var postBody = req.body;

  Sce002_PostProcess(postBody); 

  //Response to external app
  res.sendStatus(200);
});

function Sce002_PostProcess(jsonObj, type) {
  var result = new PostProcessEventSce002(jsonObj);
  console.log('Sce002 received: '+ JSON.stringify(result));

  if (result.State == 1){
    io.emit('Toasts', { type : 'Warning', message:  `Missing error handling in "${result.Name}" ${type}. Please, add any require or modifier block.`});
    io.emit('Points', -5);
  } else if (result.State == 2){
    io.emit('Points', 40);
  }
}

//TODO - Make this part of a different module
class PostProcessEventSce002{
  constructor(e) {
    this.Timestamp = e.SmaCly_sce002.Timestamp;
    this.IdSession = e.SmaCly_sce002.IdSession;
    this.Name = e.SmaCly_sce002.Param1;
    this.State = e.SmaCly_sce002.State;
  }
}

app.post('/validation-sce003', (req, res) => {
  JSON.safeStringify = (obj, indent = 2) => {
    let cache = [];
    const retVal = JSON.stringify(
      obj,
      (key, value) =>
        typeof value === "object" && value !== null
          ? cache.includes(value)
            ? undefined // Duplicate reference found, discard key
            : cache.push(value) && value // Store value in our collection
          : value,
      indent
    );
    cache = null;
    return retVal;
  };
  var postBody = req.body;

  Sce003_PostProcess(postBody); 

  //Response to external app
  res.sendStatus(200);
});


//TODO - Make this part of a different module
class PostProcessEventSce003 {
  constructor(e) {
    this.Timestamp = e.SmaCly_sce003.Timestamp;
    this.IdSession = e.SmaCly_sce003.IdSession;
    this.State = e.SmaCly_sce003.State;
    this.Name = e.SmaCly_sce003.Param1;
  }
}

function Sce003_PostProcess(jsonObj) {
  var result = new PostProcessEventSce003(jsonObj);
  console.log('Ntd002 received: '+  JSON.stringify(result));

  // Emitir el mensaje a todos los clientes conectados
  if (result.State == 1){
    io.emit('Toasts', { type : 'Warning', message:  `Function "${result.Name}" should have modifiers. Please, add modifiers as "onlyOwner()"`});
    io.emit('Points', -5);
  } else if (result.State == 2){
    io.emit('Points', 40);
  }
}

app.post('/validation-sce005', (req, res) => {
  JSON.safeStringify = (obj, indent = 2) => {
    let cache = [];
    const retVal = JSON.stringify(
      obj,
      (key, value) =>
        typeof value === "object" && value !== null
          ? cache.includes(value)
            ? undefined // Duplicate reference found, discard key
            : cache.push(value) && value // Store value in our collection
          : value,
      indent
    );
    cache = null;
    return retVal;
  };
  var postBody = req.body;

  Sce005_PostProcess(postBody); 

  //Response to external app
  res.sendStatus(200);
});

function Sce005_PostProcess(jsonObj) {
  var result = new PostProcessEventSce005(jsonObj);
  console.log('Sce005 received: '+ JSON.stringify(result));

  if (result.State == 1){
    io.emit('Toasts', { type : 'Warning', message:  `Compiler version should be upper than 0.8.0 to avoid integer overflow.`});
    io.emit('Points', -5);
  } else if (result.State == 2){
    io.emit('Points', 40);
  }
}

//TODO - Make this part of a different module
class PostProcessEventSce005{
  constructor(e) {
    this.Timestamp = e.SmaCly_sce005.Timestamp;
    this.IdSession = e.SmaCly_sce005.IdSession;
    this.Name = e.SmaCly_sce005.Param1;
    this.State = e.SmaCly_sce005.State;
  }
}

app.post('/validation-sce006', (req, res) => {
  JSON.safeStringify = (obj, indent = 2) => {
    let cache = [];
    const retVal = JSON.stringify(
      obj,
      (key, value) =>
        typeof value === "object" && value !== null
          ? cache.includes(value)
            ? undefined // Duplicate reference found, discard key
            : cache.push(value) && value // Store value in our collection
          : value,
      indent
    );
    cache = null;
    return retVal;
  };
  var postBody = req.body;

  Sce006_PostProcess(postBody); 

  //Response to external app
  res.sendStatus(200);
});

function Sce006_PostProcess(jsonObj) {
  var result = new PostProcessEventSce006(jsonObj);
  console.log('Sce006 received: '+ JSON.stringify(result));

  if (result.State == 1){
    io.emit('Toasts', { type : 'Warning', message:  `Use libraries like SafeMath to avoid integer overflow.`});
    io.emit('Points', -5);
  } else if (result.State == 2){
    io.emit('Points', 40);
  }
}

//TODO - Make this part of a different module
class PostProcessEventSce006{
  constructor(e) {
    this.Timestamp = e.SmaCly_sce006.Timestamp;
    this.IdSession = e.SmaCly_sce006.IdSession;
    this.Name = e.SmaCly_sce006.Param1;
    this.State = e.SmaCly_sce006.State;
  }
}

/************** END SCE00X */

server.listen(process.env.PORT, () => {
  console.log('Server started on port ' + process.env.PORT);
});
