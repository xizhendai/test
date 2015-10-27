'use strict';

angular.module('navigation', [])

.controller('NavCtrl', ['$scope', 'AuthenticationService',
  function($scope, auth) {

    $scope.loggedIn = function() { return auth.loggedIn(); };
    $scope.admin = function() { return auth.admin(); };
    $scope.username = function() { return auth.username(); };
    $scope.logout = function() { return auth.logout(); };

  }]);
