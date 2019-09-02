/*
 * mockserver
 * http://mock-server.com
 *
 * Copyright (c) 2014 James Bloom
 * Licensed under the Apache License, Version 2.0
 */
(function () {
        "use strict";

        if (module && require) {
            var Q = require('q');
            var http = require('http');
            var request = require('request');

            var defer = function () {
                var promise = (global.protractor && protractor.promise.USE_PROMISE_MANAGER !== false)
                    ? protractor.promise
                    : Q;
                var deferred = promise.defer();

                if (deferred.fulfill && !deferred.resolve) {
                    deferred.resolve = deferred.fulfill;
                }
                return deferred;
            };

            var processResponse = function (body, response, resolveCallback) {
                var deferred = defer();
                if (resolveCallback) {
                    deferred.resolve(resolveCallback(body));
                } else {
                    if (response.statusCode >= 400 && response.statusCode < 600) {
                        if (response.statusCode === 404) {
                            deferred.reject("404 Not Found");
                        } else {
                            deferred.reject(body);
                        }
                    } else {
                        deferred.resolve({
                            statusCode: response.statusCode,
                            body      : body
                        });
                    }
                }
                return deferred.promise;
            };

            var processError = function (error, host, port) {
                var deferred = defer();
                if (error.code && error.code === "ECONNREFUSED") {
                    deferred.reject("Can't connect to MockServer running on host: \"" + host + "\" and port: \"" + port + "\"");
                } else {
                    deferred.reject(JSON.stringify(error));
                }
                return deferred.promise;
            };

            var processHttpsRequest = function (body, options, resolveCallback) {
                var deferred = defer();
                options.url = 'https://' + options.host + options.path;
                options.body = body;
                request(options, function (error, response, body) {
                    if (error) {
                        deferred.resolve(processError(error, options.host, options.port));
                    } else {
                        deferred.resolve(processResponse(body, response, resolveCallback));
                    }
                });
                return deferred.promise;
            };

            var processRequest = function (body, options, resolveCallback) {
                var deferred = defer();
                var req = http.request(options);

                req.once('response', function (response) {
                    var data = '';

                    response.on('data', function (chunk) {
                        data += chunk;
                    });

                    response.on('end', function () {
                        deferred.resolve(processResponse(data, response, resolveCallback));
                    });
                });

                req.once('error', function (error) {
                    deferred.resolve(processError(error, options.host, options.port));
                });

                req.write(body);
                req.end();

                return deferred.promise;

            };

            var sendRequest = function (host, port, path, jsonBody, resolveCallback) {

                var body = (typeof jsonBody === "string" ? jsonBody : JSON.stringify(jsonBody || ""));
                var options = {
                    method : 'PUT',
                    host   : host,
                    path   : path,
                    port   : port,
                    headers: {
                        'Content-Type': "application/json; charset=utf-8"
                    }
                };

                if (resolveCallback != null) {
                    console.log(resolveCallback.toString());
                }

                // If the port number is 443 we send the request with https
                if (port === 443 || port === 8443) {
                    return processHttpsRequest(body, options, resolveCallback);
                }
                return processRequest(body, options, resolveCallback);
            };

            module.exports = {
                sendRequest: sendRequest
            };
        }
    }
)();
