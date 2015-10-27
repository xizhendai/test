'use strict';

/**
 * @ngdoc function
 * @name hem1538App.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the hem1538App
 */
angular.module('main', ['ngRoute'])
  .controller('MainCtrl', 
  ['$scope', 'messagingService', 'AuthenticationService', 'cqsdbProvider',
  function ($scope, messagingService, auth, cqsdb) {
    $scope.message = messagingService.getMsg();
    $scope.loggedIn = function() { return auth.loggedIn(); };
    $scope.roles = cqsdb.Role.mine({}, function() {
      if ($scope.roles.length === 0) {
        $scope.message = 'You do not have permission to access this project.';
      }
    }, function() {
      $scope.message = 'You do not have permission to access this project.';
    });
  }])
  .config(['$routeProvider',
  function($routeProvider){
    $routeProvider.
      when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      }).
      otherwise({
        redirectTo: '/'
      });
  }]);
