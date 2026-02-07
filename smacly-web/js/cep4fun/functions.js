function dep001_sye001Listener(e) {
    if (e == null) return;

    if (itemSelectedFromToolbox(e)) {
        var block = workspace.getBlockById(e.newValue);
        if (block.type == "version") {
            var logEventoSye001 = new LogEventSye001(block);
            sendPostSye001(logEventoSye001);
        }
    } else if (fieldHasChanged(e)) {
        var block = workspace.getBlockById(e.blockId);
        if (block.type == "version") {
            var logEventoDep001 = new LogEventDep001(block);
            var logEventoSye001 = new LogEventSye001(block);
            if (logEventoDep001.value1version == 0 && logEventoDep001.value2version == 0 && logEventoDep001.value3version == 0
                && logEventoDep001.value1versionoptional == 0 && logEventoDep001.value2versionoptional == 0 && logEventoDep001.value3versionoptional == 0) {
                sendPostSye001(logEventoSye001);
            } else {
                logEventoSye001.State = 0;
                sendPostSye001(logEventoSye001);
                sendPostDep001(logEventoDep001);
            }
        }
    }
}


function prg001Listener(e) {
    if (e == null) return;

    const logEvento = new LogEventPrg001();
    sendPostPrg001(logEvento);
}

function ntd002_sce003_Listener(e) {
    if (e == null) return;

    var block = workspace.getBlockById(e.blockId);
    if (fieldHasChanged(e) && block.type == "clause") {
        var clauseBlocks = workspace.getBlocksByType("clause");

        var blocksNtd002 = [];
        var blocksSce003 = [];
        var timestamp = time();
        for (var i = 0; i < clauseBlocks.length; i++) {//Saco los ids de los elementos que elimino
            blocksNtd002[i] = new LogEventNtd002(clauseBlocks[i], timestamp);
            blocksSce003[i] = new LogEventSce003(clauseBlocks[i], timestamp);
        }
        sendPostNtd002(blocksNtd002);
        sendPostSce003(blocksSce003);
    }
}

function ntd003Listener(e) {
    if (e == null) return;

    var blockChanged = workspace.getBlockById(e.blockId);
    if (blockChanged == null) return;

    var contractBlockParent = blockChanged.getParent();
    if (fieldHasChanged(e)) {
        if (blockChanged.type == "contract_father" && contractBlockParent != null && contractBlockParent.type == "contract") {
            //contractBlockParent = workspace.getBlockById(contractBlockParent.id);
            var previousToParent = contractBlockParent.getPreviousBlock();

            //TODO - Raise suggestion. This is an error.
            if (previousToParent == null || !(previousToParent.type == "interface" || previousToParent.type == "contract")) return;

            if (previousToParent.type == "interface" && getName(previousToParent) == getName(blockChanged)) {
                //NTD003
                var timestamp = time();

                //Contract functions
                var functionsInContract = getFunctionsInsideBlock(contractBlockParent, timestamp, "contract", false);

                //Interface functions
                var functionsInInterface = getFunctionsInsideBlock(previousToParent, timestamp, "interface", true);


                //TODO - Only validating name + values_visibility + values_inputmodifier. Some fields are still not validated
                // as Modifiers. 
                let result = functionsInInterface.concat(functionsInContract);
                console.log('All functions ' + result);
                sendPostNtd003(result);
            }
        } else if (blockChanged.type == "interface") {
            //Could be raised by interface name
            var contractBlock = blockChanged.getNextBlock();
            if (contractBlock == null || contractBlock.type != "contract") return;

            var contractChilds = contractBlock.getChildren(false);

            if (contractChilds != null) {
                var inheritanceBlock = contractChilds.find((block) => block.type == "contract_father" && getName(block) == getName(blockChanged));
                if (inheritanceBlock == undefined) return;

                var timestamp = time();

                //Contract functions
                contractBlock = workspace.getBlockById(contractBlock.id);
                var functionsInContract = getFunctionsInsideBlock(contractBlock, timestamp, "contract", false);

                //Interface functions
                var functionsInInterface = getFunctionsInsideBlock(blockChanged, timestamp, "interface", true);

                //TODO - Only validating name + values_visibility + values_inputmodifier. Some fields are still not validated
                // as Modifiers. 
                let result = functionsInInterface.concat(functionsInContract);
                console.log('All functions ' + result);
                sendPostNtd003(result);
            }
        }
    }
}

