const exec = require('child_process').exec;
var fs = require('fs');

exec_code = function (code) {

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

exports.new_pdf = function(folder_template, name_template, socket){         // create a new pdf with pandoc and template..

      fs.readFile('static/comm_pandoc.txt', 'utf8', function (err,text) {
               if (err) { return console.log(err); }
               var code = text.format(folder_template, name_template)
               exec_code(code)  // Execute Pandoc code..

          }); // end fs.readFile

      setTimeout(function(){socket.emit('page_return_to_html','')}, 1000)
}
