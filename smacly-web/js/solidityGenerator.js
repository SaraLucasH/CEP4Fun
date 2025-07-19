  
"use strict";


var SolidityGenerator = new Blockly.Generator('Solidity');

SolidityGenerator.ORDER_ATOMIC = 0;
SolidityGenerator.ORDER_NONE = 0;

SolidityGenerator.init = function(workspace) {};
SolidityGenerator.finish = function(code) {return code;};

SolidityGenerator.scrub_ = function(block, code) {
  var nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  var nextCode = SolidityGenerator.blockToCode(nextBlock);
  return code + nextCode;
};


function removeIndentAndTrailingNewline() {
   
}


SolidityGenerator['file'] = function(block) {
  var statements_head = SolidityGenerator.statementToCode(block, 'head');
  var statements_contract = SolidityGenerator.statementToCode(block, 'contract_elements');

  var code = '<!DOCTYPE HTML>\n<html>\n<head>\n  <meta charset="utf-8">\n'
    + statements_head
    + "</head>\n\n<body>\n"
    + statements_contract
    + "</body>\n</html>\n";

  return code;
};

SolidityGenerator['html'] = function(block) {
  var statements_content = SolidityGenerator.statementToCode(block, 'elements_file');
  var code = '<!DOCTYPE HTML>\n<html>\n' + statements_content + '</html>\n';
  return code;
};

SolidityGenerator['version'] = function(block) {
  var dropdown_symbolversion = block.getFieldValue('symbolversion');
  var number_value1version = block.getFieldValue('value1version');
  var number_value2version = block.getFieldValue('value2version');
  var number_value3version = block.getFieldValue('value3version');
  var dropdown_symbolcomparation = block.getFieldValue('symbolcomparation');
  var number_value1versionoptional = block.getFieldValue('value1versionoptional');
  var number_value2versionoptional = block.getFieldValue('value2versionoptional');
  var number_value3versionoptional = block.getFieldValue('value3versionoptional');
  var code = "pragma solidity " + dropdown_symbolversion + number_value1version + '.' + number_value2version + '.' + number_value3version;
  if(number_value1versionoptional != "0" || number_value2versionoptional != "0" || number_value3versionoptional != "0"){
    code += dropdown_symbolcomparation + number_value1versionoptional + '.' + number_value2versionoptional != "0" + '.' + number_value3versionoptional;
  }
  return code;
};

SolidityGenerator['contract'] = function(block) {
  var contract_name = block.getFieldValue('name');
  var statements_content = SolidityGenerator.statementToCode(block, 'contract_elements');
  var code = 'contract ' + contract_name + " {\n" + statements_content + '}\n';
  return code;
};

SolidityGenerator['interface'] = function(block) {
  var interface_name = block.getFieldValue('name');
  var statements_content = SolidityGenerator.statementToCode(block, 'interface_functions');
  var code = 'interface' + interface_name + " {\n" + statements_content + '}\n';
  return code;
};

SolidityGenerator['title'] = function(block) {
  var statements_content = SolidityGenerator.statementToCode(block, 'content');

  if (statements_content != "")
    document.getElementById('title').innerText = statements_content;
  else
    document.getElementById('title').innerText = "untitled web page";

  var code = '<title>' + statements_content.trim() + '</title>\n';
  return code;
};



SolidityGenerator['plaintext'] = function(block) {
  var text_content = block.getFieldValue('content');
  var code = text_content + '\n';
  return code;
};

SolidityGenerator['division'] = function(block) {
  var value_name = SolidityGenerator.valueToCode(block, 'NAME', SolidityGenerator.ORDER_ATOMIC);
  var statements_content = SolidityGenerator.statementToCode(block, 'content');
  var code = '<div' + value_name + '>\n' + statements_content + '</div>\n';
  return code;
};

SolidityGenerator['style'] = function(block) {
  var statements_name = SolidityGenerator.statementToCode(block, 'NAME');
  var code = ' style="' + statements_name.trim() + '"';
  return [code, SolidityGenerator.ORDER_NONE];
};

SolidityGenerator['color'] = function(block) {
  var colour_name = block.getFieldValue('NAME');
  var code = 'color: ' + colour_name + ';';
  return code;
};

SolidityGenerator['bgcolour'] = function(block) {
  var colour_name = block.getFieldValue('NAME');
  var code = 'background-color: ' + colour_name + ';';
  return code;
};

