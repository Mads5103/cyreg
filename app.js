var express = require('express');
var app = express();
var http = require('http');
var bodyParser = require('body-parser');
var fs = require("fs");
var JsonDB = require('node-json-db');
var count = 0;
var db = new JsonDB("myDataBase", true, false); // Database hvor samtlige ingående signaler logges.
var db2 = new JsonDB("myDataBase2",true, false); // Currentstate af cykler
var util = require('util');
var net = require('net');
var HOST = '128.76.239.220'; // Lokal IP adresse på netværket der benyttes
var PORT = 10002; // Den benyttede port
var wifiData; // Variable der bruges til at opbevare indkommende data midlertidigt.
var i; // Bruges til for loops  i funktioner.
var binary_array = [128, 64, 32, 16, 8, 4, 2, 1];
function logdata( vogn_id, antal_optagede_pladser, lognummer, tid, pladsstring) {
    this.vogn_id = vogn_id;
    this.antal_optagede_pladser =  antal_optagede_pladser;
    this.tid = tid;
    this.lognummer = lognummer;
    this.pladsstring = pladsstring;
} // Klasse der bruges til input i myDataBase, til at opbevare samtlige signaler.
function logdata2( antal_optagede_pladser, lognummer, pladsstring) {
    this.antal_optagede_pladser =  antal_optagede_pladser;
    this.lognummer = lognummer;
    this.pladsstring = pladsstring;
}//Klasse der bruges til at opbevare realtime logs.
var logdata4 = new logdata2("1","1","1")
var now = (function () {
    var year = new Date(new Date().getFullYear().toString()).getTime();
    return function () {
        return Date.now() - year
    }
})(); // Bruges til at skabe dato, ugedage og tiden på følgende form: Fri Jun 02 2017 13:03:47 GMT+0200 (Rom, sommertid)


// Følgnede funktion bruges til at oprette direkte forbindelse over wifi, til serveren
net.createServer(function(sock) {

    // Hvis der er en forbindelse der åbnes, bliver deres adresse samt hvilken port de forbinder med udskrevet i konsollen
    console.log('CONNECTED: ' + sock.remoteAddress +':'+ sock.remotePort);
    // To variable deklareres der bruges til at få omskrevet det data der skal logges til string, således at dataen
    // i database er konstant samme form.
    var wifi_vogn_optaget_temp = 0;
    var wifi_vogn_id_temp = 0;


    // Her tilføjes en funktion, hvis der bliver tilsendt data. Da dette er et lukket system (altså ingen bruger indtastning
    // Det antages at formen vil være 8 bit til nummer af vognnen, 1 dødt bit og 7 bit som individuelt beskriver hvorledes
    // om en ckel plads er optaget.
    sock.on('data', function(data) {
        // Adressen samt hvad der er bliver sendt bliver noteret i consolen.
        console.log('DATA ' + sock.remoteAddress + ': ' + data);
        // Skriver den data tlbage til afsenderen som er afsendt.
        sock.write('You said "' + data + ' " ');
        // Omskriver data modtaget fra xxx form til string.
        wifiData = data.toString('utf8');
        // Konvereterer vogn nummeret fra binært til decimal tal.
        for (i = 0; i < 8; i++) {
            if(wifiData[i] == 1) {
                wifi_vogn_id_temp = wifi_vogn_id_temp + binary_array[i]
            }
        }
        // Omsættes ovgnnummeret til en string for konsekvens form af data.
        var wifi_vogn_id = wifi_vogn_id_temp.toString();
        console.log("------------------------");
        console.log("Vogn ID:");
        console.log(wifi_vogn_id);
        console.log("------------------------");
        // Følgende for loop tæller antalet af cykler i vognen.
        for (i = 9; i < 16; i++) {
            if(wifiData[i] == 1) {
                wifi_vogn_optaget_temp++;
            }
        }

        var wifi_vogn_optaget = wifi_vogn_optaget_temp.toString();
        console.log("------------------------");
        console.log("Antal optagede pladser:")
        console.log(wifi_vogn_optaget);
        console.log("------------------------");
        // Udregner antallet af cykel pakeringspladser i vognen.

        // Data indsættes i de givne klasser, så det kan indskrives i logggen.
        var logdata1 = new logdata(wifi_vogn_id,wifi_vogn_optaget,count,Date(),wifiData);
        var logdata3 = new logdata2(wifi_vogn_optaget,count,wifiData);
        // Dataen indsættes i json log filerne.
            db.push("/data" + count, logdata1);
            count++;
            db2.push("/data" + logdata1.vogn_id, logdata3 );

    });

    // Socketen lukkes, således hvis der sker fejl fungerer systemet stadig.
    sock.on('close', function(data) {
        console.log('CLOSED: ' + sock.remoteAddress +' '+ sock.remotePort);
    });

}).listen(PORT);



// Create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })

app.use(express.static('public'));
app.get('/index.htm', function (req, res) {
    res.sendFile( __dirname + "/" + "index.htm" );
})

