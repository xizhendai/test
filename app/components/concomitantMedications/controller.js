'use strict';

angular.module('concomitantMedications', ['ngRoute'])

.controller('ConcomitantMedicationsController',
  ['$scope', '$routeParams', 'cqsdbProvider', '$location', 'action', 'schemaService',
  'messagingService', 'errorMessagesHelper', '$window', 'AuthorizationService', 'businessLogic',
  function($scope, $routeParams, cqsdbProvider, $location, action, schemaService,
    messagingService, errorMessagesHelper, $window, authorization, businessLogic) {
    $scope.canEdit = false;
    $scope.canVerify = false;
    $scope.canComment = false;
    $scope.disabled = (action === 'show');
    var api = cqsdbProvider('StudyEnrollments');
    $scope.studyEnrollment = {};
    $scope.partialStudyEnrollment = { 'id': $routeParams.studyEnrollmentId, 'ConcomitantMedications': [] };
    $scope.concomitantMedication = {};
    $scope.errors = {};
    $scope.messages = [];

    $scope.isLockedDown = function(skipBaseline){
      return businessLogic.isLockedDown($scope.studyEnrollment, skipBaseline);
    };

    var loadObjects = function() {
      api.get($routeParams.studyEnrollmentId).then(function(object) {
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
          schemaService.getPermissions('StudyEnrollments.Comments').then(function(data) {
            $scope.canEdit = authorization.check(data, roles, 'update', object);
            if (action !== 'show' && !$scope.canEdit) {
              messagingService.setMsg('You can\'t do that.');
              $location.path('/studyenrollments/'+object.id);
            }
            $scope.canVerify = authorization.check(data, roles, 'verify', object);
            $scope.canComment = authorization.check(data, roles, 'comment', object);
          });
        });
        if (action === 'new') {
        } else {
          var idx = $routeParams.concomitantMedicationId;
          var meds = $.grep(object.ConcomitantMedications, function(med){
            return med.id === idx;
          });
          if (meds.length > 0) {
            $scope.concomitantMedication = meds[0];
          } else {
            $location.path('/studyenrollments/'+$routeParams.studyEnrollmentId);
          }
        }
        $scope.partialStudyEnrollment.ConcomitantMedications.push($scope.concomitantMedication);
      }, function(data){
        messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
        $location.path('/');
      });
    };

    $scope.openDatePicker = function(date, $event) {
      $event.preventDefault();
      $event.stopPropagation();
      $scope['opened'+date] = true;
    };

    $scope.submit = function() {
      $scope.submitted = true;
      $window.scrollTo(0,0);
      if (!$scope.disabled) {
        $scope.errors = {};
        $scope.messages = [];
        api.update($scope.partialStudyEnrollment).then(function(result) {
          if (result && result.success === true) {
            messagingService.setMsg($scope.notifications('StudyEnrollments.ConcomitantMedications', 'create'));
            $location.path('/studyenrollments/' + $scope.studyEnrollment.id).search({ 'tab': 'logForms' });;
          } else if (result && result.success === false) {
            if (result.errors instanceof Object) {
              $scope.errors = $.grep(result.errors.ConcomitantMedications, function(med) {
                return med.id === ($scope.concomitantMedication.id || "null");
              })[0];
              $scope.messages = errorMessagesHelper.squash('', result.errors);
              if ($scope.errors) {
                $scope.errors = errorMessagesHelper.rehash($scope.errors);
              } else {
                $scope.errors = {};
              }
              $scope.submitted = false;
            }
          }
        }, function(data) {
          messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
          $location.path('/');
        });
      }
    };

    $scope.verify = function(){
      var obj = { id: $scope.studyEnrollment.id, ConcomitantMedications: [{ id: $scope.concomitantMedication.id, _verify: true}] };
      api.verify(obj).then(function(object){
        if (object.success) {
          if(!$scope.concomitantMedication.__verifications){ $scope.concomitantMedication.__verifications = []; }
          $scope.concomitantMedication.__verifications.push({action: 'verified', timestamp: new Date().toISOString()});
          $scope.message = "Concomitant medication verified successfully";
        }
      }, function(data){
        messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
        $location.path('/');
      });
    };

    $scope.comment = function() {
      var obj = { id: $scope.studyEnrollment.id, ConcomitantMedications: [{ id: $scope.concomitantMedication.id, _commentText: $scope.commentText }] };
      api.comment(obj).then(function(response) {
        if (response.success) {
          if(!$scope.concomitantMedication.__comments){ $scope.concomitantMedication.__comments = []; }
          var d = new Date().toISOString();
          $scope.concomitantMedication.__verifications.push({ action: 'unverified', timestamp: d });
          $scope.concomitantMedication.__comments.push({ 'text': $scope.commentText, userId: '', timestamp: d });
          $scope.commentText = '';
          $scope.message = "Comment added";
        }
      }, function(error) {
        messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
        $location.path('/');
      });
    };

    loadObjects();
    schemaService.loadSchema();
    schemaService.requiredFactory()
      .then(function(data){ $scope.required = data; });
    schemaService.notificationService().then(function(data){ $scope.notifications = data; });
    schemaService.labelFactory()
      .then(function(data){ $scope.labelService = data; });
  }])

.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider
      .when('/studyenrollments/:studyEnrollmentId/concomitant_medications/new', {
        templateUrl:    'components/concomitantMedications/form.html',
        controller:     'ConcomitantMedicationsController',
        resolve: {
          action: function() { return 'new'; }
        }
      })
      .when('/studyenrollments/:studyEnrollmentId/concomitant_medications/:concomitantMedicationId', {
        templateUrl:    'components/concomitantMedications/form.html',
        controller:     'ConcomitantMedicationsController',
        resolve: {
          action: function() { return 'show'; }
        }
      })
      .when('/studyenrollments/:studyEnrollmentId/concomitant_medications/:concomitantMedicationId/edit', {
        templateUrl:    'components/concomitantMedications/form.html',
        controller:     'ConcomitantMedicationsController',
        resolve: {
          action: function() { return 'edit'; }
        }
      });
  }]);