SolidityGenerator['genericstyle'] = function(block) {
  var text_property = block.getFieldValue('property');
  var text_value = block.getFieldValue('value');
  var code = text_property + ': ' + text_value + ';';
  return code;
};

SolidityGenerator['generictag'] = function(block) {
  var text_name = block.getFieldValue('NAME');
  var value_name = SolidityGenerator.valueToCode(block, 'NAME', SolidityGenerator.ORDER_ATOMIC);
  var statements_content = SolidityGenerator.statementToCode(block, 'content');
  var code = '<' + text_name + value_name + '>\n' + statements_content + '</' + text_name + '>\n';
  return code;
};

SolidityGenerator['more_attributes'] = function(block) {
  var value_name1 = SolidityGenerator.valueToCode(block, 'NAME1', SolidityGenerator.ORDER_ATOMIC);
  var value_name2 = SolidityGenerator.valueToCode(block, 'NAME2', SolidityGenerator.ORDER_ATOMIC);
  var value_name3 = SolidityGenerator.valueToCode(block, 'NAME3', SolidityGenerator.ORDER_ATOMIC);
  var code = value_name1 + value_name2 + value_name3;
  return [code, SolidityGenerator.ORDER_NONE];
};

SolidityGenerator['genericattribute'] = function(block) {
  var text_attribute = block.getFieldValue('attribute');
  var text_value = block.getFieldValue('value');
  var code = ' ' + text_attribute + '="' + text_value + '"';
  return [code, SolidityGenerator.ORDER_NONE];
};

SolidityGenerator['link'] = function(block) {
  var text_name = block.getFieldValue('NAME');
  var statements_content = SolidityGenerator.statementToCode(block, 'content');
  var code = '<a href="' + text_name + '">' + statements_content.trim() + '</a>\n';
  return code;
};

SolidityGenerator['span'] = function(block) {
  var value_name = SolidityGenerator.valueToCode(block, 'NAME', SolidityGenerator.ORDER_ATOMIC);
  var statements_content = SolidityGenerator.statementToCode(block, 'content');
  var code = '<span' + value_name + '>' + statements_content.trim() + '</span>\n';
  return code;
};

SolidityGenerator['image'] = function(block) {
  var text_image = block.getFieldValue('IMAGE');
  var text_alt = block.getFieldValue('ALT');
  var code = '<img src="' +  text_image + '" alt="' + text_alt + '">\n';
  return code;
};

SolidityGenerator['emphasise'] = function(block) {
  var statements_content = SolidityGenerator.statementToCode(block, 'content');
  var code = '<em>' + statements_content.trim() + '</em>\n';
  return code;
};

SolidityGenerator['strong'] = function(block) {
  var statements_content = SolidityGenerator.statementToCode(block, 'content');
  var code = '<strong>' + statements_content.trim() + '</strong>\n';
  return code;
};

SolidityGenerator['headline'] = function(block) {
  var dropdown_name = block.getFieldValue('NAME');
  var statements_content = SolidityGenerator.statementToCode(block, 'content');
  var code = '<' + dropdown_name + '>' + statements_content.trim() + '</' +  dropdown_name + '>\n';
  return code;
};


SolidityGenerator['linebreak'] = function(block) {
  var code = '<br>\n';
  return code;
};

SolidityGenerator['horizontalbreak'] = function(block) {
  var code = '<hr>\n';
  return code;
};

SolidityGenerator['unorderedlist'] = function(block) {
  var statements_name = SolidityGenerator.statementToCode(block, 'NAME');
  var code = '<ul>\n' + statements_name + '</ul>\n';
  return code;
};

SolidityGenerator['orderedlist'] = function(block) {
  var statements_name = SolidityGenerator.statementToCode(block, 'NAME');
  var code = '<ol>\n' + statements_name + '</ol>\n';
  return code;
};

SolidityGenerator['listelement'] = function(block) {
  var statements_content = SolidityGenerator.statementToCode(block, 'content');
  var code = '<li>' + statements_content + '</li>\n';
  return code;
};

SolidityGenerator['inserted'] = function(block) {
  var statements_content = SolidityGenerator.statementToCode(block, 'content');
  var code = '<ins>' + statements_content.trim() + '</ins>\n';
  return code;
};

