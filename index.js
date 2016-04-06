var server          = require("./server");
var router          = require("./router");
var requestHandlers = require("./requestHandler");


var handle = {}
handle["/"]       = requestHandlers.start;
handle["/start"]  = requestHandlers.start;
handle["/upload"] = requestHandlers.upload;
handle["/show"]   = requestHandlers.show;
handle["/displayImage"]   = requestHandlers.displayImage;
handle["/removeAll"]   = requestHandlers.removeAll;


var marklogic = require("marklogic");
var conn = require("./env.js").connection;

var db = marklogic.createDatabaseClient(conn);

db.documents.write({
      uri: '/counter.json',
      contentType: 'application/json',
      collections: ["COUNTER"],
      content: {
        count : '0'   
      }
    } 
).
  result(function(response){
    console.dir(response)

  });

server.start(router.route, handle, db);
