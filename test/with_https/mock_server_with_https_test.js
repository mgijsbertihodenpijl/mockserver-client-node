(function () {

    'use strict';

    var mockServer = require('../../');
    var mockServerClient = mockServer.mockServerClient;
    var client;

    exports.mock_server_with_https = {
        'try reset with 127.0.0.0.1:443 (ECONNREFUSED)': function (test) {
            client = mockServerClient("localhost", 443);
            client.reset().then(function () {
                test.ok(false, "The reset should fail because there is no server with https");
                test.done();
            }, function (error) {
                test.equal('Can\'t connect to MockServer running on host: "localhost" and port: "443"', error);
                test.done();
            });
        },
        'try reset with 127.0.0.0.1:1082 (ECONNREFUSED)': function (test) {
            client = mockServerClient("127.0.0.1", 1082);
            client.reset().then(function () {
                test.ok(false, "The reset should fail because there server does not use port 1082");
                test.done();
            }, function (error) {
                test.equal('Can\'t connect to MockServer running on host: "127.0.0.1" and port: "1082"', error);
                test.done();
            });
        },
    };
})();
