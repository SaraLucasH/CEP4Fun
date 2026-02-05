  
"use strict";


var SolidityGenerator = new Blockly.Generator('Solidity');

SolidityGenerator.ORDER_ATOMIC = 0;
SolidityGenerator.ORDER_NONE = 0;

SolidityGenerator.init = function(workspace) {};
SolidityGenerator.finish = function(code) {return code;};

SolidityGenerator.scrub_ = function(block, code) {
  var nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  if(nextBlock != null){
    if(nextBlock.type == "inputparamshortidentifier" || nextBlock.type == "input_param"){
      code +=  ", ";
    }
  }
  var nextCode = SolidityGenerator.blockToCode(nextBlock);
  return code + nextCode;
};


/*
Parámetro de entrada: El bloque que va a generar su código asociado
Descripción de la función: Lo que hace generar el código definido en ese elemento y se guarda en la variable code
Párametro de salidad: El código generado almacenado en la variable code
*/
SolidityGenerator['file'] = function(block) {
  var version = SolidityGenerator.statementToCode(block, 'version_file');
  var statements_content = SolidityGenerator.statementToCode(block, 'elements_file');
  var code =  code = version + '\n' + statements_content + '\n';
  return code;
};

SolidityGenerator['version'] = function(block) {
  var dropdown_symbolversion = block.getFieldValue('symbolversion');
  var number_value1version = block.getFieldValue('value1version');
  var number_value2version = block.getFieldValue('value2version');
  var number_value3version = block.getFieldValue('value3version');
  if(dropdown_symbolversion == "greater"){
    dropdown_symbolversion = ">";
  }
  else if(dropdown_symbolversion == "greater_equal"){
    dropdown_symbolversion = ">=";
  }
  var code = "# @version" + dropdown_symbolversion + number_value1version + '.' + number_value2version + '.' + number_value3version + ";";
  return code;
};

SolidityGenerator['range_version'] = function(block) {
  var dropdown_symbolversion = block.getFieldValue('symbolversion');
  var number_value1version = block.getFieldValue('value1version');
  var number_value2version = block.getFieldValue('value2version');
  var number_value3version = block.getFieldValue('value3version');
  var dropdown_symbolcomparation = block.getFieldValue('symbolcomparation');
  var number_value1versionoptional = block.getFieldValue('value1versionoptional');
  var number_value2versionoptional = block.getFieldValue('value2versionoptional');
  var number_value3versionoptional = block.getFieldValue('value3versionoptional');
  if(dropdown_symbolversion == "greater"){
    dropdown_symbolversion = ">";
  }
  else if(dropdown_symbolversion == "greater_equal"){
    dropdown_symbolversion = ">=";
  }
  if(dropdown_symbolversion == "less"){
    dropdown_symbolcomparation = "<";
  }
  else if(dropdown_symbolversion == "less_equal"){
    dropdown_symbolcomparation = "<=";
  }
  var code = "pragma solidity " + dropdown_symbolversion + number_value1version + '.' + number_value2version + '.' + number_value3version;
  if(number_value1versionoptional != "0" || number_value2versionoptional != "0" || number_value3versionoptional != "0"){
    code += dropdown_symbolcomparation + number_value1versionoptional + '.' + number_value2versionoptional != "0" + '.' + number_value3versionoptional;
  }
  return code;
};


SolidityGenerator['import'] = function(block) {
  var resource_route = block.getFieldValue('resource_route');
  var statements_content = SolidityGenerator.statementToCode(block, 'alias');
  var code = 'import ' + '"' + resource_route + '"' + statements_content + ';\n';
  return code;
};

SolidityGenerator['alias_import'] = function(block) {
  var alias = block.getFieldValue('alias');
  var code = 'alias ' + alias;
  return code;
};

SolidityGenerator['library'] = function(block) {
  var library_name = block.getFieldValue('name');
  var statements_content = SolidityGenerator.statementToCode(block, 'functions_library');
  var code = 'library ' + library_name + " {\n" + statements_content + '}\n';
  return code;
};

SolidityGenerator['interface'] = function(block) {
  var interface_name = block.getFieldValue('name');
  var statements_content = SolidityGenerator.statementToCode(block, 'interface_functions');
  var code = 'interface ' + interface_name + " {\n" + statements_content + '}\n';
  return code;
};

SolidityGenerator['interface_clausedeclaration'] = function(block){
  var interface_function_name = block.getFieldValue('name');
  var interface_function_visibility = block.getFieldValue('values_visibility');
  var interface_function_valuesinputmodifier = block.getFieldValue('values_inputmodifier');
  var interface_function_personalizedmodifier = SolidityGenerator.statementToCode(block,'modifiers');
  var interface_function_name = block.getFieldValue('name');
  var inputparams_content = SolidityGenerator.statementToCode(block,'inputparams_function');
  inputparams_content = inputparams_content.trim();
  var outputparam = SolidityGenerator.statementToCode(block,'returns_values');
  var code;
  if(interface_function_personalizedmodifier != null){
    code = 'function ' + interface_function_name + '(' + inputparams_content + ')' + interface_function_visibility + ' ' + interface_function_valuesinputmodifier + outputparam + ";\n";
  }
  else{
    code = 'function ' + interface_function_name + '(' + inputparams_content + ')' + interface_function_visibility + ' ' + outputparam + ";\n";
  }
  return code;
};

SolidityGenerator['event'] = function(block) {
  var event_name = block.getFieldValue('name');
  var inputparams_content = SolidityGenerator.statementToCode(block, 'inputparams');
  inputparams_content = inputparams_content.trim();
  var code = 'event ' + event_name + "(" + inputparams_content + ');\n';
  return code;
};


SolidityGenerator['modifier'] = function(block) {
  var modifier_name = block.getFieldValue('name');
  var statements_content = SolidityGenerator.statementToCode(block, 'restrictions_modifier');
  var inputparams_content = SolidityGenerator.statementToCode(block, 'inputparams');
  inputparams_content = inputparams_content.trim();
  var code = 'modifier ' + modifier_name + "(" + inputparams_content + '){\n' + statements_content + "}\n";
  return code;
};