function ntd004Listener(e) {
    if (e == null) return;

    var blockChanged = workspace.getBlockById(e.blockId);
    if (blockChanged == null) return;

    var contractBlockParent = blockChanged.getParent();
    if (fieldHasChanged(e)) {
        if (blockChanged.type == "contract_father" && contractBlockParent != null && contractBlockParent.type == "contract") {
            //contractBlockParent = workspace.getBlockById(contractBlockParent.id);
            var previousToParent = findPreviousBlockByName(contractBlockParent, getName(blockChanged));

            //TODO - Raise suggestion. This is an error.
            if (previousToParent == null || previousToParent.type != "contract") return;

            var timestamp = time();

            //Contract functions
            var functionsInContract = getFunctionsInsideBlock(contractBlockParent, timestamp, "contract", false);

            //Interface functions
            var functionsInInterface = getFunctionsInsideBlock(previousToParent, timestamp, "contract_abstract", true);


            //TODO - Only validating name + values_visibility + values_inputmodifier. Some fields are still not validated
            // as Modifiers. 
            let result = functionsInInterface.concat(functionsInContract);
            console.log(result);
            if (result.length > 0)
                sendPostNtd004(result);

        } else if (blockChanged.type == "contract") {
            var contractChilds = blockChanged.getChildren(true);

            if (contractChilds != null) {
                var inheritanceBlock = contractChilds.find((block) => block.type == "contract_father");
                if (inheritanceBlock == undefined) return;

                var findParent = findPreviousBlockByName(blockChanged, getName(inheritanceBlock));
                if (findParent == undefined || findParent == null) return;

                var timestamp = time();

                var functionsInContract = getFunctionsInsideBlock(blockChanged, timestamp, "contract", false);

                //Interface functions
                var functionsInInterface = getFunctionsInsideBlock(findParent, timestamp, "contract_abstract", true);

                //TODO - Only validating name + values_visibility + values_inputmodifier. Some fields are still not validated
                // as Modifiers. 
                let result = functionsInInterface.concat(functionsInContract);
                console.log(result);
                if (result.length > 0)
                    sendPostNtd004(result);
            }
        }
    }
}

function findPreviousBlockByName(blockOrigin, name) {
    var prev = blockOrigin.getPreviousBlock();

    if (prev == null || prev == undefined) return null;
    if (getName(prev) == name) return prev;

    return findPreviousBlockByName(prev, name);
}

function statementBlockIsEmpty(block, statementName) {
    //TODO - We will catch exceptio as a try to transform content to code. Nowadays, function is not able to transfor our custom code to a string.
    //True if content is ""
    try {
        var content = Blockly.JavaScript.statementToCode(block, statementName);
        if (content == "")
            return true;
    } catch (error) {
    }
    return false;
}

function getFunctionsInsideBlock(contractBlock, timestamp, parent, IsAbstractOrInterface) {
    var result = [];
    var output = getBlockOwnElements(contractBlock, ["clause", "interface_clausedeclaration"]);
    if (output != null && output != undefined) {
        output.forEach((e) => {
            if (IsAbstractOrInterface) {
                if (statementBlockIsEmpty(e, "elements_function")) result.push(new LogEventNtd003(e, timestamp, parent));
            } else
                result.push(new LogEventNtd003(e, timestamp, parent));
        });
    }

    return result;
}

function getName(block) {
    if (block != null)
        return block.getFieldValue("name");
    return "";
}

//TODO - All functions for duplicated items should have shared code. Move shared code to another method
function sye002Listener(e) {
    if (e == null) return;

    var block = workspace.getBlockById(e.blockId);
    if (fieldHasChanged(e) && block.type == "interface") {
        var clauseBlocks = workspace.getBlocksByType("interface");

        var blocks = [];
        var timestamp = time();
        for (var i = 0; i < clauseBlocks.length; i++) {//Saco los ids de los elementos que elimino
            blocks[i] = new LogEventSyeEventDuplicated(clauseBlocks[i], timestamp);
        }
        sendPostSye002(blocks);
    }
}

function sye003Listener(e) {
    if (e == null) return;

    var block = workspace.getBlockById(e.blockId);
    if (fieldHasChanged(e) && block.type == "library") {
        var clauseBlocks = workspace.getBlocksByType("library");

        var blocks = [];
        var timestamp = time();
        for (var i = 0; i < clauseBlocks.length; i++) {//Saco los ids de los elementos que elimino
            blocks[i] = new LogEventSyeEventDuplicated(clauseBlocks[i], timestamp);
        }
        sendPostSye003(blocks);
    }
}

