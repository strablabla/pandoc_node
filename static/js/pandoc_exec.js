const exec = require('child_process').exec;

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

      var code = 'cd latex_templates/{}; pandoc -N  --template={}\
                  --variable mainfont="Palatino" --variable sansfont="Helvetica" \
                  --variable monofont="Menlo" --variable fontsize=12pt\
                  --variable version=2.0 ../../views/main.txt  --toc\
                  --data-dir=../../figure \
                  -o ../../views/result_pandoc.pdf'.format(folder_template, name_template)
      exec_code(code)  // Execute Pandoc code..
      setTimeout(function(){socket.emit('page_return_to_html','')},1000)
}
