var Kafka = function(){
    
    var 
        Avro = new require("./avro")(),
        kinesis = require("kinesis"),
        Readable = require('stream').Readable,
        Writable = require('stream').Writable,
        _producer,
        _namespace;

    /* 
        TODO: Send just Avro data to kafka instead of what kafka node sends (extra json)
    */

    var _createProducer = function(opts){

        _namespace = opts.namespace || "data-stream";
        _producer = kinesis.stream({
            name: opts.topic,
            region: opts.region,
            resolvePartitionKey: opts.resolvePartitionKey
        });

        return _producer;
    };

    var _send = function(opts, json, done) {
        
        opts.namespace = opts.namespace || _namespace;

        var schema = Avro.generateSchema(opts, json);
        Avro.encode(schema, json, function(err, data){
            if(err) return done(err);
            _sendToKinesis(opts, data, done);
        });
    };


    var _sendToKinesis = function(opts, data, done){
        try {
            kinesis.request("PutRecord",{
                Data: data,
                PartitionKey: opts.partition || opts.name || "1",
                StreamName: opts.topic
            }, opts, done);
        } catch(err) {
            if(err) console.log(err);
            return done(err);
        } 
    };

    var _listTopics = function(opts, done){
        return kinesis.listStreams(opts, done);
    };

    var _createConsumer = function(opts){
        
        if(!opts.topic) throw new Error("Send a topic to consume (Ex: {topic:'meow'}).");

        return kinesis.stream({
            name: opts.topic,
            region: opts.region,
            shardIds: opts.shardIds,
            oldest: opts.oldest
        });
    };

    var _decodeMessage = Avro.decode;

    var _createMessageHandler = function(done){

        return function(message){
            if(!message) return process.nextTick(done);
            try {
                _decodeMessage(message.Data, function(err, dmsg, header){
                    return done(err, dmsg, header, message);
                });
            } catch(er) {
                return done(er);
            }
        };
    };

    var _createTopic = function(opts, done){
        if(!opts.topic) return done(new Error("Topic required to create a stream."));
        try {
            kinesis.request("CreateStream",{
                StreamName: opts.topic,
                ShardCount: opts.shards || 1
            }, opts, done);
        } catch(err) {
            if(err) console.log(err);
            return done(err);
        } 
    };

    var _deleteTopic = function(opts, done) {
        if(!opts.topic) return done(new Error("Topic required to delete a stream."));
        try {
            kinesis.request("DeleteStream",{
                StreamName: opts.topic,
            }, opts, done);
        } catch(err) {
            if(err) console.log(err);
            return done(err);
        } 
    };

    return {
        createTopic: _createTopic,
        deleteTopic: _deleteTopic,
        listTopics: _listTopics,
        send: _send,
        decodeMessage: _decodeMessage,
        createConsumer: _createConsumer,
        createMessageHandler: _createMessageHandler,
        createProducer: _createProducer
    };
}();

module.exports = Kafka;