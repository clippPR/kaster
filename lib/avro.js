var AvroSimple = function(opts){

    var 
        Avro = require("node-avro-io"),
        es = require("event-stream"),
        AvroSchema = Avro.Schema,
        IO = Avro.IO;
        DataFile = Avro.DataFile,
        _schemas = {};

    var _encodeDatum = function(schemaName, json) {
       
        var schema = _schemas[schemaName].avro;
        var block = DataFile.Block();
        var writer = IO.DatumWriter(schema);
        var encoder = IO.BinaryEncoder(block);
        
        try {
            writer.write(json, encoder);    
        } catch(e){
            console.log("Fail to write:", e);
            return null;
        }
        
        var value = block.toBuffer().toString("base64");

        return value;
    };

    var _generateSchema = function(opts, json){
        var s = {
            name: opts.name,
            namespace: opts.namespace,
            type: opts.type || "record"
        };

        if(!s.name) throw new Error("A schema name is required");
        if(!s.namespace) throw new Error("A schema namespace is required");

        if(typeof json == "object") s.fields = [];

        _generateSchemaForField(s.fields, json);

        return s;
    };

    var _generateSchemaForField = function(schema, json){
        var avroType, sub;

        for(var j in json) {

            if(json[j] === null || typeof json[j] === "undefined") {
                delete json[j];
                continue;
            }
            avroType = _mapJSONTypeToAvro(json[j]);

            if(avroType == "object") {
                sub = {
                    name: j, 
                    fields: [], 
                    type: "record"
                };
                _generateSchemaForField(sub.fields, json[j]);
                schema.push(sub);
                continue;
            }

            schema.push({
                name: j,
                type: avroType
            });
        }
    };

    var _mapJSONTypeToAvro = function(obj){
        var type = typeof obj;

        if(obj.getMonth) return ["double", "null"];

        switch(type) {
            case "number": 
                return ["double", "null"];
            break;
            case "string": 
                return ["string", "null"]
            break;
            case "object": 
                return "object";
            break;
            case "undefined": 
                return null
            break;
        }
    };

    var _fillNulls = function(schema, json){
        if(!json) throw new Erorr("Invalid JSON at %s", schema.name);

        for(var i in schema.fields) {
            if(typeof json[schema.fields[i].name] === "undefined") json[schema.fields[i].name] = null;            
            if(schema.fields[i].fields) _fillNulls(schema.fields[i], json[schema.fields[i].name]);
        }
    };

    var _convertDates = function(json) {
        for(var j in json) {

            if(json[j] instanceof Date) json[j] = json[j].getTime();
            if(typeof json[j] === "object") _convertDates(json[j]);
        }
    }

    var _encode = function(schema, json, done){
        try {

            // var schema = _generateSchema(schema, json); ///_schemas[schemaName].json;

            _fillNulls(schema, json);
            _convertDates(json);

            var writer = DataFile.Writer(schema, "deflate");
            var datas = [];

            var collector = es.map(function(data, cb){
                datas.push(data)
                cb(null, data);
            }).on("end", function(err){
                return done(err, Buffer.concat(datas).toString("base64"));
            });

            writer
                .pipe(collector);
            writer.write(json);
            writer.end();

        } catch (e){
            return done(e);
        }
    };

    var _decode = function(message, done){

        var 
            reader = DataFile.Reader(),
            decodedMessage,
            messageHeader;
        
        es.readable(function (count, callback) {
            this.emit('data', new Buffer(message, "base64"));
            this.emit("end");
            callback();
        })
        .pipe(reader)
        .on("error", function(err){
            console.log("Read error:", err);
        })
        .on("data", function(data){
            decodedMessage = data;
        })
        .on("header", function(header){
            messageHeader = header;
        })
        .on('end', function(err) {
            return done(err, decodedMessage, messageHeader);
        });
    };

    return {
        encode: _encode,
        decode: _decode,
        generateSchema: _generateSchema
    };
};

module.exports = AvroSimple;