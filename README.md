**Note:** This is a work in progress

[![Build Status](https://travis-ci.org/clippPR/kaster.png)](https://travis-ci.org/clippPR/kaster)

Produce and consume data from [Amazon Kinesis](http://docs.aws.amazon.com/kinesis/latest/APIReference/API_Operations.html) with Avro serialization.


##Consuming

```javascript

var 
    kaster = require("kaster");

//Expects process.env.AWS_ACCESS_KEY and AWS_SECRET_KEY to be set
var consumer = kaster.createConsumer({
    topic: "testing",
    region: "us-east-1",
    oldest: false,
    // shardIds: shard
});

var currentShards;

var messageHandler = kaster.createMessageHandler(function(err, _message, header){
    if(err) console.log("mhandler error:", err.stack || err);
    console.log(header.meta["avro.schema"].name + ":", message);
    /* Do something with your json message */

    /* 
        Save this to pass to a new consumer as the shardIds 
        parameter. This is useful for picking up where you left off
        when the process crashed.
    */
    currentShards = consumer.shardIds;
});

consumer.on("data", messageHandler);

consumer.on('error', function (err) {
    console.log("Error:", err);
});


```

##Producing

```javascript

var 
    kaster = require("kaster");

var message = {
    text: "Hello world",
    id: 123
};

//Expects process.env.AWS_ACCESS_KEY and AWS_SECRET_KEY to be set
kaster.send({
    name: "Message", 
    namespace: "Kaster.Test",
    topic: "testing"
}, message, function(err, resp){
    if(err) throw err;
        
    var shard = {};
    shard[resp.ShardId] = {lastSequenceNumber: resp.SequenceNumber};
    console.log("shard:", shard);
});


```

##TODO

* Send just Avro data to kafka instead of the json kafka-node sends
* Finish writing tests