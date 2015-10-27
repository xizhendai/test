'use strict';

angular.module('roles', ['ngRoute'])

.controller('RolesIndexController', ['$scope', '$location', 'cqsdbProvider', 'ngTableParams',
  function($scope, $location, cqsdbProvider, ngTableParams) {
    $scope.roles = cqsdbProvider.Role.query(function() {
      $scope.tableParams = new ngTableParams({
        page: 1,
        count: 25
      },
      {
        total: $scope.roles.length,
        counts: [],
        defaultSort: 'asc',
        getData: function($defer, params) {
          $defer.resolve($scope.roles.slice((params.page() - 1) * params.count(), params.page() * params.count()));
        }
      });

      // match usernames with roles
      cqsdbProvider.User.query(function(users) {
        $.map($scope.roles, function(role) {
          var user = $.grep(users, function(user) {
            return role.userId === user.id;
          })[0];
          if (user) {
            role.username = user.username;
          } else {
            role.username = '[Unknown]';
          }
        });
      });
    });

    $scope.rowClick = function(path){
      $location.path(path);
    };

    $scope.destroy = function(role) {
      role.$delete(function() {
        $location.path('/roles');
      });
    };
  }])

.controller('RolesController', ['$scope', '$location', '$routeParams', 'cqsdbProvider', 'action',
  function($scope, $location, $routeParams, cqsdbProvider, action) {
    $scope.disabled = (action === 'show');
    $scope.users = cqsdbProvider.User.query();
    $scope.exists = false;
    $scope.role = new cqsdbProvider.Role();
    $scope.role.roles = [];

    $scope.roleNames = [
      'central_entry', 'central_monitor', 'central_pi', 'central_read', 'central_restricted',
      'site1_entry', 'site1_pi', 'site1_read', 'site1_restricted',
      'site2_entry', 'site2_pi', 'site2_read', 'site2_restricted',
      'site3_entry', 'site3_pi', 'site3_read', 'site3_restricted',
      'site4_entry', 'site4_pi', 'site4_read', 'site4_restricted',
      'site5_entry', 'site5_pi', 'site5_read', 'site5_restricted',
    ];

    if (action !== 'new') {
      $scope.roles = cqsdbProvider.Role.query(function() {
        var role = $.grep($scope.roles, function(role) {
          return role.id === $routeParams.id;
        });
        if (role.length > 0) {
          $scope.role = role[0];
          $scope.exists = true;
        } else {
          $location.path('/roles');
        }
        if (!$scope.role.roles) {
          $scope.role.roles = [];
        }
      });
    }

    $scope.toggleSelection = function(roleName) {
      var idx = $scope.role.roles.indexOf(roleName);
      if (idx > -1) {
        $scope.role.roles.splice(idx, 1);
      } else {
        $scope.role.roles.push(roleName);
      }
    };

    $scope.submit = function() {
      $scope.role.$save(function() {
        $location.path('/roles');
      });
    };
  }])

.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider
      .when('/roles', {
        templateUrl: 'common/roles/index.html',
        controller: 'RolesIndexController'
      })
      .when('/roles/new', {
        templateUrl: 'common/roles/form.html',
        controller: 'RolesController',
        resolve: {
          action: function() { return 'new'; }
        }
      })
      .when('/roles/:id', {
        templateUrl: 'common/roles/form.html',
        controller: 'RolesController',
        resolve: {
          action: function() { return 'show'; }
        }
      })
      .when('/roles/:id/edit', {
        templateUrl: 'common/roles/form.html',
        controller: 'RolesController',
        resolve: {
          action: function() { return 'edit'; }
        }
      });
  }]);
