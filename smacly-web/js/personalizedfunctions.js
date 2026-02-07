
var dataStr = "data:text/json;charset=utf-8,"; // Codificación del documento a crear para guardar los logs
var downloadAnchorNode = document.createElement('a'); //Creación de un elemento para la descarga del archivo de los logs
var logsEventos = [];//Array para conservar todos los logs que se producen
var idSession = generateId(); //Para generar por sesión un ID único
var idFile; //Para asignar al resto de bloques el ID del bloque Fichero
var timeLastAction = time();//Inicializo la fecha
var workspace = Blockly.mainWorkspace;
let mapBlocks = new Map();

/*
Descripción: Recoge el código Blockly y lo transforma a XML mostrándolo en la vista izquierda del lienzo
*/
function toXml() {
  var output = document.getElementById('XmlArea');
  var xml = Blockly.Xml.workspaceToDom(workspace);
  output.value = Blockly.Xml.domToPrettyText(xml);
  const logEvento = new LogEventButtonBlockly("seeXML", workspace);
  logsEventos.push(logEvento);
  if (output.value != "") {
    document.getElementById("tranformButton").disabled = false;
    document.getElementById("saveXMLButton").disabled = false;
  }
  output.focus();
  output.select();
}

/*
    Descripción: Recoge el XML generado e inicia una descarga del archivo generado
  */
function saveXml() {
  const logEvento = new LogEventButtonBlockly("downloadXML", workspace);
  logsEventos.push(logEvento);
  var xml = Blockly.Xml.workspaceToDom(workspace);
  var oSerializer = new XMLSerializer();
  var sXML = oSerializer.serializeToString(xml);
  var txml_tex = Blockly.Xml.domToText(xml);
  var pseudoelement = document.createElement("a");
  var filename = "SmaClyContract.xml";
  var pseudoelement = document.createElement("a");
  var blob = new Blob([txml_tex], { type: "text/plain" });
  pseudoelement.setAttribute("href", window.URL.createObjectURL(blob));
  pseudoelement.setAttribute("download", filename);
  pseudoelement.dataset.downloadurl = ["text/plain", pseudoelement.download, pseudoelement.href].join(":");
  pseudoelement.draggable = true;
  pseudoelement.classList.add("dragout");
  pseudoelement.click();
}

/*
    Descripción: Abre un cuadro de díalogo ofreciendo la posibilidad de limpiar los bloques del workspace si el usuario está de acuerdo
  */
function cleanWorkspace() {
  var cantidadBloques = Blockly.mainWorkspace.getAllBlocks().length;
  if (cantidadBloques > 0) {
    var answer = window.confirm("Delete all blocks in workspace?");
    if (answer) {
      const logEvento = new LogEventButtonBlockly("cleanBlocks", workspace);
      logsEventos.push(logEvento);
      Blockly.mainWorkspace.clear();
      idSession = generateId();
      document.getElementById("cleanBlockButton").disabled = true;
    }
  }
}

/*
    Descripción:Carga un fichero XML e importa su contenido en el área para el XML
  */
function loadFileAsText() {
  const logEvento = new LogEventButtonBlockly("importXML", workspace);
  logsEventos.push(logEvento);
  var fileToLoad = document.getElementById("loadFileButton").files[0];
  document.getElementById("tranformButton").disabled = false;
  var fileReader = new FileReader();
  fileReader.onload = function (fileLoadedEvent) {
    var textFromFileLoaded = fileLoadedEvent.target.result;
    document.getElementById("XmlArea").value = textFromFileLoaded;
  };
  fileReader.readAsText(fileToLoad, "UTF-8");
  var input = document.getElementById('XmlArea');// Trae el texto que se pone en la caja de texto
  var xml = Blockly.Xml.textToDom(input.value);//Transformación del texto a js
  //Blockly.Xml.domToWorkspace(xml, workspace);
  Blockly.Xml.appendDomToWorkspace(xml, workspace);//Se incorpora el js al espacio de trabajo para visualizar los bloques
}

