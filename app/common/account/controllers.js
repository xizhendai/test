'use strict';

angular.module('account', ['ngRoute'])

.controller('AccountController', ['$scope', '$location', 'cqsdbProvider',
  function($scope, $location, cqsdbProvider) {
    $scope.type = '';
    $scope.messages = [];
    $scope.errors = {};
    $scope.roles = [];
    $scope.account = cqsdbProvider.Account.get(function() {
      $scope.roles = cqsdbProvider.Role.mine({}, function() {
        if ($scope.roles.length === 0) {
          $location.path('/');
        }
      }, function() {
        $location.path('/');
      });
      if ($scope.account.username.indexOf('@') > -1) {
        $scope.type = 'email';
      } else {
        $scope.type = 'vunetid';
      }
    });

    $scope.changePassword = function() {
      $scope.messages = [];
      $scope.errors = {};
      $scope.account.$update(function(data) {
        $scope.account.currentPassword = '';
        $scope.account.newPassword = '';
        $scope.account.passwordConfirmation = '';
        messagingService.setMsg('Password updated.');
      }, function(error) {
      });
    };
  }])

.controller('ActivationController', ['$scope', '$routeParams', '$location', 'cqsdbProvider', 'messagingService', 'errorMessagesHelper',
  function($scope, $routeParams, $location, cqsdbProvider, messagingService, errorMessagesHelper) {
    $scope.messages = [];
    $scope.errors = {};
    $scope.account = {
      identityId: $routeParams.identityId,
      code: $routeParams.code,
    };

    $scope.setPassword = function() {
      $scope.messages = [];
      $scope.errors = {};
      cqsdbProvider.Account.activate($scope.account, function(data) {
        messagingService.setMsg('Account activated.');
        $location.path('/login');
      }, function(error) {
        $scope.account.password = '';
        $scope.account.passwordConfirmation = '';
        if (error.data.errors instanceof Object) {
          $scope.messages = errorMessagesHelper.squash('', error.data.errors);
          $scope.errors = errorMessagesHelper.rehash($scope.messages, true);
        }
      });
    };
  }])

.controller('RequestPasswordController', ['$scope', '$location', 'cqsdbProvider', 'configuration', 'messagingService',
  function($scope, $location, cqsdbProvider, config, messagingService) {
    $scope.account = {
      url: config.applicationUrl + '/#/account/resetPassword'
    };

    $scope.requestPassword = function() {
      cqsdbProvider.Account.requestPassword($scope.account, function(data) {
        messagingService.setMsg('Check your email for the password reset link.');
        $location.path('/');
      }, function(error) {
        messagingService.setMsg('Check your email for the password reset link.');
        $location.path('/');
      });
    };
  }])

.controller('ResetPasswordController', ['$scope', '$routeParams', '$location', 'cqsdbProvider', 'messagingService', 'errorMessagesHelper',
  function($scope, $routeParams, $location, cqsdbProvider, messagingService, errorMessagesHelper) {
    $scope.errors = {};
    $scope.messages = [];
    $scope.account = {
      identityId: $routeParams.identityId,
      code: $routeParams.code,
    };

    $scope.setPassword = function() {
      $scope.messages = [];
      $scope.errors = {};
      cqsdbProvider.Account.resetPassword($scope.account, function(data) {
        messagingService.setMsg('Password updated.');
        $location.path('/login');
      }, function(error) {
        $scope.account.password = '';
        $scope.account.passwordConfirmation = '';
        if (error.data.errors instanceof Object) {
          $scope.messages = errorMessagesHelper.squash('', error.data.errors);
          $scope.errors = errorMessagesHelper.rehash($scope.messages, true);
        }
      });
    };
  }])

.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider
      .when('/account', {
        templateUrl: 'common/account/show.html',
        controller: 'AccountController'
      })
      .when('/account/activate', {
        templateUrl: 'common/account/set.html',
        controller: 'ActivationController'
      })
      .when('/account/requestPassword', {
        templateUrl: 'common/account/request.html',
        controller: 'RequestPasswordController'
      })
      .when('/account/resetPassword', {
        templateUrl: 'common/account/set.html',
        controller: 'ResetPasswordController'
      });
  }]);
