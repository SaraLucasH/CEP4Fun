var LowCodePlatformURIs = {
    Send_Log_Events : '/events-log'
}

//TODO - Create constants for these values
function sendPostDep001(jsonLogEvents){
    sendPostRequest(jsonLogEvents,'dep001');
}

function sendPostNtd001(jsonLogEvents){
    buildHttpPost('ntd001', jsonLogEvents, '/event-state/ntd001');
}

function sendPostNtd002(jsonLogEvents){
    sendPostRequest(jsonLogEvents,'ntd002');
}

function sendPostSce003(jsonLogEvents){
    sendPostRequest(jsonLogEvents,'sce003');
}

function sendPostNtd003(jsonLogEvents){
    sendPostRequest(jsonLogEvents,'ntd003');
}

function sendPostNtd004(jsonLogEvents){
    sendPostRequest(jsonLogEvents,'ntd004');
}

function sendPostSye001(jsonLogEvents){
    buildHttpPost('sye001', jsonLogEvents, '/event-state/sye001');
}

function sendPostSye002(jsonLogEvents){
    sendPostRequest(jsonLogEvents,'sye002');
}

function sendPostSye003(jsonLogEvents){
    sendPostRequest(jsonLogEvents,'sye003');
}

function sendPostSye004(jsonLogEvents){
    sendPostRequest(jsonLogEvents,'sye004');
}

function sendPostPrg001(jsonLogEvents){
    sendPostRequest(jsonLogEvents,'prg001');
}

function sendPostPrg002(jsonLogEvents){
    buildHttpPost('prg002', jsonLogEvents, '/event-state/prg002');
}

function sendPostPrg003(jsonLogEvents){
    buildHttpPost('prg003', jsonLogEvents, '/event-state/prg003');
}

function sendPostPrg004(jsonLogEvents){
    buildHttpPost('prg004', jsonLogEvents, '/event-state/prg004');
}

function sendPostSce002(jsonLogEvents){
    buildHttpPost('sce002', jsonLogEvents, '/event-state/sce002');
}

function sendPostSce005(jsonLogEvents){
    buildHttpPost('sce005', jsonLogEvents, '/event-state/sce005');
}

function sendPostSce006(jsonLogEvents){
    buildHttpPost('sce006', jsonLogEvents, '/event-state/sce006');
}

function sendPostRequest(jsonLogEvents, topic){
    buildHttpPost(topic, jsonLogEvents, LowCodePlatformURIs.Send_Log_Events);
}

