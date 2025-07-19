var dataStr = "data:text/json;charset=utf-8,"; // Codificación del documento a crear para guardar los logs
var downloadAnchorNode = document.createElement('a'); //Creación de un elemento para la descarga del archivo de los logs
var logsEventos = [];//Array para conservar todos los logs que se producen
var idSession = generateId(); //Para generar por sesión un ID único
var idFile; //Para asignar al resto de bloques el ID del bloque Fichero

 /*
Descripción: Recoge el código Blockly y lo transforma a XML mostrándolo por pantalla
*/
function toXml() {
  var output = document.getElementById('XmlArea');
  var xml = Blockly.Xml.workspaceToDom(workspace);
  output.value = Blockly.Xml.domToPrettyText(xml);
  const logEvento = new LogEventButtonBlockly("seeXML",workspace);
  logsEventos.push(logEvento); 
  if(output.value != ""){
    document.getElementById("tranformButton").disabled = false;
    document.getElementById("saveXMLButton").disabled = false;
  }
  output.focus();
  output.select();
}

/*
    Descripción: Recoge el XML generado e inicia una descarga del archivo generado
  */
function saveXml(){
    const logEvento = new LogEventButtonBlockly("downloadXML",workspace);
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
function cleanWorkspace(){
  var cantidadBloques = Blockly.mainWorkspace.getAllBlocks().length;
  if (cantidadBloques > 0) {
    var answer = window.confirm("Delete all blocks in workspace?");
    if (answer) {
      const logEvento = new LogEventButtonBlockly("cleanBlocks",workspace);
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
function loadFileAsText()
{
  const logEvento = new LogEventButtonBlockly("importXML",workspace);
  logsEventos.push(logEvento); 
	var fileToLoad = document.getElementById("loadFileButton").files[0];
  document.getElementById("tranformButton").disabled = false;
	var fileReader = new FileReader();
	fileReader.onload = function(fileLoadedEvent) 
	{
		var textFromFileLoaded = fileLoadedEvent.target.result;
		document.getElementById("XmlArea").value = textFromFileLoaded;
	};
	fileReader.readAsText(fileToLoad, "UTF-8");
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


/*
    Parámetro de entrada: El evento que se ha producido en el workspace
    Descripción: Crea un elemento log y lo almacena en el array de logs para conservarlo. Antes de crearlo, hace una limpieza de eventos innecesarios que se producen y carecen de valor
  */
function logger(e) { 
  if(!(e.type == Blockly.Events.DELETE && e.group == "") && !(e.type == Blockly.Events.CREATE && e.group == "") 
  && !(e.type == Blockly.Events.MOVE && e.group == "")  && !(e.type == Blockly.Events.UI && e.element != "category" && e.group == "" && workspace.getBlockById(e.newValue) == null)){
    const logEvento = new LogEventBlockly(e);
    logsEventos.push(logEvento); 
  }
}

function dep001_sye001Listener(e){
  if(e == null) return; 

  if(itemSelectedFromToolbox(e)){      
    var block = workspace.getBlockById(e.newValue);
    if(block.type == "version"){
      var logEventoSye001 = new LogEventSye001(block);      
      sendPostSye001(logEventoSye001); 
    }
  }else if(fieldHasChanged(e)){
    var block = workspace.getBlockById(e.blockId);
    if(block.type == "version"){
      var logEventoDep001 = new LogEventDep001(block); 
      var logEventoSye001 = new LogEventSye001(block);
      if(logEventoDep001.value1version == 0 && logEventoDep001.value2version == 0 && logEventoDep001.value3version == 0
        && logEventoDep001.value1versionoptional == 0 && logEventoDep001.value2versionoptional == 0 && logEventoDep001.value3versionoptional == 0){
        sendPostSye001(logEventoSye001);
      }else{      
        logEventoSye001.State = 0;
        sendPostSye001(logEventoSye001); 
        sendPostDep001(logEventoDep001);
      }
    }
  }
}


function prg001Listener(e){
  if(e == null) return;

  const logEvento = new LogEventPrg001();
  sendPostPrg001(logEvento);
} 

function ntd002_sce003_Listener(e){
  if(e == null) return;

  var block = workspace.getBlockById(e.blockId);
  if(fieldHasChanged(e) && block.type == "clause"){
      var clauseBlocks = workspace.getBlocksByType("clause");

      var blocksNtd002 = [];
      var blocksSce003 = [];
      var timestamp = time();
      for(var i = 0; i < clauseBlocks.length; i++){//Saco los ids de los elementos que elimino
        blocksNtd002[i] = new LogEventNtd002(clauseBlocks[i], timestamp);
        blocksSce003[i] = new LogEventSce003(clauseBlocks[i], timestamp);
      } 
      sendPostNtd002(blocksNtd002);
      sendPostSce003(blocksSce003);
  }
}

function ntd003Listener(e){
  if(e == null) return;

  var blockChanged = workspace.getBlockById(e.blockId);
  if(blockChanged == null) return;

  var contractBlockParent = blockChanged.getParent();
  if(fieldHasChanged(e)){
    if(blockChanged.type == "contract_father" && contractBlockParent != null && contractBlockParent.type == "contract"){
      //contractBlockParent = workspace.getBlockById(contractBlockParent.id);
      var previousToParent = contractBlockParent.getPreviousBlock();
  
      //TODO - Raise suggestion. This is an error.
      if(previousToParent == null || !(previousToParent.type == "interface" || previousToParent.type == "contract")) return;
  
      if(previousToParent.type == "interface" && getName(previousToParent) == getName(blockChanged))
      {
        //NTD003
        var timestamp = time();      
  
        //Contract functions
        var functionsInContract = getFunctionsInsideBlock(contractBlockParent, timestamp, "contract", false);
  
        //Interface functions
        var functionsInInterface = getFunctionsInsideBlock(previousToParent, timestamp, "interface", true);
  
  
        //TODO - Only validating name + values_visibility + values_inputmodifier. Some fields are still not validated
        // as Modifiers. 
        let result = functionsInInterface.concat(functionsInContract);
        console.log('All functions '+ result);
        sendPostNtd003(result);     
      }
    }else if(blockChanged.type == "interface"){
      //Could be raised by interface name
      var contractBlock = blockChanged.getNextBlock();
      if(contractBlock == null || contractBlock.type != "contract") return;

      var contractChilds = contractBlock.getChildren(false);

      if(contractChilds != null){
        var inheritanceBlock = contractChilds.find((block) => block.type == "contract_father" && getName(block) == getName(blockChanged));
        if(inheritanceBlock == undefined) return;

        var timestamp = time();      
  
        //Contract functions
        contractBlock = workspace.getBlockById(contractBlock.id);
        var functionsInContract = getFunctionsInsideBlock(contractBlock, timestamp, "contract", false);
  
        //Interface functions
        var functionsInInterface = getFunctionsInsideBlock(blockChanged, timestamp, "interface", true);  
  
        //TODO - Only validating name + values_visibility + values_inputmodifier. Some fields are still not validated
        // as Modifiers. 
        let result = functionsInInterface.concat(functionsInContract);
        console.log('All functions '+ result);
        sendPostNtd003(result);        
      }      
    } 
  }
}

function ntd004Listener(e){
  if(e == null) return;

  var blockChanged = workspace.getBlockById(e.blockId);
  if(blockChanged == null) return;

  var contractBlockParent = blockChanged.getParent();
  if(fieldHasChanged(e)){
    if(blockChanged.type == "contract_father" && contractBlockParent != null && contractBlockParent.type == "contract"){
      //contractBlockParent = workspace.getBlockById(contractBlockParent.id);
      var previousToParent = findPreviousBlockByName(contractBlockParent, getName(blockChanged));
  
      //TODO - Raise suggestion. This is an error.
      if(previousToParent == null || previousToParent.type != "contract") return;

      var timestamp = time();      

      //Contract functions
      var functionsInContract = getFunctionsInsideBlock(contractBlockParent, timestamp, "contract", false);

      //Interface functions
      var functionsInInterface = getFunctionsInsideBlock(previousToParent, timestamp, "contract_abstract", true);


      //TODO - Only validating name + values_visibility + values_inputmodifier. Some fields are still not validated
      // as Modifiers. 
      let result = functionsInInterface.concat(functionsInContract);
      console.log(result);
      if(result.length > 0)
        sendPostNtd004(result);       
      
    }else if(blockChanged.type == "contract"){      
      var contractChilds = blockChanged.getChildren(true);

      if(contractChilds != null){
        var inheritanceBlock = contractChilds.find((block) => block.type == "contract_father");
        if(inheritanceBlock == undefined) return;
        
        var findParent = findPreviousBlockByName(blockChanged, getName(inheritanceBlock));
        if(findParent == undefined || findParent == null) return;

        var timestamp = time();

        var functionsInContract = getFunctionsInsideBlock(blockChanged, timestamp, "contract", false);
  
        //Interface functions
        var functionsInInterface = getFunctionsInsideBlock(findParent, timestamp, "contract_abstract", true);
  
        //TODO - Only validating name + values_visibility + values_inputmodifier. Some fields are still not validated
        // as Modifiers. 
        let result = functionsInInterface.concat(functionsInContract);
        console.log(result);
        if(result.length > 0)
          sendPostNtd004(result);        
      }      
    } 
  }
}

function findPreviousBlockByName(blockOrigin, name){
  var prev = blockOrigin.getPreviousBlock();

  if(prev == null || prev == undefined) return null;
  if(getName(prev) == name) return prev;

  return findPreviousBlockByName(prev, name);
}

function statementBlockIsEmpty(block, statementName){
  //TODO - We will catch exceptio as a try to transform content to code. Nowadays, function is not able to transfor our custom code to a string.
  //True if content is ""
  try {
    var content = Blockly.JavaScript.statementToCode(block, statementName);
    if(content == "")
      return true;
  } catch (error) {
  }
  return false;  
}

function getFunctionsInsideBlock(contractBlock, timestamp, parent, IsAbstractOrInterface){
  var result = [];
  var output = getBlockOwnElements(contractBlock, ["clause","interface_clausedeclaration"]);
  if(output != null && output != undefined){
    output.forEach((e)=> 
    {
      if(IsAbstractOrInterface){
        if(statementBlockIsEmpty(e, "elements_function")) result.push(new LogEventNtd003(e, timestamp, parent));
      }else
        result.push(new LogEventNtd003(e, timestamp, parent));        
    });    
  } 

  return result;
}

function getName(block){
  if(block != null) 
    return block.getFieldValue("name");
  return "";
}

//TODO - All functions for duplicated items should have shared code. Move shared code to another method
function sye002Listener(e){
  if(e == null) return;

  var block = workspace.getBlockById(e.blockId);
  if(fieldHasChanged(e) && block.type == "interface"){
      var clauseBlocks = workspace.getBlocksByType("interface");

      var blocks = [];
      var timestamp = time();
      for(var i = 0; i < clauseBlocks.length; i++){//Saco los ids de los elementos que elimino
        blocks[i] = new LogEventSyeEventDuplicated(clauseBlocks[i], timestamp);
      } 
      sendPostSye002(blocks);
  }
}

function sye003Listener(e){
  if(e == null) return;

  var block = workspace.getBlockById(e.blockId);
  if(fieldHasChanged(e) && block.type == "library"){
      var clauseBlocks = workspace.getBlocksByType("library");

      var blocks = [];
      var timestamp = time();
      for(var i = 0; i < clauseBlocks.length; i++){//Saco los ids de los elementos que elimino
        blocks[i] = new LogEventSyeEventDuplicated(clauseBlocks[i], timestamp);
      } 
      sendPostSye003(blocks);
  }
}

function sye004Listener(e){
  if(e == null) return;

  var block = workspace.getBlockById(e.blockId);
  if(fieldHasChanged(e) && block.type == "contract"){
      var clauseBlocks = workspace.getBlocksByType("contract");

      var blocks = [];
      var timestamp = time();
      for(var i = 0; i < clauseBlocks.length; i++){//Saco los ids de los elementos que elimino
        blocks[i] = new LogEventSyeEventDuplicated(clauseBlocks[i], timestamp);
      } 
      sendPostSye004(blocks);
  }
}

function prg002Listener(e){
  if(e == null) return;

  if(itemSelectedFromToolbox(e) && workspaceIsEmptyOrJustOneItem()){
    
    let obj = new LogEventPrg002(workspace.getBlockById(e.newValue));
    if(compilerNotFirstItem()){
      obj.State = 1;
    }
    sendPostPrg002(obj);
  }
}

function ntd001_prg003_prg004_Listener(e){
  if(e == null) return;

  if(itemSelectedFromToolbox(e)){
    var block =workspace.getBlockById(e.newValue);
    if(block.type == "var_expression"){
      let varExp = new LogEventNtd001(block);
      sendPostNtd001(varExp);
    } else if(block.type == "clause"){
      let varExp = new LogEventPrg00X(block, 'prg003');
      sendPostPrg003(varExp);
    } else if(block.type == "modifier"){
      let varExp = new LogEventPrg00X(block, 'prg004');
      sendPostPrg004(varExp);
    }
  }else if(fieldHasChanged(e)){    
    var block = workspace.getBlockById(e.blockId);
    if(block != null && block.type == "var_expression"){
      let varExp = new LogEventNtd001(block);

      var children = block.getChildren();
      if(children != null && children != undefined && children.length > 0){
        varExp.State = 0;
      }    
      sendPostNtd001(varExp);

    } else if(block != null && block.type == "clause"){
      let varExp = new LogEventPrg00X(block, 'prg003');
      if(!statementBlockIsEmpty(block, "elements_function")){
        varExp.State = 0;
      }      
      sendPostPrg003(varExp);

    }else if(block != null && block.type == "modifier"){
      let varExp = new LogEventPrg00X(block, 'prg004');
      if(!statementBlockIsEmpty(block, "restrictions_modifier")){
        varExp.State = 0;
      }
      sendPostPrg004(varExp);
    }
  }
}

//********* SCE00X */
function clauseHasModifiers(block){
  if((checkInputListHasName(block, "modifiers") && existsBlockChildArray(block, ["block_inputmodifier"]) && findParentByType(block, "modifier"))
    || existsBlockChildArray(block, ["restriction_clause", "restriction_clausecomment"])){
    return true;
  }
  return false;
}

function sce002Listener(e){
  if(e == null) return;

  var block = null;

  if(fieldHasChanged(e)){
    block = workspace.getBlockById(e.blockId);
    if(block == null) return;

    if(block.type == "clause")
    {
      // Check if it has a msg.sender | msg.transfer expression
      if(existsBlockChild(block, "msgvariables","msg.sender") 
        || existsBlockChild(block, "personalized_inputexpression","msg.sender") 
        || existsBlockChild(block, "personalized_inputexpression","msg.transfer") 
        || existsBlockChild(block, "msgvariables","msg.transfer")){
        var logEvento = new LogEventSce002(block);

        if((checkInputListHasName(block, "modifiers") && existsBlockChildArray(block, ["block_inputmodifier"]) && findParentByType(block, "modifier"))
          || existsBlockChildArray(block, ["restriction_clause", "restriction_clausecomment"])){
          logEvento.State = 0;
        }
        sendPostSce002(logEvento);
      }
    }else if(block.type == "var_expression"){
      // Child = msg.sender  || msg.transfer. Parent = clause
      var parent = findParentByType(block, "clause");
      if(parent == null) return;
      
      if(existsFieldInsideChildrenBlockByValue(block, "msg.sender") || existsFieldInsideChildrenBlockByValue(block, "msg.transfer")){
        var logEvento = new LogEventSce002(parent);
        if((checkInputListHasName(parent, "modifiers") && existsBlockChildArray(parent, ["block_inputmodifier"]) && findParentByType(parent, "modifier"))
          || existsBlockChildArray(parent, ["restriction_clause", "restriction_clausecomment"]))
        {
          logEvento.State = 0;
        }
        
        sendPostSce002(logEvento);
      }
    }else if(block.type =="personalized_inputexpression" || block.type == "msgvariables") {
      if(fieldHasValue(block.inputList, "msg.sender") || fieldHasValue(block.inputList, "msg.transfer")){
        // Check if it is inside a clause
        var parent = findParentByType(block, "clause");
        if(parent == null) return;

        var logEvento = new LogEventSce002(parent);
        if((checkInputListHasName(parent, "modifiers") && existsBlockChildArray(parent, ["block_inputmodifier"]) && findParentByType(parent, "modifier") != null)
          || existsBlockChildArray(parent, ["restriction_clause", "restriction_clausecomment"]))
        {
          logEvento.State = 0;
        }
        sendPostSce002(logEvento);
      }      
    }
  }
}

function sce005Listener(e){
  if(e == null) return;
  var block = null;

  if(itemSelectedFromToolbox(e)){
    block = workspace.getBlockById(e.newValue);
  }else if(fieldHasChanged(e)){
    block = workspace.getBlockById(e.blockId);
  }

  if(block == null) return;

  var parentBlock = findParentByType(block, "casting_expression");
  if(parentBlock!= null && parentBlock != undefined && parentBlock.type == "casting_expression"){
    
    var logEvento = new LogEventSce005(parentBlock);
    var fileBlock = findParentByType(block, "file");
    if(fileBlock != null && fileBlock != undefined){
      var parentBlockFromCast =  getBlockOwnElements(fileBlock, ["version"])[0];
    
      if(parentBlockFromCast != null && parentBlockFromCast != undefined){        
        if(blockVersionIsOkCompareTo(parentBlockFromCast, 0,8,1)){
          logEvento.State=0;
        }        
      } 
    }     
    sendPostSce005(logEvento);
  }
}

function blockVersionIsOkCompareTo(block, versionToValidate1, versionToValidate2, versionToValidate3){
  var userVersion = [versionToValidate1, versionToValidate2, versionToValidate3];
  
  var symbolversion = block.getFieldValue("symbolversion");
  var value1version = block.getFieldValue("value1version");
  var value2version = block.getFieldValue("value2version");
  var value3version = block.getFieldValue("value3version");
  var symbolcomparation = block.getFieldValue("symbolcomparation");
  var value1versionoptional = block.getFieldValue("value1versionoptional");
  var value2versionoptional = block.getFieldValue("value2versionoptional");
  var value3versionoptional = block.getFieldValue("value3versionoptional");    

  var versionMain = [
    parseInt(value1version || 0, 10),
    parseInt(value2version || 0, 10),
    parseInt(value3version || 0, 10)
  ];

  var hasLowerBound = (
    block.getFieldValue("value1version") != 0 ||
    block.getFieldValue("value2version") != 0 ||
    block.getFieldValue("value3version") != 0
  );
  
  var hasUpperBound = symbolcomparation && (
    block.getFieldValue("value1versionoptional") != 0 ||
    block.getFieldValue("value2versionoptional") != 0 ||
    block.getFieldValue("value3versionoptional") != 0
  );

  var versionOptional = hasUpperBound  ? [
    parseInt(value1versionoptional || 0, 10),
    parseInt(value2versionoptional || 0, 10),
    parseInt(value3versionoptional || 0, 10)
  ] : null;

  var minimunVersionOk = !hasUpperBound && !hasLowerBound ? false : evaluateComparison(userVersion, versionMain, symbolversion);
  var maxVersionOk = hasUpperBound ? evaluateComparison(userVersion, versionOptional,  symbolcomparation) : true;

  //Version to validate is inside range
  if (minimunVersionOk && maxVersionOk) {
    return true;
  } else {
    return false;
  }
}

function compareVersions(v1, v2) {
  for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
    const num1 = v1[i] || 0;
    const num2 = v2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

function evaluateComparison(versionMain, versionOptional, operator) {
  const result = compareVersions(versionMain, versionOptional);
  switch (operator) {
    case "greater":  return result > 0;
    case "greater_equal": return result >= 0;
    case "less":  return result < 0;
    case "less_equal": return result <= 0;
    default: throw new Error("Operador no válido: " + operator);
  }
}

function sce006Listener(e){
  if(e == null) return;

  var block = null;

  if(fieldHasChanged(e)){
    block = workspace.getBlockById(e.blockId);
    if(block == null) return;

    if(block.type == "assign_value_expression" || block.type == "assing_value_expression1inputs")
    {
      var parentBlock = findParentByType(block, "personalized_expression");
      
      if(parentBlock != null && parentBlock != undefined){        
        var logEvento = new LogEventSce006(parentBlock);
        if(fieldHasValue(parentBlock.inputList, "unchecked")){
          logEvento.State=1;
        }        
        sendPostSce006(logEvento);
      }
      
    }else if(block.type == "personalized_expression" && fieldHasValue(block.inputList, "unchecked")){
      var logEvento = new LogEventSce006(block);
      if(existsBlockChildArray(block, ["assign_value_expression", "assing_value_expression1inputs"])){
        logEvento.State=1;
      }
      sendPostSce006(logEvento);
    }
  }
}


function findParentByType(block, parentType){
  var parent = block.getParent();

  if(parent == null || parent == undefined) return null;

  if(parent.type == parentType) {
    return parent;
  }
  else {
    return findParentByType(parent, parentType); 
  } 
}

function existsBlockChildArray(block, childrenTypesArray){
  var children = block.getChildren();

  if(children == null || children == undefined) return false;

  var result =  false;
  const childrenOfTypeRequired = (element) => childrenTypesArray.includes(element.type);
  if(children.some(childrenOfTypeRequired))
    return true;
  else{
    children.forEach(element => {
      if(!result && existsBlockChildArray(element, childrenTypesArray)) result = true;
    });
  }
    
  return result;
}

function getBlockOwnElements(block, childrenTypesArray){
  var children = block.getChildren();

  var output = [];
  const childrenOfTypeRequired = (element) => childrenTypesArray.includes(element.type);
  if(children == null || children == undefined) return output;

  if(children.some(childrenOfTypeRequired)){
    output = children.filter(childrenOfTypeRequired)
  } 

  children.forEach((e)=> output = output.concat(getNextBlocksByType(e,childrenTypesArray)));
    
  return output;
}

function getNextBlocksByType(element, childrenTypesArray){
  var nextBlock = element.getNextBlock();
  var output = [];

  if(nextBlock == null || nextBlock == undefined) return output;
  
  if(childrenTypesArray.includes(nextBlock.type)){
    output.push(nextBlock);
  } 

  output = output.concat(getNextBlocksByType(nextBlock, childrenTypesArray));
    
  return output;
}

//Recursivo
function existsBlockChild(block, blockChildType, fieldChildValue){
  var children = block.getChildren();

  if(children == null || children == undefined) return false;

  var result =  false;
  const childrenOfTypeRequired = (element) => element.type == blockChildType && fieldHasValue(element.inputList, fieldChildValue);
  if(children.some(childrenOfTypeRequired))
    return true;
  else{
    children.forEach(element => {
      if(!result && existsBlockChild(element, blockChildType, fieldChildValue)) result = true;
    });
  }
    
  return result;
}

function existsStatementInsideBlockByName(block, statementName){
  var blockchilds = block.getChildren(false);

  if(blockchilds != null){
    var childByName = blockchilds.find((block1) => getName(workspace.getBlockById(block1.id)) == statementName);
    return childByName != null && childByName != undefined;
  }
  return false;
}

function existsStatementInsideBlockByValue(block, statementValue){
  var blockchilds = block.getChildren(false);

  if(blockchilds != null){
    var childByName = blockchilds.find((block1) => block1.getValue() == statementValue);
    return childByName != null && childByName != undefined;
  }
  return false;
}

function existsFieldInsideChildrenBlockByValue(block, fieldValue){
  var blockchilds = block.getChildren(false);
  
  if(blockchilds != null){
    var childByName = blockchilds.find((block1) => fieldHasValue(block1.inputList, fieldValue));
    return childByName != null && childByName != undefined;
  }
  return false;
}

function fieldHasValue(fieldsArray, fieldValue){
  if(fieldsArray == null || fieldsArray == undefined) return;
  var fieldByValue = fieldsArray.find((field)=> field.fieldRow != null && field.fieldRow != undefined 
    && (field.fieldRow[0].value_ == fieldValue || field.fieldRow[0].value_.includes(fieldValue)));
  return fieldByValue != null && fieldByValue != undefined;
}

function fieldHasName(fieldsArray, fieldName){
  if(fieldsArray == null || fieldsArray == undefined) return;
  var fieldByName = fieldsArray.find((field)=> getName(field) == fieldName);
  return fieldByName != null && fieldByName != undefined;
}

function checkInputListHasName(block, fieldName){
  var inputsArray = block.inputList;
  if(inputsArray == null || inputsArray == undefined) return false;

  //Input field must be created and not empty
  var inputByName = inputsArray.find((field)=> field.name == fieldName && field.fieldRow != null && field.fieldRow != undefined && field.fieldRow.length > 0);
  return inputByName != null && inputByName != undefined;
}

function workspaceIsEmptyOrJustOneItem(){
  var blocks = workspace.getAllBlocks();
  return blocks == null || blocks == [] || blocks.length == 1 ;
}

function compilerNotFirstItem(){
  var blocks = workspace.getAllBlocks();
  return blocks == null || blocks == [] || (blocks.length == 1 && blocks[0].type !="version");
}

function itemSelectedFromToolbox(e){
  return e.type == Blockly.Events.UI && e.element == "selected" && (e.newValue != "" || e.newValue != null) && e.oldValue != null && workspace.getBlockById(e.newValue) != null;
}

function fieldHasChanged(e){
  return e.type == Blockly.Events.CHANGE && e.element == "field";
}

/*
  Descripción: Parsea a texto los logs del array del evento para poder descargar un archivo en el que están recogidos todos estos
*/
function saveLog(){
  var logEvento = new LogEventButtonBlockly("downloadLog",workspace);
  logsEventos.push(logEvento); 
  
  var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logsEventos));
  var downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href",dataStr);
  downloadAnchorNode.setAttribute("download","logEvents.json");
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
  

function registerLogs(state){
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
    const logEvento1 = new LogEventButtonBlockly("activateLogEvent",workspace);
    logsEventos.push(logEvento1);
  } else {
    workspace.removeChangeListener(logger);
    flyoutWorkspace.removeChangeListener(logger);
    const logEvento1 = new LogEventButtonBlockly("disableLogEvent",workspace);
    logsEventos.push(logEvento1);
    if(checkbox1.checked == false){
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

  //workspace.addChangeListener(prg001Listener);
}


function textAreaChange(){
  var buttonSaveXML = document.getElementById('saveXMLButton');  
  if(document.getElementById("XmlArea").value != ""){
    buttonSaveXML.disabled = false;
  }
  else{
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
      constructor(typeActionButton,workspace){
        this.idSession = idSession;
        this.idEvent = generateId();
        this.typeEvent = "click tool button";
        this.date = time();
        if(typeActionButton == "seeXML"){       
          this.action = "see XML file";
        }
        if(typeActionButton == "downloadXML"){       
          this.action = "download XML file";    
        }
        if(typeActionButton == "downloadLog"){       
          this.action = "download Log file";    
        }
        if(typeActionButton == "cleanBlocks"){       
          this.action = "clean workspace"  ;    
        }
        if(typeActionButton == "importXML"){       
          this.action = "import XML file"  ;    
        } 
        if(typeActionButton == "transform"){       
          this.action = "transform XML file"  ;    
        } 
        if(typeActionButton == "activateLogFlyoutEvent"){
          this.action = "activate flyout event logs";
        }
        if(typeActionButton == "disableLogFlyoutEvent"){
          this.action = "disable flyout event logs";
        }
        if(typeActionButton == "activateLogEvent"){
          this.action = "activate event logs";
        }
        if(typeActionButton == "disableLogEvent"){
          this.action = "disable flyout event logs";
        }   
      } 
    }

  /*
    Descripción: Clase para definir los logs producidos por los eventos según el tipo que sean
  */
  class LogEventBlockly {

    constructor (e) {
       this.idSession = idSession;
       this.typeEvent = e.type;
       this.date = time();
       this.idBlock = e.blockId;      
       this.idEvent = generateId();
       if(e.type == Blockly.Events.CREATE){          
         if(e.ids.length > 1){
            this.action = "recover workspace";
            var idBlocks = [];
            this.workspace = [];
            for(var i=0;i<e.ids.length;i++){//Saco los ids de los elementos que elimino
              idBlocks[i] =  e.ids[i];
            }
            this.idBlock = idBlocks;
            this.amountBlocksCreated = idBlocks.length;
            for(var i=0;i < idBlocks.length;i++){//Saco los bloques que arrastro
              const block = {
                id: workspace.getBlockById(idBlocks[i]).id,
                type: workspace.getBlockById(idBlocks[i]).type,
              }
              this.workspace[i] = block;
            } 
         }
         else{
          this.action = "create element";
          this.nowValueBlock = e.xml.textContent;  
          this.typeBlock = e.xml.attributes[0].value;   
         }
       }
       if(e.type == Blockly.Events.CHANGE){
         this.oldValueBlock = e.oldValue;
         this.nowValueBlock = e.newValue; 
         if(e.element == "collapsed"){
            if(e.newValue == false && e.oldValue == true){
              this.action = "extend block";
            }
            else if(e.newValue == true && e.oldValue == false){
              this.action = "collapse block";
            }            
         }
         else if(e.element == "disabled"){
            if(e.newValue == false && e.oldValue == true){
              this.action = "enable block";
            }
            else if(e.newValue == true && e.oldValue == false){
              this.action = "disable block";
            }            
         }           
         else if(e.element != "comment"){
           if(e.oldValue == null && e.newValue == ""){
             this.action = "create comment"
           }
           else{
              if(e.newValue == null && (e.oldValue != "" || e.oldValue != null)){
                this.action = "remove comment";
              }
           }
         }
         else{         
            this.action = "change:" + e.element;  
         }
       }
       if(e.type == Blockly.Events.MOVE){
         if(e.oldInputName != "" && e.oldInputName != null){
            this.typeBlock = e.oldInputName;
            this.action = "move:" + this.typeBlock;     
         }
         else{
            this.action = "move";
         }
         if(e.oldCoordinate != null){
            this.oldCoordinateX = e.oldCoordinate.x;
            this.oldCoordinateY = e.oldCoordinate.y;
            this.oldCoordinate =  '('+ e.oldCoordinate.x + "," + e.oldCoordinate.y + ')';
         }
         if(e.newCoordinate != null){
            this.newCoordinateX = e.newCoordinate.x; 
            this.newCoordinateY = e.newCoordinate.y;
            this.newCoordinate =  '('+ e.newCoordinate.x + "," + e.newCoordinate.y + ')';
         } 
       }
       if(e.type == Blockly.Events.DELETE){
         this.nowValueBlock = e.oldXml.textContent;     
         this.oldXml = e.oldXml; 
         this.typeBlock = e.oldXml.attributes[0].value; 
         this.blockDelete = e.oldXml;
       }
       if(e.type == Blockly.Events.UI){
         if(e.element == "category"){
            this.action = "select toolbox option"
            this.category = e.newValue;
         }
         else if(e.element == "selected"){
            if((e.newValue == "" || e.newValue == null) && e.oldValue != null){
              if(workspace.getBlockById(e.oldValue) == null){//Se borra el elemento desde el menu emergente al hacer click derecho sobre el    
                this.action = "select delete block option";
              }
              else{//Se desmarca el bloque
                const block = {
                  id: workspace.getBlockById(e.oldValue).id,
                  type: workspace.getBlockById(e.oldValue).type,
                }
                this.action = "unselect block";
                this.blockSelect = block;
              }
            }
            else if((e.newValue == "" || e.newValue == null) && e.oldValue == null){//Se abre el menu de opciones sobre el elemento
              this.action = "open menu block option";
              const block = {
                id: workspace.getBlockById(e.newValue).id,
                type: workspace.getBlockById(e.newValue).type,
              }
              this.blockSelect = block;
            }    
            else if((e.newValue != "" || e.newValue != null) && e.oldValue != null){//Se ha seleccionado un bloque desde la barra de herramienta
              if(workspace.getBlockById(e.newValue) != null){ 
                this.action = "select type block from toolbox";
                const block = {
                  id: workspace.getBlockById(e.newValue).id,
                  type: workspace.getBlockById(e.newValue).type,
                }
                this.blockSelect = block;
              }
            }        
         }  
         else if(e.element == "commentOpen"){
             if(e.newValue == false && e.oldValue == true){
              this.action = "close comment";
             }
             else if(e.newValue == true && e.oldValue == false){
              this.action = "open comment";
             }            
         }  
         else if(e.element == "dragStart"){  
            this.typeBlocksDrag = [];
            for(var i=0;i<e.newValue.length;i++){//Saco los bloques que arrastro
              const block = {
                id: e.newValue[i].id,
                type: e.newValue[i].type,
              }
              this.typeBlocksDrag[i] = block;
            } 
            this.action = "start drag element";    
         }  
         else if(e.element == "dragStop"){  
            this.typeBlocksDrag = [];
            for(var i=0;i<e.oldValue.length;i++){//Saco los bloques que arrastro
              const block = {
                id: e.oldValue[i].id,
                type: e.oldValue[i].type,
              }
              this.typeBlocksDrag[i] = block;
            }  
            this.action = "stop drag element";   
         }
       }
       if(e.type == Blockly.Events.FINISHED_LOADING){
          this.action = "workspace is ready";
       }
    }
  }

  class LogEventDep001{
    constructor (e) {
      this.timestamp = time();
      this.idSession = idSession;
      // Block content itself
      this.symbolversion = e.getFieldValue("symbolversion");
      this.value1version = e.getFieldValue("value1version");
      this.value2version = e.getFieldValue("value2version");
      this.value3version = e.getFieldValue("value3version");
      this.symbolcomparation = e.getFieldValue("symbolcomparation");
      this.value1versionoptional = e.getFieldValue("value1versionoptional");
      this.value2versionoptional = e.getFieldValue("value2versionoptional");
      this.value3versionoptional = e.getFieldValue("value3versionoptional");       
      this.blockId = e.id;     
    }
  }

  class LogEventSye001{
    constructor (e) {  
      this.Timestamp = time();
      this.IdSession = idSession;    
      this.State = 1;  
      this.Param1 = "";   
      this.Topic = "sye001";    
      this.BlockId = e.id;     
    }
  }

  class LogEventPrg001{
    constructor () {
      this.timestamp = time();
      this.idSession = idSession;          
    }
  }

  class LogEventNtd001{    
    constructor (e) {
      this.Timestamp = time();
      this.IdSession = idSession;    
      this.State = 1;  
      this.Param1 = e.getFieldValue("name");   
      this.Topic = "ntd001";    
      this.BlockId = e.id;   
    }
  }

  class LogEventSce002{
    constructor (e) {
      this.Timestamp = time();
      this.IdSession = idSession;
      this.State = 1;   
      this.Param1 = e.getFieldValue("name");    
      this.Topic = "sce002"; 
      this.BlockId = e.id;      
    }
  }

  class LogEventSce005{
    constructor (e) {
      this.Timestamp = time();
      this.IdSession = idSession;
      this.State = 1;   
      this.Param1 = "";    
      this.Topic = "sce005"; 
      this.BlockId = e.id;      
    }
  }

  class LogEventSce006{
    constructor (e) {
      this.Timestamp = time();
      this.IdSession = idSession;
      this.State = 0;   
      this.Param1 = "";    
      this.Topic = "sce006"; 
      this.BlockId = e.id;      
    }
  }

  class LogEventPrg00X{
    constructor (e, topic) {
      this.Timestamp = time();
      this.IdSession = idSession;
      this.State = 1;   
      this.Param1 = e.getFieldValue("name"); 
      this.Topic = topic;          
      this.BlockId = e.id;   
    }
  }

  class LogEventPrg002{
    constructor (e) {
      this.Timestamp = time();
      this.IdSession = idSession;
      this.Topic = "prg002";
      this.State = 0;   
      this.Param1 = "";    
      this.BlockId = e.id;  
    }
  }  

  class LogEventNtd002{
    constructor (e, timestamp) {
      this.timestamp = timestamp;
      this.idSession = idSession;
      // Block content itself
      this.name = e.getFieldValue("name");
      this.values_visibility = e.getFieldValue("values_visibility");        
      this.blockId = e.id;         
    }
  }

  class LogEventSce003{
    constructor (e, timestamp) {
      this.timestamp = timestamp;
      this.idSession = idSession;
      // Block content itself
      this.name = e.getFieldValue("name");
      this.values_visibility = e.getFieldValue("values_visibility");        
      this.blockId = e.id; 
      this.hasModifiers = clauseHasModifiers(e) ? 1 : 0;        
    }
  }

  class LogEventNtd003{
    constructor (e, timestamp, parentBlock) {
      this.timestamp = timestamp;
      this.idSession = idSession;
      this.name = e.getFieldValue("name");
      this.values_visibility = e.getFieldValue("values_visibility");      
      this.values_inputmodifier = e.getFieldValue("values_inputmodifier");    
      this.parent = parentBlock; 
      this.blockId = e.id;  
    }
  }

  class LogEventSyeEventDuplicated{
    constructor (e, timestamp) {
      this.timestamp = timestamp;
      this.idSession = idSession;
      // Block content itself
      this.name = e.getFieldValue("name"); 
      this.blockId = e.id;          
    }
  }
 
  function assignIdFileBlock(){
    if(e.type == "File"){
      return e.blockId;
    }
  }
  
  /*  
    Descripción: Calcula la hora actual y la devuelve como un string
    Parámetro de salida: String de la hora actual
  */
  function time(){
    const tiempoTranscurrido = Date.now();
    const hoy = new Date(tiempoTranscurrido);
    return hoy.toLocaleString();
  }
  
   /*  
    Descripción:Genera un identificador único
    Parámetro de salida: Genera un id para el log
  */
  function generateId() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }
  