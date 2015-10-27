'use strict';

/**
 * @ngdoc function
 * @name hem1538App.controller:DeviationCtrl
 * @description
 * # DeviationCtrl
 * Controller of the hem1538App
 */
angular.module('deviation', ['ngRoute'])
.controller('DeviationCtrl',
    ['$scope', '$routeParams', 'cqsdbProvider', '$location', 'action', 'schemaService', 'messagingService',
    'AuthenticationService', 'errorMessagesHelper', '$window', 'AuthorizationService', 'businessLogic', '$filter',
    function ($scope, $routeParams, cqsdbProvider, $location, action, schemaService, messagingService,
      auth, errorMessagesHelper, $window, authorization, businessLogic, $filter) {
    //Attributes
    $scope.canEdit = false;
    $scope.canVerify = false;
    $scope.canComment = false;
    $scope.disabled = (action === 'show');
    var api = cqsdbProvider('StudyEnrollments');
    $scope.studyEnrollment = {};
    $scope.partialStudyEnrollment = { 'id': $routeParams.studyEnrollmentId, 'Deviations': [] };
    $scope.deviation = {};
    $scope.errors = {};
    $scope.messages = [];
    $scope.enum = {};
    $scope.username = function() { return auth.username(); };
    
    //Methods
    $scope.isLockedDown = function(skipBaseline){
      return businessLogic.isLockedDown($scope.studyEnrollment, skipBaseline);
    };

    $scope.loadObjects = function() {
      api.get($routeParams.studyEnrollmentId).then(function(object) {
        $scope.studyEnrollment = object;
        cqsdbProvider.Role.mine({}, function(roles) {
          schemaService.getPermissions('StudyEnrollments.Deviations').then(function(data) {
            $scope.canEdit = authorization.check(data, roles, 'update', object);
            if (action !== 'show' && !$scope.canEdit) {
              messagingService.setMsg('You can\'t do that.');
              $location.path('/studyenrollments/'+object.id);
            }
            $scope.canVerify = authorization.check(data, roles, 'verify', object);
            $scope.canComment = authorization.check(data, roles, 'comment', object);
          });
        });
        if (action === 'new' || action === 'edit') {
          if ($scope.isLockedDown(true)) {
            messagingService.setMsg('This record is locked for editing due to eligibility.');
            $location.path('/studyenrollments/'+object.id);
          }
          if ($scope.isLockedDown()) {
            messagingService.setMsg('Please complete Baseline Covariates first.');
            $location.path('/studyenrollments/'+object.id);
          }
        }
        if (action === 'new') {
        } else {
          var idx = $routeParams.deviationId;
          var devs = $.grep(object.Deviations, function (dev) {
            return dev.id === idx;
          });
          if (devs.length > 0) {
            $scope.deviation = devs[0];
          } else {
            $location.path('/studyenrollments/' + $routeParams.studyEnrollmentId).search({ 'tab': 'deviations' });
          }
        }
        $scope.partialStudyEnrollment.Deviations.push($scope.deviation);
      }, function (data) {
        messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
        $location.path('/');
      });
    };
    
    $scope.submit = function () {
      $scope.submitted = true;
      $window.scrollTo(0,0);
      if(action === 'new'){
        $scope.deviation.reported_by = $scope.username();
      }
      $scope.errors = {};
      $scope.messages = [];
      api.update($scope.partialStudyEnrollment).then(function (result) {
          if (result && result.success === true) {
            messagingService.setMsg($scope.notifications('StudyEnrollments.Deviations', 'create'));
            $location.path('/studyenrollments/' + $scope.studyEnrollment.id).search({ 'tab': 'deviations' });
          } else if (result && result.success === false) {
            if (result.errors instanceof Object) {
              if(result.errors.Deviations){
                $scope.errors = $.grep(result.errors.Deviations, function(dev) {
                  return dev.id === ($scope.deviation.id || "null");
                })[0];
              }
              $scope.messages = errorMessagesHelper.squash('', result.errors);
              if ($scope.errors) {
                $scope.errors = errorMessagesHelper.rehash($scope.errors);
              } else {
                $scope.errors = {};
              }
            }
            $scope.submitted = false;
          }
        }, function(data) {
          messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
          $location.path('/');
        }
      );
    };
    
    $scope.verify = function(){
      var obj = { id: $scope.studyEnrollment.id, Deviations: [{ id: $scope.deviation.id, _verify: true}] };
      api.verify(obj).then(function(object){
        if (object.success) {
          if(!$scope.deviation.__verifications){ $scope.deviation.__verifications = []; }
          $scope.deviation.__verifications.push({action: 'verified', timestamp: new Date().toISOString()});
          $scope.message = "Deviation verified successfully";
        }
      }, function(data){
        messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
        $location.path('/');
      });
    };

    $scope.comment = function() {
      var obj = { id: $scope.studyEnrollment.id, Deviations: [{ id: $scope.deviation.id, '_commentText': $scope.commentText }] };
      api.comment(obj).then(function(response) {
        if (response.success) {
          if(!$scope.deviation.__comments){ $scope.deviation.__comments = []; }
          var d = new Date().toISOString();
          $scope.deviation.__verifications.push({ action: 'unverified', timestamp: d });
          $scope.deviation.__comments.push({ 'text': $scope.commentText, userId: '', timestamp: d });
          $scope.commentText = '';
          $scope.message = "Comment added";
        }
      }, function(error) {
        messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
        $location.path('/');
      });
    };

    $scope.$watch('deviation.did_increased_risk_or_negatively_affect',
      function(newVal, oldVal){
        if (!$scope.disabled && (oldVal || action === 'new')) {
          if ($scope.deviation.did_increased_risk_or_negatively_affect === 'Yes'){
            $scope.deviation.report_to_irb = $scope.enum.report_to_irb[0];
          } else {
            $scope.deviation.report_to_irb = undefined;
          }
        }
      }
    );
    $scope.$watch('deviation.sponsor_notification',
      function (newVal, oldVal) {
        if (!$scope.disabled && (oldVal || action === 'new')) {
          if (newVal === "Initial notification of study sponsor will be by submission of this eCRF.") {
            $scope.deviation.sponsor_notification_initial_date = $filter('date')(new Date(), 'yyyy-MM-dd');
          } else {
            $scope.deviation.sponsor_notification_initial_date = undefined;
          }
        }
      }
    );
    
    //Initialization
    $scope.loadObjects();
    schemaService.loadSchema();
    schemaService.getAllValues('StudyEnrollments.Deviations').then(function (data) { $scope.enum = data; });
    schemaService.notificationService().then(function(data){ $scope.notifications = data; });
    schemaService.requiredFactory().then(function (data) { $scope.required = data; });
    schemaService.labelFactory()
      .then(function(data){ $scope.labelService = data; });
    
  }])
.config(['$routeProvider',
    function ($routeProvider) {
    $routeProvider.
  when('/studyenrollments/:studyEnrollmentId/deviations/new', {
      templateUrl: 'components/deviations/form.html',
      controller: 'DeviationCtrl',
      resolve: {
        action: function () { return 'new'; }
      }
    }).
when('/studyenrollments/:studyEnrollmentId/deviations/:deviationId', {
      templateUrl: 'components/deviations/form.html',
      controller: 'DeviationCtrl',
      resolve: {
        action: function () { return 'show'; }
      }
    }).
when('/studyenrollments/:studyEnrollmentId/deviations/:deviationId/edit', {
      templateUrl: 'components/deviations/form.html',
      controller: 'DeviationCtrl',
      resolve: {
        action: function () { return 'edit'; }
      }
    });
  }]);
