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

const N8N_URL = process.env.N8N_URL || 'http://localhost:5678';
app.use('/webhook', (req, res) => {
  const target = new URL(req.originalUrl, N8N_URL);
  const upstream = http.request(target, { method: req.method, headers: { ...req.headers, host: target.host } }, (upstreamRes) => {
    res.writeHead(upstreamRes.statusCode, upstreamRes.headers);
    upstreamRes.pipe(res);
  });
  upstream.on('error', (err) => {
    console.error('Error reenviando a n8n: ' + err.message);
    res.sendStatus(502);
  });
  req.pipe(upstream);
});
const io = socketIo(server);


const { Kafka } = require('kafkajs');

const KAFKA_BOOTSTRAP = process.env.KAFKA_BOOTSTRAP || 'kafka:9092';
const kafka = new Kafka({
  clientId: 'smacly-web',
  brokers: [KAFKA_BOOTSTRAP],
  retry: { initialRetryTime: 500, retries: 15 }
});

// Kafka may not accept connections yet when this container starts (compose's
// depends_on only waits for the container to start, not for the broker to be
// ready), and may be restarted later. Every Kafka connection below therefore
// retries forever instead of failing once and staying dead.
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Topics the Flink jobs read/write. Created here if missing, so a fresh or
// wiped Kafka volume cannot leave the jobs failing with UnknownTopicOrPartition.
const KAFKA_REQUIRED_TOPICS = [
  'cep4fun-events-input', 'cep4fun-events-output',
  'cep4fun-raw-dep001', 'cep4fun-raw-ntd002', 'cep4fun-raw-ntd003', 'cep4fun-raw-ntd004',
  'cep4fun-raw-sce003', 'cep4fun-raw-sye002', 'cep4fun-raw-sye003', 'cep4fun-raw-sye004'
];

async function ensureKafkaTopics() {
  const admin = kafka.admin();
  await admin.connect();
  try {
    await admin.createTopics({
      waitForLeaders: true,
      topics: KAFKA_REQUIRED_TOPICS.map((topic) => ({ topic, numPartitions: 1, replicationFactor: 1 }))
    });
  } finally {
    await admin.disconnect();
  }
}
const flinkResultsConsumer = kafka.consumer({
  // Grupo nuevo en cada arranque: solo se entregan resultados posteriores al
  // inicio y nunca los que quedaron en cola mientras smacly-web estaba parado.
  groupId: 'smacly-web-flink-bridge-' + Date.now()
});
const flinkIngestProducer = kafka.producer();

// A toast is only shown on the transitions that mean "this just broke" -
// matches the old Siddhi-era behaviour, where fixing something (or being
// correct from the start) only ever updated points, never popped a toast.
const FLINK_BROKEN_RESULTS = new Set(['BROKEN_FIRST_TIME', 'WORKING_TO_BROKEN']);

function emitFlinkToast(result, type, message, params) {
  if (!FLINK_BROKEN_RESULTS.has(result.result)) return;
  io.emit('Toasts', params ? { type, message, params } : { type, message });
}

function SyeDuplicatedItem_FlinkResult(result, entityType) {
  io.emit('Points', result.points);
  emitFlinkToast(result, 'Warning', 'toasts.sye_duplicateItem', { name: result.param1, type: entityType });
}

