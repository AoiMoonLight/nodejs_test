var mysql = require("mysql");
var dbConfig = {
  host : 'localhost',
  port : 3306,
  user : 'BithumbPublic',
  password : 'thddudgns',
  database : 'coiner'
}
var connection;

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

//Create chart db
var currency = ['BTC', 'ETH', 'DASH', 'LTC', 'ETC', 'XRP', 'BCH', 'XMR', 'ZEC', 'QTUM', 'BTG',
                'EOS', 'ICX', 'VEN', 'TRX', 'ELF', 'MITH', 'MCO', 'OMG', 'KNC', 'GNT', 'HSR',
                'ZIL', 'ETHOS', 'PAY', 'WAX', 'POWR', 'LRC', 'GTO', 'STEEM', 'STRAT'];
var period = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '1d', '1w'];
//
// gentables = function(){
//   currency.forEach(function(a){
//     period.forEach(function(b) {
//       connection.query('CREATE TABLE Bithumb_'+a+'_'+b+'_chart LIKE chart');
//     });
//   });
// };
// gentables();

//
// genCurrency = function() {
//   currency.forEach(function(a){
//     connection.query('INSERT INTO currencyState(`exchange_currency`, `order`) values(?, "0");', 'bithumb_'+a,
//     function(err, rows, fields) {
//   	  if (err) {
//         if(err.code == "ER_DUP_ENTRY") {}
//         else {   console.log(err);}
//       }
//       else {
//   	     console.log(a, " wallet generation complete");
//        }
//   	});
//   });
// };
// genCurrency();
