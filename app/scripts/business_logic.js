'use strict';

/**
 * A service for errors hash operations
 * @name hem1538App.factory:businessLogic
 */
angular.module('businessLogic', [])
.factory('businessLogic', function() {

  var service = {};

  service.isLockedDown = function(studyEnrollment, skipBaseline) {
    if (studyEnrollment.Eligibility && studyEnrollment.Eligibility.eligible === 'No') { return true; };
    var col = studyEnrollment.__signatures;
    if (col && col.length > 0 && col[col.length-1].action === 'signed') { return true; };
    var screeningVisits = [];
    var baseline = [];
    if (!skipBaseline) {
      if (studyEnrollment.Visits) {
        screeningVisits = studyEnrollment.Visits.filter(function(obj) { return obj.visit_type === 'Screening visit'; });
        if (screeningVisits.length > 0) {
          baseline = screeningVisits.filter(function(visit) {
            return visit.BaselineCovariates && visit.BaselineCovariates.id !== null && visit.BaselineCovariates.draftStatus === 'Complete';
          });
          return baseline.length === 0;
        }
      }
      return true;
    } else {
      return false;
    }
  };

  service.isSignable = function(studyEnrollment) {
    var result = true;
    //make new enrollments unsignable
    if (!studyEnrollment.Visits || studyEnrollment.Visits.length < 1) {
      result = false;
    } else {
      //all forms verified
      if (!studyEnrollment.__verifications || studyEnrollment.__verifications.length === 0 ||
          studyEnrollment.__verifications[studyEnrollment.__verifications.length - 1].action !== 'verified') {
        result = false;
      }
      var collections = ['MedicalHistories', 'ConcomitantMedications', 'Comments', 'Deviations'];
      angular.forEach(collections, function(collection) {
        angular.forEach(studyEnrollment[collection], function(item) {
          if (!item.__verifications || item.__verifications.length === 0 ||
              item.__verifications[item.__verifications.length-1].action !== 'verified') {
            result = false;
          }
        });
      });
      var forms = [
        'BaselineCovariates',
        'DrugAdministration',
        'ObservationsAndReviews',
        'ClinicalExam',
        'MPNSAFTSS',
        'Labs',
        'QuantitativeImmunoglobulins',
        'BiomarkerSpecimens',
        'PKSpecimens',
        'BoneMarrow',
        'CTScanDiagnostics',
        'DiseaseAssessment',
        'OffTreatmentDetails'
      ];
      angular.forEach(studyEnrollment.Visits, function(visit) {
        angular.forEach(forms, function(form) {
          if (visit[form] && (!visit[form].__verifications || visit[form].__verifications.length === 0 ||
              visit[form].__verifications[visit[form].__verifications.length-1].action !== 'verified')) {
            result = false;
          }
        });
      });
      angular.forEach(studyEnrollment.AdverseEvents, function(ae) {
        if (!ae.event.__verifications || ae.event.__verifications.length === 0 ||
            ae.event.__verifications[ae.event.__verifications.length-1].action !== 'verified') {
          result = false;
        }
        angular.forEach(ae.Followups, function(followup) {
          if (!followup.event.__verifications || followup.event.__verifications.length === 0 ||
              followup.event.__verifications[followup.event.__verifications.length-1].action !== 'verified') {
            result = false;
          }
        });
      });
      //EoS form or EoS-NP present
      var EoSVisit = studyEnrollment.Visits.filter(function(x) { return x.visit_type === 'End-of-study (EoS) visit'; });
      if (EoSVisit.length === 0) {
        result = false;
      }
      if (EoSVisit.length > 0 && EoSVisit[0].performed === 'Yes' && !EoSVisit[0].ObservationsAndReviews) {
        result = false;
      }
      //No unresolved SAEs
      angular.forEach(studyEnrollment.AdverseEvents, function(ae) {
        if (ae.Followups) {
          var last = ae.Followups[ae.Followups.length-1];
          if (last) {
            if (last.event.ongoing === 'Ongoing') { result = false; }
          }
        } else {
          if (ae.event.ongoing === 'Ongoing') { result = false; }
        }
      });
    }

    return result;
  };

  return service;
});
