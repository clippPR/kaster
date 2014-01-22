describe("Kinesis", function(){

    var kinesisSever = "localhost:4567";

    before(function(done){
        var kinesalite = require('kinesalite'),
        kinesaliteServer = kinesalite({path: './mydb', createStreamMs: 50})

        // Listen on port 4567
        kinesaliteServer.listen(4567, function(err) {
            if (err) throw err
            console.log('Kinesalite started on port 4567')
            return done();
        });
    });


    it("should send a message to kinesis", function(){
        
    });

});