// One handler per migrated topic, keyed by result.topic - each knows which
// toast key/type/params its event used under Siddhi. Points always come
// straight from Flink's scoring (ScoringRuleFunction), never recomputed here.
const FLINK_TOPIC_HANDLERS = {
  DEP001: (result) => {
    io.emit('Points', result.points);
    emitFlinkToast(result, 'Warning', 'toasts.dep001_deprecatedCompiler');
  },
  NTD002: (result) => {
    io.emit('Points', result.points);
    emitFlinkToast(result, 'Info', 'toasts.ntd002_tooManyPublicFunctions');
  },
  NTD003: (result) => {
    io.emit('Points', result.points);
    emitFlinkToast(result, 'Error', 'toasts.ntd003_interfaceInheritance');
  },
  NTD004: (result) => {
    io.emit('Points', result.points);
    emitFlinkToast(result, 'Error', 'toasts.ntd004_abstractInheritance');
  },
  SCE003: (result) => {
    io.emit('Points', result.points);
    emitFlinkToast(result, 'Warning', 'toasts.sce003_missingModifiers', { name: result.param1 });
  },
  SYE002: (result) => SyeDuplicatedItem_FlinkResult(result, 'interface'),
  SYE003: (result) => SyeDuplicatedItem_FlinkResult(result, 'library'),
  SYE004: (result) => SyeDuplicatedItem_FlinkResult(result, 'contract'),
  NTD001: (result) => {
    io.emit('Points', result.points);
    emitFlinkToast(result, 'Warning', 'toasts.ntd001_varWithoutValue', { name: result.param1 });
  },
  SYE001: (result) => {
    io.emit('Points', result.points);
    emitFlinkToast(result, 'Error', 'toasts.sye001_invalidCompiler');
  },
  PRG002: (result) => {
    io.emit('Points', result.points);
    emitFlinkToast(result, 'Info', 'toasts.prg002_compilerNotDefined');
  },
  PRG003: (result) => {
    io.emit('Points', result.points);
    emitFlinkToast(result, 'Warning', 'toasts.prg003_functionWithoutBody', { name: result.param1 });
  },
  PRG004: (result) => {
    io.emit('Points', result.points);
    emitFlinkToast(result, 'Warning', 'toasts.prg004_modifierWithoutBody', { name: result.param1 });
  },
  SCE002: (result) => {
    io.emit('Points', result.points);
    emitFlinkToast(result, 'Warning', 'toasts.sce002_missingErrorHandling', { name: result.param1 });
  },
  SCE005: (result) => {
    io.emit('Points', result.points);
    emitFlinkToast(result, 'Warning', 'toasts.sce005_compilerTooLow');
  },
  SCE006: (result) => {
    io.emit('Points', result.points);
    emitFlinkToast(result, 'Warning', 'toasts.sce006_useSafeMath');
  },
};

async function startFlinkResultsBridge() {
  while (true) {
  try {
    await flinkResultsConsumer.connect();
    await flinkResultsConsumer.subscribe({ topic: 'cep4fun-events-output', fromBeginning: false });
    await flinkResultsConsumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) return;
        var result;
        try {
          result = JSON.parse(message.value.toString());
        } catch (err) {
          console.error('Invalid JSON message: ' + err.message);
          return;
        }

        console.log('Message received: ' + JSON.stringify(result));
        console.log('Points received: ' + result.topic + ' ' + result.points + ' (' + result.result + ')');

        const handler = FLINK_TOPIC_HANDLERS[result.topic];
        if (handler) {
          handler(result);
        } else {
          // Fallback for a topic not migrated to a dedicated handler yet.
          io.emit('Points', result.points);
          if (result.points < 0) {
            io.emit('Toasts', {
              type: 'Warning',
              message: `Flink: ${result.topic} (${result.result})`
            });
          }
        }
      }
    });
    console.log('Flink bridge: connected to Kafka, listening on cep4fun-events-output');
    return;
  } catch (err) {
    console.error('Flink bridge: could not connect to Kafka, retrying in 5s: ' + err.message);
    try { await flinkResultsConsumer.disconnect(); } catch (e) { /* ignore */ }
    await sleep(5000);
  }
  }
}

// If the consumer crashes later (broker restart), start it again.
flinkResultsConsumer.on(flinkResultsConsumer.events.CRASH, (event) => {
  console.error('Flink bridge: consumer crashed (' + event.payload.error.message + '), restarting in 5s');
  setTimeout(async () => {
    try { await flinkResultsConsumer.disconnect(); } catch (e) { /* ignore */ }
    startFlinkResultsBridge();
  }, 5000);
});

let flinkIngestProducerReady = false;

async function connectFlinkIngestProducer() {
  while (!flinkIngestProducerReady) {
    try {
      await flinkIngestProducer.connect();
      flinkIngestProducerReady = true;
      console.log('Flink ingest: producer connected to Kafka');
    } catch (err) {
      console.error('Flink ingest: producer could not connect, retrying in 5s: ' + err.message);
      await sleep(5000);
    }
  }
}

flinkIngestProducer.on(flinkIngestProducer.events.DISCONNECT, () => {
  if (flinkIngestProducerReady) {
    flinkIngestProducerReady = false;
    console.error('Flink ingest: producer disconnected, reconnecting...');
    connectFlinkIngestProducer();
  }
});

// Topics first (idempotent), then the producer and the results bridge.
(async function startKafkaLayer() {
  while (true) {
    try {
      await ensureKafkaTopics();
      break;
    } catch (err) {
      console.error('Kafka: could not ensure topics, retrying in 5s: ' + err.message);
      await sleep(5000);
    }
  }
  connectFlinkIngestProducer();
  startFlinkResultsBridge();
})();

// Log
const fs = require('fs');

fs.mkdirSync(path.join(__dirname, 'logs'), { recursive: true });
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

