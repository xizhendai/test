'use strict';

angular.module('reports', ['ngRoute'])

.controller('ReportsController', ['$scope', '$location', 'cqsdbProvider', 'schemaService', '$timeout',
  function($scope, $location, cqsdbProvider, schemaService, $timeout) {
    var api = cqsdbProvider('StudyEnrollments');

    $scope.selectedReport = {};
    $scope.reportStart = null;
    $scope.reportEnd = null;
    $scope.sitesSelected = [];
    $scope.sitesList = [];
    $timeout(function() {
      $scope.$broadcast('loading-complete')
    }, 250);

    var loadReports = function() {
      schemaService.getReports('StudyEnrollments').then(function(data) {
        $scope.reports = data;
      });

      schemaService.getValues('StudyEnrollments.site_name').then(function(sites) {
        $scope.sitesList = sites;
      });
    };

    $scope.aSiteSelected = function() {
      return $scope.sitesSelected.length != 0;
    };

    $scope.showDates = function(reportName) {
      if (reportName == null || reportName == "verify") {
        return false;
      } else {
        return true;
      }
    };

    $scope.submit = function() {
      $scope.$broadcast('loading-started')

      var sites = [],
          dateRange = {},
          params = {},
          object = { name: $scope.selectedReport.name };

      angular.extend(params, { site_name : { "$in" : $scope.sitesSelected } });

      switch(object.name) {
        case "ae":
        case "sae":
          dateRange.AdverseEvents = {
            $elemMatch : {
              $and : [
                { 'event.start_date' : { $gte : $scope.reportStart } },
                { 'event.start_date' : { $lte : $scope.reportEnd } }
              ]
            }
          };
          break;
        case "verify":
          break;
        case "deviation":
          dateRange.Deviations = {
            $elemMatch : {
              $and : [
                { discovered_date : { $gte : $scope.reportStart } },
                { discovered_date : { $lte : $scope.reportEnd } }
              ]
            }
          };
          break;
      };
      angular.extend(params, dateRange);

      object.params = params;

      api.reports(object).then(function (data) {
        var dateStr = new Date().toJSON().substring(0, 10);
        var title = $scope.selectedReport.title.replace(' ', '_');
        var reportName = 'hem_1538_' + title + '_report_' + dateStr + '.pdf';
        $scope.$broadcast('loading-complete');
        saveAs(data, reportName);
      });
    };

    //Initialization
    schemaService.loadSchema();
    loadReports();
  }])

.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider
      .when('/reports', {
        templateUrl: 'common/reports/form.html',
        controller: 'ReportsController'
      })
  }])