SolidityGenerator['restriction_clause'] = function(block) {
  var require_condition_content = SolidityGenerator.statementToCode(block, 'condition');
  var code = "require(" + require_condition_content + ");\n";
  return code;
};

SolidityGenerator['restriction_clausecomment'] = function(block) {
  var comment = block.getFieldValue('comment');
  var require_condition_content = SolidityGenerator.statementToCode(block, 'condition');
  var code = "require(" + require_condition_content + ',"' + comment +  '");\n';
  return code;
};

SolidityGenerator['coin_expression'] = function(block) {
  var amount_coin = block.getFieldValue('amount_coin');
  var type_coin = block.getFieldValue('type_coin');
  var code = amount_coin + " " + type_coin;
  return code;
};

SolidityGenerator['closemodifier'] = function(block) {
  var code = "_;\n";
  return code;
};

SolidityGenerator['markmodifier'] = function(block) {
  var code = "_;\n";
  return code;
};


SolidityGenerator['inputparam'] = function(block) {
  //var value_name = SolidityGenerator.valueToCode(block, 'NAME', SolidityGenerator.ORDER_ATOMIC);
  var statements_content = SolidityGenerator.statementToCode(block,'inputparams');
  statements_content = statements_content.trim();
  var code = statements_content;
  return code;
};

SolidityGenerator['input_param'] = function(block) {
  var inputparam_type = SolidityGenerator.statementToCode(block,'type');
  inputparam_type = inputparam_type.trim();
  var inputparam_name = block.getFieldValue('name');
  var inputparam_indexed =  block.getFieldValue('indexed');
  var inputparam_storagedata_values =  block.getFieldValue('storagedata_values');
  var property_array =  SolidityGenerator.statementToCode(block,'arraydimension');
  property_array = property_array.trim();
  var code;
  if(inputparam_indexed == "TRUE"){
    if(property_array == ""){
      code = inputparam_type + " " +  'indexed' + " "+ inputparam_storagedata_values + " " +  inputparam_name;
    }
    else{
      code = inputparam_type + " " + property_array + " " + 'indexed' + " " + inputparam_storagedata_values + " " +  inputparam_name;     
    }
  }
  else{
    if(property_array == ""){
      code = inputparam_type + " " + inputparam_storagedata_values + " " +  inputparam_name;
    }
    else{
      code = inputparam_type + " " + property_array + inputparam_storagedata_values + " " +  inputparam_name;
    }
  }
  return code;
};


SolidityGenerator['inputparamshortidentifier'] = function(block) {
var inputparam_type =  SolidityGenerator.statementToCode(block, 'type');
var inputparam_name =  block.getFieldValue('name');
var property_array =  SolidityGenerator.statementToCode(block,'arraydimension');
property_array = property_array.trim();
var code;
if(property_array != ""){
  code =  inputparam_type + property_array +  inputparam_name;
}
else{
  code =  inputparam_type +  inputparam_name;
}
return code;
};

SolidityGenerator['outputparam'] = function(block) {
  var outputparam_name =  block.getFieldValue('name');
  var outputparam_type =  SolidityGenerator.statementToCode(block, 'value_type_outputparam');
  var code;
  if(outputparam_type == null || outputparam_type == ""){
    code =  "returns" + outputparam_name;
  }
  else{
    if(outputparam_name != ""){
      code =  "->" + outputparam_type + " " +  outputparam_name;
    }
    else{
      code =  "->" + outputparam_type + ":";
    }
  }
  return code;
};

SolidityGenerator['abstract_contract'] = function(block) {
  var contract_name = block.getFieldValue('name');
  var statements_content = SolidityGenerator.statementToCode(block, 'contract_elements');
  var code = 'abstract contract ' + contract_name + " {\n" + statements_content + '}\n';
  return code;
};


SolidityGenerator['contract'] = function(block) {
  var contract_name = block.getFieldValue('name');
  var statements_content = SolidityGenerator.statementToCode(block, 'contract_elements');
  var inheritance_contract = SolidityGenerator.statementToCode(block, 'namecontractfather');
  var code;
  if(inheritance_contract != ""){
    inheritance_contract = "is" + inheritance_contract;
    code = 'contract ' + contract_name + " " + inheritance_contract + "{\n" + statements_content + '}\n';
  }
  else{
    code = 'contract ' + contract_name + " {\n" + statements_content + '}\n';
  }
  return code;
};

SolidityGenerator['contract_father'] = function(block) {
  var contract_name = block.getFieldValue('name');
  var next_contract = SolidityGenerator.statementToCode(block, 'contracts_inherit');
  var contracts_inherit;
  if(next_contract == ""){
    contracts_inherit =  SolidityGenerator.statementToCode(block, 'contracts_inherit');
  }
  else{
    contracts_inherit =  ',' + SolidityGenerator.statementToCode(block, 'contracts_inherit');   
  }
  var code = contract_name + contracts_inherit;
  return code;
};

SolidityGenerator['contract_constructor'] = function(block) {
  var statements_content = SolidityGenerator.statementToCode(block, 'expressions_constructor');
  var inputparams_content = SolidityGenerator.statementToCode(block, 'type');
  var inherance_constructor = SolidityGenerator.statementToCode(block, 'inherance');
  var constructor_visibility = block.getFieldValue('visibility_values');
  var constructor_payable = block.getFieldValue('payable');
  var code;
  if(constructor_payable != "TRUE"){
    if(inherance_constructor == ""){
      code = "constructor(" + inputparams_content + ') ' + constructor_visibility + "{\n" + statements_content + '}\n';
    }
    else{
      code = "constructor(" + inputparams_content + ') ' + inherance_constructor + ' ' + constructor_visibility + "{\n" + statements_content + '}\n';
    }
  }
  else{
    if(inherance_constructor == ""){
     code = "constructor(" + inputparams_content + ') ' + constructor_visibility + " payable" +  "{\n" + statements_content + '}\n';
    }
    else{
      code = "constructor(" + inputparams_content + ') ' + inherance_constructor + ' ' + constructor_visibility  + " payable" + "{\n" + statements_content + '}\n';
    }
 }
  return code;
};