app.use(bodyparser.json({ strict: false }));

app.use(toastr());

//Toaster
app.use(cookieParser('secret'));
app.use(session({
  secret: 'secret',
  saveUninitialized: true,
  resave: true
}));
app.use(flash());

// Index.html requires user log in
app.get(['/', '/index.html', '/editor.html'], (req, res, next) => {
  if (!req.session.compiladorCookie) {
    return res.redirect('/login.html');
  }
  next();
});

// Same URL as the original SmaCly: the editor is also served at /editor.html
app.get('/editor.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/scripts', express.static(__dirname + '/node_modules/http/'));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/resources', express.static(path.join(__dirname, 'resources')));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Credentials", true);

  res.locals.toasts = req.toastr.render();
  next();
});

app.get('/', (req, res) => {
  res.set('Cache-Control', 'no-store'); // avoiding cache
  const stringIndex = path.join(__dirname, 'public', 'index.html');
  console.log(stringIndex);
  res.sendFile(stringIndex);
});

/* ---- Siddhi -> Flink migration: n8n ingest gateway ----
 * Replaces every call n8n used to make into Siddhi (:1080/get-X and
 * :1080/event-state/X). n8n's workflows (n8n/receive-log-event.json and
 * n8n/event-state.json) now point here instead.
 *
 * Two shapes of event:
 *  - "detector" topics (RAW_EVENT_MAPPERS): SmaCly sends a raw action and a
 *    dedicated Flink job (Sye002Job, Ntd003Job, ...) still has to compute
 *    the error condition - same as the old per-event .siddhi app. Forwarded
 *    to that job's own raw input topic.
 *  - "passthrough" topics (PASSTHROUGH_EVENTS): SmaCly already computed the
 *    condition itself and sends {Timestamp,Topic,IdSession,State,Param1,
 *    BlockId} directly - there was never a .siddhi detector for these. Goes
 *    straight onto cep4fun-events-input; ScoringRuleFunction does the
 *    transition tracking EventStateFlow used to do.
 */
const RAW_TOPIC_BY_EVENT = {
  dep001: 'cep4fun-raw-dep001',
  ntd002: 'cep4fun-raw-ntd002',
  ntd003: 'cep4fun-raw-ntd003',
  ntd004: 'cep4fun-raw-ntd004',
  sce003: 'cep4fun-raw-sce003',
  sye002: 'cep4fun-raw-sye002',
  sye003: 'cep4fun-raw-sye003',
  sye004: 'cep4fun-raw-sye004',
};

// SmaCly's raw payload shape differs per event (mirrors each old .siddhi
// app's @source stream) - maps it onto the shape the matching Flink
// detector job expects (flink-app/.../model/Raw*.java).
const RAW_EVENT_MAPPERS = {
  dep001: (b) => ({
    timestamp: b.timestamp, sessionId: b.idSession, blockId: b.blockId,
    comparator: b.symbolversion, major: b.value1version, minor: b.value2version, patch: b.value3version
  }),
  ntd002: (b) => ({
    timestamp: b.timestamp, sessionId: b.idSession, blockId: b.blockId, visibility: b.values_visibility
  }),
  ntd003: (b) => ({
    timestamp: b.timestamp, sessionId: b.idSession, blockId: b.blockId, name: b.name, parent: b.parent
  }),
  ntd004: (b) => ({
    timestamp: b.timestamp, sessionId: b.idSession, blockId: b.blockId, name: b.name, parent: b.parent
  }),
  sce003: (b) => ({
    timestamp: b.timestamp, sessionId: b.idSession, blockId: b.blockId, name: b.name,
    visibility: b.values_visibility, modifierCount: b.hasModifiers
  }),
  sye002: (b) => ({ timestamp: b.timestamp, sessionId: b.idSession, blockId: b.blockId, name: b.name }),
  sye003: (b) => ({ timestamp: b.timestamp, sessionId: b.idSession, blockId: b.blockId, name: b.name }),
  sye004: (b) => ({ timestamp: b.timestamp, sessionId: b.idSession, blockId: b.blockId, name: b.name }),
};

const DUPLICATE_TOPICS = new Set(['sye002', 'sye003', 'sye004']);

const PASSTHROUGH_EVENTS =new Set([
  'ntd001', 'sye001', 'prg002', 'prg003', 'prg004', 'sce002', 'sce005', 'sce006'
]);

