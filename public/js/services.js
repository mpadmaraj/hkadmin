'use strict';

angular.module('myApp.services',[])
    .factory('hkSocket', function (socketFactory) {
        var socket = socketFactory();
        socket.forward('broadcast');
        return socket;
    })
    .factory('recordService', function () {
        var machine = {};
        return machine;
    });
