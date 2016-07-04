// datalove <3
// dependencies
var http = require('http'),
    express = require('express'),
    app = express(),
    path = require('path'),
    favicon = require('serve-favicon'),
     xls = require('excel');
    
// all environments
app.set('port', process.env.PORT || 3001);

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', function(res, req, next){
    res.header('X-XSS-Protection' ,  '1; mode=block');
    
    next(); 
});


function convertToJSON(array) {
  var first = array[0].join()
  var headers = first.split(',');

  var jsonData = [];
  for ( var i = 1, length = array.length; i < length; i++ )
  {

    var myRow = array[i].join();
    var row = myRow.split(',');

    var data = {};
    for ( var x = 0; x < row.length; x++ )
    {
      data[headers[x]] = row[x];
    }
    jsonData.push(data);

  }
  return jsonData;
};

app.get('/1', function(req,res){
    xls(__dirname + "/data/1.STANOVNISTVO PREMA POJEDINACNIM GODINAMA STAROSTI I SPOLU.xlsx", function(err, data) {
        if(err) throw err;
            // data is an array of arrays
            res.end(JSON.stringify(data));

    });
});
//

app.get('/2', function(req,res){
    res.header("Content-Type", "application/json; charset=utf-8");
    res.charset = 'utf-8';

    xls(__dirname + "/data/2. STANOVNISTVO PREMA STAROSTI PO PETOGODISTIMA I SPOLU.xlsx", function(err, data) {
        if(err) throw err;
            // data is an array of arrays
            res.end(JSON.stringify(data), 'utf-8');

    });
});

var server = http.createServer(app);

server.listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});