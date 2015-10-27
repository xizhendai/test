'use strict';

/**
 * @ngdoc function
 * @name hem1538App.controller:MedicalHistoryCtrl
 * @description
 * # MedicalHistoryCtrl
 * Controller of the hem1538App
 */
angular.module('medicalhistory', ['ngRoute'])
.controller('MedicalHistoryCtrl',
    ['$scope', '$routeParams', 'cqsdbProvider', '$location', 'action', 'schemaService',
    'messagingService', 'errorMessagesHelper', '$window', 'AuthorizationService', 'businessLogic',
    function ($scope, $routeParams, cqsdbProvider, $location, action, schemaService,
      messagingService, errorMessagesHelper, $window, authorization, businessLogic) {
      //Attributes
      $scope.canEdit = false;
      $scope.canVerify = false;
      $scope.canComment = false;
      $scope.disabled = (action === 'show');
      var api = cqsdbProvider('StudyEnrollments');
      $scope.studyEnrollment = {};
      $scope.partialStudyEnrollment = { 'id': $routeParams.studyEnrollmentId, 'MedicalHistories': [] };
      $scope.medicalHistory = {};
      $scope.errors = {};
      $scope.messages = [];

      //Methods
      $scope.isLockedDown = function(skipBaseline){
        return businessLogic.isLockedDown($scope.studyEnrollment, skipBaseline);
      };

      var loadObjects = function () {
        api.get($routeParams.studyEnrollmentId).then(function (object) {
          $scope.studyEnrollment = object;
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
          cqsdbProvider.Role.mine({}, function(roles) {
            schemaService.getPermissions('StudyEnrollments.MedicalHistories').then(function(data) {
              $scope.canEdit = authorization.check(data, roles, 'update', object);
              if (action !== 'show' && !$scope.canEdit) {
                messagingService.setMsg('You can\'t do that.');
                $location.path('/studyenrollments/'+object.id);
              }
              $scope.canVerify = authorization.check(data, roles, 'verify', object);
              $scope.canComment = authorization.check(data, roles, 'comment', object);
            });
          });
          if(action === 'new'){
          }else{
            var idx = $routeParams.medicalHistoryId;
            var histories = $.grep(object.MedicalHistories, function(history){
              return history.id === idx;
            });
            if (histories.length > 0){
              $scope.medicalHistory = histories[0];
            } else {
              $location.path('/studyenrollments/' + $routeParams.studyEnrollmentId).search({ 'tab': 'logForms' });
            }
          }
          $scope.partialStudyEnrollment.MedicalHistories.push($scope.medicalHistory);
        }, function(data){
          messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
          $location.path('/');
        });
      };

      $scope.verify = function(){
        var obj = { id: $scope.studyEnrollment.id, MedicalHistories: [{ id: $scope.medicalHistory.id, _verify: true}] };
        api.verify(obj).then(function(object){
          if (object.success) {
            if(!$scope.medicalHistory.__verifications){ $scope.medicalHistory.__verifications = []; }
            $scope.medicalHistory.__verifications.push({action: 'verified', timestamp: new Date().toISOString()});
            $scope.message = "Medical history verified successfully";
          }
        }, function(data){
          messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
          $location.path('/');
        });
      };

      $scope.comment = function() {
        var obj = { id: $scope.studyEnrollment.id, MedicalHistories: [{ id: $scope.medicalHistory.id, _commentText: $scope.commentText }] };
        api.comment(obj).then(function(response) {
          if (response.success) {
            if(!$scope.medicalHistory.__comments){ $scope.medicalHistory.__comments = []; }
            var d = new Date().toISOString();
            $scope.medicalHistory.__verifications.push({ action: 'unverified', timestamp: d });
            $scope.medicalHistory.__comments.push({ 'text': $scope.commentText, userId: '', timestamp: d });
            $scope.commentText = '';
            $scope.message = "Comment added";
          }
        }, function(error) {
          messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
          $location.path('/');
        });
      };

      $scope.submit = function () {
        $scope.submitted = true;
        $window.scrollTo(0,0);
        $scope.errors = {};
        $scope.messages = [];
        api.update($scope.partialStudyEnrollment).then(function (result) {
          if (result && result.success === true) {
            messagingService.setMsg($scope.notifications('StudyEnrollments.MedicalHistories', 'create'));
            $location.path('/studyenrollments/' + $scope.studyEnrollment.id).search({ 'tab': 'logForms' });
          } else if (result && result.success === false) {
            if (result.errors instanceof Object) {
              if(result.errors.MedicalHistories){
                $scope.errors = $.grep(result.errors.MedicalHistories, function(mhx) {
                  return mhx.id === ($scope.medicalHistory.id || "null");
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
          $scope.submitted = false;
          messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
          $location.path('/');
        });
      };

      //Initialization
      loadObjects();
      schemaService.loadSchema();
      schemaService.requiredFactory()
        .then(function(data){ $scope.required = data; });
      schemaService.notificationService().then(function(data){ $scope.notifications = data; });
      schemaService.labelFactory()
        .then(function(data){ $scope.labelService = data; });
    }])
.config(['$routeProvider',
    function ($routeProvider) {
      $routeProvider.
        when('/studyenrollments/:studyEnrollmentId/medicalhistories/new', {
          templateUrl: 'components/medicalHistories/form.html',
          controller: 'MedicalHistoryCtrl',
          resolve: {
            action: function () {
              return 'new';
            }
          }
        }).
        when('/studyenrollments/:studyEnrollmentId/medicalhistories/:medicalHistoryId', {
          templateUrl: 'components/medicalHistories/form.html',
          controller: 'MedicalHistoryCtrl',
          resolve: {
            action: function () {
              return 'show';
            }
          }
        }).
        when('/studyenrollments/:studyEnrollmentId/medicalhistories/:medicalHistoryId/edit', {
          templateUrl: 'components/medicalHistories/form.html',
          controller: 'MedicalHistoryCtrl',
          resolve: {
            action: function () {
              return 'edit';
            }
          }
        });
    }]);
