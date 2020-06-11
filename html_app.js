const https = require('https')
var express = require('express')
var path = require("path");
var open = require('open');
var fs = require('fs');
var nunjucks  = require('nunjucks');

//----------

var count = require('./static/js/count_lines');
var util = require('./static/js/util');
var re = require('./static/js/read_emit');
var init = require('./static/js/init');
var modify = require('./static/js/modify_html');
var pan = require('./static/js/pandoc_exec');

//-------------- Addresses

// var folder_template = 'eisvogel'
// var name_template = 'eisvogel.tex'
var folder_template = 'asme2ej'
var name_template = 'asme2ej.tex'

//--------------  Server

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('server.crt')
};

var app = express()
var server =  https.createServer(options, app)
//var server = http.createServer(app);

nunjucks.configure('views', {
    autoescape: true,
    express: app,
    watch:true
    // echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
});

app.get('/', function(req, res){ res.render('strap_small.html'); });
app.get('/text', function(req, res){ res.render('text.html'); });
app.get('/html', function(req, res){ res.render('part_html.html'); });

app.get('/pdf', function (req, res) {
    var filePath = path.join(__dirname, 'views', "result_pandoc.pdf");
    console.log("filePath " + filePath)
    fs.readFile(filePath , function (err,data){
        res.contentType("application/pdf");
        res.send(data);
    });
});

//--------------  static addresses

init.static_addr(app,express)

//--------------  websocket

// Loading socket.io
var io = require('socket.io')(server);

var patt = '' // pattern for scroll position
var scroll_html_pos = 0 //
var comment = false;

String.prototype.format = function () {
    var i = 0, args = arguments;
    return this.replace(/{}/g, function () {
          return typeof args[i] != 'undefined' ? args[i++] : '';
    });
};

io.sockets.on('connection', function (socket) {

      console.log('A client is connected!');
      fs.readFile('views/main.txt', 'utf8', function (err,text) {
              if (err) { return console.log(err); }
              re.emit_from_read(socket, count, patt, text, scroll_html_pos)
          }); // end fs.readFile
      util.save_regularly() // save the regularly the text..
      socket.on('join', function(data) { socket.emit('scroll', patt) }); // end socket.on join
      socket.on('template', function(temp){
              console.log(temp)
              folder_template = temp
              name_template = temp + '.tex'
              pan.new_pdf(folder_template, name_template, socket)
              //socket.emit('page_return_to_html','')
      })

      //-------------------------------- From textarea to html

      socket.on('return', function(new_text) {        // change html with textarea
              modify.modify_html_with_newtext(io, fs, util, new_text)
              //var code = 'pandoc -N --template=template.tex --variable mainfont="Palatino" --variable sansfont="Helvetica" --variable monofont="Menlo" --variable fontsize=12pt --variable version=2.0 views/main.txt --pdf-engine=pdflatex --toc -o example14.pdf'
              pan.new_pdf(folder_template, name_template, socket)
        }); // end socket.on return

      socket.on('scroll', function(pattern) { patt = pattern })
      socket.on('scroll_html', function(pos) { scroll_html_pos = pos })

}); // sockets.on connection


var port = 3083
var host = '0.0.0.0' // 127.0.0.1
server.listen(port, host);
var addr = 'https://{}'.format(host) + ':{}/'.format(port) // access through 192.168.0.13..
console.log('Server running at {}'.format(addr));
open(addr,"node-pandoc");
