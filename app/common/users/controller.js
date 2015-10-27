'use strict';

angular.module('users', ['ngRoute'])

.controller('UsersIndexController', ['$scope', '$location', 'cqsdbProvider', 'ngTableParams',
  function($scope, $location, cqsdbProvider, ngTableParams) {
    $scope.users = cqsdbProvider.User.query(function() {
      $scope.tableParams = new ngTableParams({
        page: 1,
        count: 25
      },
      {
        total: $scope.users.length,
        counts: [],
        defaultSort: 'asc',
        getData: function($defer, params) {
          $defer.resolve($scope.users.slice((params.page() - 1) * params.count(), params.page() * params.count()));
        }
      });

    });

    $scope.rowClick = function(path){
      $location.path(path);
    };
  }])

.controller('UsersController', ['$scope', '$location', '$routeParams', 'cqsdbProvider', 'action', 'configuration', '$window', 'errorMessagesHelper',
  function($scope, $location, $routeParams, cqsdbProvider, action, config, $window, errorMessagesHelper) {
    $scope.user = new cqsdbProvider.User();
    $scope.user.url = config.applicationUrl + '/#/account/activate';
    $scope.errors = {};
    $scope.messages = [];

    $scope.submit = function() {
      $window.scrollTo(0,0);
      $scope.errors = {};
      $scope.messages = [];
      if ($scope.user.type === 'email') {
        $scope.user.username = undefined;
      } else if ($scope.user.type === 'vunetid') {
        $scope.user.email = undefined;
        $scope.user.lastName = undefined;
        $scope.user.firstName = undefined;
      }
      $scope.user.$save(function(data) {
        $location.path('/users');
      }, function(error) {
        $scope.messages = errorMessagesHelper.squash('', error.data.errors);
        $scope.errors = errorMessagesHelper.rehash($scope.messages, true);
      });
    };
  }])

.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider
      .when('/users', {
        templateUrl: 'common/users/index.html',
        controller: 'UsersIndexController'
      })
      .when('/users/new', {
        templateUrl: 'common/users/form.html',
        controller: 'UsersController',
        resolve: {
          action: function() { return 'new'; }
        }
      });
  }]);
