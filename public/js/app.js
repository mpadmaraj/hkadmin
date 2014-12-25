'use strict';

// Declare app level module which depends on filters, and services

angular.module('myApp', ['ngRoute',
  'myApp.controllers',
  'myApp.filters',
  'myApp.services',
  'myApp.directives',
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'btford.socket-io'
]).
config(function ($routeProvider, $locationProvider) {
  //    $locationProvider.hashPrefix("#");
  $routeProvider.
    when('/', {
        templateUrl: 'partials/main',
        controller: 'MainCtrl'
      }).
      when('/record', {
        templateUrl: 'partials/record',
        controller: 'RecordCtrl'
      }).
    otherwise({
      redirectTo: '/'
    });

  //$locationProvider.html5Mode(true);
});
