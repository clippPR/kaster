var Kafka = function(){
    
    var 
        _schemas,
        Avro = new require("./avro")(),
        kafka = require("kafka-node"),
        Producer = kafka.Producer,
        Consumer = kafka.Consumer,
        _producer,
        _client,
        topics,
        payloads = [],
        payloadIntveralObj,
        payloadInterval = 1000,
        payloadIntervalMax = 60000,
        payloadIntervalMin = 1,
        immediate = true,
        defaultTopic,
        namespace,
        _defaultConsumerSettings = {
            groupId: 'kafka-node-group',//consumer group id, deafult `kafka-node-group`
            // Auto commit config 
            autoCommit: true,
            autoCommitIntervalMs: 5000,
            // The max wait time is the maximum amount of time in milliseconds to block waiting if insufficient data is available at the time the request is issued, default 100ms
            fetchMaxWaitMs: 100,
            // This is the minimum number of bytes of messages that must be available to give a response, default 1 byte
            fetchMinBytes: 1,
            // The maximum bytes to include in the message set for this partition. This helps bound the size of the response.
            fetchMaxBytes: 1024 * 10, 
            // If set true, consumer will fetch message from the given offset in the payloads 
            fromOffset: true
        }

    /* 
        TODO: Send just Avro data to kafka instead of what kafka node sends (extra json)
    */

    var _createProducer = function(opts){

        payloadIntervalMin = opts.payloadIntervalMin || payloadIntervalMin;
        payloadIntervalMax = opts.payloadIntervalMax || payloadIntervalMax;

        payloadInterval = payloadIntervalMin;

        namespace = opts.namespace || "data-stream";

        immediate = opts.immediate || immediate;
        defaultTopic = opts.defaultTopic;

        _client = new kafka.Client(opts.clientHost || "localhost:2181");
        _producer = new Producer(_client);

        _producer.on("ready", function(){
            if(!immediate) _scheduleSends();    
        });

        return _producer;
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

    var _createConsumer = function(opts){
        
        if(opts.clientHost) {
            opts.client = new kafka.Client(opts.clientHost || "localhost:2181");
        }
        opts.client = opts.client || _client;

        if(!opts.topics) throw new Error("Send some topics to consume (Ex: {topics:['meow']}).");

        opts.settings = opts.settings || _defaultConsumerSettings;

        return new Consumer(
            opts.client,
            opts.topics,
            opts.settings
        );
    };

    var _decodeMessage = Avro.decode;

    var _createMessageHandler = function(done){
        return function(message){
            _decodeMessage(message.value, function(err, dmsg, header){
                return done(err, dmsg, header);
            });
        }
    };

    return {
        init: _init,
        createTopics: _createTopics,
        sendNewTopic: _sendNewTopic,
        send: _send,
        decodeMessage: _decodeMessage,
        createConsumer: _createConsumer,
        createMessageHandler: _createMessageHandler,
        createProducer: _createProducer
    };
}();

module.exports = Kafka;