function sye004Listener(e) {
    if (e == null) return;

    var block = workspace.getBlockById(e.blockId);
    if (fieldHasChanged(e) && block.type == "contract") {
        var clauseBlocks = workspace.getBlocksByType("contract");

        var blocks = [];
        var timestamp = time();
        for (var i = 0; i < clauseBlocks.length; i++) {//Saco los ids de los elementos que elimino
            blocks[i] = new LogEventSyeEventDuplicated(clauseBlocks[i], timestamp);
        }
        sendPostSye004(blocks);
    }
}

function prg002Listener(e) {
    if (e == null) return;

    if (itemSelectedFromToolbox(e) && workspaceIsEmptyOrJustOneItem()) {

        let obj = new LogEventPrg002(workspace.getBlockById(e.newValue));
        if (compilerNotFirstItem()) {
            obj.State = 1;
        }
        sendPostPrg002(obj);
    }
}

function ntd001_prg003_prg004_Listener(e) {
    if (e == null) return;

    if (itemSelectedFromToolbox(e)) {
        var block = workspace.getBlockById(e.newValue);
        if (block.type == "var_expression") {
            let varExp = new LogEventNtd001(block);
            sendPostNtd001(varExp);
        } else if (block.type == "clause") {
            let varExp = new LogEventPrg00X(block, 'prg003');
            sendPostPrg003(varExp);
        } else if (block.type == "modifier") {
            let varExp = new LogEventPrg00X(block, 'prg004');
            sendPostPrg004(varExp);
        }
    } else if (fieldHasChanged(e)) {
        var block = workspace.getBlockById(e.blockId);
        if (block != null && block.type == "var_expression") {
            let varExp = new LogEventNtd001(block);

            var children = block.getChildren();
            if (children != null && children != undefined && children.length > 0) {
                varExp.State = 0;
            }
            sendPostNtd001(varExp);

        } else if (block != null && block.type == "clause") {
            let varExp = new LogEventPrg00X(block, 'prg003');
            if (!statementBlockIsEmpty(block, "elements_function")) {
                varExp.State = 0;
            }
            sendPostPrg003(varExp);

        } else if (block != null && block.type == "modifier") {
            let varExp = new LogEventPrg00X(block, 'prg004');
            if (!statementBlockIsEmpty(block, "restrictions_modifier")) {
                varExp.State = 0;
            }
            sendPostPrg004(varExp);
        }
    }
}

//********* SCE00X */
function clauseHasModifiers(block) {
    if ((checkInputListHasName(block, "modifiers") && existsBlockChildArray(block, ["block_inputmodifier"]) && findParentByType(block, "modifier"))
        || existsBlockChildArray(block, ["restriction_clause", "restriction_clausecomment"])) {
        return true;
    }
    return false;
}

function sce002Listener(e) {
    if (e == null) return;

    var block = null;

    if (fieldHasChanged(e)) {
        block = workspace.getBlockById(e.blockId);
        if (block == null) return;

        if (block.type == "clause") {
            // Check if it has a msg.sender | msg.transfer expression
            if (existsBlockChild(block, "msgvariables", "msg.sender")
                || existsBlockChild(block, "personalized_inputexpression", "msg.sender")
                || existsBlockChild(block, "personalized_inputexpression", "msg.transfer")
                || existsBlockChild(block, "msgvariables", "msg.transfer")) {
                var logEvento = new LogEventSce002(block);

                if ((checkInputListHasName(block, "modifiers") && existsBlockChildArray(block, ["block_inputmodifier"]) && findParentByType(block, "modifier"))
                    || existsBlockChildArray(block, ["restriction_clause", "restriction_clausecomment"])) {
                    logEvento.State = 0;
                }
                sendPostSce002(logEvento);
            }
        } else if (block.type == "var_expression") {
            // Child = msg.sender  || msg.transfer. Parent = clause
            var parent = findParentByType(block, "clause");
            if (parent == null) return;

            if (existsFieldInsideChildrenBlockByValue(block, "msg.sender") || existsFieldInsideChildrenBlockByValue(block, "msg.transfer")) {
                var logEvento = new LogEventSce002(parent);
                if ((checkInputListHasName(parent, "modifiers") && existsBlockChildArray(parent, ["block_inputmodifier"]) && findParentByType(parent, "modifier"))
                    || existsBlockChildArray(parent, ["restriction_clause", "restriction_clausecomment"])) {
                    logEvento.State = 0;
                }

                sendPostSce002(logEvento);
            }
        } else if (block.type == "personalized_inputexpression" || block.type == "msgvariables") {
            if (fieldHasValue(block.inputList, "msg.sender") || fieldHasValue(block.inputList, "msg.transfer")) {
                // Check if it is inside a clause
                var parent = findParentByType(block, "clause");
                if (parent == null) return;

                var logEvento = new LogEventSce002(parent);
                if ((checkInputListHasName(parent, "modifiers") && existsBlockChildArray(parent, ["block_inputmodifier"]) && findParentByType(parent, "modifier") != null)
                    || existsBlockChildArray(parent, ["restriction_clause", "restriction_clausecomment"])) {
                    logEvento.State = 0;
                }
                sendPostSce002(logEvento);
            }
        }
    }
}

