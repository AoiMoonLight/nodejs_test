// Minimal amount of secure websocket server
// read ssl certificate
// var privateKey = fs.readFileSync('/etc/letsencrypt/live/bot.aoimoonlight.com/privkey.pem', 'utf8');
// var certificate = fs.readFileSync('/etc/letsencrypt/live/bot.aoimoonlight.com/fullchain.pem', 'utf8');
//
// var credentials = { key: privateKey, cert: certificate };
// var app = require('http');
// app.createServer(function (req, res) {
//   res.write('Hello World!');
//   res.end();
// }).listen(52222);


var WebSocketServer = require('ws').Server;
var jwt = require('jsonwebtoken'),
    token_key = "qnwkrkehlwk"; // be the rich
var wss = new WebSocketServer({port:52222});
var db = require('./dbcontrol');
var bithumb = require('./BithumbApi');
var currency = ['BTC', 'ETH', 'DASH', 'LTC', 'ETC', 'XRP', 'BCH', 'XMR', 'ZEC', 'QTUM', 'BTG',
                'EOS', 'ICX', 'VEN', 'TRX', 'ELF', 'MITH', 'MCO', 'OMG', 'KNC', 'GNT', 'HSR',
                'ZIL', 'ETHOS', 'PAY', 'WAX', 'POWR', 'LRC', 'GTO', 'STEEM', 'STRAT'];
var period = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '1d', '1w'];
var schema = require('./DB_Schema');


var redis = require('redis'),
    tempdb = redis.createClient(6379, 'localhost');

var currentprice = {"date":""};

function noop () {}
function heartbeat() {
  this.isAlive = true;
}

wss.on('connection', function connection(ws, req) {
  ws.isAlive = true;
  ws.ip = req.headers['x-fowarded-for'].split(/\s*,\s*/)[0];
  ws.authorized = false;
  ws.iduser = 0;
  ws.api = "";
  ws.sapi = "";
  ws.on('pong', heartbeat);
  ws.on('message', function incoming(message) {
      // console.log('received: %s', message);
      try {
        var msg = JSON.parse(message);
      }
      catch (err) {
        console.log(err);
      }
      var response = {key:"nop"};
      if (msg.key) {
        if(msg.key == ws.token) { // token ok
          jwt.verify(msg.key,token_key, function(err, decoded) {
            // console.log(decoded);
            if(decoded.exp < Date.now()/1000) { //expired
              ws.send('{"key":"expired"}');
              ws.authorized = false;
            }
            else if (decoded.exp < (Date.now()/1000)-300){ //almost expired
              ws.send('{"key":"almost_expired"}');
            }
            else {
              response.key = "ok";
            }
          });
          if(msg.request) {
            switch(msg.request) {
              case "currentprice" :
                response.current_price = currentprice;
                ws.send(JSON.stringify(response));
                break;
            }
          }
          else {
            ws.send(JSON.stringify(response));
          }
        }
      }
      else {
        // no key
        if(msg.id && msg.pw) {
          db.checkout(msg.id,msg.pw, function(result) {
            if(result.status == 0) {
              console.log("id ok");
              jwt.sign({idUser:result},token_key,{expiresIn:'1h'}, function(err,token) {
                ws.send('{"key":"'+token+'"}');
                console.log("key : "+token);
                ws.token = token;
                ws.iduser = result.idUser;
                ws.api = result.api;
                ws.sapi = result.sapi;
              })
              ws.authorized = true;
            }
            else {
              ws.authorized = false;
            }
          });
        }
        else {
          ws.send('{"error":"key_not_exist"}');
          ws.close();
        }
      }
  });
  console.log(ws.ip+" is connected");
  setTimeout(function () {// discard user if no response in 1 second after connection
    if(ws.authorized == true) {
      console.log('login complete, get user wallet data');
      db.get_wallet(ws.iduser, function(result) {
        if(result.status == 0) {
          ws.Bithumb_wallet = result.wallet;
          ws.send('{"Bithumb_wallet":'+JSON.stringify(ws.Bithumb_wallet,replacer)+'}');
          console.log('{"Bithumb_wallet":'+JSON.stringify(ws.Bithumb_wallet,replacer)+'}');
        }
      });
    }
    else {
      console.log('login fail');
      return ws.close();
    }
  }, 1000);
});

setInterval(function ping() { // user alive check
  wss.clients.forEach(function each(ws) {
    if(ws.isAlive == false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

setInterval(() => { // Run Bithumb API in 150msec cycle each, 5000msec cycle total
  bithumb.ticker(function(result) {
    if(result) if(result.status == "0000") {
      currency.forEach(function(item) {
        var temp ={
          price:'',
          fluctate:'',
          rate:''
        };
        currentprice[item] = temp;
        currentprice[item].price = String(result.data[item].closing_price);
        currentprice[item].fluctate = String(result.data[item]['24H_fluctate']);
        currentprice[item].rate = String(result.data[item]['24H_fluctate_rate']);
      });
      var stamp = Date(result.data.date).toString();

      currentprice["date"] = stamp.substr(0,stamp.length - 15);
    }
  });
}, 5000);


function replacer(key, value) {
  if (typeof value === "number") {
    return String;
  }
  return value;
}
