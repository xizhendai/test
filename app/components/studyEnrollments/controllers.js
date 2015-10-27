'use strict';

/**
 * @ngdoc function
 * @name hem1538App.controller:StudyEnrollmentsCtrl
 * @description
 * # StudyEnrollmentsCtrl
 * Controller of the hem1538App
 */
angular.module('studyenrollments', ['ngRoute'])
  .controller('StudyEnrollmentsIndexCtrl',
  ['$scope', 'cqsdbProvider', '$location', '$filter', 'ngTableParams', 'messagingService', '$window', 'schemaService', 'AuthorizationService', 'businessLogic',
  function ($scope, cqsdbProvider, $location, $filter, ngTableParams, messagingService, $window, schemaService, authorization, businessLogic) {
    //Attributes
    $scope.canCreate = false;
    var api = cqsdbProvider('StudyEnrollments');
    $scope.studyEnrollments = [];
    $scope.message = messagingService.getMsg();
    $scope.searchText = '';

    //Methods
    $scope.objectSignedDate = function(object){
      var col = object && object.__signatures;
      return col && col.length > 0 && col[col.length-1].action === 'signed' && col[col.length-1].timestamp;
    };

    $scope.objectSigned = function(obj){
      var col = obj && obj.__signatures;
      return col && col.length > 0 && col[col.length-1].action === 'signed';
    };

    $scope.signable = businessLogic.isSignable;

    $scope.setupTable = function(){
      $scope.tableParams = new ngTableParams({
        page: 1,            // show first page
        count: 10,          // count per page
        sorting: {
          site_name: 'asc'     // initial sorting
        }
      }, {
        total: $scope.studyEnrollments.length, // length of data
        counts: [],
        defaultSort: 'asc',
        getData: function($defer, params) {
          // use build-in angular filter
          var orderBy = params.orderBy();
          if (orderBy[0] === "+hemid") {
            orderBy = ["+Details.patient_site_id","+Details.patient_study_id"];
          } else if (orderBy[0] === "-hemid") {
            orderBy = ["-Details.patient_site_id","-Details.patient_study_id"];
          }
          var orderedData = params.sorting() ?
            $filter('orderBy')($scope.studyEnrollments, orderBy) :
            $scope.studyEnrollments;
          $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
        }
      });
    };

    $scope.patientIdFilter = function() {
      return function(enrollment) {
        if ($scope.searchText === '') {
          return true;
        } else {
          var re = new RegExp($scope.searchText);
          var patientId = '1538-' + enrollment.Details.patient_site_id + '-' + enrollment.Details.patient_study_id;
          return re.test(patientId);
        }
      }
    };

    var loadStudyEnrollments = function(){
      api.list().then(function(objectList){
        if(objectList instanceof Array){
          $scope.studyEnrollments = objectList;
          $scope.setupTable();
          cqsdbProvider.Role.mine({}, function(roles) {
            schemaService.getPermissions('StudyEnrollments.Details').then(function(data) {
              $scope.canCreate = authorization.check(data, roles, 'create', {});
            });
            schemaService.getPermissions('StudyEnrollments').then(function(data) {
              $scope.canDelete = function(record) {
                return authorization.check(data, roles, 'delete', record);
              };
            });
            schemaService.getPermissions('StudyEnrollments').then(function(data) {
              $scope.canSign = function(record) {
                return authorization.check(data, roles, 'e_sign', record);
              };
            });
          });
        }
      }, function(error){
        messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
        $location.path('/');
      }).finally(function() {
        $scope.$broadcast('loading-complete');
      });
    };

    $scope.destroy = function(enrollment){
      if($window.confirm('Are you sure you want to delete this study enrollment?')){
        var ind = $scope.studyEnrollments.indexOf(enrollment);
        api.destroy(enrollment).then(function(response){
          if(response && response.success === true){
            $scope.studyEnrollments.splice(ind,1);
            $scope.tableParams.reload();
          }else if(response && response.success === false){
            var msg = "You can't do that.";
            messagingService.setMsg(msg);
            $location.path('/');
          }
        }, function(error) {
          messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
          $location.path('/');
        });
      }
    };

    $scope.revokeObject = function(obj){
      api.revoke({ id: obj.id }).then(function(response){
        if (response.success) {
          if(!obj.__signatures){ obj.__signatures = []; }
          obj.__signatures.push({ action: 'revoked', timestamp: new Date().toISOString() });
          $scope.message = "Study enrollment revoked successfully";
        }
      }, function(data){
        messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
        $location.path('/');
      });
    };

    $scope.signObject = function(obj){
      api.sign({ id: obj.id }).then(function(response){
        if (response.success) {
          if(!obj.__signatures){ obj.__signatures = []; }
          obj.__signatures.push({ action: 'signed', timestamp: new Date().toISOString() });
          $scope.message = "Study enrollment signed successfully";
        }
      }, function(data){
        messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
        $location.path('/');
      });
    };

    $scope.rowClick = function(path){
      $location.path(path);
    };

    //Initialization
    loadStudyEnrollments();
    schemaService.loadSchema();
    schemaService.labelFactory()
      .then(function(data){ $scope.labelService = data; });
  }])
  .controller('StudyEnrollmentsShowCtrl',
  ['$scope', '$routeParams', 'cqsdbProvider', '$location', 'AuthenticationService', 'schemaService',
  '$filter', 'visitTypeForms', 'messagingService', '$window', 'AuthorizationService', 'businessLogic', 'errorMessagesHelper',
  function ($scope, $routeParams, cqsdbProvider, $location, auth, schemaService,
    $filter, visitTypeForms, messagingService, $window, authorization, businessLogic, errorMessagesHelper) {
    //Attributes
    $scope.canEdit = false;
    $scope.canVerify = {};
    $scope.canComment = false;
    $scope.canAdd = {};
    $scope.canDelete = {};
    $scope.disabled = true;
    var api = cqsdbProvider('StudyEnrollments');
    var rangeApi = cqsdbProvider('ReferenceRanges');
    $scope.studyEnrollment = {};
    $scope.details = {};
    $scope.eligibility = {};
    $scope.trialStages = [];
    $scope.sites = [];
    $scope.message = messagingService.getMsg();
    $scope.admin = auth.admin;
    $scope.messages = [];

    $scope.tabs = {
      'logForms': { 'active': false },
      'visitForms': { 'active': false },
      'deviations': { 'active': false }
    };
    if ($scope.tabs[$routeParams.tab]) {
      $scope.tabs[$routeParams.tab].active = true;
    }
    $scope.activeVisit = $routeParams.visit;

    $scope.getWords = function (str) {
      return str ? str.split(/\s+/).slice(0, 4).join(' ') : '';
    }

    $scope.hasRanges = false;
    //Methods
    $scope.getRanges = function(){
      var ranges;
      rangeApi.list().then(function(object){
        $scope.ranges = object;
        if($scope.ranges && $scope.ranges.filter(function(x){
          return x.site_name === $scope.studyEnrollment.site_name && x.draftStatus === 'Complete';
        }).length > 0){
          $scope.hasRanges = true;
        }
      });
    };

    $scope.verifyObject = function(obj, objType, updateParams) {
      api.verify(updateParams).then(function(object){
        if (object.success) {
          if(!obj.__verifications){ obj.__verifications = []; }
          obj.__verifications.push({action: 'verified', timestamp: new Date().toISOString()});
          $scope.message = objType + " verified successfully";
        }
      }, function(data){
        messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
        $location.path('/');
      });
    };

    $scope.verify = function() {
      var obj = {id: $scope.studyEnrollment.id};
      if(!$scope.objectVerified($scope.studyEnrollment)){ obj._verify = true; }
      api.verify(obj).then(function(object){
        if (object.success) {
          if(!$scope.studyEnrollment.__verifications){ $scope.studyEnrollment.__verifications = []; }
          $scope.studyEnrollment.__verifications.push({action: 'verified', timestamp: new Date().toISOString()});
          $scope.message = "Study enrollment verified successfully";
        }
      }, function(data){
        messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
        $location.path('/');
      });
    };

    $scope.objectVerified = function(object) {
      var col = object && object.__verifications;
      return col && col.length > 0 && col[col.length-1].action === 'verified';
    };

    $scope.objectVerifiedDate = function(object){
      var col = object && object.__verifications;
      return col && col.length > 0 && col[col.length-1].action === 'verified' && col[col.length-1].timestamp;
    };

    $scope.comment = function() {
      var obj = { id: $scope.studyEnrollment.id, _commentText: $scope.commentText };
      api.comment(obj).then(function(response) {
        if (response.success) {
          if(!$scope.studyEnrollment.__comments){ $scope.studyEnrollment.__comments = []; }
          var d = new Date().toISOString();
          $scope.studyEnrollment.__verifications.push({ action: 'unverified', timestamp: d });
          $scope.studyEnrollment.__comments.push({ 'text': $scope.commentText, userId: '', timestamp: d });
          $scope.commentText = '';
          $scope.message = "Comment added";
        }
      }, function(error) {
        messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
        $location.path('/');
      });
    };

    $scope.isLockedDown = function(skipBaseline){
      return businessLogic.isLockedDown($scope.studyEnrollment, skipBaseline);
    };

    $scope.visitTitle = function(visit){
      var visitTitle = visit.visit_type;
      if(visit.visit_type ==='Treatment period visit'){
        if(visit.eot_completed === 'Yes') visitTitle += " (with EoT) ";
        if(visit.cycle_day_c) visitTitle += " C"+visit.cycle_day_c;
        if(visit.cycle_day_d) visitTitle += "D"+visit.cycle_day_d;
      }else if(['End-of-treatment (EoT) visit', 'End-of-study (EoS) visit'].indexOf(visit.visit_type) >= 0){
        if(visit.performed === 'No') visitTitle += " (not performed)";
      }
      visitTitle += ": "+visit.visit_date;
      return visitTitle;
    };

    $scope.canAddVisits = function(skipBaseline){
      var screeningVisits = [];
      var baseline = [];
      if($scope.isLockedDown(skipBaseline)){return false;}
      if($scope.studyEnrollment.Visits){
        screeningVisits = $scope.studyEnrollment.Visits.filter(function(obj){ return obj.visit_type == 'Screening visit'});
        if(screeningVisits.length > 0){
          baseline = screeningVisits.filter(function(visit){
            return visit.BaselineCovariates && visit.BaselineCovariates.id !== null && visit.BaselineCovariates.draftStatus === 'Complete';
          });
          return baseline.length > 0;
        }else{
          return true;
        }
      }else{
        return true;
      }
    };

    $scope.forms = function(visit){
      if(['Treatment period visit', 'Screening visit'].indexOf(visit.visit_type) >= 0){
        var requiredForms = [];
        var x = parseInt(visit.cycle_day_c);
        var y = parseInt(visit.cycle_day_d);
        var collection;
        if(visit.eot_completed === 'Yes'){
          collection = visitTypeForms['TP+EoT'];
        }else{
          collection = visitTypeForms[visit.visit_type];
        }

        angular.forEach(collection, function(form){
          if(eval(form.conditions)){
            requiredForms.push(form);
          }
        });
        return requiredForms;
      }else if(visit.visit_type === 'End-of-treatment (EoT) visit' && visit.performed === 'No'){
        return visitTypeForms['EoT:NP'];
      }else if(visit.visit_type === 'End-of-study (EoS) visit' && visit.performed === 'No'){
        return [];
      }else{
        return visitTypeForms[visit.visit_type];
      }
    };

    var loadStudyEnrollment = function(){
      api.get($routeParams.id).then(function(object){
        $scope.studyEnrollment = object;
        cqsdbProvider.Role.mine({}, function(roles) {
          schemaService.getPermissions('StudyEnrollments').then(function(data) {
            $scope.canVerify.StudyEnrollments = authorization.check(data, roles, 'verify', object);
            $scope.canComment = authorization.check(data, roles, 'comment', object);
          });
          schemaService.getPermissions('StudyEnrollments.Details').then(function(data) {
            $scope.canEdit = authorization.check(data, roles, 'update', object);
          });
          schemaService.getPermissions('StudyEnrollments.MedicalHistories').then(function(data) {
            $scope.canAdd.MedicalHistories = authorization.check(data, roles, 'update', object);
            $scope.canDelete.MedicalHistories = authorization.check(data, roles, 'delete', object);
            $scope.canVerify.MedicalHistories = authorization.check(data, roles, 'verify', object);
          });
          schemaService.getPermissions('StudyEnrollments.ConcomitantMedications').then(function(data) {
            $scope.canAdd.ConcomitantMedications = authorization.check(data, roles, 'update', object);
            $scope.canDelete.ConcomitantMedications = authorization.check(data, roles, 'delete', object);
            $scope.canVerify.ConcomitantMedications = authorization.check(data, roles, 'verify', object);
          });
          schemaService.getPermissions('StudyEnrollments.Comments').then(function(data) {
            $scope.canAdd.Comments = authorization.check(data, roles, 'update', object);
            $scope.canDelete.Comments = authorization.check(data, roles, 'delete', object);
            $scope.canVerify.Comments = authorization.check(data, roles, 'verify', object);
          });
          schemaService.getPermissions('StudyEnrollments.Visits').then(function(data) {
            $scope.canAdd.Visits = authorization.check(data, roles, 'update', object);
            $scope.canDelete.Visits = authorization.check(data, roles, 'delete', object);
            $scope.canVerify.Visits = authorization.check(data, roles, 'verify', object);
          });
          schemaService.getPermissions('StudyEnrollments.Visits.BaselineCovariates').then(function(data) {
            $scope.canVerify.BaselineCovariates = authorization.check(data, roles, 'verify', object);
          });
          schemaService.getPermissions('StudyEnrollments.Visits.ObservationsAndReviews').then(function(data) {
            $scope.canVerify.ObservationsAndReviews = authorization.check(data, roles, 'verify', object);
          });
          schemaService.getPermissions('StudyEnrollments.Visits.CTScanDiagnostics').then(function(data) {
            $scope.canVerify.CTScanDiagnostics = authorization.check(data, roles, 'verify', object);
          });
          schemaService.getPermissions('StudyEnrollments.Visits.QuantitativeImmunoglobulins').then(function(data) {
            $scope.canVerify.QuantitativeImmunoglobulins = authorization.check(data, roles, 'verify', object);
          });
          schemaService.getPermissions('StudyEnrollments.Visits.DiseaseAssessment').then(function(data) {
            $scope.canVerify.DiseaseAssessment = authorization.check(data, roles, 'verify', object);
          });
          schemaService.getPermissions('StudyEnrollments.Visits.BiomarkerSpecimens').then(function(data) {
            $scope.canVerify.BiomarkerSpecimens = authorization.check(data, roles, 'verify', object);
          });
          schemaService.getPermissions('StudyEnrollments.Visits.BoneMarrow').then(function(data) {
            $scope.canVerify.BoneMarrow = authorization.check(data, roles, 'verify', object);
          });
          schemaService.getPermissions('StudyEnrollments.Visits.Labs').then(function(data) {
            $scope.canVerify.Labs = authorization.check(data, roles, 'verify', object);
          });
          schemaService.getPermissions('StudyEnrollments.Visits.PKSpecimens').then(function(data) {
            $scope.canVerify.PKSpecimens = authorization.check(data, roles, 'verify', object);
          });
          schemaService.getPermissions('StudyEnrollments.Visits.OffTreatmentDetails').then(function(data) {
            $scope.canVerify.OffTreatmentDetails = authorization.check(data, roles, 'verify', object);
          });
          schemaService.getPermissions('StudyEnrollments.Visits.DrugAdministration').then(function(data) {
            $scope.canVerify.DrugAdministration = authorization.check(data, roles, 'verify', object);
          });
          schemaService.getPermissions('StudyEnrollments.Visits.ClinicalExam').then(function(data) {
            $scope.canVerify.ClinicalExam = authorization.check(data, roles, 'verify', object);
          });
          schemaService.getPermissions('StudyEnrollments.Visits.MPNSAFTSS').then(function(data) {
            $scope.canVerify.MPNSAFTSS = authorization.check(data, roles, 'verify', object);
          });
          schemaService.getPermissions('StudyEnrollments.Deviations').then(function(data) {
            $scope.canAdd.Deviations = authorization.check(data, roles, 'update', object);
            $scope.canDelete.Deviations = authorization.check(data, roles, 'delete', object);
            $scope.canVerify.Deviations = authorization.check(data, roles, 'verify', object);
          });
        });
        if (!$scope.studyEnrollment.Details) {
          $scope.studyEnrollment.Details = $scope.details;
        } else {
          $scope.details = $scope.studyEnrollment.Details;
        }
        if (!$scope.studyEnrollment.Eligibility) {
          $scope.studyEnrollment.Eligibility = $scope.eligibility;
        } else {
          $scope.eligibility = $scope.studyEnrollment.Eligibility;
        }
        $scope.initials = $filter('initialsFilter')($scope.details);
        $scope.getRanges();
        $scope.studyEnrollmentRaw = btoa(unescape(encodeURIComponent(JSON.stringify(object))));
      }, function(data){
        messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
        $location.path('/');
      });
    };

    $scope.destroy = function(){
      api.destroy($scope.studyEnrollment).then(function(response){
        if(response.success === true){
          $location.path('/studyenrollments');
        }
      });
    };

    $scope.rowClick = function (path) {
      $location.path(path);
    };

    $scope.deleteResource = function(resourceType, resource){
      if($window.confirm('Are you sure you want to delete this ' + resourceType + '?')){
        var partialStudyEnrollment = { 'id': $scope.studyEnrollment.id }
        partialStudyEnrollment[resourceType] = [{ 'id': resource.id, '_delete': true }];
        api.update(partialStudyEnrollment).then(function(result){
          console.log(result.errors);
          if(result.success === true){
            $scope.studyEnrollment[resourceType].splice($scope.studyEnrollment[resourceType].indexOf(resource), 1);
            $location.path('/studyenrollments/'+$scope.studyEnrollment.id);
          }else if(result.success === false){
            if (result.errors instanceof Object) {
              $scope.errors = result.errors;
            }
            $scope.messages = errorMessagesHelper.squash('', result.errors);
            if ($scope.errors) {
              $scope.errors = errorMessagesHelper.rehash($scope.errors);
            } else {
              $scope.errors = {};
            }
            $scope.submitted = false;
          }
        }, function(data){
          messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
          $location.path('/');
        });
      }
    };

    $scope.deleteVisitForm = function(visit, formName){
      if ($window.confirm('Are you sure you want to clear the data in the ' + formName + ' form?')) {
        var partialStudyEnrollment = { 'id': $scope.studyEnrollment.id, 'Visits': [{ 'id': visit.id }] };
        partialStudyEnrollment.Visits[0][formName] = { '_delete': true };
        if(formName === "BaselineCovariates"){
          angular.forEach($scope.studyEnrollment.Visits, function (visit) {
            var tmp = {id: visit.id};
            var changed = false;
            if (visit.ObservationsAndReviews){
              tmp.ObservationsAndReviews = {id: visit.ObservationsAndReviews.id, _delete: true };
              changed = true;
            }
            if (visit.DiseaseAssessment){
              tmp.DiseaseAssessment = {id: visit.DiseaseAssessment.id, _delete: true };
              changed = true;
            }
            if(changed){ partialStudyEnrollment.Visits.push(tmp); }
          });
        }
        api.update(partialStudyEnrollment).then(function(result){
          if(result.success === true){
            visit[formName] = undefined;
            $location.path('/studyenrollments/'+$scope.studyEnrollment.id).search({'tab':'visitForms', 'visit':visit.id});
          }else if(result.success === false){
            if (result.errors instanceof Object) {
              $scope.errors = result.errors;
            }
            $scope.submitted = false;
          }
        }, function(data){
          messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
          $location.path('/');
        });
      }
    };

    //Initialization
    schemaService.loadSchema();
    loadStudyEnrollment();
    schemaService.getValues('StudyEnrollments.site_name')
      .then(function(data){ $scope.sites = data; });
    schemaService.getValues('StudyEnrollments.Details.trial_stage')
      .then(function(data){ $scope.trialStages = data; });
    schemaService.labelFactory()
      .then(function(data){ $scope.labelService = data; });
  }])
  .controller('StudyEnrollmentsEditCtrl',
  ['$scope', '$routeParams', 'cqsdbProvider', '$location',
  'schemaService', 'action', 'messagingService', 'errorMessagesHelper', '$window', 'AuthorizationService',
  function ($scope, $routeParams, cqsdbProvider, $location,
    schemaService, action, messagingService, errorMessagesHelper, $window, authorization) {
    //Attributes
    $scope.disabled = false;
    var api = cqsdbProvider('StudyEnrollments');
    $scope.details = {};
    $scope.eligibility = {};
    $scope.studyEnrollment = { 'id': $routeParams.id, 'Details': $scope.details, 'Eligibility': $scope.eligibility };
    $scope.errors = {};
    $scope.messages = [];
    $scope.sites = [];
    $scope.trialStages = [];

    //Methods
    $scope.prepareInitials = function(){
      if($scope.details.first_initial){
        $scope.details.first_initial = $scope.details.first_initial[0].toUpperCase();
      }
      if($scope.details.middle_initial){
        $scope.details.middle_initial = $scope.details.middle_initial[0].toUpperCase();
      }
      if($scope.details.last_initial){
        $scope.details.last_initial = $scope.details.last_initial[0].toUpperCase();
      }
    };

    var loadStudyEnrollment = function(){
      api.get($routeParams.id).then(function(object){
        $scope.studyEnrollment.site_name = object.site_name;
        cqsdbProvider.Role.mine({}, function(roles) {
          schemaService.getPermissions('StudyEnrollments.Details').then(function(data) {
            if(!authorization.check(data, roles, 'update', object)) {
              messagingService.setMsg('You can\'t do that.');
              $location.path('/studyenrollments/'+object.id);
            }
          });
        });
        if (object.Details) {
          $scope.details = object.Details;
          $scope.studyEnrollment.Details = $scope.details;
        }
        if (object.Eligibility) {
          $scope.eligibility = object.Eligibility;
          $scope.studyEnrollment.Eligibility = $scope.eligibility;
        }
      }, function(data){
        messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
        $location.path('/');
      });
    };

    $scope.submit = function(){
      $scope.submitted = true;
      $window.scrollTo(0,0);
      $scope.errors = [];
      $scope.prepareInitials();
      api.update($scope.studyEnrollment).then(function(result){
        if(result && result.success === true){
          messagingService.setMsg(result.message);
          $location.path('/studyenrollments/'+$scope.studyEnrollment.id);
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

    //Initialization
    $scope.action = action;
    schemaService.loadSchema();
    loadStudyEnrollment();
    schemaService.getValues('StudyEnrollments.site_name')
      .then(function(data){ $scope.sites = data; });
    schemaService.getValues('StudyEnrollments.Details.trial_stage')
      .then(function(data){ $scope.trialStages = data; });
    schemaService.requiredFactory()
      .then(function(data){ $scope.required = data; });
    schemaService.labelFactory()
      .then(function(data){ $scope.labelService = data; });
  }])
  .controller('StudyEnrollmentsNewCtrl',
    ['$scope', 'cqsdbProvider', '$location', 'schemaService', 'action', 'messagingService', 'errorMessagesHelper', '$window', 'AuthorizationService',
    function($scope, cqsdbProvider, $location, schemaService, action, messagingService, errorMessagesHelper, $window, authorization) {
    //Attributes
    $scope.disabled = false;
    var api = cqsdbProvider('StudyEnrollments');
    $scope.details = {};
    $scope.eligibility = { 'eligible': 'Yes' };
    $scope.studyEnrollment = { 'Details': $scope.details, 'Eligibility': $scope.eligibility };
    $scope.messages = [];
    $scope.errors = {};
    $scope.sites = [];
    $scope.trialStages = [];

    //Methods
    $scope.prepareInitials = function(){
      if($scope.details.first_initial){
        $scope.details.first_initial = $scope.details.first_initial[0].toUpperCase();
      }
      if($scope.details.middle_initial){
        $scope.details.middle_initial = $scope.details.middle_initial[0].toUpperCase();
      }
      if($scope.details.last_initial){
        $scope.details.last_initial = $scope.details.last_initial[0].toUpperCase();
      }
    };

    $scope.submit = function(){
      $scope.submitted = true;
      $window.scrollTo(0,0);
      $scope.errors = [];
      //prepare the enrollment to be submitted
      $scope.prepareInitials();
      $scope.eligibility.eligible = 'Yes';

      //submit the enrollment
      api.create($scope.studyEnrollment).then(function(result){
        if (result && result.success === true) {
          $scope.studyEnrollment.id = result.id;
          messagingService.setMsg(result.message);
          $location.path('/studyenrollments/'+$scope.studyEnrollment.id);
        } else if (result && result.success === false) {
          if (result.errors instanceof Object) {
            $scope.messages = errorMessagesHelper.squash('', result.errors);
            $scope.errors = errorMessagesHelper.rehash($scope.messages, true);
            $scope.submitted = false;
          }
        }
      }, function(data) {
        messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
        $location.path('/');
      });
    };

    //Initialization
    $scope.action = action;
    schemaService.loadSchema();
    cqsdbProvider.Role.mine({}, function(roles) {
      schemaService.getPermissions('StudyEnrollments.Details').then(function(data) {
        if(!authorization.check(data, roles, 'create', {})) {
          messagingService.setMsg('You can\'t do that.');
          $location.path('/studyenrollments');
        }
      });
    }, function(error) {
      messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
      $location.path('/');
    });
    schemaService.getValues('StudyEnrollments.site_name')
      .then(function(data){
        $scope.sites = data;
        if (data.length === 1) {
          $scope.studyEnrollment.site_name = data[0];
        }
      });
    schemaService.getValues('StudyEnrollments.Details.trial_stage')
      .then(function(data){ $scope.trialStages = data; });
    schemaService.requiredFactory()
      .then(function(data){ $scope.required = data; });
    schemaService.labelFactory()
      .then(function(data){ $scope.labelService = data; });
  }])
  .config(['$routeProvider',
    function($routeProvider){
      $routeProvider.
        when('/studyenrollments', {
          templateUrl:  'components/studyEnrollments/index.html',
          controller:   'StudyEnrollmentsIndexCtrl'
        }).
        when('/studyenrollments/new', {
          templateUrl:  'components/studyEnrollments/form.html',
          controller:   'StudyEnrollmentsNewCtrl',
          resolve: {
            action: function () {
              return 'new';
            }
          }
        }).
        when('/studyenrollments/:id/edit', {
          templateUrl:  'components/studyEnrollments/form.html',
          controller:   'StudyEnrollmentsEditCtrl',
          resolve: {
            action: function () {
              return 'edit';
            }
          }
        }).
        when('/studyenrollments/:id', {
          templateUrl:  'components/studyEnrollments/show.html',
          controller:   'StudyEnrollmentsShowCtrl'
        });
    }
  ]);