SolidityGenerator['block_constructor_contract_inherance'] = function(block) {
  var constructor_inherance_contract_name = block.getFieldValue('contract_name_inherance');
  var inputparams_content = SolidityGenerator.statementToCode(block, 'input_params');
  var code = constructor_inherance_contract_name + '(' + inputparams_content + ')';
  return code;
};

SolidityGenerator['clause'] = function(block) {
  var function_name = block.getFieldValue('name');
  var inputparams_content = SolidityGenerator.statementToCode(block,'inputparams_function');
  inputparams_content = inputparams_content.trim();
  var function_visibility = block.getFieldValue('values_visibility');
  function_visibility = function_visibility.trim();
  var function_valuesinputmodifier = block.getFieldValue('values_inputmodifier');
  var function_personalizedmodifier = SolidityGenerator.statementToCode(block,'modifiers');
  var outputparam = SolidityGenerator.statementToCode(block,'returns_values');
  outputparam = outputparam.trim();
  var function_statements_content = SolidityGenerator.statementToCode(block,'elements_function');
  var code;
  code += '@' + function_visibility;
  if(function_personalizedmodifier == null){
    code += 'def ' + function_name + '(' + inputparams_content + ') ' + function_visibility + ' ' + function_valuesinputmodifier + ' ' + outputparam + "{\n" + 
    function_statements_content + "}\n";
  }
  else{
    code = 'def ' + function_name + '(' + inputparams_content + ') ' + function_visibility + ' ' + function_valuesinputmodifier+ ' ' + function_personalizedmodifier + ' ' + outputparam + "{\n" + 
    function_statements_content + "}\n";
  }
  return code;
};

SolidityGenerator['return_clause'] = function(block) {
  var value = SolidityGenerator.statementToCode(block,'values');
  var code = "return "  + value + ";\n";
  return code;
};

SolidityGenerator['overridemodifier'] = function(block) {
  var value = SolidityGenerator.statementToCode(block,'inputparams');
  var code = "override "  +  value;
  return code;
};

SolidityGenerator['block_inputmodifier'] = function(block) {
  var input_modifier_name = block.getFieldValue('value') + '()';
  var next_input_modifier = SolidityGenerator.statementToCode(block,'modifier');
  if(next_input_modifier != null){
       var code = input_modifier_name + next_input_modifier;
  }
  else{
      var code = input_modifier_name; 
  }
  return code;
};

//Generador de propiedades largas

SolidityGenerator['text_property'] = function(block) {
  var property_name = block.getFieldValue('name');
  var property_type = block.getFieldValue('type');
  if(property_type == "char_type"){
    property_type = "char";
  }
  else{
    property_type = "string";
  }
  var property_constant = block.getFieldValue('constant');
  var property_visibility = block.getFieldValue('values_visibility');
  var property_storagedata_values =  block.getFieldValue('storagedata_values');
  var property_array =  SolidityGenerator.statementToCode(block,'arraydimension');
  property_array = property_array.trim();
  var property_valueproperty = SolidityGenerator.statementToCode(block,'valueproperty');
  var code;
  if(property_valueproperty == null){
    property_valueproperty = "";
  }
  if(property_array == ""){
    if(property_constant == "TRUE"){
      code = property_type + ' ' + property_visibility + ' ' + "constant" + ' ' + property_storagedata_values + ' ' + property_name + ' ' + property_valueproperty +";\n";
    }
    else{
      code = property_type + ' ' + property_visibility + ' ' + property_storagedata_values + ' ' + property_name + ' ' + property_valueproperty +";\n";
    }
  }
  else{
    if(property_constant == "TRUE"){
      code = property_type + " " + property_array + ' ' + property_visibility + ' ' + "constant" + ' ' + property_storagedata_values + ' ' + property_name + ' ' + property_valueproperty +";\n";
    }
    else{
      code = property_type + " "  + property_array + ' ' + property_visibility + ' ' + property_storagedata_values + ' ' + property_name + ' ' + property_valueproperty +";\n";
    }
  }
  return code;
};

SolidityGenerator['byte_property'] = function(block) {
  var property_name = block.getFieldValue('name');
  var property_type = block.getFieldValue('byte_type');
  var property_constant = block.getFieldValue('constant');
  var property_visibility = block.getFieldValue('values_visibility');
  var property_storagedata_values =  block.getFieldValue('storagedata_values');
  var property_array =  SolidityGenerator.statementToCode(block,'arraydimension');
  property_array = property_array.trim();
  var property_valueproperty = SolidityGenerator.statementToCode(block,'valueproperty');
  var code;
  if(property_valueproperty ==  null){
    property_valueproperty = "";
  }
  if(property_array == ""){
    if(property_constant == "TRUE"){
      code = property_type + ' ' + property_visibility + ' ' + "constant" + ' ' + property_storagedata_values + ' ' + property_name + ' ' + property_valueproperty +";\n";
    }
    else{
      code = property_type + ' ' + property_visibility + ' ' + property_storagedata_values + ' ' + property_name + ' ' + property_valueproperty +";\n";
    }
  }
  else{
    if(property_constant == "TRUE"){
      code = property_type + " " + property_array + ' ' + property_visibility + ' ' + "constant" + ' ' + property_storagedata_values + ' ' + property_name + ' ' + property_valueproperty +";\n";
    }
    else{
      code = property_type + " "  + property_array + ' ' + property_visibility + ' ' + property_storagedata_values + ' ' + property_name + ' ' + property_valueproperty +";\n";
    }
  }
  return code;
};

SolidityGenerator['identifier_property'] = function(block) {
  var property_name = block.getFieldValue('name');
  var property_type = block.getFieldValue('type');
  var property_constant = block.getFieldValue('constant');
  var property_visibility = block.getFieldValue('values_visibility');
  var property_storagedata_values =  block.getFieldValue('storagedata_values');
  var property_array =  SolidityGenerator.statementToCode(block,'arraydimension');
  property_array = property_array.trim();
  var property_valueproperty = SolidityGenerator.statementToCode(block,'valueproperty');
  var code;
  if(property_valueproperty ==  null){
    property_valueproperty = "";
  }
  if(property_array == ""){
    if(property_constant == "TRUE"){
      code = property_type + ' ' + property_visibility + ' ' + "constant" + ' ' + property_storagedata_values + ' ' + property_name + ' ' + property_valueproperty +";\n";
    }
    else{
      code = property_type + ' ' + property_visibility + ' ' + property_storagedata_values + ' ' + property_name + ' ' + property_valueproperty +";\n";
    }
  }
  else{
    if(property_constant == "TRUE"){
      code = property_type + " " + property_array + ' ' + property_visibility + ' ' + "constant" + ' ' + property_storagedata_values + ' ' + property_name + ' ' + property_valueproperty +";\n";
    }
    else{
      code = property_type + " "  + property_array + ' ' + property_visibility + ' ' + property_storagedata_values + ' ' + property_name + ' ' + property_valueproperty +";\n";
    }
  }
  return code;
};

