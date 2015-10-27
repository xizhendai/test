'use strict';

angular.module('cqsdbProviders', ['ngResource'])

.provider('cqsdbProvider', function(){
  var baseUrl = '';
  var applicationId = '';

  this.setBaseUrl = function(url){
    baseUrl = url;
  };
  this.setApplicationId = function(id){
    applicationId = id;
  };

  this.$get = ['$http', '$q', '$resource', function($http, $q, $resource) {
    var provider = function(objectName){
      return {
        list: function(){
          var deferred = $q.defer();
          var url = baseUrl+'/projects/'+applicationId+'/collections/'+objectName+'/items';
          $http.get(url, {timeout: 30000})
            .success(function(data){
              deferred.resolve(data);
            })
            .error(function(data){
              deferred.reject(data);
            });
          return deferred.promise;
        },

        get: function(id){
          var deferred = $q.defer();
          var url = baseUrl+'/projects/'+applicationId+'/collections/'+objectName+'/items/'+id;
          $http.get(url, {timeout: 30000})
            .success(function(data){
              deferred.resolve(data);
            })
            .error(function(data) {
              deferred.reject(data);
            });
          return deferred.promise;
        },

        update: function(object){
          var deferred = $q.defer();
          var url = baseUrl+'/projects/'+applicationId+'/collections/'+objectName+'/items/'+object.id;
          $http.put(url, object, {timeout: 30000})
            .success(function(data){
              deferred.resolve(data);
            })
            .error(function(data){
              if (data && data.success === false) {
                deferred.resolve(data);
              } else {
                deferred.reject(data);
              }
            });
          return deferred.promise;
        },

        create: function(object){
          var deferred = $q.defer();
          var url = baseUrl+'/projects/'+applicationId+'/collections/'+objectName+'/items';
          $http.post(url, object, {timeout: 30000})
            .success(function(data){
              deferred.resolve(data);
            })
            .error(function(data){
              if (data && data.success === false) {
                deferred.resolve(data);
              } else {
                deferred.reject(data);
              }
            });
          return deferred.promise;
        },

        destroy: function(object){
          var deferred = $q.defer();
          var url = baseUrl+'/projects/'+applicationId+'/collections/'+objectName+'/items/'+object.id;
          $http.delete(url, {timeout: 30000})
            .success(function(data){
              deferred.resolve(data);
            })
            .error(function(data){
              if (data && data.success === false) {
                deferred.resolve(data);
              } else {
                deferred.reject(data);
              }
            });
          return deferred.promise;
        },

        comment: function(object){
          var deferred = $q.defer();
          var url = baseUrl+'/projects/'+applicationId+'/collections/'+objectName+'/items/'+object.id+'/comment';
          $http.put(url, object, {timeout: 30000})
            .success(function(data){
              deferred.resolve(data);
            })
            .error(function(data){
              if (data && data.success === false) {
                deferred.resolve(data);
              } else {
                deferred.reject(data);
              }
            });
          return deferred.promise;
        },

        verify: function(object){
          var deferred = $q.defer();
          var url = baseUrl+'/projects/'+applicationId+'/collections/'+objectName+'/items/'+object.id+'/verify';
          $http.put(url, object, {timeout: 30000})
            .success(function(data){
              deferred.resolve(data);
            })
            .error(function(data){
              if (data && data.success === false) {
                deferred.resolve(data);
              } else {
                deferred.reject(data);
              }
            });
          return deferred.promise;
        },

        sign: function(object){
          var deferred = $q.defer();
          var url = baseUrl+'/projects/'+applicationId+'/collections/'+objectName+'/items/'+object.id+'/sign';
          $http.put(url, object, {timeout: 30000})
            .success(function(data){
              deferred.resolve(data);
            })
            .error(function(data){
              if (data && data.success === false) {
                deferred.resolve(data);
              } else {
                deferred.reject(data);
              }
            });
          return deferred.promise;
        },

        revoke: function(object){
          var deferred = $q.defer();
          var url = baseUrl+'/projects/'+applicationId+'/collections/'+objectName+'/items/'+object.id+'/revoke';
          $http.put(url, object, {timeout: 30000})
            .success(function(data){
              deferred.resolve(data);
            })
            .error(function(data){
              if (data && data.success === false) {
                deferred.resolve(data);
              } else {
                deferred.reject(data);
              }
            });
          return deferred.promise;
        },
        reports: function(object){
          var deferred = $q.defer();
          var url = baseUrl+'/projects/'+applicationId+'/collections/'+objectName+'/reports/'+object.name;
          $http.post(url, object.params, {timeout: 30000, responseType: "blob"})
            .success(function(data){
              deferred.resolve(data);
            })
            .error(function(data){
              if (data && data.success === false) {
                deferred.resolve(data);
              } else {
                deferred.reject(data);
              }
            });
          return deferred.promise;
        }
      };
    };

    // Account resource

    var accountActions = {
      activate: { method: 'POST', isArray: false, url: baseUrl+'/account/activate' },
      update: { method: 'PUT', isArray: false },
      requestPassword: { method: 'POST', isArray: false, url: baseUrl+'/account/resetPasswordRequest' },
      resetPassword: { method: 'POST', isArray: false, url: baseUrl+'/account/resetPassword' }
    };

    provider.Account = $resource(baseUrl+'/account', {}, accountActions);

    // User resource

    var userActions = {
      update: { method: 'PUT', isArray: false },
      create: { method: 'POST' }
    };

    provider.User = $resource(baseUrl+'/users/:id', { id: '@id' }, userActions);

    // Role resource

    var roleActions = {
      update: { method: 'PUT', isArray: false },
      create: { method: 'POST' },
      mine: { method: 'GET', isArray: true, url: baseUrl+'/projects/'+applicationId+'/roles/mine' }
    };

    provider.Role = $resource(baseUrl+'/projects/'+applicationId+'/roles/:id', { id: '@id' }, roleActions);

    provider.Role.prototype.$save = function(params, success, error) {
      if ( !this.id ) {
        return this.$create(params, success, error);
      }
      else {
        return this.$update(params, success, error);
      }
    };


    return provider;
  }];
});
