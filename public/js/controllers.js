'use strict';

/* Controllers */

angular.module('myApp.controllers', []).
  controller('AppCtrl', function ($scope, $http) {

  }).
  controller('MainCtrl', function ($log, $scope, hkSocket,$http,$location,recordService) {
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

        $scope.movetoRecordScreen=function(machineName,status,$log){
            if(status=="Up"){
                recordService.machinename=machineName;
                $location.path("record");
            }else{
                alert("The machine is down.");
            }

        }

  }).
controller('RecordCtrl', function ($scope,$location,$http,recordService,hkSocket,$log) {
        $scope.hide=true;
        $scope.disable=false;
        $scope.measure={};
        $scope.$on('socket:broadcast', function(event, data) {
            $log.debug( data);
            $scope.data=data.payload;
            if($scope.data.machine==$scope.machineName){
                $scope.hide=true;
                $scope.measure.pulse=$scope.data.pulse;
                $scope.measure.systolic=$scope.data.systolic;
                $scope.measure.diastolic=$scope.data.diastolic;
                $scope.measure.spo2=$scope.data.spo2;
                $scope.disable=false;
            }

        });
        $scope.goBack=function(){
            $location.path("/");
        };
        $scope.machineName= recordService.machinename;
        $scope.startRecording=function(){
            $http({
                method: 'GET',
                url: '/startRecording',
                params:{machinename:recordService.machinename}
            }).
                success(function (data, status, headers, config) {
                    // $scope.name = data.name;
                    $log.debug( data);
                    $scope.rasps=data.rasps;
                }).
                error(function (data, status, headers, config) {
                    // $scope.name = 'Error!';
                });
            $scope.hide=false;
            $scope.disable=true;
            $(".progress-bar").animate({
                width: "90%"
            }, 2000,'linear');
        }

});
