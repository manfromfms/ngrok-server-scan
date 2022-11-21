module.exports = class Check {
    constructor(EventEmitter) {
        this.eventEmitter = new EventEmitter()
    }

    async get(ip, addition) {
        var eventEmitter = this.eventEmitter
        var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest

        var url = `http://localhost:8080/api/server/${ip}`;

        var xhr = new XMLHttpRequest();
        xhr.open("GET", url);

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if(xhr.status == 200) {
                    var output = xhr.responseText
                    output = JSON.parse(output)
                    output.addition = addition
                    eventEmitter.emit('serverStatus', output)
                } else {
                    eventEmitter.emit('serverStatus', {status: 'error', addition: addition})
                }
            }}

        xhr.send()
    }
}