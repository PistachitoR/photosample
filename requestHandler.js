var querystring = require("querystring"),
    fs = require("fs"),
    formidable = require("formidable");
    
var multiparty = require("multiparty");
   var marklogic = require("marklogic");
   var conn = require("./env.js").connection;
   var db = marklogic.createDatabaseClient(conn);
   var qb = marklogic.queryBuilder;
   var pb = marklogic.patchBuilder;

function start(response) {
    console.log("Request handler 'start' was called.");

    response.writeHead(202, { "Content-Type": "text/html" });
    fs.readFile( __dirname + "/" + "homePage.html", 'utf8', function (err, data){
        response.write(data);
    });
}
function upload(response, request) {
    console.log("Request handler 'upload' was called.");
     var form = new formidable.IncomingForm();
    form.uploadDir = 'tmp';
    console.log("about to parse");
    form.parse(request, function(error, fields, files) {
        storeImage(fields, files.upload.path);
        
        response.writeHead(200, { "Content-Type": "text/html" });
        response.write("received image:<br/>");
        response.end();
    });
}

function storeImage(fields, filepath){
  db.documents.read("/counter.json")
    .result(function(results) {
        console.log("COUNTER" + results[0]);
        writeImage(filepath, results[0].content.count);
        var photo = [];
        photo.push({
           "Title" : fields.fTitle,
           "Description" : fields.fDescription,
           "Path" : "./photos/" + parseInt(results[0].content.count)
            });
        db.documents.write(
            photo.map(function(item) {
                return {
                    uri: item.Path,
                    contentType: "application/json",
                    collections: ["PHOTOS"],
                    content: item
                }
            })
        ).
            result();
    });
}

function removeAll(){
    db.documents.removeAll({collection: "PHOTOS"})
    .result()
    .then(function(response){
        console.log("Removed Collection" + response.collection);
    })
    .catch(function(error){
        console.log(error)
    });
}

function writeImage(filepath, count){
   console.log("PATH:::::" + filepath);
    fs.readFile(filepath, function(err, data) {
            var newPath = "./photos/" + count + ".jpg";
            fs.writeFile(newPath, data, function(err) {
                return true;
            });
    });
    updateCounter();
}

function updateCounter(){
    db.documents.read("/counter.json")
    .result()
    .then(function(response){
            console.log("counter : " + response);
        var currentCounter = response[0].content.count;
        return db.documents.patch("/counter.json",
            pb.replace('count', parseInt(currentCounter+1))
            ).result();
    })
}

function show(response) {
    console.log("Request handler 'show' was called.");
    db.documents.query(
        qb.where(
            qb.collection('PHOTOS')
)
    ).
        result(function(documents) {
            documents.forEach(function(document) {
                console.log("Path: " + document.content.Path);
                console.log("Title: " + document.content.Title);
                console.log("Description: " + document.content.Description);
            })
        }, function(error) {
            console.dir(error);
        });
}

function displayImage(response, request) {
    
    console.log("Request handler 'display' was called.");
    var form = new formidable.IncomingForm();
    form.uploadDir = 'tmp';
    form.parse(request, function(error, fields, files) {

        console.log("Code: " + "./photos/" + fields.codigo + ".jpg");
        db.documents.query(
            qb.where(
                qb.byExample({
                    Title: fields.codigo
                })
            )
        ).result(function(documents) {
            console.log("holaholaholaholaholaholaholaholaholaholahola");
            if (documents!=undefined) {
                console.log("holaholaholaholaholaholaholaholaholaholahola");
                documents.forEach(function(document) {
                    if (document != undefined) {
                                        console.log("holaholaholaholaholaholaholaholaholaholahola");
                        console.log(document);
                        console.log("PATH: " + document.content);
                        fs.readFile(document.content.Path + ".jpg", "binary", function(error, file) {
                            if (error) {
                                response.writeHead(500, { "Content-Type": "text/plain" });
                                response.write(error + "\n");
                                response.end();
                            } else {
                                console.log("imagen encontrada");
                                response.writeHead(200, { "Content-Type": "image/jpg" });
                                response.write(file, "binary");
                                response.end();
                            }
                        });
                    }
                })
            }else{
                console.log("Code: " + "./photos/************");
                response.writeHead(202, { "Content-Type": "text/html" });
                fs.readFile(__dirname + "/theme/" + "404.html", 'utf8', function(err, data) {
                    response.write(data);
                });    
            }
        }, function(error) {
            console.log("Code: " + "./photos/************");
            console.log(document);
            response.writeHead(202, { "Content-Type": "text/html" });
            fs.readFile(__dirname + "/theme/" + "404.html", 'utf8', function(err, data) {
                response.write(data);
            });
        });
/*.stream()
            .on("data", function(document) {
                console.log("hola");
                console.log(document);
                    console.log("PATH: " + document.content);
                    fs.readFile(document.content.Path + ".jpg", "binary", function(error, file) {
                        if (error) {
                            response.writeHead(500, { "Content-Type": "text/plain" });
                            response.write(error + "\n");
                            response.end();
                        } else {
                            console.log("imagen encontrada");
                            response.writeHead(200, { "Content-Type": "image/jpg" });
                            response.write(file, "binary");
                            response.end();
                        }
                    });
            })
            .on("error", function(error) {
                console.log("Code: " + "./photos/************");
                console.log(document);
                response.writeHead(202, { "Content-Type": "text/html" });
                fs.readFile(__dirname + "/theme/" + "404.html", 'utf8', function(err, data) {
                    response.write(data);
                });
            });*/
    });
}

exports.displayImage = displayImage;
exports.start = start;
exports.upload = upload;
exports.show = show;
exports.removeAll = removeAll;