/*
    Descripción: Carga el contenido XML del área y lo transforma en bloques en el workspace
  */
function fromXml() {
  var input = document.getElementById('XmlArea');// Trae el texto que se pone en la caja de texto
  var xml = Blockly.Xml.textToDom(input.value);//Transformación del texto a js
  //Blockly.Xml.domToWorkspace(xml, workspace);
  Blockly.Xml.appendDomToWorkspace(xml, workspace);//Se incorpora el js al espacio de trabajo para visualizar los bloques
  input.focus();
  input.select();
  //taChange();
}

function saveHtmlToDownload() {
  var code = HtmlGenerator.workspaceToCode(workspace);
  newWindow = window.open("data:application/octet-stream," + encodeURIComponent(code), 'webseite.html');
}

function seeSolidityToDownload() {
  var logEvento = new LogEventButtonBlockly("transformBlockToSolidity", workspace);
  logsEventos.push(logEvento);
  var code = SolidityGenerator.workspaceToCode(workspace);
  var output = document.getElementById('XmlArea');
  output.value = code;
  output.focus();
  output.select();
}


function saveSolidityToDownload() {
  var code = SolidityGenerator.workspaceToCode(workspace);
  newWindow = window.open("data:application/octet-stream," + encodeURIComponent(code), 'webseite.sol');
}

function download(filename, textInput) {
  var logEvento = new LogEventButtonBlockly("downloadSolidity", workspace);
  logsEventos.push(logEvento);
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8, ' + encodeURIComponent(textInput));
  element.setAttribute('download', filename);
  document.body.appendChild(element);
  element.click();
  //document.body.removeChild(element);
}


/*
Parámetro de entrada: El evento que se ha producido en el workspace
Descripción: Crea un elemento log y lo almacena en el array de logs para conservarlo. Antes de crearlo, hace una limpieza de eventos innecesarios que se producen y carecen de valor
*/

function logger(e) {
  if (!(e.type == Blockly.Events.DELETE && e.group == "") && !(e.type == Blockly.Events.CREATE && e.group == "")
    && !(e.type == Blockly.Events.MOVE && e.group == "") && !(e.type == Blockly.Events.UI && e.element != "category" && e.group == "" && workspace.getBlockById(e.newValue) == null)) {
    var logEvento = new LogEventBlockly(e);
    logsEventos.push(logEvento);
  }
}

/*
  Descripción: Parsea a texto los logs del array del evento para poder descargar un archivo en el que están recogidos todos estos
*/
function saveLog() {
  var logEvento = new LogEventButtonBlockly("downloadLog", workspace);
  logsEventos.push(logEvento);
  var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logsEventos));
  var downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "logEvents.json");
  document.body.appendChild(downloadAnchorNode); // required for firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

/*
    Parámetro de entrada: Si el usuario ha marcado o desmarcado la opción de registrar eventos
    Descripción: Activa el registro de eventos en la aplicación
  */
/*function logEvents(state) {
  var checkbox1 = document.getElementById('logCheck');
  var checkbox2 = document.getElementById('logFlyoutCheck');
  var buttonSaveLog = document.getElementById('saveLogButton');
  checkbox1.checked = state;
  if (sessionStorage) {
    sessionStorage.setItem('logEvents', Number(state));
  }
  if (state) {
    buttonSaveLog.disabled = false;
    workspace.addChangeListener(logger);
    const logEvento = new LogEventButtonBlockly("activateLogEvent",workspace);
    logsEventos.push(logEvento);
  } else {
    workspace.removeChangeListener(logger);
    const logEvento = new LogEventButtonBlockly("disableLogEvent",workspace);
    logsEventos.push(logEvento);
    if((checkbox1.checked == false) && (checkbox2.checked == false)){
      buttonSaveLog.disabled = true;
    }
  }
}

function logFlyoutEvents(state) {
  var checkbox1 = document.getElementById('logCheck');
  var checkbox2 = document.getElementById('logFlyoutCheck');
  var buttonSaveLog = document.getElementById('saveLogButton');
  checkbox2.checked = state;
  if (sessionStorage) {
    sessionStorage.setItem('logFlyoutEvents', Number(state));
  }
  var flyoutWorkspace = workspace.getFlyout().getWorkspace();
  if (state) {
    buttonSaveLog.disabled = false;
    flyoutWorkspace.addChangeListener(logger);
    const logEvento = new LogEventButtonBlockly("activateLogFlyoutEvent",workspace);
    logsEventos.push(logEvento);
  } else {
    flyoutWorkspace.removeChangeListener(logger);
    const logEvento = new LogEventButtonBlockly("disableLogFlyoutEvent",workspace);
    logsEventos.push(logEvento);
    if((checkbox1.checked == false) && (checkbox2.checked == false)){
      buttonSaveLog.disabled = true;
    }
  }
}*/


