/*

Scroll position in html

*/

exports.socket_html = function(date){

      var socket = io.connect();

      socket.on('connection', function() {
         socket.emit('join', 'This is a message from client' );
        });

      date.click(function(){    // $('.date')
             var patt = $(this).attr('id').split('_')[1]
             //alert("patt is " + patt)
             window.location.href = 'text';
             socket.emit('scroll', patt );// noooothinggggggggggggggggg
        })// end click

}
