class LogEventDep001 {
    constructor(e) {
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

class LogEventSye001 {
    constructor(e) {
        this.Timestamp = time();
        this.IdSession = idSession;
        this.State = 1;
        this.Param1 = "";
        this.Topic = "sye001";
        this.BlockId = e.id;
    }
}

class LogEventPrg001 {
    constructor() {
        this.timestamp = time();
        this.idSession = idSession;
    }
}

class LogEventNtd001 {
    constructor(e) {
        this.Timestamp = time();
        this.IdSession = idSession;
        this.State = 1;
        this.Param1 = e.getFieldValue("name");
        this.Topic = "ntd001";
        this.BlockId = e.id;
    }
}

class LogEventSce002 {
    constructor(e) {
        this.Timestamp = time();
        this.IdSession = idSession;
        this.State = 1;
        this.Param1 = e.getFieldValue("name");
        this.Topic = "sce002";
        this.BlockId = e.id;
    }
}

class LogEventSce005 {
    constructor(e) {
        this.Timestamp = time();
        this.IdSession = idSession;
        this.State = 1;
        this.Param1 = "";
        this.Topic = "sce005";
        this.BlockId = e.id;
    }
}

class LogEventSce006 {
    constructor(e) {
        this.Timestamp = time();
        this.IdSession = idSession;
        this.State = 0;
        this.Param1 = "";
        this.Topic = "sce006";
        this.BlockId = e.id;
    }
}

class LogEventPrg00X {
    constructor(e, topic) {
        this.Timestamp = time();
        this.IdSession = idSession;
        this.State = 1;
        this.Param1 = e.getFieldValue("name");
        this.Topic = topic;
        this.BlockId = e.id;
    }
}

class LogEventPrg002 {
    constructor(e) {
        this.Timestamp = time();
        this.IdSession = idSession;
        this.Topic = "prg002";
        this.State = 0;
        this.Param1 = "";
        this.BlockId = e.id;
    }
}

class LogEventNtd002 {
    constructor(e, timestamp) {
        this.timestamp = timestamp;
        this.idSession = idSession;
        // Block content itself
        this.name = e.getFieldValue("name");
        this.values_visibility = e.getFieldValue("values_visibility");
        this.blockId = e.id;
    }
}

class LogEventSce003 {
    constructor(e, timestamp) {
        this.timestamp = timestamp;
        this.idSession = idSession;
        // Block content itself
        this.name = e.getFieldValue("name");
        this.values_visibility = e.getFieldValue("values_visibility");
        this.blockId = e.id;
        this.hasModifiers = clauseHasModifiers(e) ? 1 : 0;
    }
}

class LogEventNtd003 {
    constructor(e, timestamp, parentBlock) {
        this.timestamp = timestamp;
        this.idSession = idSession;
        this.name = e.getFieldValue("name");
        this.values_visibility = e.getFieldValue("values_visibility");
        this.values_inputmodifier = e.getFieldValue("values_inputmodifier");
        this.parent = parentBlock;
        this.blockId = e.id;
    }
}

class LogEventSyeEventDuplicated {
    constructor(e, timestamp) {
        this.timestamp = timestamp;
        this.idSession = idSession;
        // Block content itself
        this.name = e.getFieldValue("name");
        this.blockId = e.id;
    }
}