SolidityGenerator['boolean_property'] = function(block) {
  var property_name = block.getFieldValue('name');
  var property_constant = block.getFieldValue('constant');
  var property_visibility = block.getFieldValue('values_visibility');
  var property_storagedata_values =  block.getFieldValue('storagedata_values');
  var property_array =  SolidityGenerator.statementToCode(block,'arraydimension');
  property_array = property_array.trim();
  var property_valueproperty = SolidityGenerator.statementToCode(block,'valueproperty');
  var code;
  if(property_valueproperty ==  null){
    property_valueproperty = "";
  }
  if(property_array == ""){
    if(property_constant == "TRUE"){
      code = "boolean" + ' ' + property_visibility + ' ' + "constant" + ' ' + property_storagedata_values + ' ' + property_name + ' ' + property_valueproperty +";\n";
    }
    else{
      code = "boolean" + ' ' + property_visibility + ' ' + property_storagedata_values + ' ' + property_name + ' ' + property_valueproperty +";\n";
    }
  }
  else{
    if(property_constant == "TRUE"){
      code = "boolean" + " " + property_array + ' ' + property_visibility + ' ' + "constant" + ' ' + property_storagedata_values + ' ' + property_name + ' ' + property_valueproperty +";\n";
    }
    else{
      code = "boolean" + " "  + property_array + ' ' + property_visibility + ' ' + property_storagedata_values + ' ' + property_name + ' ' + property_valueproperty +";\n";
    }
  }
  return code;
};

SolidityGenerator['address_property'] = function(block) {
  var property_name = block.getFieldValue('name');
  var property_type = block.getFieldValue('addresstype_values');
  var property_constant = block.getFieldValue('constant');
  var property_visibility = block.getFieldValue('values_visibility');
  var property_storagedata_values =  block.getFieldValue('storagedata_values');
  var property_array =  SolidityGenerator.statementToCode(block,'arraydimension');
  property_array = property_array.trim();
  var property_valueproperty = SolidityGenerator.statementToCode(block,'valueproperty');
  var code;
  if(property_array == ""){
    if(property_constant == "TRUE"){
      code = property_type + ' ' + property_visibility + ' ' + "constant" + ' ' + property_storagedata_values + ' ' + property_name + ' ' + property_valueproperty +";\n";
    }
    else{
      code = property_type + ' ' + property_visibility + ' ' + property_storagedata_values + ' ' + property_name + ' ' + property_valueproperty +";\n";
    }
  }
  else{
    if(property_constant == "TRUE"){
      code = property_type + " " + property_array + ' ' + property_visibility + ' ' + "constant" + ' ' + property_storagedata_values + ' ' + property_name + ' ' + property_valueproperty +";\n";
    }
    else{
      code = property_type + " "  + property_array + ' ' + property_visibility + ' ' + property_storagedata_values + ' ' + property_name + ' ' + property_valueproperty +";\n";
    }
  }
  return code;
};

SolidityGenerator['number_property'] = function(block) {
  var property_name = block.getFieldValue('name');
  var property_type = block.getFieldValue('numbertype_property');
  var property_constant = block.getFieldValue('constant');
  var property_visibility = block.getFieldValue('values_visibility');
  var property_storagedata_values =  block.getFieldValue('storagedata_values');
  var property_array =  SolidityGenerator.statementToCode(block,'arraydimension');
  property_array = property_array.trim();
  var property_valueproperty = SolidityGenerator.statementToCode(block,'valueproperty');
  if(property_valueproperty ==  null){
    property_valueproperty = "";
  }
  var code;
  if(property_array == ""){
    if(property_constant == "TRUE"){
      code = property_type + ' ' + property_visibility + ' ' + "constant" + ' ' + property_storagedata_values + ' ' + property_name + ' ' + property_valueproperty +";\n";
    }
    else{
      code = property_type + ' ' + property_visibility + ' ' + property_storagedata_values + ' ' + property_name + ' ' + property_valueproperty +";\n";
    }
  }
  else{
    if(property_constant == "TRUE"){
      code = property_type + " " + property_array + ' ' + property_visibility + ' ' + "constant" + ' ' + property_storagedata_values + ' ' + property_name + ' ' + property_valueproperty +";\n";
    }
    else{
      code = property_type + " "  + property_array + ' ' + property_visibility + ' ' + property_storagedata_values + ' ' + property_name + ' ' + property_valueproperty +";\n";
    }
  }
  return code;
};

SolidityGenerator['user_property'] = function(block) {
  var property_name = block.getFieldValue('name');
  var property_constant = block.getFieldValue('constant');
  var property_visibility = block.getFieldValue('values_visibility');
  var property_storagedata_values =  block.getFieldValue('storagedata_values');
  var property_array =  SolidityGenerator.statementToCode(block,'array_dimension');
  property_array = property_array.trim();
  var property_valueproperty = SolidityGenerator.statementToCode(block,'valueproperty');
  if(property_valueproperty ==  null){
    property_valueproperty = "";
  }
  var code;
  if(property_array == ""){
    if(property_constant == "TRUE"){
      code = "User" + ' ' + property_visibility + ' ' + "constant" + ' ' + property_storagedata_values + ' ' + property_name + ' ' + property_valueproperty +";\n";
    }
    else{
      code = "User" + ' ' + property_visibility + ' ' + property_storagedata_values + ' ' + property_name + ' ' + property_valueproperty +";\n";
    }
  }
  else{
    if(property_constant == "TRUE"){
      code = "User" + " " + property_array + ' ' + property_visibility + ' ' + "constant" + ' ' + property_storagedata_values + ' ' + property_name + ' ' + property_valueproperty +";\n";
    }
    else{
      code = "User" + " "  + property_array + ' ' + property_visibility + ' ' + property_storagedata_values + ' ' + property_name + ' ' + property_valueproperty +";\n";
    }
  }
  return code;
};

