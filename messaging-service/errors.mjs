export class ErrorData {
    constructor(errorCode, message, stack) {
        this.errorCode = errorCode;
        this.message = message;
        this.stack = stack;

        console.error(message, stack);
    }
}