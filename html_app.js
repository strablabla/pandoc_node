var express = require('express')
var path = require("path");
var open = require('open');
var fs = require('fs');
var nunjucks  = require('nunjucks');
var count = require('./static/js/count_lines');
var util = require('./static/js/util');
var re = require('./static/js/read_emit');
var modify = require('./static/js/modify_html');
const exec = require('child_process').exec;

//-------------- Addresses

// var folder_template = 'article_3' //'bare_jrnl' //'wen'
// var name_template = 'article_3.tex' //'bare_jrnl.tex' //'wen_template.tex'

// var folder_template = 'wen'
// var name_template = 'wen.tex'

var folder_template = 'eisvogel'
var name_template = 'eisvogel.tex'

// var folder_template = 'mich'
// var name_template = 'mich.tex'

//--------------  Server

var app = express()
var server = require('http').createServer(app);

nunjucks.configure('views', {
    autoescape: true,
    express: app,
    watch:true
    // echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
});

app.get('/', function(req, res){ res.render('strap_small.html'); });
app.get('/text', function(req, res){ res.render('text.html'); });

app.get('/pdf', function (req, res) {
    var filePath = path.join(__dirname, 'views', "result_pandoc.pdf");
    console.log("filePath " + filePath)
    fs.readFile(filePath , function (err,data){
        res.contentType("application/pdf");
        res.send(data);
    });
});

//--------------  static addresses

app.use(express.static('public'));
app.use(express.static('scripts'));
app.use(express.static('lib'));

function exec_code(code) {

      /*
      Execute code in the shell console..
      */

      exec(code, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
    });

}

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

function new_pdf(folder_template, name_template, socket){         // create a new pdf with pandoc and template..

      var code = 'cd latex_templates/{}; pandoc -N  --template={}\
                  --variable mainfont="Palatino" --variable sansfont="Helvetica" \
                  --variable monofont="Menlo" --variable fontsize=12pt\
                  --variable version=2.0 ../../views/main.txt  --toc\
                  -o ../../views/result_pandoc.pdf'.format(folder_template, name_template)
      exec_code(code)  // Execute Pandoc code..
      setTimeout(function(){socket.emit('page_return_to_html','')},1000)
}

io.sockets.on('connection', function (socket) {

      console.log('A client is connected!');
      fs.readFile('views/main.txt', 'utf8', function (err,text) {
              if (err) { return console.log(err); }
              re.emit_from_read(socket, count, patt, text, scroll_html_pos)
          }); // end fs.readFile
      util.save_regularly() // save the regularly the text..
      socket.on('join', function(data) { socket.emit('scroll', patt) }); // end socket.on join
      socket.on('template',function(temp){
              console.log(temp)
              folder_template = temp
              name_template = temp + '.tex'
              new_pdf(folder_template, name_template, socket)
              //socket.emit('page_return_to_html','')
      })

      //-------------------------------- From textarea to html

      socket.on('return', function(new_text) {        // change html with textarea
              modify.modify_html_with_newtext(io, fs, util, new_text)
              //var code = 'pandoc -N --template=template.tex --variable mainfont="Palatino" --variable sansfont="Helvetica" --variable monofont="Menlo" --variable fontsize=12pt --variable version=2.0 views/main.txt --pdf-engine=pdflatex --toc -o example14.pdf'
              new_pdf(folder_template, name_template, socket)
        }); // end socket.on return

      socket.on('scroll', function(pattern) { patt = pattern })
      socket.on('scroll_html', function(pos) { scroll_html_pos = pos })

}); // sockets.on connection

var port = 3083
var host = '127.0.0.1'
server.listen(port, host);
var addr = 'http://{}'.format(host) + ':{}/'.format(port) // access through 192.168.0.13..
console.log('Server running at {}'.format(addr));
open(addr,"node-strap");