SolidityGenerator['company_property'] = function(block) {
  var property_name = block.getFieldValue('name');
  var property_constant = block.getFieldValue('constant');
  var property_visibility = block.getFieldValue('values_visibility');
  var property_storagedata_values =  block.getFieldValue('storagedata_values');
  var property_array =  SolidityGenerator.statementToCode(block,'array_dimension');
  property_array = property_array.trim();
  var property_valueproperty = SolidityGenerator.statementToCode(block,'valueproperty');
  var code;
  if(property_array == ""){
    if(property_constant == "TRUE"){
      code = "Company" + ' ' + property_visibility + ' ' + "constant" + ' ' + property_storagedata_values + ' ' + property_name + ' ' + property_valueproperty +";\n";
    }
    else{
      code = "Company" + ' ' + property_visibility + ' ' + property_storagedata_values + ' ' + property_name + ' ' + property_valueproperty +";\n";
    }
  }
  else{
    if(property_constant == "TRUE"){
      code = "Company" + " " + property_array + ' ' + property_visibility + ' ' + "constant" + ' ' + property_storagedata_values + ' ' + property_name + ' ' + property_valueproperty +";\n";
    }
    else{
      code = "Company" + " "  + property_array + ' ' + property_visibility + ' ' + property_storagedata_values + ' ' + property_name + ' ' + property_valueproperty +";\n";
    }
  }
  return code;
};

SolidityGenerator['mapping_property'] = function(block) {
  var property_name = block.getFieldValue('name');
  var property_constant = block.getFieldValue('constant');
  var property_visibility = block.getFieldValue('values_visibility');
  var property_storagedata_values =  block.getFieldValue('storagedata_values');
  var property_valueproperty = SolidityGenerator.statementToCode(block,'valueproperty');
  var property_type = SolidityGenerator.statementToCode(block,'key') + "=>" + SolidityGenerator.statementToCode(block,'value');
  var code;
  if(property_constant == "TRUE"){
    code = property_type + ' ' + property_visibility + ' ' + "constant" + ' ' + property_storagedata_values + ' ' + property_name + ' ' + property_valueproperty +";\n";
  }
  else{
    code = property_type + ' ' + property_visibility + ' ' + property_storagedata_values + ' ' + property_name + ' ' + property_valueproperty +";\n";
  }   return code;
};


SolidityGenerator['personalized_struct'] = function(block) {
  var struct_name = block.getFieldValue('name');
  var struct_properties = SolidityGenerator.statementToCode(block, 'properties_struct');
  var code = "struct " + struct_name + ":\n" + struct_properties + "\n";
  return code;
};

SolidityGenerator['enum'] = function(block) {
  var enum_name = block.getFieldValue('name');
  var enum_values = SolidityGenerator.statementToCode(block, 'values_enum');
  var code = "enum " + enum_name + '(' + enum_values + ');\n';
  return code;
};

SolidityGenerator['enum_value'] = function(block) {
  var enum_value = block.getFieldValue('value_enum');
  var statement_next_enum_value = SolidityGenerator.statementToCode(block, 'value');
  var code = enum_value + statement_next_enum_value
  return code;
};
//Generador de propiedades largas

//Generador de propiedades cortas

SolidityGenerator['identifier_shortproperty'] = function(block) {
  var property_name = block.getFieldValue('name');
  var property_valueproperty = SolidityGenerator.statementToCode(block,'valueproperty');
  var property_type = block.getFieldValue('type');
  var property_array =  SolidityGenerator.statementToCode(block,'arraydimension');
  property_array = property_array.trim()
  if(property_valueproperty ==  null){
    property_valueproperty = "";
  }
  var code;
  if(property_array != null){
    code = property_type + ' ' + property_name + ' ' + property_valueproperty +";\n"; 
  }
  else {
    code = property_type + ' ' + property_array + ' ' + property_name + ' ' + property_valueproperty +";\n"; 
  }
  return code;
};

SolidityGenerator['number_shortproperty'] = function(block) {
  var property_name = block.getFieldValue('name');
  var property_valueproperty = SolidityGenerator.statementToCode(block,'valueproperty');
  var property_type = block.getFieldValue('numbertype_property');
  var property_array =  SolidityGenerator.statementToCode(block,'arraydimension');
  property_array = property_array.trim()
  if(property_valueproperty ==  null){
    property_valueproperty = "";
  }
  var code;
  if(property_array != null){
    code = property_type + ' ' + property_name + ' ' + property_valueproperty +";\n"; 
  }
  else {
    code = property_type + ' ' + property_array + ' ' + property_name + '' + property_valueproperty +";\n"; 
  } 
  return code;
};

SolidityGenerator['text_shortproperty'] = function(block) {
  var property_name = block.getFieldValue('name');
  var property_valueproperty = SolidityGenerator.statementToCode(block,'valueproperty');
  var property_type = block.getFieldValue('type');
  if(property_type == "char_type"){
    property_type = "char";
  }
  else{
    property_type = "string";
  }
  var property_array =  SolidityGenerator.statementToCode(block,'arraydimension');
  property_array = property_array.trim()
  if(property_valueproperty ==  null){
    property_valueproperty = "";
  }
  var code;
  if(property_array != null){
    code = property_type + ' ' + property_name + ' ' + property_valueproperty +";\n"; 
  }
  else {
    code = property_type + ' ' + property_array + ' ' + property_name + ' ' + property_valueproperty +";\n"; 
  }
  return code;
};

SolidityGenerator['address_shortproperty'] = function(block) {
  var property_name = block.getFieldValue('name');
  var property_valueproperty = SolidityGenerator.statementToCode(block,'valueproperty');
  var property_type = block.getFieldValue('addresstype_values');
  var property_array =  SolidityGenerator.statementToCode(block,'arraydimension');
  property_array = property_array.trim()
  if(property_valueproperty ==  null){
    property_valueproperty = "";
  }
  var code;
  if(property_array != null){
    code = property_type + ' ' + property_name + ' ' + property_valueproperty +";\n"; 
  }
  else {
    code = property_type + ' ' + property_array + ' ' + property_name + ' ' + property_valueproperty +";\n"; 
  }
  return code;
};

