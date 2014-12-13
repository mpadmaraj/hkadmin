'use strict';

/* Controllers */

angular.module('myApp.controllers', []).
  controller('AppCtrl', function ($scope, $http) {

  }).
  controller('MainCtrl', function ($log, $scope, hkSocket,$http) {
      $http({
        method: 'GET',
        url: '/machines'
      }).
          success(function (data, status, headers, config) {
            // $scope.name = data.name;
            $log.debug( data);
            $scope.rasps=data.rasps;
          }).
          error(function (data, status, headers, config) {
            // $scope.name = 'Error!';
          });
      $scope.$on('socket:broadcast', function(event, data) {
        $log.debug( data);
        $scope.rasps=data.payload;

      });

  });
