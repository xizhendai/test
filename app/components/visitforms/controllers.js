'use strict';

/**
 * @ngdoc function
 * @name hem1538App.controller:CommentCtrl
 * @description
 * # CommentCtrl
 * Controller of the hem1538App
 */
angular.module('visitforms', ['ngRoute'])
.controller('FormCtrl',
  ['$scope', '$routeParams', 'cqsdbProvider', '$location', 'schemaService', 'messagingService', 'rangeService',
  'errorMessagesHelper', '$window', 'AuthorizationService', 'businessLogic', 'action',
  function ($scope, $routeParams, cqsdbProvider, $location, schemaService, messagingService, rangeService,
    errorMessagesHelper, $window, authorization, businessLogic, action) {
    //Attributes
    $scope.canEdit = false;
    $scope.canVerify = false;
    $scope.canComment = false;
    $scope.errors = {};
    $scope.messages = [];
    var api = cqsdbProvider('StudyEnrollments');
    $scope.visitId = $routeParams.visitId;
    $scope.formname = $routeParams.formname;
    $scope.form = {};
    $scope.visit = {};
    $scope.studyEnrollment = {};
    $scope.partialStudyEnrollment = { 'id': $routeParams.studyEnrollmentId, 'Visits': [ { 'id': $routeParams.visitId } ] }
    $scope.enum = {};
    $scope.inited = false;

    $scope.disabled = (action === 'show');
    
    $scope.autoFillForm = function () {
      if(!$scope.inited){
        return;
      }
      
      if ($scope.formname === 'ObservationsAndReviews') {
        var diagnosis = $scope.studyEnrollment.Visits[0].BaselineCovariates.diagnosis; 
        var ready1 = $scope.form.PRBC_performed_priorC1D1;
        if(ready1){
          $scope.form.Transfusion_PRBC = 'Transfusion-independent (PRBC)';
          if (diagnosis === 'Myelofibrosis (MF)' && 
              $scope.form.PRBC_performed_priorC1D1 === 'Yes' && 
              $scope.form.PRBC_units_priorC1D1 >= 6 &&
              $scope.visit.cycle_day_c === '1' &&
              $scope.visit.cycle_day_d === '1') {
            //it must be C1D1
            var c1d1date = new Date($scope.visit.visit_date);
            c1d1date.setDate(c1d1date.getDate() - 28);
            c1d1date.setHours(0, 0, 0, 0);
            var prbcdate = new Date($scope.form.PRBC_date_priorC1D1);
            prbcdate.setHours(0, 0, 0, 0);
            if (c1d1date < prbcdate) {
              $scope.form.Transfusion_PRBC = 'Transfusion-dependent (PRBC)';
            }
          }
        }
        if($scope.form.PRBC_performed_sinceC1D1){
          if (diagnosis === 'Myelofibrosis (MF)' && $scope.form.PRBC_performed_sinceC1D1 === 'Yes') {
            $scope.form.Transfusion_PRBC = 'Transfusion-dependent (PRBC)';
          }else{
            $scope.form.Transfusion_PRBC = 'Transfusion-independent (PRBC)';
          }
        }
        if($scope.form.PRBC_performed_8week_priorVisit){
          if (diagnosis === 'Myelodysplastic/myeloproliferative (MDS/MPN)' && $scope.form.PRBC_performed_8week_priorVisit === 'Yes') {
            $scope.form.Transfusion_PRBC = 'Transfusion-dependent (PRBC)';
          }else{
            $scope.form.Transfusion_PRBC = 'Transfusion-independent (PRBC)';
          } 
        }
        
        if($scope.form.PRBC_performed_12week_priorVisit){
          if (diagnosis === 'Myelofibrosis (MF)' && $scope.form.PRBC_performed_12week_priorVisit === 'Yes') {
            $scope.form.Transfusion_PRBC = 'Transfusion-dependent (PRBC)';
          }else{
            $scope.form.Transfusion_PRBC = 'Transfusion-independent (PRBC)';
          }
        }

        
        if (diagnosis === 'Myelodysplastic/myeloproliferative (MDS/MPN)') {
          if ($scope.form.PRBC_performed_4week_priorVisit === 'Yes') {
            $scope.form.Transfusion_platelets = 'Transfusion-dependent (platelets)';
          } else if ($scope.form.PRBC_performed_4week_priorVisit === 'No') {
            $scope.form.Transfusion_platelets = 'Transfusion-independent (platelets)';
          } else {
            $scope.form.Transfusion_platelets = undefined;
          }
        }
        
      } else if ($scope.formname === 'DrugAdministration') {
        if ($scope.visit.eot_completed === "Yes") {
          $scope.indicate_adjustment_fixed = true;
          $scope.form.indicate_adjustment_tgr1202 = "Yes";
          $scope.form.indicate_adjustment_Ruxolitinib = "Yes";
        } else {
          $scope.indicate_adjustment_fixed = false;
        }
      }
    }
    
    var processVisit = function () {
      if ($scope.visit.visit_type === 'Screening visit') {
        $scope.partialStudyEnrollment.Eligibility = {};
        if ($scope.formname === 'CTScanDiagnostics') {
          if ($scope.form.performed === 'No') {
            $scope.partialStudyEnrollment.Eligibility.eligible = 'No';
            $scope.partialStudyEnrollment.Eligibility.reason_ineligible = 'No baseline CT scan';
          } else if ($scope.form.performed === 'Yes' && $scope.studyEnrollment.Eligibility.reason_ineligible === 'No baseline CT scan') {
            $scope.partialStudyEnrollment.Eligibility.eligible = 'Yes';
            $scope.partialStudyEnrollment.Eligibility.reason_ineligible = undefined;
          }
        } else if ($scope.formname === 'BoneMarrow') {
          if ($scope.form.marrow_collected === 'No') {
            $scope.partialStudyEnrollment.Eligibility.eligible = 'No';
            $scope.partialStudyEnrollment.Eligibility.reason_ineligible = 'No baseline bone marrow core';
          } else if ($scope.form.marrow_collected === 'Yes' && $scope.studyEnrollment.Eligibility.reason_ineligible === 'No baseline bone marrow core') {
            $scope.partialStudyEnrollment.Eligibility.eligible = 'Yes';
            $scope.partialStudyEnrollment.Eligibility.reason_ineligible = undefined;
          }
        }
      }
    };
    
    var checkDiagnosis = function () {
      if ($scope.visit.visit_type === 'Screening visit' && $scope.formname === 'BaselineCovariates' && $scope.form.diagnosis !== $scope.diagnosisWas) {
        if(!$scope.partialStudyEnrollment.Visits){ $scope.partialStudyEnrollment.Visits = [] };
        angular.forEach($scope.studyEnrollment.Visits, function (visit) {
          var ids = $scope.partialStudyEnrollment.Visits.map(function(x){return x.id});
          if(ids.indexOf(visit.id) < 0){
            $scope.partialStudyEnrollment.Visits.push({id: visit.id});
          }
          var tmp = $scope.partialStudyEnrollment.Visits.filter(function(x){ return x.id === visit.id})[0];
          if(tmp){
            if (visit.ObservationsAndReviews){
              tmp.ObservationsAndReviews = {id: visit.ObservationsAndReviews.id, _delete: true};
            }
            if (visit.DiseaseAssessment){
              tmp.DiseaseAssessment = {id: visit.DiseaseAssessment.id, _delete: true};
            }
          }
        });
      }
    };
    
    $scope.setDraft = function(val){
      if(($scope.form.performed === 'No' || $scope.form.marrow_collected === 'No') && $scope.visit.visit_type === 'Screening visit'){
        $scope.form.draftStatus = val;
      }else{
        $scope.form.draftStatus = '';
      }
    };
    $scope.submit = function () {
      $scope.submitted = true;
      $window.scrollTo(0, 0);
      if($scope.formname === 'Labs'){
        if($scope.form.hematology_date_performed){
          var hemaRange = $scope.ranges($scope.studyEnrollment.site_name, $scope.form.hematology_date_performed);
          if(hemaRange){
            $scope.form.hematologyRangeId = hemaRange.id;
            $scope.form.hematologyRangeVersion = hemaRange.__version;
          }
        }
         
        if($scope.form.coagulation_date_performed){
          var coagRange = $scope.ranges($scope.studyEnrollment.site_name, $scope.form.coagulation_date_performed);
          if(coagRange){
            $scope.form.coagulationRangeId = coagRange.id;
            $scope.form.coagulationRangeVersion = coagRange.__version;
          }
        }
       
        if($scope.form.chemistry_date_performed){
          var chemRange = $scope.ranges($scope.studyEnrollment.site_name, $scope.form.chemistry_date_performed);
          if(chemRange){
            $scope.form.chemistryRangeId = chemRange.id;
            $scope.form.chemistryRangeVersion = chemRange.__version;
          }
        }
      
        if($scope.form.HbA1c_date_performed){
          var HbA1cRange = $scope.ranges($scope.studyEnrollment.site_name, $scope.form.HbA1c_date_performed);
          if(HbA1cRange){
            $scope.form.HbA1cRangeId = HbA1cRange.id;
            $scope.form.HbA1cRangeVersion = HbA1cRange.__version;
          }
        }
      }
      if($scope.formname === 'QuantitativeImmunoglobulins'){
        if($scope.form.date_of_blood_draw){
          var QIRange = $scope.ranges($scope.studyEnrollment.site_name, $scope.form.date_of_blood_draw);
          if(QIRange){
            $scope.form.rangeId = QIRange.id;
            $scope.form.rangeVersion = QIRange.__version;
          }
        }
      }
      
      $scope.errors = {};
      $scope.messages = [];
      processVisit();
      checkDiagnosis();
      api.update($scope.partialStudyEnrollment).then(function (result) {
        if (result && result.success === true) {
          messagingService.setMsg($scope.notifications('StudyEnrollments.Visits.' + $scope.formname, 'create'));
          $location.path('/studyenrollments/' + $scope.studyEnrollment.id).search({ 'tab': 'visitForms', 'visit': $routeParams.visitId });
        } else if (result && result.success === false) {
          if (result.errors instanceof Object) {
            $scope.messages = errorMessagesHelper.squash('', result.errors);
            if(result.errors.Visits){
              $scope.errors = $.grep(result.errors.Visits, function (visit) {
                return visit.id === ($scope.visit.id || "null");
              })[0][$scope.formname];
              if ($scope.errors) {
                $scope.errors = errorMessagesHelper.rehash($scope.errors);
              } else {
                $scope.errors = {};
              }
            }
          }
          $scope.submitted = false;
        }
      }, function(data) {
        messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
        $location.path('/');
      });
    };
    
    $scope.setDate = function (fieldName, asVisitDate) {
      if (asVisitDate) {
        $scope.form[fieldName] = $scope.visit.visit_date;
      } else {
        $scope.form[fieldName] = undefined;
      }
    };
    
    $scope.clearData = function (condition, fieldsClearOnTrue, fieldsClearOnFalse) {
      var $fields = condition?fieldsClearOnTrue:fieldsClearOnFalse;
      if ($fields !== undefined) {
        for (var $idx = 0; $idx < $fields.length; $idx++) {
          var $fieldName = $fields[$idx];
          $scope.form[$fieldName] = undefined;
        }
      }
    };
    
    var getDiagnosis = function () {
      var screeningVisit = $scope.studyEnrollment.Visits.filter(function (x) { return x.visit_type === 'Screening visit' });
      if (screeningVisit.length > 0 && screeningVisit[0].BaselineCovariates) {
        return angular.copy(screeningVisit[0].BaselineCovariates.diagnosis)
      } else {
        return '';
      }
    };
    
    $scope.verify = function(){
      var obj = { id: $scope.studyEnrollment.id, Visits: [{ id: $scope.visit.id }] };
      obj.Visits[0][$scope.formname] = { _verify: true };
      api.verify(obj).then(function(object){
        if (object.success) {
          if(!$scope.form.__verifications){ $scope.form.__verifications = []; }
          $scope.form.__verifications.push({action: 'verified', timestamp: new Date().toISOString()});
          $scope.message = $scope.formname + " verified successfully";
        }
      }, function(data){
        messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
        $location.path('/');
      });
    };

    $scope.comment = function() {
      var obj = { id: $scope.studyEnrollment.id, Visits: [{ id: $scope.visit.id }] };
      obj.Visits[0][$scope.formname] = { _commentText: $scope.commentText };
      api.comment(obj).then(function(response) {
        if (response.success) {
          if(!$scope.form.__comments){ $scope.form.__comments = []; }
          var d = new Date().toISOString();
          $scope.form.__verifications.push({ action: 'unverified', timestamp: d });
          $scope.form.__comments.push({ 'text': $scope.commentText, userId: '', timestamp: d });
          $scope.commentText = '';
          $scope.message = "Comment added";
        }
      }, function(error) {
        messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
        $location.path('/');
      });
    };

    $scope.isLockedDown = function(skipBaseline) {
      return businessLogic.isLockedDown($scope.studyEnrollment, skipBaseline);
    };

    api.get($routeParams.studyEnrollmentId).then(function (object) {
      $scope.studyEnrollment = object;
      if (action === 'edit') {
        if ($scope.isLockedDown(true)) {
          messagingService.setMsg('This record is locked for editing due to eligibility.');
          $location.path('/studyenrollments/'+object.id);
        }
        if ($scope.isLockedDown($scope.formname === 'BaselineCovariates')) {
          messagingService.setMsg('Please complete Baseline Covariates first.');
          $location.path('/studyenrollments/'+object.id);
        }
      }
      cqsdbProvider.Role.mine({}, function(roles) {
        schemaService.getPermissions('StudyEnrollments.Visits.'+$scope.formname).then(function(data) {
          $scope.canEdit = authorization.check(data, roles, 'update', object)
          if (action !== 'show' && !$scope.canEdit) {
            messagingService.setMsg('You can\'t do that.');
            $location.path('/studyenrollments/'+object.id);
          }
          $scope.canVerify = authorization.check(data, roles, 'verify', object);
          $scope.canComment = authorization.check(data, roles, 'comment', object);
        });
      });
      var idx = $routeParams.visitId;
      var visits = $.grep(object.Visits, function (visit) {
        return visit.id === idx;
      });
      if (visits.length > 0) {
        $scope.visit = visits[0];
        if ($scope.visit[$scope.formname] === undefined) {
          if (action === 'show') {
            $location.path('/studyenrollments/'+object.id).search({ 'tab': 'visitForms' });
          } else {
            $scope.visit[$scope.formname] = {};
          }
        }
        $scope.form = $scope.visit[$scope.formname];
        $scope.diagnosisWas = getDiagnosis(); //For comparing for change upon submission
        $scope.visit_type = $scope.visit.visit_type;
        if ($scope.visit.cycle_day_c !== undefined) {
          $scope.visit_type = $scope.visit_type + " : C" + $scope.visit.cycle_day_c + "D" + $scope.visit.cycle_day_d;
        }
        if ($scope.visit.eot_completed === "Yes") {
          $scope.visit_type = $scope.visit_type + " + EoT";
        }
        $scope.partialStudyEnrollment.Visits[0][$scope.formname] = $scope.form;
        schemaService.loadSchema();
        schemaService.getAllValues('StudyEnrollments.Visits.' + $scope.formname).then(function (data) {
          $scope.enum = data;
          if ($scope.formname === 'BaselineCovariates') {
            if ($scope.studyEnrollment.Details.trial_stage !== 'Expansion stage') {
              $scope.enum.diagnosis.splice(2);
            }
          } else if ($scope.formname === 'DrugAdministration') {
            if ($scope.visit.visit_type === "Dose adjustment by phone" || $scope.visit.eot_completed === "Yes") {
              $scope.dose_adjustment_fixed = true;
              $scope.enum.dose_adjustment.splice(1);
              $scope.form.dose_adjustment = $scope.enum.dose_adjustment[0];
            } else {
              $scope.dose_adjustment_fixed = false;
            }
            
            if ($scope.visit.eot_completed === "Yes") {
              $scope.dose_adjustment_type_fixed = true;
              $scope.enum.dose_adjustment_type = [$scope.enum.dose_adjustment_type[2]];
              $scope.form.dose_adjustment_type = $scope.enum.dose_adjustment_type[0];
            } else {
              $scope.dose_adjustment_type_fixed = false;
            }
          } else if ($scope.formname === 'BiomarkerSpecimens') {
            if ($scope.visit.visit_type !== "Screening visit") {
              $scope.enum.bm_sample_type.splice(0, 1);
            }
          }
        });
        schemaService.requiredFactory().then(function (data) { $scope.required = data; });
        schemaService.notificationService().then(function (data) { $scope.notifications = data; });
        schemaService.warningService().then(function (data) { $scope.warnings = data; });
        schemaService.labelFactory()
          .then(function(data){ $scope.labelService = data; });
        rangeService.then(function(data){ $scope.ranges = data });
        $scope.inited = true;
        $scope.autoFillForm();
      }
      else {
        $location.path('/studyenrollments/' + $routeParams.studyEnrollmentId).search({ 'tab': 'visitForms' });
      }
    }, function (data) {
      messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
      $location.path('/');
    });

    $scope.$watch('form.PCP_prophy_drug', function(newVal, oldVal){
      if (!$scope.disabled && (oldVal || action === 'new')) {
        if($scope.form.PCP_started === 'Yes' || $scope.form.PCP_changed === 'Yes'){
          if(newVal === 'Atovaquone' || newVal === 'Bactrim (trimethoprim-sulfamethoxazole)'){
            $scope.form.PCP_prophy_route = 'Oral';
          } else if (newVal === 'Pentamidine') {
            $scope.form.PCP_prophy_route = 'Inhaled';
          }else{
            $scope.form.PCP_prophy_route = undefined;
          }
        }
      }
    });

    $scope.outOfRange = function(field, value, date){
      var ranges;
      if($scope.ranges){ ranges = $scope.ranges($scope.studyEnrollment.site_name, date) };
      if(ranges){ 
        var lower = ranges[field].low_value;
        var upper = ranges[field].high_value;
        if(value !== '999' && value !== 999 && (value < lower || value > upper)){
          return true;
        }else{
          return false;
        }
      }else{
        return false;
      }
    };

    $scope.rangeWarnings = function(field, value, date){
      if($scope.outOfRange(field, value, date)){
        return ['The value you have entered for this lab is below lower limit of normal or above upper limit of normal. If this was a data entry error, please correct the error. If this value is correct, please answer the follow-up question(s) that appear below.'];
      }else{
        return [];
      }
    };
  }])
.config(['$routeProvider',
function ($routeProvider) {
    $routeProvider.
    when('/studyenrollments/:studyEnrollmentId/visits/:visitId/:formname', {
      templateUrl: function (param) {
        return 'components/visitforms/' + param.formname + '.html';
      },
      controller: 'FormCtrl',
      resolve: {
        action: function() { return 'show'; }
      }
    }).
    when('/studyenrollments/:studyEnrollmentId/visits/:visitId/:formname/edit', {
      templateUrl: function (param) {
        return 'components/visitforms/' + param.formname + '.html';
      },
      controller: 'FormCtrl',
      resolve: {
        action: function() { return 'edit'; }
      }
    });
  }]);
