var mysql = require("mysql");

var dbConfig = {
  host : 'localhost',
  port : 3306,
  user : 'CurrencyBot',
  password : 'thddudgns',
  database : 'coiner'
}
var connection;
var schema = require('./DB_Schema');

var currency = ['BTC', 'ETH', 'DASH', 'LTC', 'ETC', 'XRP', 'BCH', 'XMR', 'ZEC', 'QTUM', 'BTG',
                'EOS', 'ICX', 'VEN', 'TRX', 'ELF', 'MITH', 'MCO', 'OMG', 'KNC', 'GNT', 'HSR',
                'ZIL', 'ETHOS', 'PAY', 'WAX', 'POWR', 'LRC', 'GTO', 'STEEM', 'STRAT', 'KRW'];

function handleDisconnect() { // for continus connecting
  connection = mysql.createConnection(dbConfig);
  connection.connect (function onConnect(err) {
    if(err) {
      console.log('error whtn connecting to db :', err);
      setTimeout(handleDisconnect, 10000);
    }
  });
  connection.on('error', function onError(err) {
    console.log('db error', err);
    if(err.code == 'PROTOCOL_CONNECTION_LOST') {
      handleDisconnect();
    }
    else {
      throw err;
    }
  })
}
handleDisconnect();

exports.joinNew = function(a,b) {
  var query_data = [a,b];
  connection.query('INSERT into Users(`ID`, `Password`) values(?, HEX(AES_ENCRYPT(?, SHA2("veryimportantkey", 512))));',query_data,
  	function(err, rows, fields) {
  	  if (err) {
        if(err.code == 'ER_DUP_ENTRY') {
          console.log("User ID alreade exist");
          return -1;
        }
        else {
          console.log(err);
          return -2;
        }
      }
      else {
  	     console.log("User ID joining complete");
         return 0;
       }
  	}
  )
}

exports.checkout = function(a,b, callback) {
  var response = {
    idUser : 0,
    api :"",
    sapi : "",
    status : -1
  };
  var error = 0;
  connection.query('SELECT `idUsers`, `Status`, CAST( AES_DECRYPT(UNHEX(`Password`), SHA2("veryimportantkey", 512)) AS CHAR) AS `PassWord`, CAST( AES_DECRYPT(UNHEX(`Bithumb_API`), SHA2("veryimportantkey", 512)) AS CHAR) AS `Bithumb_API` , CAST( AES_DECRYPT(UNHEX(`Bithumb_SAPI`), SHA2("veryimportantkey", 512)) AS CHAR) AS `Bithumb_SAPI`  FROM Users WHERE ID="' + a + '"',
    function(err, rows, fields) {
      if(err) {
        error = -3;
        callback(error);
      }
      else {
        if(rows.length == 0) {
          console.log("User not exist");
          callback(response);
        }
        else {
          if((rows[0].PassWord == b) && (rows[0].Status == 1)) {
              response.idUser = rows[0].idUsers;
              response.api = rows[0].Bithumb_API;
              response.sapi = rows[0].Bithumb_SAPI;
              response.status = 0;
              console.log("id:"+response.idUser+" api:"+response.api+" sapi:"+response.sapi);
              callback(response);
          }
          else {
            console.log("Wrong password or User not activated");
            callback(response);
          }
        }
      }
    }
  )
}

exports.get_wallet = function(idUser, callback) {
  var response = {
    status : -1,
    wallet : {}
  };
  response.status = -1;
  var counter = 0;
  currency.forEach(function each(item) {
    connection.query('SELECT * FROM `wallet` WHERE `owner` = "'+idUser+'" AND `exchange_currency` = "Bithumb_'+item+'"',
    function(err, rows, fields) {
      if(err) {
        console.log(err);
        callback(response);
      }
      else {
        response.wallet[item] = JSON.parse(JSON.stringify(rows[0]));
        if(++counter == currency.length) {
          response.status = 0;
          callback(response);
        }
      }
    });
  })
};

exports.setUsers = function (idUser,exchange, openapi, secretapi) {
  var query_data = [idUser, openapi, secretapi];
  connection.query('INSERT into `wallet`(`idUsers`, `open api key`, `secret api key`) values(?, ?, HEX(AES_ENCRYPT(?, SHA2("veryimportantkey", 512))),HEX(AES_ENCRYPT(?, SHA2("veryimportantkey", 512))));',query_data,
  	function(err, rows, fields) {
  	  if (err) {
        if(err.code == 'ER_DUP_ENTRY') {
          console.log("User Wallet already exist");
          return -1;
        }
        else {
          console.log(err);
          return -2;
        }
      }
      else {
  	     console.log(exchange, " wallet generation complete");
         return 0;
       }
  	}
  )
}



// exports.getUsers = function ()
