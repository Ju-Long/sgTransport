module.exports = class RequestError extends Error {
    constructor(message, parameter, line) {
        super(message);

        this.parameter = parameter
        this.line = line
    }
}