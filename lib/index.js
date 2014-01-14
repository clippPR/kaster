var Kafka = function(){
    
    var 
        _schemas,
        Avro,
        kafka = require("kafka-node"),
        Producer = kafka.Producer,
        _producer,
        topics,
        payloads = [],
        payloadIntveralObj,
        payloadInterval = 1000,
        payloadIntervalMax = 60000,
        payloadIntervalMin = 1,
        immediate = true,
        defaultTopic,
        namespace;

    /* 
        TODO: Send just Avro data to kafka instead of what kafka node sends (extra json)
    */

    var _init = function(opts){

        Avro = new require("./avro")();

        payloadIntervalMin = opts.payloadIntervalMin || payloadIntervalMin;
        payloadIntervalMax = opts.payloadIntervalMax || payloadIntervalMax;

        payloadInterval = payloadIntervalMin;

        namespace = opts.namespace || "data-stream";

        immediate = opts.immediate || immediate;
        defaultTopic = opts.defaultTopic;

        client = new kafka.Client(opts.clientHost || "localhost:2181");
        _producer = new Producer(client);

        if(!immediate) _scheduleSends();
    };

    var _sendNewTopic = function(opts, json, done) {
        _producer.createTopics([opts.topic], function (err, data) {
            if(err) return done(err);
            _send(opts, json, done);
        });
    };
    
    var _createTopics = function(){
        _producer.createTopics.call(this.arguments);
    };

    var _send = function(opts, json, done) {
        
        opts.namespace = opts.namespace || namespace;

        var schema = Avro.generateSchema(opts, json);
        Avro.encode(schema, json, function(err, data){
            if(err) return done(err);

            payloads.push(
                { 
                    topic: opts.topic, 
                    messages: data, 
                    partition: opts.partition 
                }
            );   

            if(payloadInterval > payloadIntervalMin) payloadInterval -= 10;

            if(!immediate) _scheduleSends();
            else _sendPayloads(done);
        });
    };

    var _sendPayloads = function(done){
        if(payloads.length <= 0) {
            if(payloadInterval < payloadIntervalMax) payloadInterval += 10;
            if(!immediate) _scheduleSends();
            return;
        }

        _producer.send(payloads, function(err, data){
            if(err) {
                console.log("%j", err);
                if(done) return done(err);
                return;
            };
            payloads = [];
            if(done) done(err, data);
        });
    };

    var _scheduleSends = function(){
        if(payloadInterval < 0) payloadInterval = Math.max(payloadIntervalMin, 1);
        clearInterval(payloadIntveralObj);
        payloadIntveralObj = setInterval(_sendPayloads, payloadInterval);
    };

    return {
        init: _init,
        createTopics: _createTopics,
        sendNewTopic: _sendNewTopic,
        send: _send
    };
}();

module.exports = Kafka;