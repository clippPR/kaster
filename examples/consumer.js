var 
    kaster = require("../lib");

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
    console.log(header.meta["avro.schema"].name + ":", _message);
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
    console.log("Error:", err.stack || err);
});


