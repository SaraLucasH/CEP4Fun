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

const compilerProxy = require('./compilerProxy');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Log
const fs = require('fs');

const logStream = fs.createWriteStream(path.join(__dirname + '/logs/', `${new Date().toISOString().split('T')[0]}_server.log`), { flags: 'a', autoClose: true });

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

//Toaster
app.use(cookieParser('secret'));
app.use(session({
  secret: 'secret',
  saveUninitialized: true,
  resave: true
}));
app.use(flash());

// La app (index.html) requiere haber iniciado sesión contra el backend "compilador".
// Se comprueba ANTES del middleware estático para que este no sirva el fichero directamente.
app.get(['/', '/index.html'], (req, res, next) => {
  if (!req.session.compiladorCookie) {
    return res.redirect('/login.html');
  }
  next();
});

//app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/scripts', express.static(__dirname + '/node_modules/http/'));
// Otros recursos si están fuera de public
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/resources', express.static(path.join(__dirname, 'resources')));

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
  res.set('Cache-Control', 'no-store'); // evitar cache
  const stringIndex = path.join(__dirname, 'public', 'index.html');
  console.log(stringIndex);
  res.sendFile(stringIndex);
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

  console.log('Dep001 received: ' + JSON.stringify(result));
  // Emitir el mensaje a todos los clientes conectados
  if (result.VersionDeprecated == 1) {
    io.emit('Toasts', {
      type: 'Warning',
      message: 'toasts.dep001_deprecatedCompiler'
    });
  }
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
  console.log('Ntd001 received: ' + JSON.stringify(result));

  if (result.State == 1) {
    io.emit('Toasts', {
      type: 'Warning',
      message: 'toasts.ntd001_varWithoutValue',
      params: { name: result.Name }
    });
    io.emit('Points', -5);
  } else if (result.State == 2) {
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
  console.log('Ntd002 received: ' + JSON.stringify(result));

  // Emitir el mensaje a todos los clientes conectados
  if (result.State == 1) {
    io.emit('Toasts', {
      type: 'Info',
      message: 'toasts.ntd002_tooManyPublicFunctions'
    });
    io.emit('Points', -10);
  } else if (result.State == 2) {
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
  console.log('Ntd003 received: ' + JSON.stringify(result));

  if (result.State == 1) {
    io.emit('Toasts', {
      type: 'Error',
      message: 'toasts.ntd003_interfaceInheritance'
    });
    io.emit('Points', -10);
  } else if (result.State == 2) {
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
  console.log('Ntd004 received: ' + JSON.stringify(result));

  if (result.State == 1) {
    io.emit('Toasts', {
      type: 'Error',
      message: 'toasts.ntd004_abstractInheritance'
    });
    io.emit('Points', -10);
  } else if (result.State == 2) {
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
  if (postBody.Response == '1') {
    io.emit('Toasts', {
      type: 'Info',
      message: 'toasts.prg001_areYouThere'
    });
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
  console.log('Prg002 received: ' + JSON.stringify(result));

  if (result.State == 1) {
    io.emit('Toasts', {
      type: 'Info',
      message: 'toasts.prg002_compilerNotDefined'
    });
    io.emit('Points', -5);
  } else if (result.State == 2) {
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
  console.log('Prg003 received: ' + JSON.stringify(result));

  if (result.State == 1) {
    io.emit('Toasts', {
      type: 'Warning',
      message: 'toasts.prg003_functionWithoutBody',
      params: { name: result.Name }
    });
    io.emit('Points', -5);
  } else if (result.State == 2) {
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
  console.log('Prg004 received: ' + JSON.stringify(result));

  if (result.State == 1) {
    io.emit('Toasts', {
      type: 'Warning',
      message: 'toasts.prg004_modifierWithoutBody',
      params: { name: result.Name }
    });
    io.emit('Points', -5);
  } else if (result.State == 2) {
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
  console.log('Sye001 received: ' + JSON.stringify(result));

  if (result.State == 1) {
    io.emit('Toasts', {
      type: 'Error',
      message: 'toasts.sye001_invalidCompiler'
    });
    io.emit('Points', -5);
  } else if (result.State == 2) {
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

  SyeEvent_ItemDuplicated_PostProcess(postBody.SmaCly_sye004, "contract", "Sye004");

  //Response to external app
  res.sendStatus(200);
});

function SyeEvent_ItemDuplicated_PostProcess(jsonObj, type, topic) {
  var result = new PostProcessEventSyeDuplicatedItem(jsonObj);
  console.log(`${topic} received: ` + JSON.stringify(result));

  if (result.State == 1) {
    io.emit('Toasts', {
      type: 'Warning',
      message: 'toasts.sye_duplicateItem',
      params: { name: result.Name, type }
    });
    io.emit('Points', -5);
  } else if (result.State == 2) {
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
  console.log('Sce002 received: ' + JSON.stringify(result));

  if (result.State == 1) {
    io.emit('Toasts', {
      type: 'Warning',
      message: 'toasts.sce002_missingErrorHandling',
      params: { name: result.Name }
    });
    io.emit('Points', -5);
  } else if (result.State == 2) {
    io.emit('Points', 40);
  }
}

//TODO - Make this part of a different module
class PostProcessEventSce002 {
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
  console.log('Ntd002 received: ' + JSON.stringify(result));

  // Emitir el mensaje a todos los clientes conectados
  if (result.State == 1) {
    io.emit('Toasts', {
      type: 'Warning',
      message: 'toasts.sce003_missingModifiers',
      params: { name: result.Name }
    });
    io.emit('Points', -5);
  } else if (result.State == 2) {
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
  console.log('Sce005 received: ' + JSON.stringify(result));

  if (result.State == 1) {
    io.emit('Toasts', {
      type: 'Warning',
      message: 'toasts.sce005_compilerTooLow'
    });
    io.emit('Points', -5);
  } else if (result.State == 2) {
    io.emit('Points', 40);
  }
}

//TODO - Make this part of a different module
class PostProcessEventSce005 {
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
  console.log('Sce006 received: ' + JSON.stringify(result));

  if (result.State == 1) {
    io.emit('Toasts', {
      type: 'Warning',
      message: 'toasts.sce006_useSafeMath'
    });
    io.emit('Points', -5);
  } else if (result.State == 2) {
    io.emit('Points', 40);
  }
}

//TODO - Make this part of a different module
class PostProcessEventSce006 {
  constructor(e) {
    this.Timestamp = e.SmaCly_sce006.Timestamp;
    this.IdSession = e.SmaCly_sce006.IdSession;
    this.Name = e.SmaCly_sce006.Param1;
    this.State = e.SmaCly_sce006.State;
  }
}

/************** END SCE00X */

/************** COMPILADOR: LOGIN / REGISTRO / SESIÓN
El backend Java "compilador" (puerto 8080 por defecto) tiene su propio login de Spring
Security con usuarios/roles en MongoDB. En vez de duplicar ese sistema, smacly-web hace de
fachada: cuando un usuario inicia sesión aquí, este servidor inicia sesión contra compilador
en su nombre y guarda la cookie de esa sesión (JSESSIONID) en la sesión de Express. Todas las
llamadas a /api/** de compilador (compilación, workspaces, logs, e3value, administración) se
reenvían server-to-server usando esa cookie, así el navegador solo habla con este servidor
(mismo origen, sin CORS) y sigue viendo el resto de la app tal cual está hoy. */

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ exito: false, mensaje: 'User and password are required' });
    }
    const cookie = await compilerProxy.login(username, password);
    req.session.compiladorCookie = cookie;
    const perfil = sanitizeUsuario(await compilerProxy.call(cookie, 'GET', '/api/miPerfil'));
    req.session.compiladorUser = perfil;
    res.json({ exito: true, usuario: perfil });
  } catch (error) {
    console.error('Login error: ' + error.message);
    if (error.code) {
      // Error de red (p.ej. ECONNREFUSED): el servicio "compilador" no está arrancado o
      // COMPILADOR_URL está mal configurado, no es un problema de credenciales.
      return res.status(502).json({ exito: false, mensaje: 'Could not reach the compiler service. Please try again later.' });
    }
    res.status(error.status || 401).json({ exito: false, mensaje: 'Invalid username or password' });
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ exito: true });
  });
});