function registerLogs(state) {
  var checkbox1 = document.getElementById('logCheck');
  var buttonSaveLog = document.getElementById('saveLogButton');
  checkbox1.checked = state;
  if (sessionStorage) {
    sessionStorage.setItem('logEvents', Number(state));
    sessionStorage.setItem('logFlyoutEvents', Number(state));
  }

  if (state) {
    buttonSaveLog.disabled = false;
    workspace.addChangeListener(logger);
    const logEvento1 = new LogEventButtonBlockly("activateLogEvent", workspace);
    logsEventos.push(logEvento1);
  } else {
    workspace.removeChangeListener(logger);
    flyoutWorkspace.removeChangeListener(logger);
    const logEvento1 = new LogEventButtonBlockly("disableLogEvent", workspace);
    logsEventos.push(logEvento1);
    if (checkbox1.checked == false) {
      buttonSaveLog.disabled = true;
    }
  }

  workspace.addChangeListener(dep001_sye001Listener);

  workspace.addChangeListener(ntd001_prg003_prg004_Listener);
  workspace.addChangeListener(ntd002_sce003_Listener);
  workspace.addChangeListener(ntd003Listener);
  workspace.addChangeListener(ntd004Listener);

  workspace.addChangeListener(prg002Listener);

  workspace.addChangeListener(sye002Listener);
  workspace.addChangeListener(sye003Listener);
  workspace.addChangeListener(sye004Listener);

  workspace.addChangeListener(sce002Listener);
  workspace.addChangeListener(sce005Listener);
  workspace.addChangeListener(sce006Listener);
}


function textAreaChange() {
  var buttonSaveXML = document.getElementById('saveXMLButton');
  if (document.getElementById("XmlArea").value != "") {
    buttonSaveXML.disabled = false;
  }
  else {
    buttonSaveXML.disabled = true;
  }
}

// Disable the "Import from XML" button if the XML is invalid.
// Preserve text between page reloads.
function taChange() {
  var textarea = document.getElementById('transformButton');
  if (sessionStorage) {
    sessionStorage.setItem('XmlArea', textarea.value);
  }
  var valid = true;
  try {
    Blockly.Xml.textToDom(textarea.value);
  } catch (e) {
    valid = false;
  }
  document.getElementById('transformButton').disabled = !valid;
}

/*
  Descripción: Clase para definir los logs producidos por los eventos según el tipo que sean
*/
class LogEventButtonBlockly {
  constructor(typeActionButton, workspace) {
    this.idSession = idSession;
    this.idEvent = generateId();
    this.typeEvent = "click tool button";
    this.date = time();
    switch (typeActionButton) {
      case "seeXML": this.action = "see XML file";
        break;
      case "downloadXML": this.action = "download XML file";
        break;
      case "downloadSolidity": this.action = "download Solidity file";
        break;
      case "downloadLog": this.action = "download Log file";
        break;
      case "cleanBlocks": this.action = "clean workspace";
        break;
      case "importXML": this.action = "import XML file";
        break;
      case "transform": this.action = "transform to XML language";
        break;
      case "transformBlockToSolidity": this.action = "transform to Solidity code";
        break;
      case "activateLogFlyoutEvent": this.action = "activate flyout event logs";
        break;
      case "disableLogFlyoutEvent": this.action = "disable flyout event logs";
        break;
      case "activateLogEvent": this.action = "activate event logs";
        break;
      default: this.action = "disable event logs";
        break;
    }
  }
}

