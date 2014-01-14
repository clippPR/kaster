describe("Avro", function(){
    var Avro = new require("../lib/avro")();

    it("should auto-generate a schema", function(done){

        var json = {
            "host": "testhostA",
            "time": "1970-01-01T00:00Z",
            "elapsedTime": 123456789, 
            "request": {
                "headers": {
                    "user-agent": "firefox",
                    "remote-ip": "0.0.0.0"
                },
                "method": "GET",
                "path": "/basepath/object",
                "queryString": {
                    "string": "param1=test1&param2=test2"
                },
                "body": {}
            },
            "exception": {
                "e.d.c.b.a.AppException": {
                    "class": "org.apache.avro",
                    "message": "An error occurred",
                    "stackTrace": {
                        "string": "failed at line 1"
                    }
                }
            }
        };

        var schema = Avro.generateSchema({
            name: "Exception",
            type: "record",
            namespace: "Loggging.Exceptions"
        }, json);

        Avro.encode(schema, json, function(err, data){
            // console.log("encoded:", err || data);

            return done();

        });
    });

    it("should base64 encode and decode an Avro object", function(done){

        var json = {
            "host": "testhostA",
            "time": "1970-01-01T00:00Z",
            "elapsedTime": 123456789, 
            "request": {
                "headers": {
                    "user-agent": "firefox",
                    "remote-ip": "0.0.0.0"
                },
                "method": "GET",
                "path": "/basepath/object",
                "queryString": {
                    "string": "param1=test1&param2=test2"
                },
                "body": {}
            },
            "exception": {
                "e.d.c.b.a.AppException": {
                    "class": "org.apache.avro",
                    "message": "An error occurred",
                    "stackTrace": {
                        "string": "failed at line 1"
                    }
                }
            }
        };

        var schema = Avro.generateSchema({
            name: "Exception",
            type: "record",
            namespace: "Loggging.Exceptions"
        }, json);

        Avro.encode(schema, json, function(err, data){
            // console.log("encoded:", err || data);

            Avro.decode(data, function(err, data){
                // console.log("decoded", data);

                return done();
             });

        });

    });
});