app.get('/api/sesionActual', (req, res) => {
  if (!req.session.compiladorCookie || !req.session.compiladorUser) {
    return res.status(401).json({ mensaje: 'Not authenticated' });
  }
  res.json(req.session.compiladorUser);
});

// El registro de usuarios es público en compilador (no requiere sesión previa)
app.post('/api/registrarUsuario', async (req, res) => {
  try {
    const resultado = await compilerProxy.call(null, 'POST', '/api/registrarUsuario', req.body);
    res.json(resultado);
  } catch (error) {
    console.error('Register error: ' + error.message);
    res.status(error.status || 502).json({ exito: false, mensaje: error.message });
  }
});

/************** COMPILADOR: PROXY GENÉRICO DE /api/**
Todas las rutas de abajo reenvían al compilador con la cookie de sesión del usuario ya
autenticado en smacly-web. Si la sesión ha caducado (401/403 del compilador) se limpia la
cookie guardada y se le pide al front que redirija a /login.html otra vez. */

function requireCompiladorSession(req, res, next) {
  if (!req.session.compiladorCookie) {
    return res.status(401).json({ mensaje: 'Not authenticated' });
  }
  next();
}

// compilador devuelve el objeto Usuario tal cual, passwordHash incluido - nunca debe llegar
// al navegador, ni el del propio usuario ni el de los usuarios que gestiona un PROFESSOR/ADMIN.
function sanitizeUsuario(usuario) {
  if (!usuario || typeof usuario !== 'object') return usuario;
  const { passwordHash, ...resto } = usuario;
  return resto;
}

function proxyCompilador(method, buildPath) {
  return async (req, res) => {
    try {
      const pathName = typeof buildPath === 'function' ? buildPath(req) : buildPath;
      const payload = (method === 'GET' || method === 'DELETE') ? undefined : req.body;
      const resultado = await compilerProxy.call(req.session.compiladorCookie, method, pathName, payload);
      res.json(resultado);
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        req.session.compiladorCookie = null;
        return res.status(401).json({ mensaje: 'Session expired, please log in again' });
      }
      console.error('Compilador API error: ' + error.message);
      res.status(error.status || 502).json({ mensaje: error.message });
    }
  };
}