/*
  Descripción: Clase para definir el log de inactividad
*/
class LogEventInactive {
  constructor(currentDate) {
    this.idSession = idSession;
    this.idEvent = generateId();
    this.typeEvent = "Inactive";
    this.date = currentDate;
  }
}


/*
  Descripción: Clase para definir los logs producidos por los eventos según el tipo que sean
*/
class LogEventBlockly {

  constructor(e) {
    this.idSession = idSession;
    this.typeEvent = e.type;
    this.date = time();
    calculateTimeLastAction(timeLastAction);//Miramos si hay un intervalo considerable de tiempo entre una acción y otra
    timeLastAction = this.date;
    this.idBlock = e.blockId;
    this.idEvent = generateId();
    let block;
    switch (e.type) {
      case Blockly.Events.CREATE: eventCreateBlock(e, this, block);
        break;
      case Blockly.Events.CHANGE: eventChangeBlock(e, this);
        break;
      case Blockly.Events.MOVE: eventMoveBlock(e, this);
        break;
      case Blockly.Events.DELETE: eventDeleteBlock(e, this, block);
        break;
      case Blockly.Events.UI: eventUIBlock(e, this, block);
        break;
      case Blockly.Events.FINISHED_LOADING: this.action = "workspace is ready";
        break;
      default: this.action = "not recognized";
        break;
    }
  }
}

/*
* Parámetros de entrada: El evento producido que es de tipo CREATE, el log a construir y el bloque que se mueve
* Descripción: Creación del log que registra la creación de un bloque o recuperación de estos tras haberse borrado en el lienzo
*/
function eventCreateBlock(e, log, block) {
  if (e.ids.length > 1) {
    log.action = "recover workspace";
    var idBlocks = [];
    log.workspace = [];
    for (var i = 0; i < e.ids.length; i++) {//Saco los ids de los elementos que se eliminaron
      idBlocks[i] = e.ids[i];
    }
    log.idBlock = idBlocks;
    log.amountBlocksCreated = idBlocks.length;
    for (var i = 0; i < idBlocks.length; i++) {//Saco los bloques que recupero de nuevo para el workspace
      block = {
        idBlock: workspace.getBlockById(idBlocks[i]).id,
        typeBlock: workspace.getBlockById(idBlocks[i]).type,
      }
      log.workspace[i] = block;
    }
  }
  else {
    log.action = "create element";
    log.nowValueBlock = e.xml.textContent;
    log.typeBlock = e.xml.attributes[0].value;
    log.workspace = block;
    log.amountBlocksCreated = 1;
  }
}

/*
* Parámetros de entrada: El evento producido que es de tipo CHANGE, el log a construir y el bloque que se modifica
* Descripción: Creación del log que registra la modificación que se ha realizado sobre un bloque o conjunto de estos
*/
function eventChangeBlock(e, log) {
  log.typeBlock = workspace.getBlockById(log.idBlock).type;
  if (e.element == "collapsed") {
    if (e.newValue == false && e.oldValue == true) {
      log.action = "extend block";
    }
    else if (e.newValue == true && e.oldValue == false) {
      log.action = "collapse block";
    }
  }
  else if (e.element == "inline") {
    if (e.newValue == true && e.oldValue == false) {
      log.action = "change block for inline entries";
    }
    else if (e.newValue == false && e.oldValue == true) {
      log.action = "change block for external entries";
    }
  }
  else if (e.element == "disabled") {
    if (e.newValue == false && e.oldValue == true) {
      log.action = "enable block";
    }
    else if (e.newValue == true && e.oldValue == false) {
      log.action = "disable block";
    }
  }
  else if (e.element == "field") {
    log.oldValueBlock = e.oldValue;
    log.nowValueBlock = e.newValue;
    log.action = "change value block field";
  }
  else if (e.element == "comment") {
    log.oldValueBlock = e.oldValue;
    log.nowValueBlock = e.newValue;
    if (e.oldValue == null && e.newValue == "") {
      log.action = "create comment"
    }
    else {
      if (e.newValue == null && (e.oldValue != "" || e.oldValue != null)) {
        log.action = "remove comment";
      }
    }
  }
}