app.post('/process_post', urlencodedParser, function (req, res) {
    // Process post bruges til at indsætte data i loggen, fra browseren
    console.log("You are in /process_post");
    // Data
    new Date();
    var logdata1 = new logdata(req.body.vogn_id,req.body.antal_optagede,count,Date(),req.body.plads_string);
    var logdata3 = new logdata2(req.body.antal_optagede, count, req.body.plads_string);
    // Her logges dataen

        db.push("/data"+ count, logdata1);
        count++;
        db2.push("/data" + logdata1.vogn_id, logdata3 );

    res.redirect('http://cyreg.lkv20.dk:10000');

})
//
// Tjek Data siden blvier oprettet
app.get('/TjekData', function (req, res) {
    // First read existing users.
    res.sendFile( __dirname + "/" + "TjekData.html" );

})
// Tjek 0 funktionen bliver oprettet
app.get('/Tjek0',function (req,res){
    res.sendFile( __dirname + "/" + "Tjek0.html" );
})
// Stylesheetet bliver offenligtgjort
app.get('/public/stylesheets/stylesheet.css', function (req,res) {
    res.sendFile( __dirname + "/public/stylesheets/" + "stylesheet.css");
})
//Databaserne bliver lagt op
app.get('/myDataBase2.json', function (req, res) {
    res.sendFile( __dirname + "/" + "myDataBase2.json" );
})
app.get('/myDataBase.json', function (req, res) {
    res.sendFile( __dirname + "/" + "myDataBase.json" );
})
//  Nikolaj er en kegle
app.get('/skype.jpg', function (req, res) {
    res.sendFile( __dirname + "/" + "skype.jpg" );
})
app.get('/tog.html', function (req, res) {
    res.sendFile( __dirname + "/" + "tog.html" );
})
app.get('/img/groncykel.png', function (req, res) {
    res.sendFile( __dirname + "/" + "img/groncykel.png" );
})
app.get('/img/gulcykel.png', function (req, res) {
    res.sendFile( __dirname + "/" + "img/gulcykel.png" );
})
app.get('/img/rodcykel.png', function (req, res) {
    res.sendFile( __dirname + "/" + "img/rodcykel.png" );
})

app.get('/tog2.html', function (req, res) {
    res.sendFile( __dirname + "/" + "tog2.html" );
})
app.get('/tog3.html', function (req, res) {
    res.sendFile( __dirname + "/" + "tog3.html" );
})
app.get('/frontend.css', function (req, res) {
    res.sendFile( __dirname + "/" + "frontend.css" );
})
app.get('/public/javascripts/TableTools.js', function (req, res) {
    res.sendFile( __dirname + "/" + "public/javascripts/TableTools.js" );
})


// Tjek 0 test bliver udført
app.post('/Resultat0', urlencodedParser, function(req,res){
    var j = 0;
    var k = 0;
    // fejl, der beskriver hvor fejlen er oprettes, samt array test
    var fejl = '';
    var array_test =[0,0,0,0,0,0,0]
    var vogn = req.body.check_vogn;
    // Et loop tjekker om alle cykel holderne har været 1 på et tidspunkt
    for(j = 0; j < db2.getData("/data" + vogn).lognummer + 1; j++){

        if(vogn == db.getData("/data" + j).vogn_id){
            var string_data = db.getData("/data" + j).pladsstring;
            for(k = 9; k < 16; k++){

                if(string_data[k] == '1'){
                    array_test[k-9] = 1;
                }

            }
        }
    }
    // Der laves en string med hvilke vogne der er fejl
    var m = 0;
    for(m = 0; m < 7; m++){
        console.log(m);
        if(array_test[m] == 0){
            console.log("-------------------")
            console.log(fejl);
            var fejltemp = m;
            if(fejl == ''){
                fejl = fejltemp.toString();
            } else{
                fejl = fejl + ',' + fejltemp.toString() ;
            }
        }
    }
    // Der skrives hvor fejlene er.
    res.send("Fejl ved holder " + fejl)

})
app.post('/TjekData', urlencodedParser, function (req, res) {
    logdata4.antal_optagede_pladser = db2.getData("/data" + req.body.check_vogn).antal_optagede_pladser;
    logdata4.pladsstring = db2.getData("/data" + req.body.check_vogn).pladsstring;

    // Det antages, at der mindst er 7 cykelholdere i en given vogn.
    if (db2.getData("/data" + req.body.check_vogn).antal_optagede_pladser === db2.getData("/data" + req.body.check_vogn).pladsstring) {
        res.sendFile( __dirname + "/" + "Roed.html" ); //
    }
    else if (db2.getData("/data" + req.body.check_vogn).antal_optagede_pladser + 1 < db2.getData("/data" + req.body.check_vogn).pladsstring) {

    }

    res.sendFile( __dirname + "/" + "TjekData.html" );
    //res.send(logdata4);
    //if(logdata4.antal_pladser -
    //res.write(logdata4);
    //res.end();
   // res.send(logdata4.antal_optagede_pladser + " " + logdata4.antal_pladser);

})

app.get('/TjekEndestation', function (req, res){
    res.sendFile(__dirname + "/" + "TjekEndestation.html");
})
app.post('/EndestationResultat', urlencodedParser, function (req, res){
    var HolderData = db2.getData("/data" + req.body.check_vogn).pladsstring;
    var fejl = '';
    // Der bliver lavet et loop, der tjekker om alle holderne er tomme.
    for (i = 9; i < 16; i++) {
        if(HolderData[i] == 1) {
            var fejltemp = i-7;
            if(fejl == ''){
                fejl = fejltemp.toString();
            } else{
                fejl = fejl + ',' + fejltemp.toString() ;
            }
            console.log(fejl);
        }
    }
    res.send("Fejl ved holder " +  fejl);
})


console.log(logdata);
var server = app.listen(10000, function () {
    var host = server.address().address
    var port = server.address().port

    console.log("Example app listening at http://%s:%s", host, port)

})


console.log('Server listening on ' + HOST +':'+ PORT);


