var 
    kaster = require("../lib");
    

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