/*
* Parámetros de entrada: El evento producido que es de tipo MOVE, el log a construir y el bloque que se mueve
* Descripción: Creación del log que registra el movimiento que se ha realizado sobre un bloque o conjunto de estos
*/
function eventMoveBlock(e, log) {
  log.typeBlock = workspace.getBlockById(log.idBlock).type;
  if (e.oldInputName != "" && e.oldInputName != null) {
    log.typeBlock = e.oldInputName;
    log.action = "move:" + log.typeBlock;
  }
  else {
    log.action = "move";
  }
  if (e.oldCoordinate != null) {
    log.originCoordinateX = e.oldCoordinate.x;
    log.originCoordinateY = e.oldCoordinate.y;
    log.originCoordinate = '(' + e.oldCoordinate.x + "," + e.oldCoordinate.y + ')';
  }
  if (e.newCoordinate != null) {
    log.destinyCoordinateX = e.newCoordinate.x;
    log.destinyCoordinateY = e.newCoordinate.y;
    log.destinyCoordinate = '(' + e.newCoordinate.x + "," + e.newCoordinate.y + ')';
  }
}

/*
* Parámetros de entrada: El evento producido que es de tipo DELETE, el log a construir y el bloque que se borra
* Descripción: Creación del log que registra el movimiento que se ha realizado sobre un bloque o conjunto de estos
*/
function eventDeleteBlock(e, log, block) {
  log.nowValueBlock = e.oldXml.textContent;
  var idBlocks = [];
  log.workspace = [];
  if (e.ids.length > 1) {
    for (var i = 0; i < e.ids.length; i++) {//Saco los ids de los elementos que elimino en caso de que sea + de 1 elemento
      idBlocks[i] = e.ids[i];
      block = {
        idBlock: workspace.getBlockById(idBlocks[i]).id,
        typeBlock: workspace.getBlockById(idBlocks[i]).type,
      }
      log.blockDelete[i] = block;
    }
    log.idBlock = idBlocks;
  }
  else {
    log.typeBlock = e.oldXml.attributes[0].value;
  }
  log.blockDelete = e.oldXml.toString;
}

/*
* Parámetros de entrada: El evento producido que es de tipo UI, el log a construir y el bloque con el que se interactua
* Descripción: Creación del log que registra la acción del usuario que se ha realizado sobre un bloque o conjunto de estos
*/
function eventUIBlock(e, log, block) {
  if (e.element == "category") {
    log.action = "select toolbox option"
    log.category = e.newValue;
    if (e.oldValue == null) {
      log.lastOptionSelect = "none";
    }
    else {
      log.lastOptionSelect = e.oldValue;
    }
  }
  else if (e.element == "selected") {
    if ((e.newValue == "" || e.newValue == null) && e.oldValue != null) {
      block = {
        idBlock: workspace.getBlockById(e.oldValue).id,
        typeBlock: workspace.getBlockById(e.oldValue).type,
      }
      log.action = "select delete block option";
      log.blockSelect = block;
      log.idBlock = block.idBlock;
      log.typeBlock = block.typeBlock;
    }
    else if ((e.newValue == "" || e.newValue == null) && e.oldValue == null) {//Se abre el menu de opciones sobre el elemento
      log.action = "open menu block option";
      block = {
        idBlock: workspace.getBlockById(e.newValue).id,
        typeBlock: workspace.getBlockById(e.newValue).type,
      }
      log.blockSelect = block;
    }
    else if ((e.newValue != "" || e.newValue != null) && e.oldValue != null) {//Se ha seleccionado un bloque desde la barra de x
      if (workspace.getBlockById(e.newValue) != null) {
        log.action = "select type block from toolbox";
        block = {
          idBlock: workspace.getBlockById(e.newValue).id,
          typeBlock: workspace.getBlockById(e.newValue).type,
        }
        log.blockSelect = block;
      }
    }
    else if ((e.newValue != "" || e.newValue != null) && e.oldValue == null) {//Se ha seleccionado un bloque desde la barra de herramienta
      if (workspace.getBlockById(e.newValue) != null) {
        log.action = "select type block from workspace";
        block = {
          idBlock: workspace.getBlockById(e.newValue).id,
          typeBlock: workspace.getBlockById(e.newValue).type,
        }
        log.blockSelect = block;
      }
    }
  }
  else if (e.element == "commentOpen") {
    if (e.newValue == false && e.oldValue == true) {
      log.action = "close comment";
    }
    else if (e.newValue == true && e.oldValue == false) {
      log.action = "open comment";
    }
  }
  else if (e.element == "dragStart") {
    log.blocksDrag = [];
    for (var i = 0; i < e.newValue.length; i++) {//Saco los bloques que arrastro
      block = {
        idBlock: e.newValue[i].id,
        typeBlock: e.newValue[i].type,
      }
      log.blocksDrag[i] = block;
    }
    log.action = "start drag element";
  }
  else if (e.element == "dragStop") {
    log.blocksDrag = [];
    for (var i = 0; i < e.oldValue.length; i++) {//Saco los bloques que arrastro
      block = {
        idBlock: e.oldValue[i].id,
        typeBlock: e.oldValue[i].type,
      }
      log.blocksDrag[i] = block;
    }
    log.action = "stop drag element";
  }
}