SolidityGenerator['byte_shortproperty'] = function(block) {
  var property_name = block.getFieldValue('name');
  var property_valueproperty = SolidityGenerator.statementToCode(block,'valueproperty');
  var property_type = block.getFieldValue('byte_type');
  var property_array =  SolidityGenerator.statementToCode(block,'arraydimension');
  property_array = property_array.trim()
  if(property_valueproperty ==  null){
    property_valueproperty = "";
  }
  var code;
  if(property_array != null){
    code = property_type + ' ' + property_name + ' ' + property_valueproperty +";\n"; 
  }
  else {
    code = property_type + ' ' + property_array + ' ' + property_name + ' ' + property_valueproperty +";\n"; 
  }
  return code;
};

SolidityGenerator['user_shortproperty'] = function(block) {
  var property_name = block.getFieldValue('name');
  var property_valueproperty = SolidityGenerator.statementToCode(block,'valueproperty');
  var property_array =  SolidityGenerator.statementToCode(block,'array_dimension');
  property_array = property_array.trim()
  if(property_valueproperty ==  null){
    property_valueproperty = "";
  }
  var code;
  if(property_array != null){
    code = "User" + ' ' + property_name + ' ' + property_valueproperty +";\n"; 
  }
  else {
    code = "User" + ' ' + property_array + ' ' + property_name + ' ' + property_valueproperty +";\n"; 
  }
  return code;
};

SolidityGenerator['company_shortproperty'] = function(block) {
  var property_name = block.getFieldValue('name');
  var property_valueproperty = SolidityGenerator.statementToCode(block,'valueproperty');
  var property_array =  SolidityGenerator.statementToCode(block,'array_dimension');
  property_array = property_array.trim()
  if(property_valueproperty ==  null){
    property_valueproperty = "";
  }
  var code;
  if(property_array != null){
    code = "Company" + ' ' + property_name + ' ' + property_valueproperty +";\n"; 
  }
  else {
    code = "Company" + ' ' + property_array + ' ' + property_name + ' ' + property_valueproperty +";\n"; 
  }; 
  return code;
};

SolidityGenerator['mapping_shortproperty'] = function(block) {
  var property_name = block.getFieldValue('name');
  var property_valueproperty = SolidityGenerator.statementToCode(block,'valueproperty');
  var property_type = SolidityGenerator.statementToCode(block,'key') + "=>" + SolidityGenerator.statementToCode(block,'value');
  var property_array =  SolidityGenerator.statementToCode(block,'array_dimension');
  property_array = property_array.trim()
  if(property_valueproperty ==  null){
    property_valueproperty = "";
  }
  var code;
  if(property_array != null){
     code = property_type + ' ' + property_name + ' ' + property_valueproperty +";\n";
  }
  else{
    code = property_type + ' ' + property_array + ' ' + property_name + ' ' + property_valueproperty +";\n";
  }
  return code;
};
//Generador de propiedades cortas

//Generador de variables predefinidas

SolidityGenerator['blockvariables'] = function(block) {
  var value_block_variable = block.getFieldValue('values_blockvariables');
  var code = value_block_variable;
  return code;
};

SolidityGenerator['msgvariables'] = function(block) {
  var value_msg_variable = block.getFieldValue('msgvariables');
  var code = value_msg_variable;
  return code;
};

SolidityGenerator['txvariables'] = function(block) {
  var value_tx_variable = block.getFieldValue('values_txvariables');
  var code =  value_tx_variable;
  return code;
};

SolidityGenerator['block_this'] = function(block) {  
  var code = "this";
  return code;
};

SolidityGenerator['block_thisexpression'] = function(block) {
  var value = block.getFieldValue('value');
  var code = "this." + value;
  return code;
};

SolidityGenerator['block_now'] = function(block) {
  var code = "now";
  return code;
};
//Fin Generador de variables predefinidas

//Generador de Expresiones

SolidityGenerator['block_usinglibrary'] = function(block) {
  var name = block.getFieldValue('name');
  var alias_for = block.getFieldValue('alias');
  var code = "using " + name + " for " + alias_for + ";\n";
  return code;
};


SolidityGenerator['shift_expression'] = function(block) {
  var operator = block.getFieldValue('operators');
  var expression1 = SolidityGenerator.statementToCode(block, 'value1_shiftexpression');
  var expression2 = SolidityGenerator.statementToCode(block, 'value2_shiftexpression');
  var code = expression1 + " " + operator + " " + expression2;
  return code;
};

SolidityGenerator['time_expression'] = function(block) {
  var time_value = block.getFieldValue('time_value');
  var time_unity = block.getFieldValue('time_unity');
  var code = time_value + ' ' + time_unity;
  return code;
};

SolidityGenerator['assign_value_expression'] = function(block) {
  var operator = block.getFieldValue('operators');
  var expression1 = SolidityGenerator.statementToCode(block, 'value1_assignexpression');
  var expression2 = SolidityGenerator.statementToCode(block, 'value2_assignexpression');
  var code = expression1 + " " + operator + expression2 + ";\n";
  return code;
};

SolidityGenerator['assing_value_expression1inputs'] = function(block) {
  var operator = block.getFieldValue('operators');
  var expression1 = SolidityGenerator.statementToCode(block, 'value1_assignexpression');
  var code = operator + " " + expression1;
  return code;
};

SolidityGenerator['var_expression'] = function(block) {
  var name = block.getFieldValue('name');
  var expression = SolidityGenerator.statementToCode(block, 'expression_varexpression');
  var code = "var " + name + expression + ";\n";
  return code;
};

SolidityGenerator['bitwise_expression'] = function(block) {
  var operator = block.getFieldValue('operators');
  var expression1 = SolidityGenerator.statementToCode(block, 'value1_bitwiseexpression');
  var expression2 = SolidityGenerator.statementToCode(block, 'value2_bitwiseexpression');
  var code = expression1 + " " + operator + " " + expression2;
  return code;
};