SolidityGenerator['deleted'] = function(block) {
  var statements_content = SolidityGenerator.statementToCode(block, 'content');
  var code = '<del>' + statements_content.trim() + '</del>\n';
  return code;
};

SolidityGenerator['super'] = function(block) {
  var statements_content = SolidityGenerator.statementToCode(block, 'content');
  var code = '<sup>' + statements_content.trim() + '</sup>\n';
  return code;
};

SolidityGenerator['sub'] = function(block) {
  var statements_content = SolidityGenerator.statementToCode(block, 'content');
  var code = '<sub>' + statements_content.trim() + '</sub>\n';
  return code;
};

SolidityGenerator['code'] = function(block) {
  var statements_content = SolidityGenerator.statementToCode(block, 'content');
  var code = '<code>\n' + statements_content + '</code>\n';
  return code;
};

SolidityGenerator['quote'] = function(block) {
  var statements_content = SolidityGenerator.statementToCode(block, 'content');
  var code = '<q>' + statements_content.trim() + '</q>\n';
  return code;
};

SolidityGenerator['blockquote'] = function(block) {
  var statements_content = SolidityGenerator.statementToCode(block, 'content');
  var code = '<blockquote>\n' + statements_content + '</blockquote>\n';
  return code;
};

SolidityGenerator['sample'] = function(block) {
var statements_content = SolidityGenerator.statementToCode(block, 'content');
  var code = '<samp>\n' + statements_content + '</samp>\n';
  return code;
};

SolidityGenerator['keyboard'] = function(block) {
  var statements_content = SolidityGenerator.statementToCode(block, 'content');
  var code = '<kbd>\n' + statements_content + '</kbd>\n';
  return code;
};

SolidityGenerator['variable'] = function(block) {
  var statements_content = SolidityGenerator.statementToCode(block, 'content');
  var code = '<var>' + statements_content.trim() + '</var>\n';
  return code;
};

SolidityGenerator['form'] = function(block) {
  var statements_content = SolidityGenerator.statementToCode(block, 'content');
  var code = '<form>\n' + statements_content + '</form>\n';
  return code;
};

SolidityGenerator['table'] = function(block) {
  var statements_content = SolidityGenerator.statementToCode(block, 'content');
  var code = '<table>\n' + statements_content + '</table>\n';
  return code;
};

SolidityGenerator['tablerow'] = function(block) {
  var statements_content = SolidityGenerator.statementToCode(block, 'content');
  var code = '<tr>\n' + statements_content + '</tr>\n';
  return code;
};

SolidityGenerator['tablecell'] = function(block) {
  var statements_content = SolidityGenerator.statementToCode(block, 'content');
  var code = '<td>' + statements_content.trim() + '</td>\n';
  return code;
};

SolidityGenerator['input_text'] = function(block) {
  var text_default = block.getFieldValue('default');
  var code = '<input value="' + text_default + '">\n';
  return code;
};

SolidityGenerator['button'] = function(block) {
  var statements_name = SolidityGenerator.statementToCode(block, 'NAME');
  var code = '<button>' + statements_name.trim() + '</button>\n';
  return code;
};

SolidityGenerator['input'] = function(block) {
  var dropdown_type = block.getFieldValue('type');
  var text_value = block.getFieldValue('value');
  var value_text = SolidityGenerator.valueToCode(block, 'text', SolidityGenerator.ORDER_ATOMIC);
  var code = '<input type="' + dropdown_type + '" value="' + text_value + '"' + value_text + ' />\n';
  return code;
};

SolidityGenerator['script'] = function(block) {
  var statements_content = Blockly.JavaScript.statementToCode(block, 'content');
  var code = '<script>\n' + statements_content + '</script>\n';
  return code;
};

SolidityGenerator['onclick'] = function(block) {
  var statements_name = Blockly.JavaScript.statementToCode(block, 'NAME');
  var code = ' onclick="' + statements_name.trim() + '"';
  return [code, SolidityGenerator.ORDER_NONE];
};

SolidityGenerator['body_attributes'] = function(block) {
  var value_name = SolidityGenerator.valueToCode(block, 'NAME', SolidityGenerator.ORDER_ATOMIC);
  var statements_content = SolidityGenerator.statementToCode(block, 'content');
  var code = '<body' + value_name + '>\n' + statements_content + '</body>\n';
  return code;
};