function assignIdFileBlock() {
  if (e.type == "File") {
    return e.blockId;
  }
}

/*  
  Descripción: Calcula la hora actual y la devuelve como un string
  Parámetro de salida: String de la hora actual
*/
function time() {
  return new Date().toISOString();
}

/*  
  Descripción: Calcula la hora actual y la devuelve como un string
  Parámetro de salida: String de la hora actual
*/
function timeToLocaleString() {
  return new Date().toLocaleString();
}

/*
Descripción: Calcula el intervalo entre la ultima acción y la actual
Parámetro de salida: String de la hora actual
*/
function calculateTimeLastAction(timeLastAction) {

  // Convertir la cadena de fecha guardada de nuevo a un objeto Date
  let lastAction = new Date(timeLastAction);

  // Obtener la fecha actual
  let currentDate = new Date();

  // Calcular la diferencia en milisegundos
  let differenceInMilliseconds = currentDate - lastAction;

  // Convertir la diferencia a minutos
  let differenceInMinutes = differenceInMilliseconds / 1000 / 60;

  if (differenceInMinutes > 2) {
    logEvento1 = new LogEventInactive(currentDate);
    logsEventos.push(logEvento1);
  }  // Retorna true si han pasado más de 5 minutos

}


/*  
 Descripción:Genera un identificador único
 Parámetro de salida: Genera un id para el log
*/
function generateId() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

/*  
  Descripción: Carga la página en el idioma seleccionado
  Parámetro de salida: Genera un id para el log
*/
function changeLanguage() {
  var currentUrl = window.location.href;
  var newUrl;

  if (currentUrl.indexOf("spanish") !== -1) {
    // Si la página actual está en español, cambiar a inglés
    newUrl = currentUrl.replace("index_spanish.html", "index_english.html");
  } else {
    // Si la página actual está en inglés, cambiar a español
    newUrl = currentUrl.replace("index_english.html", "index_spanish.html");
  }

  window.location.href = newUrl;
}


// Definir la función para comprobar bloques en el espacio de trabajo
function checkBlocksAmount() {
  var bloques = workspace.getAllBlocks();
  var botones = document.getElementsByClassName('button');

  // Si hay bloques, activar los botones; de lo contrario, desactivarlos
  var activar = bloques.length > 0;
  for (var i = 0; i < botones.length; i++) {
    botones[i].disabled = !activar;
    botones[i].textContent = activar ? '¡Botón activado!' : 'Botón desactivado';
  }
}