function sce005Listener(e) {
    if (e == null) return;
    var block = null;

    if (itemSelectedFromToolbox(e)) {
        block = workspace.getBlockById(e.newValue);
    } else if (fieldHasChanged(e)) {
        block = workspace.getBlockById(e.blockId);
    }

    if (block == null) return;

    var parentBlock = findParentByType(block, "casting_expression");
    if (parentBlock != null && parentBlock != undefined && parentBlock.type == "casting_expression") {

        var logEvento = new LogEventSce005(parentBlock);
        var fileBlock = findParentByType(block, "file");
        if (fileBlock != null && fileBlock != undefined) {
            var parentBlockFromCast = getBlockOwnElements(fileBlock, ["version"])[0];

            if (parentBlockFromCast != null && parentBlockFromCast != undefined) {
                if (blockVersionIsOkCompareTo(parentBlockFromCast, 0, 8, 1)) {
                    logEvento.State = 0;
                }
            }
        }
        sendPostSce005(logEvento);
    }
}

function blockVersionIsOkCompareTo(block, versionToValidate1, versionToValidate2, versionToValidate3) {
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

    var versionOptional = hasUpperBound ? [
        parseInt(value1versionoptional || 0, 10),
        parseInt(value2versionoptional || 0, 10),
        parseInt(value3versionoptional || 0, 10)
    ] : null;

    var minimunVersionOk = !hasUpperBound && !hasLowerBound ? false : evaluateComparison(userVersion, versionMain, symbolversion);
    var maxVersionOk = hasUpperBound ? evaluateComparison(userVersion, versionOptional, symbolcomparation) : true;

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
        case "greater": return result > 0;
        case "greater_equal": return result >= 0;
        case "less": return result < 0;
        case "less_equal": return result <= 0;
        default: throw new Error("Operador no válido: " + operator);
    }
}

function sce006Listener(e) {
    if (e == null) return;

    var block = null;

    if (fieldHasChanged(e)) {
        block = workspace.getBlockById(e.blockId);
        if (block == null) return;

        if (block.type == "assign_value_expression" || block.type == "assing_value_expression1inputs") {
            var parentBlock = findParentByType(block, "personalized_expression");

            if (parentBlock != null && parentBlock != undefined) {
                var logEvento = new LogEventSce006(parentBlock);
                if (fieldHasValue(parentBlock.inputList, "unchecked")) {
                    logEvento.State = 1;
                }
                sendPostSce006(logEvento);
            }

        } else if (block.type == "personalized_expression" && fieldHasValue(block.inputList, "unchecked")) {
            var logEvento = new LogEventSce006(block);
            if (existsBlockChildArray(block, ["assign_value_expression", "assing_value_expression1inputs"])) {
                logEvento.State = 1;
            }
            sendPostSce006(logEvento);
        }
    }
}


function findParentByType(block, parentType) {
    var parent = block.getParent();

    if (parent == null || parent == undefined) return null;

    if (parent.type == parentType) {
        return parent;
    }
    else {
        return findParentByType(parent, parentType);
    }
}

