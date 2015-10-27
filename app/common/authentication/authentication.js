'use strict';

angular.module('authentication', [
    'ngRoute'
  ])

.provider('AuthenticationService',
  function() {
    var baseUrl = '',
        savedPath = null,
        authToken = null,
        userInfo = {};

    return {

      setBaseUrl: function(url) {
        baseUrl = url;
      },

      $get: ['$http', '$window', '$q', function($http, $window, $q) {
        var fetchAccount = function() {
          $http.get(baseUrl + '/account', {skipAuthInterceptor:true}).success(function(response) {
            userInfo = response;
          });
        };

        if ($window.sessionStorage.authToken && $window.sessionStorage.authToken !== '') {
          authToken = $window.sessionStorage.authToken;
          fetchAccount();
        }

        return {
          login: function(username, password) {
            var deferred = $q.defer();

            var credentials = {
              username: username,
              password: password
            };

            var success = function(response) {
              authToken = response.data.key;
              $window.sessionStorage.authToken = authToken;
              fetchAccount();
              deferred.resolve();
            };

            var error = function(error) {
              if (error.status === 403) {
                deferred.resolve();
              } else {
                deferred.reject();
              }
            };

            $http.post(baseUrl + '/auth/login', credentials, { timeout: 15000 }).then(success, error);

            return deferred.promise;
          },

          logout: function() {
            userInfo = {};
            authToken = null;
            $window.sessionStorage.authToken = '';
          },

          authToken: function() {
            return authToken;
          },

          username: function() {
            return userInfo.username;
          },

          admin: function() {
            return userInfo.admin;
          },

          loggedIn: function() {
            return !!authToken;
          },

          savedPath: function(value) {
            if (value) {
              if (value !== '/login') {
                savedPath = value;
              }
            } else {
              return savedPath;
            }
          },

          baseUrl: function() {
            return baseUrl;
          }
        };
      }]
    };
  })

.factory('AuthenticationInterceptor', ['$injector', '$q', '$location', 'messagingService',
  function($injector, $q, $location, messagingService) {
    var service = {};

    service.request = function(config) {
      var auth = $injector.get('AuthenticationService');
      if (config.url.lastIndexOf(auth.baseUrl(), 0) === 0) {
        if (auth.authToken() && auth.authToken() !== '') {
          config.headers.Authorization = auth.authToken();
        }
      }
      return config;
    };

    service.responseError = function(rejection) {
      if (rejection.config.skipAuthInterceptor !== true) {
        var auth = $injector.get('AuthenticationService');
        if (rejection.status === 401) {
          if (rejection.config.url.lastIndexOf(auth.baseUrl(), 0) === 0) {
            var errors = rejection.data.errors;
            if (errors === 'unauthorized') {
              if (rejection.config.url.indexOf('/roles/mine', rejection.config.url.length - 11) === -1) {
                messagingService.setMsg('Access denied:  You do not have permission to perform that action.');
                $location.path('/'); // redirect to root when not authorized
                return $q.defer().promise;
              } // else: user has no roles on the project
            } else if (errors instanceof Array) {
              var invalidExpired = false;
              for (var i = 0; i < errors.length; i++) {
                if(errors[i] instanceof Object && 'authorization_key' in errors[i]){
                  if (errors[i].authorization_key[0] === 'invalid' ||
                      errors[i].authorization_key[0] === 'expired') {
                    invalidExpired = true;
                  }
                }
              }
              if (invalidExpired) {
                if (auth.authToken()) {
                  messagingService.setMsg('Your session has expired.  Please log in to continue.');
                } else {
                  messagingService.setMsg('Please log in to continue.');
                }
                auth.savedPath($location.path()); // save location when not authenticated
                auth.logout();
                $location.path('/login');
                return $q.defer().promise;
              }
            }
          }
        }
      }
      return $q.reject(rejection);
    };

    return service;
  }])

.config(['$httpProvider',
  function($httpProvider) {
    $httpProvider.interceptors.push('AuthenticationInterceptor');
  }])

.controller('AuthenticationController',
  ['$scope', 'AuthenticationService', '$location', 'messagingService',
  function($scope, auth, $location, messagingService) {

    $scope.credentials = {};
    $scope.message = messagingService.getMsg();

    $scope.login = function() {
      auth.login($scope.credentials.username, $scope.credentials.password).then(function() {
        if (auth.loggedIn()) {
          $scope.credentials = {}; // clear form
          $location.path(auth.savedPath() || '/'); // redirect to saved location
          auth.savedPath('');
        } else {
          $scope.message = 'There was a problem with your credentials.';
        }
      }, function() {
        $scope.message = 'There was a problem communicating with the server.';
      });
    };

  }])

.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider
      .when('/login', {
        templateUrl: 'common/authentication/form.html',
        controller: 'AuthenticationController'
      });
  }]);
