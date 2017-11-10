"use strict";
process.title = 'superDirtSocket';
var http = require('http');
var WebSocket = require('ws');
var nopt = require('nopt');
var osc = require('osc');

// parse command-line options
var knownOpts = {
  "help": Boolean,
  "dirt-address" : [String, null],
  "dirt-port" : [Number, null],
  "ws-port" : [Number, null],
  "udp-port" : [Number, null]
};
var shortHands = {
  "h" : ["--help"],
  "a" : ["--superDirtAddress"],
  "p" : ["--superDirtPort"],
  "w" : ["--superDirtPort"],
  "u" : ["--osc-address"]
};

var parsed = nopt(knownOpts,shortHands,process.argv,2);
if(parsed['help']!=null) {
  console.log("superDirtSocket");
  console.log("usage:");
  console.log(" --help (-h)                  this help message");
  console.log(" --dirt-address (-a) [string] address for sending OSC messages to SuperDirt (default: 127.0.0.1)");
  console.log(" --dirt-port (-p) [number]    port for sending OSC messages to SuperDirt (default: 57120)");
  console.log(" --ws-port (-w) [number]      TCP port (WebSocket) to listen on (default: 7772)");
  console.log(" --udp-port (-u) [number]     UDP port to listen on (default: 7773)")
  process.exit(1);
}

var dirtAddress = parsed['dirt-address'];
if(dirtAddress==null) dirtAddress="127.0.0.1";
var dirtPort = parsed['dirt-port'];
if(dirtPort==null) dirtPort = 57120;
var wsPort = parsed['ws-port'];
if(wsPort==null) wsPort = 7772;
var udpPort = parsed['udp-port'];
if(udpPort==null) udpPort = 7773;

// create UDP port (currently only used for sending to SuperCollider)
var udp = new osc.UDPPort( { localAddress: "127.0.0.1", localPort: udpPort });
udp.open();

function appendSuperDirtArg(superDirtArgName,oscType,sourceValue,targetArray) {
  if(sourceValue != null) {
    targetArray.push({ type: "s", value: superDirtArgName});
    targetArray.push({ type: oscType, value: sourceValue });
  }
}

// create WebSocket server (*** note: for security we should add a default so only local connections are accepted...)
var server = http.createServer();
var wss = new WebSocket.Server({server: server});
wss.on('connection',function(ws) {
  // var ip = ws.upgradeReq.connection.remoteAddress; // seems to fail, not sure why but not important since main use is local
  console.log("new WebSocket connection "); //  + ip);
  ws.on("message",function(m) {
    var n = JSON.parse(m);
    console.log(n);
    var args = [];
    appendSuperDirtArg("s","s",n.sample_name,args);
    appendSuperDirtArg("n","i",n.sample_n,args);
    appendSuperDirtArg("speed","f",n.speed,args);
    appendSuperDirtArg("begin","f",n.begin,args);
    appendSuperDirtArg("end","f",n.end,args);
    appendSuperDirtArg("length","f",n.f,args);
    appendSuperDirtArg("accelerate","i",n.accelerate,args);
    appendSuperDirtArg("cps","f",n.cps,args);
    appendSuperDirtArg("unit","i",n.unit,args);
    appendSuperDirtArg("loop","i",n.loop,args);
    appendSuperDirtArg("delta","f",n.delta,args);
    appendSuperDirtArg("legato","f",n.legato,args);
    appendSuperDirtArg("sustain","f",n.sustain,args);
    appendSuperDirtArg("amp","f",n.amp,args);
    appendSuperDirtArg("gain","f",n.gain,args);
    appendSuperDirtArg("pan","f",n.pan,args);
    appendSuperDirtArg("note","f",n.note,args);
    appendSuperDirtArg("freq","f",n.freq,args);
    appendSuperDirtArg("midinote","f",n.midinote,args);
    appendSuperDirtArg("octave","f",n.octave,args);
    appendSuperDirtArg("latency","f",n.latency,args);
    appendSuperDirtArg("lag","f",n.lag,args);
    appendSuperDirtArg("offset","f",n.offset,args);
    appendSuperDirtArg("cut","i",n.cut,args);
    appendSuperDirtArg("orbit","i",n.orbit,args);
    appendSuperDirtArg("cycle","i",n.cycle,args);
    var bundle = {
      timeTag: { native: n.when * 1000 + 300 },
      packets: [ { address: "/play2", args: args }]
    };
    console.log(bundle);
    udp.send(bundle,dirtAddress,dirtPort);
  });
});

// make it go
server.listen(wsPort, function () {
  console.log('superDirtSocket listening (WebSocket) on ' + server.address().port)
  console.log('will forward OSC messages to SuperDirt at ' + dirtAddress + ':' + dirtPort + " using UDP port " + udpPort);
});