app.use('/api', requireCompiladorSession);

// Compilación real (solc / vyper)
app.post('/api/compilarSolidity', proxyCompilador('POST', '/api/compilarSolidity'));
app.post('/api/compilarVyper', proxyCompilador('POST', '/api/compilarVyper'));

// Parser Solidity -> bloques
app.post('/api/parsearSolidity', proxyCompilador('POST', '/api/parsearSolidity'));

// Mi perfil
app.get('/api/miPerfil', async (req, res) => {
  try {
    const usuario = await compilerProxy.call(req.session.compiladorCookie, 'GET', '/api/miPerfil');
    res.json(sanitizeUsuario(usuario));
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      req.session.compiladorCookie = null;
      return res.status(401).json({ mensaje: 'Session expired, please log in again' });
    }
    res.status(error.status || 502).json({ mensaje: error.message });
  }
});
app.put('/api/miPerfil', proxyCompilador('PUT', '/api/miPerfil'));

// Workspaces
app.post('/api/crearWorkspace', proxyCompilador('POST', '/api/crearWorkspace'));
app.post('/api/registrarWorkspace', proxyCompilador('POST', '/api/registrarWorkspace'));
app.post('/api/cargarWorkspace', proxyCompilador('POST', '/api/cargarWorkspace'));
app.get('/api/listarWorkspaces', proxyCompilador('GET', '/api/listarWorkspaces'));
app.get('/api/workspaces/visibles', proxyCompilador('GET', '/api/workspaces/visibles'));
app.get('/api/ultimoWorkspace', proxyCompilador('GET', '/api/ultimoWorkspace'));
app.delete('/api/workspaces/:id', proxyCompilador('DELETE', (req) => '/api/workspaces/' + encodeURIComponent(req.params.id)));
app.delete('/api/workspaces', proxyCompilador('DELETE', '/api/workspaces'));

// Logs de actividad
app.post('/api/registrarLogs', proxyCompilador('POST', '/api/registrarLogs'));
app.get('/api/logs/mostrarLogs', proxyCompilador('GET', '/api/logs/mostrarLogs'));
app.delete('/api/logs/sesion/:sessionId', proxyCompilador('DELETE', (req) => '/api/logs/sesion/' + encodeURIComponent(req.params.sessionId)));
app.delete('/api/logs', proxyCompilador('DELETE', '/api/logs'));

// e3value
app.post('/api/e3value/contratos', proxyCompilador('POST', '/api/e3value/contratos'));
app.post('/api/e3value/eventos', proxyCompilador('POST', '/api/e3value/eventos'));
app.post('/api/e3value/convertirE3Value', proxyCompilador('POST', '/api/e3value/convertirE3Value'));
app.post('/api/e3value/validar', proxyCompilador('POST', '/api/e3value/validar'));
app.post('/api/e3value/preguntasObjetos', proxyCompilador('POST', '/api/e3value/preguntasObjetos'));

// Administración de usuarios (el backend exige rol PROFESSOR/ADMIN; si el usuario no lo
// tiene, compilador devuelve 403 y proxyCompilador lo traslada tal cual)
app.get('/api/admin/usuarios/gestionables', async (req, res) => {
  try {
    const usuarios = await compilerProxy.call(req.session.compiladorCookie, 'GET', '/api/admin/usuarios/gestionables');
    res.json((usuarios || []).map(sanitizeUsuario));
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      req.session.compiladorCookie = null;
      return res.status(401).json({ mensaje: 'Session expired, please log in again' });
    }
    res.status(error.status || 502).json({ mensaje: error.message });
  }
});
app.post('/api/admin/usuarios', proxyCompilador('POST', (req) => '/api/admin/usuarios?rol=' + encodeURIComponent(req.query.rol || 'USER')));
app.put('/api/admin/usuarios/:id', proxyCompilador('PUT', (req) => '/api/admin/usuarios/' + encodeURIComponent(req.params.id) + '?rol=' + encodeURIComponent(req.query.rol || 'USER')));
app.delete('/api/admin/usuarios/:id', proxyCompilador('DELETE', (req) => '/api/admin/usuarios/' + encodeURIComponent(req.params.id)));
app.delete('/api/admin/usuarios', proxyCompilador('DELETE', '/api/admin/usuarios'));
app.patch('/api/admin/usuarios/:id/bloqueo', proxyCompilador('PATCH', (req) => '/api/admin/usuarios/' + encodeURIComponent(req.params.id) + '/bloqueo'));

/* NOTA: /api/admin/usuarios/carga-masiva (subida masiva de usuarios por Excel) no se ha
portado - requiere reenviar un multipart/form-data, que este proxy no maneja todavía. */

/************** END COMPILADOR PROXY */

server.listen(process.env.PORT, () => {
  console.log('Server started on port ' + process.env.PORT);
});
