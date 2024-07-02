export class ErrorData {
    constructor(statusCode, message, stack) {
        this.statusCode = statusCode;
        this.message = message;
        this.stack = stack;

        console.error(message, stack);
    }
}


export class UnsupportedHTTPMethod {
    constructor() {
        super(400, "Unsupported HTTP method")
    }
}

export class UnsupportedResource {
    constructor() {
        super(400, "Unsupported resource")
    }
}

export class MissingParameters {
    constructor() {
        super(400, "Missing parameters")
    }
}

export class GroupMaximumSize {
    constructor(groupId) {
        super(400, `group ${groupId} has reached maximum size`)
    }
}

export class UserBlocked {
    constructor() {
        super(403, "Blocked")
    }
}