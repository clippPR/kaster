**Note:** This is a work in progress

Produce and consume data from Kafka with Avro serialization.


##Consuming

```javascript

var 
    kaster = require("kaster");

var consumer = kaster.createConsumer({
    clientHost: "localhost:2181",
    topics: [
        {topic: "kaster-test", partition: 0, offset: 0}, 
    ],
    settings: {
        groupId: 'kafka-node-group', //consumer group id, deafult `kafka-node-group`
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
});

var messageHandler = kaster.createMessageHandler(function(err, message, header){
    if(err) console.log("mhandler error:", err.stack || err);

    console.log("Message:", message);
    /* Do something with your json message */
});

consumer.on("message", messageHandler);


consumer.on('error', function (err) {
    console.log("Error:", err);
});

consumer.on('offsetOutOfRange', function (err) {
    console.log("offsetOutOfRange Error:", err);
});


```

###Producing

```javascript

var 
    kaster = require("kaster");
    

var producer = kaster.createProducer({
    namespace: "Kaster.Test",
    clientHost: "localhost:2181",
    immediate: true
});

var message = {
    text: "Hello world",
    id: 123
};

producer.on("ready", function(){
    
    //Create a topic to send data on
    producer.createTopics(['kaster-test'], function (err, data) {
        
        kaster.send({ //Send with Avro serialization
            topic: "kaster-test",
            name: "Message",
            parition: 0
        }, message, function(err, data){

            if(err) {
                console.log("Kaster Send Error:", err.stack || err);
                console.log(message);
            }

            //Do something with data...

        });


        //Optionally you can send directly to kafka without Avro serialization via...
        var payload = {
            topic: "kaster-test-noavro",
            name: "Message",
            parition: 0,
            messages: message.toString() //must be a string or array of strings
        };
        
        producer.send([payload], function(err, data){

            if(err) {
                console.log("Kafka Send Error:", err.stack || err);
                console.log(data);
            }

            //Do something with data...
        });

    });

});

```

##TODO

* Send just Avro data to kafka instead of the json kafka-node sends
* Finish writing tests