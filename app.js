const WebSocket = require('ws');
const dayjs = require('dayjs');
const express = require('express')
const app = express()
const port = process.env.PORT || '3000';


var now = new Date();
var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

// get begining of today with complete date
var firstDay = dayjs().format('YYYY-MM-DD 00:00:00');

// get end of today with complete date
var lastDay = dayjs().format('YYYY-MM-DD HH:mm:ss');



const date_from = firstDay;
var date_to = lastDay;

console.log (date_from , date_to);

const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=61777&l=EN&brand=deriv');

// You can get your token here https://app.deriv.com/account/api-token. 
const token = 'mdEbAfnRILyGB18'; // Replace with your API token.
// Define an array variable to store the total markup.
var total = [];
var total_trades = [];

function total_markup (date_to, callback) {
  var count = 0;
  var i = 0;
  var app_id = 0;
  var markup_value = 0;
  var transactions_count = 0;
  

  ws.onopen = function (evt) {
    ws.send(JSON.stringify({ "authorize": token })) // First send an authorize call.
	};

  ws.onmessage = function (msg) {
    var data = JSON.parse(msg.data);
    console.log('Response: %o', data.app_markup_statistics); // Uncomment to see the full JSON response.
    if (data.error !== undefined) {
        console.log('Error : %o', data.error.message);
    } else if (data.msg_type == 'authorize') {
        /*
        * Format json request.  
        */
        ws.send(JSON.stringify( { "app_markup_statistics": 1, "date_from": date_from,  "date_to": date_to }))
    } else if (data.msg_type == 'app_markup_statistics') {
        let count = Object.keys(data.app_markup_statistics.breakdown).length;
        console.log ("Total Aplicativos: "+count);
        
        let total_markup = 0;
        total_markup = data.app_markup_statistics.total_app_markup_usd;
        for (let i = 0; i < count; i++ ){
          console.log('Aplicativo ID %d $: %o', data.app_markup_statistics.breakdown[i].app_id, data.app_markup_statistics.breakdown[i].app_markup_value);
          app_id = data.app_markup_statistics.breakdown[i].app_id;
          markup_value = data.app_markup_statistics.breakdown[i].app_markup_value;
          transactions_count = data.app_markup_statistics.breakdown[i].transactions_count;
          

           //check if app_id == 35683
          //if yes, then add markup_value to total
          //if no, then do nothing
          if (app_id == 61777) {
            total[0] =  markup_value;
            total_trades[0] = transactions_count;
          }
          else if (app_id == 35206) {
            total[1] = markup_value;
          }

        }
        console.log('Total Markup $: %o', total_markup);
        
        ws.close();
	
    } else {
        console.log('Unknown Response %o', data);
        ws.close();
	return 0;
    }
  }
  return total;
};

total = total_markup(date_to) ;


app.get('/', (req, res) => {
  res.json([
    { valorTotal1: total[0],
      transactions_count: total_trades[0],
      dia: today,
    }

  ])

})




app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
