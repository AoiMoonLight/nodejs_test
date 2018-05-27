var mysql = require("mysql");
var	request = require('request');


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

function XCoinAPI(api_key, api_secret){
	this.apiUrl = 'https://api.bithumb.com';
	this.api_key = api_key;
	this.api_secret = api_secret;
}

transaction_history = function(var_currency, var_offset, callback){
  request({
		method : 'POST',
		uri : 'https://api.bithumb.com/public/transaction_history/'+var_currency+'?count=100&cont_no='+var_offset,
	},
	function(error, response, rgResult) {
		if(error) {
			console.log(error);
			return;
		}
		else {
      try {
			     var rgResultDecode = JSON.parse(rgResult);
           if(rgResultDecode && typeof rgResultDecode == "object") {
             callback(rgResultDecode);
           }
      }
      catch(e) {
        console.log(e);
        if(rgResult) {
          console.log(rgResult);
        }
      }
		}
	});
}
var lastcount = 0;
var chart_min = {
  'transaction_date':'0',
  'open':'0',
  'close':'0',
  'high':'0',
  'low':'0',
  'bid_volume':'0',
  'ask_volume':'0',
  'average':'0',
  'lastcount' : '0'
}
var prev_min = new Date();
var tzoffset = prev_min.getTimezoneOffset() * 60000;
prev_min.setSeconds(0);


// setInterval(() => { // get current price for each currency
//   var currency = 'EOS';
//   transaction_history(currency,lastcount.toString(),function(result) {
//     if(result.status == "0000") {
//       var size = result.data.length;
//       for (var cnt=0;cnt<size;cnt++) {
//         var current_min = new Date(result.data[cnt].transaction_date);
//         current_min.setSeconds(0);
//         var current_price = result.data[cnt].price;
//         if(current_min.getMinutes() != prev_min.getMinutes()) {
//           if((parseFloat(chart_min.ask_volume) + parseFloat(chart_min.bid_volume))> 0) {
//             chart_min.average = parseInt(parseInt(chart_min.average)/ (parseFloat(chart_min.ask_volume) + parseFloat(chart_min.bid_volume)));
//           }
//           connection.query('INSERT IGNORE into `Bithumb_'+currency+'_1m_chart` SET ?', chart_min,
//           function(err, rows, fields) {
//         	  if (err) {
//               if(err.code == 'ER_DUP_ENTRY') {
//               }
//               else {
//                 console.log(err);
//               }
//             }
//         	});
//           console.log(chart_min.transaction_date + " : " + lastcount);
//           chart_min.open = 0;
//           chart_min.close = 0;
//           chart_min.high = 0;
//           chart_min.low = 0;
//           chart_min.bid_volume = 0;
//           chart_min.ask_volume = 0;
//           chart_min.average = 0;
//         }
//         chart_min.transaction_date = new Date(current_min-tzoffset).toISOString().slice(0, 19).replace('T', ' ');;
//         if(chart_min.close==0) {
//           chart_min.close = current_price;
//         }
//         if((chart_min.high < current_price)||(chart_min.high == 0)) {
//           chart_min.high = current_price;
//         }
//         if((chart_min.low > current_price)||(chart_min.low == 0)) {
//           chart_min.low = current_price;
//         }
//         if(result.data[cnt].type == "ask") {
//           chart_min.ask_volume = parseFloat(chart_min.ask_volume) + parseFloat(result.data[cnt].units_traded);
//         }
//         else if (result.data[cnt].type == "bid") {
//           chart_min.bid_volume = parseFloat(chart_min.bid_volume) + parseFloat(result.data[cnt].units_traded);
//         }
//         chart_min.average += parseInt(result.data[cnt].total);
//         chart_min.open = current_price;
//         lastcount = result.data[cnt].cont_no;
//         prev_min = current_min;
//       };
//     }
//   });
// }, 300);
