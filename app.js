// datalove <3
// dependencies
var http = require('http'),
    fs = require('fs'),
    express = require('express'),
    app = express(),
    path = require('path'),
    favicon = require('serve-favicon'),
    xls = require('excel');
    
// all environments
app.set('port', process.env.PORT || 3002);

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', function(res, req, next){
    res.header('X-XSS-Protection' ,  '1; mode=block');
    next(); 
});

app.get('/*', function(req, res){
    res.header("Content-Type", "application/json; charset=utf-8");
    res.charset = 'utf-8';

    var path = req.path.substr(1, req.path.length),
        dataset = null;
        
    switch(path){
        case '1':
            dataset = '/data/1.STANOVNISTVO PREMA POJEDINACNIM GODINAMA STAROSTI I SPOLU.xlsx';
        break;
        case '2':
            dataset = '/data/2. STANOVNISTVO PREMA STAROSTI PO PETOGODISTIMA I SPOLU.xlsx';
        break;
        case '3':
            dataset = '/data/3.STANOVNISTVO PREMA NACIONALNOM IZJASNJAVANJU I SPOLU.xlsx';
        break;
        case '4':
            dataset = '/data/4.STANOVNISTVO PREMA IZJASNJAVANJU O VJEROISPOVIJESTI I SPOLU.xlsx';
        break;
        case '5':
            dataset = '/data/5.STANOVNISTVO PREMA MATERNJEM JEZIKU I SPOLU.xlsx';
        break;
        case '6':
            dataset = '/data/6.STANOVNISTVO STARO 15 I VISE GODINA PREMA ZAKONSKOM BRACNOM STANJU I SPOLU.xlsx';
        break;
        case '7':
            dataset = '/data/7.ZENSKO STANOVNISTVO STARO 15 I VISE GODINA PREMA UKUPNOM BROJU ZIVORODENE DJECE.xlsx';
        break;
        case '8':
            dataset = '/data/8.NEPISMENO STANOVNISTVO STARO 10 I VISE GODINA PREMA SPOLU.xlsx';
        break;
        case '9':
            dataset = '/data/9.STANOVNISTVO STARO 15 I VISE GODINA PREMA NAJVISOJ ZAVRSENOJ SKOLI I SPOLU.xlsx';
        break;
        case '10':
            dataset = '/data/10.KOMPJUTERSKI PISMENO STANOVNISTVO STARO 10 I VISE GODINA PREMA SPOLU.xlsx';
        break;
        case '11':
            dataset = '/data/11.RADNO SPOSOBNO STANOVNISTVO PREMA STATUSU U AKTIVNOSTI I SPOLU.xlsx';
        break;
        case '12':
            dataset = '/data/12.OSOBE SA POTESKOCAMA PREMA VRSTI POTESKOCE I SPOLU.xlsx';
        break;
        case '13':
            dataset = '/data/13.DOMACINSTVA PREMA BROJU CLANOVA.xlsx';
        break;
        case '14':
            dataset = '/data/14.STAMBENE ZGRADE PREMA BROJU STANOVA.xlsx';
        break;
        case '15':
            dataset = '/data/15.BROJ I POVRSINA STANOVA PREMA OSNOVU KORISTENJA.xlsx';
        break;
        case '16':
            dataset = '/data/16.STANOVI ZA STANOVANJE PREMA BROJU SOBA I POVRSINI.xlsx';
        break;
        case '17':
            dataset = '/data/17.DOMACINSTVA KOJA OBAVLJAJU POLJOPRIVREDNU AKTIVNOST.xlsx';
        break;
        case 'sve':
            dataset = '/data/popis_sve.json'
    }

    if(dataset){

        if(!isNaN(path))
            xls(__dirname + dataset, function(err, data) {
                if(err) throw err;
                    res.end(JSON.stringify(data));
            });
        else
            res.end(fs.readFileSync(__dirname + dataset, 'utf8'));
    }
    else
        res.end('404');   
});

var server = http.createServer(app);

server.listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});