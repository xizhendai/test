'use strict';

angular.module('visits', ['ngRoute'])
.controller('VisitsNewCtrl',
  ['$scope', '$routeParams', 'cqsdbProvider', '$location', 'schemaService', 'messagingService',
  'errorMessagesHelper', '$window', 'AuthorizationService', 'businessLogic',
  function ($scope, $routeParams, cqsdbProvider, $location, schemaService, messagingService,
    errorMessagesHelper, $window, authorization, businessLogic) {
    //variables
    $scope.canVerify = false;
    $scope.canComment = false;
    $scope.disabled = false;
    $scope.errors = {};
    $scope.messages = [];
    $scope.visitTypes = [];
    $scope.notPerformedReasons = [];
    var api = cqsdbProvider('StudyEnrollments');
    $scope.visit = {};
    $scope.partialStudyEnrollment = {'id': $routeParams.studyEnrollmentId, 'Visits': [ $scope.visit ] }
    $scope.studyEnrollment = {};
    
    //methods
    $scope.isLockedDown = function(skipBaseline){
      return businessLogic.isLockedDown($scope.studyEnrollment, skipBaseline);
    };

    var loadStudyEnrollment = function () {
      api.get($routeParams.studyEnrollmentId).then(function (object) {
        $scope.studyEnrollment = object;
        if ($scope.isLockedDown(true)) {
          messagingService.setMsg('This record is locked for editing due to eligibility.');
          $location.path('/studyenrollments/'+object.id);
        }
        if ($scope.isLockedDown() && (object.Visits && object.Visits.length > 0)) {
          messagingService.setMsg('Please complete Baseline Covariates first.');
          $location.path('/studyenrollments/'+object.id);
        }
        cqsdbProvider.Role.mine({}, function(roles) {
          schemaService.getPermissions('StudyEnrollments.Visits').then(function(data) {
            if (!authorization.check(data, roles, 'update', object)) {
              messagingService.setMsg('You can\'t do that.');
              $location.path('/studyenrollments/'+object.id);
            }
          });
        });
        $scope.getTypes();
        if (!$scope.studyEnrollment.Visits) {
          $scope.studyEnrollment.Visits = [];
        }
        $scope.studyEnrollment.Visits.push($scope.visit);
      }, function(data){
        messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
        $location.path('/');
      });
    };
    
    $scope.submit = function () {
      $scope.submitted = true;
      $window.scrollTo(0,0);
      $scope.errors = [];
      $scope.messages = [];
      $scope.setCycleDay();
      api.update($scope.partialStudyEnrollment).then(function(result) {
        if (result && result.success === true) {
          messagingService.setMsg($scope.notifications('StudyEnrollments.Visits', 'create'));
          $location.path('/studyenrollments/'+$scope.studyEnrollment.id).search({'tab': 'visitForms'});
        } else if (result && result.success === false) {
          if (result.errors instanceof Object) {
            if(result.errors.Visits){
              $scope.errors = $.grep(result.errors.Visits, function(visit) {
                return visit.id === ($scope.visit.id || "null");
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
      });
    };
    
    $scope.setCycleDay = function () {
      if ($scope.visit.visit_type === 'Treatment period visit') {
        var visits_c = ['1', '1', '1', '1', '2', '2', '2', '2', '3', '3', '4', '4'];
        var visits_d = ['1', '8', '15', '22', '1', '8', '15', '22', '1', '15', '1', '15'];
        var treatmentPeriodVisits = $.grep($scope.studyEnrollment.Visits,
          function (e) {
          if (e.visit_type === 'Treatment period visit') {
            return true;
          }
        });
        var visitNumber = treatmentPeriodVisits.indexOf($scope.visit);
        if (visitNumber < 12) {
          $scope.visit.cycle_day_c = visits_c[visitNumber];
          $scope.visit.cycle_day_d = visits_d[visitNumber];
        } else {
          $scope.visit.cycle_day_c = (visitNumber - 7).toString();
          $scope.visit.cycle_day_d = '1';
        }
      }
    };
    
    $scope.getTypes = function () {
      var types;
      schemaService.getValues('StudyEnrollments.Visits.visit_type').then(function (data) {
        types = data;
        var screeningVisits = $scope.studyEnrollment.Visits.filter(function (obj) { return obj.visit_type == 'Screening visit' });
        var eotVisits = $scope.studyEnrollment.Visits.filter(function (obj) { return obj.visit_type == 'End-of-treatment (EoT) visit' });
        var eosVisits = $scope.studyEnrollment.Visits.filter(function (obj) { return obj.visit_type == 'End-of-study (EoS) visit' });
        var tpEotComplete = $scope.studyEnrollment.Visits.filter(function (obj) { return obj.visit_type == 'Treatment period visit' && obj.eot_completed == 'Yes' });
        if (screeningVisits.length > 0) {
          types.splice(types.indexOf('Screening visit'), 1)
        } else {
          types = ['Screening visit'];
          $scope.visit.visit_type = 'Screening visit';
        }
        if (eotVisits.length > 0) { types.splice(types.indexOf('End-of-treatment (EoT) visit'), 1) }
        if (eosVisits.length > 0) { types.splice(types.indexOf('End-of-study (EoS) visit'), 1) }
        if (tpEotComplete.length > 0) {
          types.splice(types.indexOf('End-of-treatment (EoT) visit'), 1);
          types.splice(types.indexOf('Treatment period visit'), 1);
        }
        $scope.visitTypes = types;
      });
    };
    
    $scope.verify = function(){};

    $scope.comment = function() {};

    //Initialization
    loadStudyEnrollment();
    schemaService.loadSchema();
    schemaService.getValues('StudyEnrollments.Visits.not_performed_reason')
      .then(function (data) { $scope.notPerformedReasons = data; });
    schemaService.requiredFactory().then(function (data) { $scope.required = data; });
    schemaService.notificationService().then(function (data) { $scope.notifications = data; });
    schemaService.warningService().then(function (data) { $scope.warnings = data; });
    schemaService.labelFactory()
      .then(function(data){ $scope.labelService = data; });
    
  }])
.controller('VisitsShowCtrl',
  ['$scope', '$routeParams', 'cqsdbProvider', '$location', 'schemaService', 'AuthorizationService', 'businessLogic',
  function ($scope, $routeParams, cqsdbProvider, $location, schemaService, authorization, businessLogic) {
    //variables
    $scope.canVerify = false;
    $scope.canComment = false;
    $scope.disabled = true;
    $scope.visit = {};
    $scope.errors = {};
    $scope.messages = [];
    $scope.visitTypes = [];
    $scope.notPerformedReasons = [];
    var api = cqsdbProvider('StudyEnrollments');
    $scope.studyEnrollment = {};
    
    //methods
    var loadStudyEnrollment = function () {
      api.get($routeParams.studyEnrollmentId).then(function (object) {
        $scope.studyEnrollment = object;
        var idx = $routeParams.visitId;
        var visits = $.grep(object.Visits, function (visit) {
          return visit.id === idx;
        });
        if (visits.length > 0) {
          $scope.visit = visits[0];
        } else {
          $location.path('/studyenrollments/' + $routeParams.studyEnrollmentId);
        }
        cqsdbProvider.Role.mine({}, function(roles) {
          schemaService.getPermissions('StudyEnrollments.Visits').then(function(data) {
            $scope.canVerify = authorization.check(data, roles, 'verify', object);
            $scope.canComment = authorization.check(data, roles, 'comment', object);
          });
        });
      }, function(data){
        messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
        $location.path('/');
      });
    };
    
    $scope.verify = function(){
      var obj = { id: $scope.studyEnrollment.id, Visits: [{ id: $scope.visit.id, _verify: true}] };
      api.verify(obj).then(function(object){
        if (object.success) {
          if(!$scope.visit.__verifications){ $scope.visit.__verifications = []; }
          $scope.visit.__verifications.push({action: 'verified', timestamp: new Date().toISOString()});
          $scope.message = "Visit verified successfully";
        }
      }, function(data){
        messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
        $location.path('/');
      });
    };

    $scope.comment = function() {
      var obj = { id: $scope.studyEnrollment.id, Visits: [{ id: $scope.visit.id, '_commentText': $scope.commentText }] };
      api.comment(obj).then(function(response) {
        if (response.success) {
          if(!$scope.visit.__comments){ $scope.visit.__comments = []; }
          var d = new Date().toISOString();
          $scope.visit.__verifications.push({ action: 'unverified', timestamp: d });
          $scope.visit.__comments.push({ 'text': $scope.commentText, userId: '', timestamp: d });
          $scope.commentText = '';
          $scope.message = "Comment added";
        }
      }, function(error) {
        messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
        $location.path('/');
      });
    };

    //Initialization
    loadStudyEnrollment();
    schemaService.loadSchema();
    schemaService.getValues('StudyEnrollments.Visits.visit_type')
      .then(function (data) { $scope.visitTypes = data; });
    schemaService.getValues('StudyEnrollments.Visits.not_performed_reason')
      .then(function (data) { $scope.notPerformedReasons = data; });
    schemaService.requiredFactory().then(function (data) { $scope.required = data; });
    schemaService.labelFactory()
      .then(function(data){ $scope.labelService = data; });
  }])
.config(['$routeProvider',
  function ($routeProvider) {
    $routeProvider.
      when('/studyenrollments/:studyEnrollmentId/visits/new', {
      templateUrl: 'components/visits/form.html',
      controller: 'VisitsNewCtrl'
    })
      .when('/studyenrollments/:studyEnrollmentId/visits/:visitId', {
      templateUrl: 'components/visits/form.html',
      controller: 'VisitsShowCtrl'
    });
  }]);
