describe("Kinesis", function(){
   

    if(
        (!process.env.AWS_ACCESS_KEY && !process.env.AWS_ACCESS_KEY_ID) ||
        (!process.env.AWS_SECRET_KEY && !process.env.AWS_SECRET_ACCESS_KEY)
    ) {
        return;
    }

    var 
        kaster = require("../lib"),
        should = require("should"),
        TOPIC_NAME = "testing";

    it("should list all topics", function(done){
        kaster.listTopics({
            region: "us-east-1"
        }, function(err, data){
            if(err) throw err;
            return done();
        });
    });

    it("should send and recieve a message from kinesis", function(done){
        this.timeout(10000);

        var message = {
            text: "Hello world",
            id: require("node-uuid").v4()
        };


        var messageHandler = kaster.createMessageHandler(function(err, _message, header, raw){
            if(err) console.log("mhandler error:", err.stack || err);
            console.log("Message:", _message);
            if(!message) return;
            if(_message && message.id == _message.id) return done();
            
        });

        
        kaster.send({
            name: "Message", 
            namespace: "Kaster.Test",
            topic: TOPIC_NAME,
            region: "us-east-1"
        }, message, function(err, resp){
            if(err) throw err;
            var shard = {};
            shard[resp.ShardId] = {lastSequenceNumber: resp.SequenceNumber};

            var consumer = kaster.createConsumer({
                topic: TOPIC_NAME,
                region: "us-east-1",
                oldest: true,
                shardIds: shard
            });

            consumer.on("data", messageHandler);
            consumer.on("error", function(err){

                console.log("consumer error:", err);
            });

            kaster.send({
                name: "Message", 
                namespace: "Kaster.Test",
                topic: TOPIC_NAME
            }, message, function(err, resp){
                if(err) throw err;
            });

        }); 
    });

    it("should respond with an error if a topic does not exist", function(done){
        this.timeout(10000);

        var message = {
            text: "Hello world",
            id: require("node-uuid").v4()
        };

        kaster.send({
            name: "Message", 
            namespace: "Kaster.Test",
            topic: "testing-2"
        }, message, function(err, resp){
            should.exist(err);
            return done();
        });   
    });

});