function existsBlockChildArray(block, childrenTypesArray) {
    var children = block.getChildren();

    if (children == null || children == undefined) return false;

    var result = false;
    const childrenOfTypeRequired = (element) => childrenTypesArray.includes(element.type);
    if (children.some(childrenOfTypeRequired))
        return true;
    else {
        children.forEach(element => {
            if (!result && existsBlockChildArray(element, childrenTypesArray)) result = true;
        });
    }

    return result;
}

function getBlockOwnElements(block, childrenTypesArray) {
    var children = block.getChildren();

    var output = [];
    const childrenOfTypeRequired = (element) => childrenTypesArray.includes(element.type);
    if (children == null || children == undefined) return output;

    if (children.some(childrenOfTypeRequired)) {
        output = children.filter(childrenOfTypeRequired)
    }

    children.forEach((e) => output = output.concat(getNextBlocksByType(e, childrenTypesArray)));

    return output;
}

function getNextBlocksByType(element, childrenTypesArray) {
    var nextBlock = element.getNextBlock();
    var output = [];

    if (nextBlock == null || nextBlock == undefined) return output;

    if (childrenTypesArray.includes(nextBlock.type)) {
        output.push(nextBlock);
    }

    output = output.concat(getNextBlocksByType(nextBlock, childrenTypesArray));

    return output;
}

//Recursivo
function existsBlockChild(block, blockChildType, fieldChildValue) {
    var children = block.getChildren();

    if (children == null || children == undefined) return false;

    var result = false;
    const childrenOfTypeRequired = (element) => element.type == blockChildType && fieldHasValue(element.inputList, fieldChildValue);
    if (children.some(childrenOfTypeRequired))
        return true;
    else {
        children.forEach(element => {
            if (!result && existsBlockChild(element, blockChildType, fieldChildValue)) result = true;
        });
    }

    return result;
}

function existsStatementInsideBlockByName(block, statementName) {
    var blockchilds = block.getChildren(false);

    if (blockchilds != null) {
        var childByName = blockchilds.find((block1) => getName(workspace.getBlockById(block1.id)) == statementName);
        return childByName != null && childByName != undefined;
    }
    return false;
}

function existsStatementInsideBlockByValue(block, statementValue) {
    var blockchilds = block.getChildren(false);

    if (blockchilds != null) {
        var childByName = blockchilds.find((block1) => block1.getValue() == statementValue);
        return childByName != null && childByName != undefined;
    }
    return false;
}

function existsFieldInsideChildrenBlockByValue(block, fieldValue) {
    var blockchilds = block.getChildren(false);

    if (blockchilds != null) {
        var childByName = blockchilds.find((block1) => fieldHasValue(block1.inputList, fieldValue));
        return childByName != null && childByName != undefined;
    }
    return false;
}

function fieldHasValue(fieldsArray, fieldValue) {
    if (fieldsArray == null || fieldsArray == undefined) return;
    var fieldByValue = fieldsArray.find((field) => field.fieldRow != null && field.fieldRow != undefined
        && (field.fieldRow[0].value_ == fieldValue || field.fieldRow[0].value_.includes(fieldValue)));
    return fieldByValue != null && fieldByValue != undefined;
}

function fieldHasName(fieldsArray, fieldName) {
    if (fieldsArray == null || fieldsArray == undefined) return;
    var fieldByName = fieldsArray.find((field) => getName(field) == fieldName);
    return fieldByName != null && fieldByName != undefined;
}

function checkInputListHasName(block, fieldName) {
    var inputsArray = block.inputList;
    if (inputsArray == null || inputsArray == undefined) return false;

    //Input field must be created and not empty
    var inputByName = inputsArray.find((field) => field.name == fieldName && field.fieldRow != null && field.fieldRow != undefined && field.fieldRow.length > 0);
    return inputByName != null && inputByName != undefined;
}

function workspaceIsEmptyOrJustOneItem() {
    var blocks = workspace.getAllBlocks();
    return blocks == null || blocks == [] || blocks.length == 1;
}

function compilerNotFirstItem() {
    var blocks = workspace.getAllBlocks();
    return blocks == null || blocks == [] || (blocks.length == 1 && blocks[0].type != "version");
}

function itemSelectedFromToolbox(e) {
    return e.type == Blockly.Events.UI && e.element == "selected" && (e.newValue != "" || e.newValue != null) && e.oldValue != null && workspace.getBlockById(e.newValue) != null;
}

function fieldHasChanged(e) {
    return e.type == Blockly.Events.CHANGE && e.element == "field";
}