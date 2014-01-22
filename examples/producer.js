var 
    kaster = require("../lib");

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

