from flask import Flask
from mcstatus import JavaServer
import jsonpickle
app = Flask(__name__)

@app.route('/')
def index():
    return 'hello world'

@app.route('/api/server/<ip>')
def apiserver(ip):
    server = JavaServer.lookup(ip, 3.0)
    status = server.status()
    status.status = 'online'
    encoded = jsonpickle.encode(status)
    return encoded

@app.route('/favicon.ico')
def favicon():
    return ''

app.run(host='0.0.0.0', port=8080, debug=False)

