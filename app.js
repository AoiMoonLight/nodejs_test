var http = require ('http');
var io = require('socket.io').listen(app);
http.createServer (function (request, response) {
  response.writeHead (200,{'Content-Type': 'text/html'});
  response.end('<h1>Welcome to node.js</h1>');

}).listen (52222, function() {
  console.log('Listening on 127.0.0.1:52222');
});

io.on('connection', (socket) => {
  socket.on('disconnect', () => {
    console.log('disconnected');
  });
});