SolidityGenerator['bitwise_expression1inputs'] = function(block) {
  var operator = block.getFieldValue('operators');
  var expression2 = SolidityGenerator.statementToCode(block, 'value2_shiftexpression');
  var code = operator + " " + expression2;
  return code;
};

SolidityGenerator['casting_expression'] = function(block) {
  var type = SolidityGenerator.statementToCode(block, 'type');
  type = type.trim();
  var expression = SolidityGenerator.statementToCode(block, 'expressioncast');
  expression = expression.trim();
  var code = "(" + type + ")" + expression;
  return code;
};

SolidityGenerator['tuple'] = function(block) {
  var expression = SolidityGenerator.statementToCode(block, 'values');
  var code = "(" + expression + ")";
  return code;
};

SolidityGenerator['block_assembly'] = function(block) {
  var assembly_statements_content = SolidityGenerator.statementToCode(block,'assembly_values');
  var code = "assembly{\n" + assembly_statements_content + "}\n";
  return code;;
};

SolidityGenerator['block_assembly'] = function(block) {
  var assembly_statements_content = SolidityGenerator.statementToCode(block,'assembly_values');
  var code = "assembly{\n" + assembly_statements_content + "}\n";
  return code;;
};

SolidityGenerator['block_assignvalue_assemblyexpression'] = function(block) {
  var name_var = block.getFieldValue('name_var');
  var assembly_var_statements_content = SolidityGenerator.statementToCode(block,'expression');
  var code = name_var + " := " + assembly_var_statements_content;
  return code;;
};

SolidityGenerator['block_let_expression'] = function(block) {
  var name_var_let = block.getFieldValue('name_var_let');
  var assembly_let_var_statements_content = SolidityGenerator.statementToCode(block,'expression');
  var code = "let " + name_var_let + " := " + assembly_let_var_statements_content;
  return code;
};

SolidityGenerator['personalized_expression'] = function(block) {
  var text_value = block.getFieldValue('values_expression');
  var code = text_value + ";\n";
  return code;
};

SolidityGenerator['personalized_inputexpression'] = function(block) {
  var text_value = block.getFieldValue('values_expression');
  var code = text_value;
  return code;
};

SolidityGenerator['block_number'] = function(block) {
  var text_value = block.getFieldValue('value');
  var code = String(text_value);
  return code;
};

SolidityGenerator['block_positivenumber'] = function(block) {
  var text_value = block.getFieldValue('value');
  var code = String(text_value);
  return code;
};

SolidityGenerator['block_text'] = function(block) {
  var text_value = block.getFieldValue('value');
  var code = '"' + text_value + '"';
  return code;
};

SolidityGenerator['emit_event'] = function(block) {
  var emit_name_event = block.getFieldValue('name');
  var inputparams_content = SolidityGenerator.statementToCode(block, 'inputparams');
  inputparams_content = inputparams_content.trim();
  var code = "emit " + emit_name_event +  "(" + inputparams_content + ");"; 
  return code;
};

SolidityGenerator['arithmetical_expression'] = function(block) {
  var operator = block.getFieldValue('operators');
  var expression1 = SolidityGenerator.statementToCode(block, 'value1_arithmeticalexpression');
  var expression2 = SolidityGenerator.statementToCode(block, 'value2_arithmeticalexpression');
  var code = expression1 + " " + operator + " " + expression2;
  return code;
};

//Fin Generador de Expresiones 

//Generador de Funciones Predefinidas 

SolidityGenerator['keccak_function'] = function(block) {
  var text_value = block.getFieldValue('value_parameter');
  var code = 'keccack256' + '(' + text_value + ');\n';
  return code;
};

SolidityGenerator['keccak_inputfunction'] = function(block) {
  var text_value = block.getFieldValue('value_parameter');
  var code = 'keccack256' + '(' + text_value + ")";
  return code;
};

SolidityGenerator['sha_function'] = function(block) {
  var sha_type = block.getFieldValue('name');
  var text_value = block.getFieldValue('value_parameter');
  var code = sha_type + '(' + text_value + ');\n';
  return code;
};

SolidityGenerator['sha_inputfunction'] = function(block) {
  var sha_type = block.getFieldValue('identifier');
  var text_value = block.getFieldValue('value_parameter');
  var code = sha_type + '(' + text_value + ')';
  return code;
};

SolidityGenerator['abyencode_function'] = function(block) {
  var text_value = block.getFieldValue('value_parameter');
  var code = "abi.encodePacked(" + text_value + ');\n';
  return code;
};

SolidityGenerator['abyencode_inputfunction'] = function(block) {
  var text_value = block.getFieldValue('value_parameter');
  var code = "abi.encodePacked(" + text_value + ")";
  return code;
};

SolidityGenerator['selfdestruct_function'] = function(block) {
  var text_value = block.getFieldValue('value_parameter');
  var code = "selfdestruct " + text_value + ';\n';
  return code;
};

SolidityGenerator['assert_function'] = function(block) {
  var text_value = block.getFieldValue('value_parameter');
  var code = "assert " + text_value + ';\n';
  return code;
};

SolidityGenerator['revert_expression'] = function(block) {
  var text_value = block.getFieldValue('value_revertexpression');
  var code = "revert " + text_value + ';\n';
  return code;
};

SolidityGenerator['deleteexpression'] = function(block) {
  var text_value = block.getFieldValue('value_deleteexpression');
  var code = "delete " + text_value + ';\n';
  return code;
};

SolidityGenerator['log_function'] = function(block) {
  var log = block.getFieldValue('value_log');
  var text_value = block.getFieldValue('value');
  var code = " " + log + text_value + ';\n';
  return code;
};
//Fin Generador de Funciones Predefinidas

//Generador de Expresiones Logicas
SolidityGenerator['block_ifcondition'] = function(block) {
  var condition = SolidityGenerator.statementToCode(block, 'condition');
  condition = condition.trim();
  var actionsif = SolidityGenerator.statementToCode(block, 'actionsif');
  var code =  "if(" + condition + "){\n" + actionsif + "}\n";
  return code;
};

