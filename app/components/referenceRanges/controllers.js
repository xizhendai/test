'use strict';

/**
 * @ngdoc function
 * @name hem1538App.controller:ReferencerangesCtrl
 * @description
 * # ReferencerangesCtrl
 * Controller of the hem1538App
 */
angular.module('referenceranges', ['ngRoute'])
  .controller('ReferencerangesIndexCtrl',
  ['$scope', 'cqsdbProvider', '$location', '$filter', 'ngTableParams', 'messagingService', 'schemaService', 'AuthorizationService',
  function ($scope, cqsdbProvider, $location, $filter, ngTableParams, messagingService, schemaService, authorization) {

    $scope.canCreate = false;
    var api = cqsdbProvider('ReferenceRanges');
    $scope.referenceRanges = [];
    $scope.message = messagingService.getMsg();

    $scope.setupTable = function(){
      $scope.tableParams = new ngTableParams({
        page: 1,            // show first page
        count: 10,          // count per page
        sorting: {
          site_name: 'asc'     // initial sorting
        }
      }, {
        total: $scope.referenceRanges.length, // length of data
        counts: [],
        defaultSort: 'asc',
        getData: function($defer, params) {
          // use build-in angular filter
          var orderedData = params.sorting() ?
            $filter('orderBy')($scope.referenceRanges, params.orderBy()) :
            $scope.referenceRanges;
        $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
          }
      });
    };
    $scope.loadRanges = function(){
      api.list().then(function(objectList){
        if(objectList instanceof Array){
          $scope.referenceRanges = objectList;
          $scope.setupTable();
          cqsdbProvider.Role.mine({}, function(roles) {
            schemaService.getPermissions('ReferenceRanges').then(function(data) {
              $scope.canCreate = authorization.check(data, roles, 'create', {});
            });
          });
        }
      }, function(error) {
        messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
        $location.path('/');
      }).finally(function() {
        $scope.$broadcast('loading-complete');
      });
    };

    $scope.rowClick = function(path){
      $location.path(path);
    };

    $scope.loadRanges();
    schemaService.loadSchema();
    schemaService.labelFactory()
      .then(function(data){ $scope.labelService = data; });
  }])
  .controller('ReferencerangesNewCtrl',
    ['$scope', 'cqsdbProvider', '$location', 'schemaService', 'messagingService', 'errorMessagesHelper', '$window', 'AuthorizationService',
    function ($scope, cqsdbProvider, $location, schemaService, messagingService, errorMessagesHelper, $window, authorization) {
    //variables
    $scope.disabled = false;
    $scope.referenceRange = {};
    $scope.errors = {};
    $scope.messages = [];
    var api = cqsdbProvider('ReferenceRanges');
    $scope.sites = [];

    //methods
    $scope.submit = function(){
      $scope.submitted = true;
      $window.scrollTo(0,0);
      api.create($scope.referenceRange).then(function(result){
        if(result && result.success === true){
          $scope.referenceRange.id = result.id;
          messagingService.setMsg(result.message);
          $location.path('/referenceranges');
        }else if(result && result.success === false){
          if (result.errors instanceof Object) {
            $scope.messages = errorMessagesHelper.squash('', result.errors);
            $scope.errors = errorMessagesHelper.rehash($scope.messages, true);
          }
          $scope.submitted = false;
        }
      }, function(error) {
        messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
        $location.path('/');
      });
    };

    //instantiation
    schemaService.loadSchema();
    cqsdbProvider.Role.mine({}, function(roles) {
      schemaService.getPermissions('ReferenceRanges').then(function(data) {
        if (!authorization.check(data, roles, 'create', {})) {
          messagingService.setMsg('You can\'t do that.');
          $location.path('/referenceranges');
        }
      });
    }, function(error) {
      messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
      $location.path('/');
    });
    schemaService.getValues('ReferenceRanges.site_name')
      .then(function(data){
        $scope.sites = data;
        if (data.length === 1) {
          $scope.referenceRange.site_name = data[0];
        }
      });
    schemaService.requiredFactory().then(function(data){ $scope.required = data; });
    schemaService.labelFactory()
      .then(function(data){ $scope.labelService = data; });
  }])
  .controller('ReferencerangesShowCtrl',
  ['$scope', '$routeParams', 'cqsdbProvider', '$location', 'schemaService', 'messagingService', 'AuthorizationService',
  function ($scope, $routeParams, cqsdbProvider, $location, schemaService, messagingService, authorization) {
    $scope.canEdit = false;
    $scope.canVerify = false;
    $scope.canComment = false;
    $scope.disabled = true;
    var api = cqsdbProvider('ReferenceRanges');
    $scope.referenceRange = {};
    $scope.sites = [];

    $scope.verify = function(){
      var obj = {id: $scope.referenceRange.id, _verify: true};
      api.verify(obj).then(function(object){
        if (object.success) {
          if(!$scope.referenceRange.__verifications){ $scope.referenceRange.__verifications = []; }
          $scope.referenceRange.__verifications.push({action: 'verified', timestamp: new Date().toISOString()});
          $scope.message = "Reference range verified successfully";
        }
      }, function(data){
        messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
        $location.path('/');
      });
    };

    $scope.comment = function() {
      var obj = { id: $scope.referenceRange.id, _commentText: $scope.commentText };
      api.comment(obj).then(function(response) {
        if (response.success) {
          if(!$scope.referenceRange.__comments){ $scope.referenceRange.__comments = []; }
          var d = new Date().toISOString();
          $scope.referenceRange.__verifications.push({ action: 'unverified', timestamp: d });
          $scope.referenceRange.__comments.push({ 'text': $scope.commentText, userId: '', timestamp: d });
          $scope.commentText = '';
          $scope.message = "Comment added";
        }
      }, function(error) {
        messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
        $location.path('/');
      });
    };

    $scope.loadRange = function(){
      api.get($routeParams.id).then(function(object){
        $scope.referenceRange = object;
        cqsdbProvider.Role.mine({}, function(roles) {
          schemaService.getPermissions('ReferenceRanges').then(function(data) {
            $scope.canEdit = authorization.check(data, roles, 'update', object);
            $scope.canVerify = authorization.check(data, roles, 'verify', object);
            $scope.canComment = authorization.check(data, roles, 'comment', object);
          });
        });
      }, function(data){
        messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
        $location.path('/');
      });
    };

    $scope.loadRange();
    schemaService.loadSchema();
    schemaService.getValues('ReferenceRanges.site_name')
      .then(function(data){ $scope.sites = data; });
    schemaService.requiredFactory().then(function(data){ $scope.required = data; });
    schemaService.labelFactory()
      .then(function(data){ $scope.labelService = data; });
  }])
  .controller('ReferencerangesEditCtrl',
    ['$scope', '$routeParams', 'cqsdbProvider', '$location', 'schemaService', 'messagingService', 'errorMessagesHelper', '$window', 'AuthorizationService',
    function ($scope, $routeParams, cqsdbProvider, $location, schemaService, messagingService, errorMessagesHelper, $window, authorization) {
    $scope.disabled = false;
    var api = cqsdbProvider('ReferenceRanges');
    $scope.referenceRange = {};
    $scope.errors = {};
    $scope.messages = [];
    $scope.sites = [];

    $scope.loadRange = function(){
      api.get($routeParams.id).then(function(object){
        $scope.referenceRange = object;
        cqsdbProvider.Role.mine({}, function(roles) {
          schemaService.getPermissions('ReferenceRanges').then(function(data) {
            if (!authorization.check(data, roles, 'update', object)) {
              messagingService.setMsg('You can\'t do that.');
              $location.path('/referenceranges/'+object.id);
            }
          });
        });
      }, function(data){
        messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
        $location.path('/');
      });
    };

    $scope.submit = function(){
      $scope.submitted = true;
      $window.scrollTo(0,0);
      api.update($scope.referenceRange).then(function(result){
        if(result && result.success === true){
          messagingService.setMsg(result.message);
          $location.path('/referenceranges');
        }else if(result && result.success === false){
          if (result.errors instanceof Object) {
            $scope.messages = errorMessagesHelper.squash('', result.errors);
            $scope.errors = errorMessagesHelper.rehash($scope.messages, true);
          }
          $scope.submitted = false;
        }
      }, function(data) {
        messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
        $location.path('/');
      });
    };

    $scope.loadRange();
    schemaService.loadSchema();
    schemaService.getValues('ReferenceRanges.site_name')
      .then(function(data){ $scope.sites = data; });
    schemaService.requiredFactory().then(function(data){ $scope.required = data; });
    schemaService.labelFactory()
      .then(function(data){ $scope.labelService = data; });
  }])
  .config(['$routeProvider',
    function($routeProvider){
      $routeProvider.
        when('/referenceranges', {
          templateUrl:  'components/referenceRanges/index.html',
          controller:   'ReferencerangesIndexCtrl'
        }).
        when('/referenceranges/new', {
          templateUrl:  'components/referenceRanges/form.html',
          controller:   'ReferencerangesNewCtrl'
        }).
        when('/referenceranges/:id/edit', {
          templateUrl:  'components/referenceRanges/form.html',
          controller:   'ReferencerangesEditCtrl'
        }).
        when('/referenceranges/:id', {
          templateUrl:  'components/referenceRanges/form.html',
          controller:   'ReferencerangesShowCtrl'
        });
    }
  ]);