app.post('/flink-ingest/:topic', async (req, res) => {
  const topic = req.params.topic.toLowerCase();
  const body = req.body;

  try {
    if (RAW_TOPIC_BY_EVENT[topic]) {
      // El editor manda un ARRAY con todos los bloques (SYE002/3/4, NTD...)
      // o un objeto suelto: se normaliza y se envia un mensaje por bloque.
      const items = (Array.isArray(body) ? body : [body]).filter(b => b && typeof b === 'object');
      if (items.length === 0) return res.sendStatus(400);
      await flinkIngestProducer.send({
        topic: RAW_TOPIC_BY_EVENT[topic],
        messages: items.map((b, i) => {
          const m = RAW_EVENT_MAPPERS[topic](b);
          // SYE002/3/4: el detector espera al ultimo bloque del lote para juzgar duplicados
          if (DUPLICATE_TOPICS.has(topic)) m.last = (i === items.length - 1);
          return { value: JSON.stringify(m) };
        })
      });
    } else if (PASSTHROUGH_EVENTS.has(topic)) {
      const inputEvent = {
        timestamp: body.Timestamp,
        topic: topic.toUpperCase(),
        sessionId: body.IdSession,
        blockId: body.BlockId,
        param1: body.Param1,
        error: Number(body.State) === 1
      };
      await flinkIngestProducer.send({
        topic: 'cep4fun-events-input',
        messages: [{ value: JSON.stringify(inputEvent) }]
      });
    } else {
      console.error('flink-ingest: unknown topic ' + topic);
      return res.sendStatus(404);
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('flink-ingest error (' + topic + '): ' + err.message);
    res.sendStatus(500);
  }
});

//************DEP001************/

app.post('/validation-dep001', (req, res) => {
  var postBody = req.body;

  Dep001_PostProcess(postBody);

  //Response to external app
  res.sendStatus(200);
});

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
  if (result.VersionDeprecated == 1) {
    io.emit('Toasts', {
      type: 'Warning',
      message: 'toasts.dep001_deprecatedCompiler'
    });
  }
}

//************ntd001************************** */

app.post('/validation-ntd001', (req, res) => {
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
    this.Name = e.SmaCly_ntd001.Param1;
    this.State = e.SmaCly_ntd001.State;
  }
}

//************ntd002************************** */

app.post('/validation-ntd002', (req, res) => {
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
  var postBody = req.body;

  SyeEvent_ItemDuplicated_PostProcess(postBody.SmaCly_sye002, "interface", "Sye002");

  //Response to external app
  res.sendStatus(200);
});

app.post('/validation-sye003', (req, res) => {
  var postBody = req.body;

  SyeEvent_ItemDuplicated_PostProcess(postBody.SmaCly_sye003, "library", "Sye003");

  //Response to external app
  res.sendStatus(200);
});

app.post('/validation-sye004', (req, res) => {
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

class PostProcessEventSce006 {
  constructor(e) {
    this.Timestamp = e.SmaCly_sce006.Timestamp;
    this.IdSession = e.SmaCly_sce006.IdSession;
    this.Name = e.SmaCly_sce006.Param1;
    this.State = e.SmaCly_sce006.State;
  }
}

/************** END SCE00X */

/************** COMPILADOR: LOGIN / REGISTRO / SESIÓN **************/

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
      // Network error (p.ej. ECONNREFUSED): "compilador" is not up or
      // COMPILADOR_URL could be not properly configured, not a credential issue.
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

// Compiler public register. No session required
app.post('/api/registrarUsuario', async (req, res) => {
  try {
    const resultado = await compilerProxy.call(null, 'POST', '/api/registrarUsuario', req.body);
    res.json(resultado);
  } catch (error) {
    console.error('Register error: ' + error.message);
    res.status(error.status || 502).json({ exito: false, mensaje: error.message });
  }
});

/************** COMPILADOR: Generic proxy /api/**
 * User cookie sent. If session has expired (401/403) cookies is cleaned up and redirect to /login.html */

function requireCompiladorSession(req, res, next) {
  if (!req.session.compiladorCookie) {
    return res.status(401).json({ mensaje: 'Not authenticated' });
  }
  next();
}

// PWD should not reach browser
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
app.post('/api/compilarSolidity', proxyCompilador('POST', '/api/compilarSolidity'));
app.post('/api/compilarVyper', proxyCompilador('POST', '/api/compilarVyper'));
app.post('/api/parsearSolidity', proxyCompilador('POST', '/api/parsearSolidity'));

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

// Activity Logs
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

// **************** User management **************** 
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

/************** END COMPILADOR PROXY ***************/

server.listen(process.env.PORT, () => {
  console.log('Server started on port ' + process.env.PORT);
});