SolidityGenerator['block_elseifcondition'] = function(block) {
  var condition = SolidityGenerator.statementToCode(block, 'condition');
  condition = condition.trim();
  var actionselseif = SolidityGenerator.statementToCode(block, 'actionselseif');
  var code =  "else if(" + condition + "){\n" + actionselseif + "}\n";
  return code;
};

SolidityGenerator['block_elsecondition'] = function(block) {
  var expression = SolidityGenerator.statementToCode(block, 'actionselse');
  var code =  "else{\n" + expression +  "}\n";
  return code;
};

SolidityGenerator['block_negation'] = function(block) {
  var expression = SolidityGenerator.statementToCode(block, 'value');
  expression = expression.trim();
  var code = "!" + expression;
  return code;
};

SolidityGenerator['block_null'] = function(block) {
  var code = "null";
  return code;
};

SolidityGenerator['block_boolean'] = function(block) {
  var boolean_value = block.getFieldValue('values');
  var code = boolean_value;
  return code;
};

SolidityGenerator['comparation_expression'] = function(block) {
  var operator = block.getFieldValue('operators');
  var expression1 = SolidityGenerator.statementToCode(block, 'value1_expression');
  var expression2 = SolidityGenerator.statementToCode(block, 'value2_expression');
  var code = expression1 + " " + operator + " " + expression2;
  return code;
};

SolidityGenerator['comparation_arithmeticalexpression'] = function(block) {
  var operator = block.getFieldValue('operators');
  var expression1 = SolidityGenerator.statementToCode(block, 'value1_arithmeticalcomparationexpression');
  var expression2 = SolidityGenerator.statementToCode(block, 'value2_arithmeticalcomparationexpression');
  var code = expression1 + " " + operator + " " + expression2;
  return code;
};

SolidityGenerator['comparation_logicalexpression'] = function(block) {
  var operator = block.getFieldValue('operators');
  var expression1 = SolidityGenerator.statementToCode(block, 'value1_logicalexpression');
  var expression2 = SolidityGenerator.statementToCode(block, 'value2_logicalexpression');
  var code = expression1 + " " + operator + " " + expression2;
  return code;
};

SolidityGenerator['parenthesis_expression'] = function(block) {
  var expression = SolidityGenerator.statementToCode(block, 'value');
  var code =  "(" + expression + ")";
  return code;
};

//Fin Generador de Expresiones Logicas

//Generador de bucles
SolidityGenerator['block_whileloop'] = function(block) {
  var condition = SolidityGenerator.statementToCode(block, 'condition');
  condition = condition.trim();
  var statements_content = SolidityGenerator.statementToCode(block, 'elements_while');
  var code = "while(" + condition + "){\n" + statements_content + "}\n";
  return code;
};

SolidityGenerator['block_dowhile'] = function(block) {
  var condition = SolidityGenerator.statementToCode(block, 'condition');
  condition = condition.trim();
  var statements_content = SolidityGenerator.statementToCode(block, 'elements_dowhile');
  var code = "do{\n" + statements_content + "}while(" + condition + ")\n";
  return code;
};

SolidityGenerator['block_for'] = function(block) {
  var name_counter =  block.getFieldValue('namevariable');
  var initialization_counter =  block.getFieldValue('value');
  var counter =  block.getFieldValue('namevariable2');
  var operatorcomparation =  block.getFieldValue('operatorcomparation');
  var limit =  block.getFieldValue('limit');
  var counter_post =  block.getFieldValue('namevariable3');
  var counter_postoperation =  block.getFieldValue('arithmeticaloperator');
  var statements_content = SolidityGenerator.statementToCode(block, 'expressions_for');
  var code = "for(uint256 " + name_counter + " = " + initialization_counter + "; " + counter + ' ' + operatorcomparation + ' ' + limit 
  + "; " + counter_post + counter_postoperation + "){\n" + statements_content + "}\n"; 
  return code;
};
//Fin Generador de bucles

//Generador de tipos
SolidityGenerator['type_int'] = function(block) {
  var options = block.getFieldValue('int_options');
  var code = options;
  return code;
};

SolidityGenerator['type_uint'] = function(block) {
  var options = block.getFieldValue('uint_options');
  var code = options;
  return code;
};

SolidityGenerator['type_bool'] = function(block) {
  var options = block.getFieldValue('bool_options');
  var code = options;
  return code;
};

SolidityGenerator['type_float'] = function(block) {
  var options = block.getFieldValue('float_options');
  var code = options;
  return code;
};

SolidityGenerator['type_User'] = function(block) {
  var options = block.getFieldValue('user_options');
  var code = options;
  return code;
};

SolidityGenerator['type_Company'] = function(block) {
  var options = block.getFieldValue('companyoptions');
  var code = options;
  return code;
};


SolidityGenerator['type_address'] = function(block) {
  var options = block.getFieldValue('address_options');
  var code = options;
  return code;
};

SolidityGenerator['type_text'] = function(block) {
  var options = block.getFieldValue('typetext_options');
  var code = options;
  return code;
};

SolidityGenerator['type_identifier'] = function(block) {
  var options = block.getFieldValue('identifier_options');
  var code = options;
  return code;
};

SolidityGenerator['type_byte'] = function(block) {
  var options = block.getFieldValue('bytes_options');
  var code = options;
  return code;
};

SolidityGenerator['type_mapping'] = function(block) {
  var options = SolidityGenerator.statementToCode(block, 'key')+ "=>" +SolidityGenerator.statementToCode(block, 'value');
  var code = "mapping(" + options + ")";
  return code;
};

SolidityGenerator['block_payable'] = function(block) {
  var code = "payable";
  return code;
};
//Fin generador de tipos

SolidityGenerator['array_property'] = function(block) {
  var static_dimension = block.getFieldValue('cells');
  var next_arraydimension = SolidityGenerator.statementToCode(block, 'plus_dimension');
  next_arraydimension = next_arraydimension.trim();
  var code = '[' + static_dimension + ']' + next_arraydimension;
  return code;
};

SolidityGenerator['dynamic_array'] = function(block) {
  var dimension = SolidityGenerator.statementToCode(block, 'dimension');
  dimension = dimension.trim();
  var code = "[]" + dimension;
  return code;
};

