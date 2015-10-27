'use strict';

/**
 * @ngdoc overview
 * @name hem1538App
 * @description
 * # hem1538App
 *
 * Main module of the application.
 */
angular.module('hem1538App', [
    'common.config',
    'main',
    'navigation',
    'authentication',
    'account',
    'users',
    'roles',
    'reports',
    'visitTypeForms',
    'aeSupportMod',
    'visitforms',
    'referenceranges',
    'studyenrollments',
    'concomitantMedications',
    'businessLogic',
    'errorMessagesHelper',
    'cqsDirectives',
    'loadingOverlay',
    'queryVerify',
    'schemaService',
    'authorization',
    'messagingService',
    'cqsdbProviders',
    'rangeService',
    'cqsFilters',
    'ui.bootstrap',
    'ui.bootstrap.tpls.custom',
    'medicalhistory',
    'comment',
    'visits',
    'adverseevents',
    'adverseEventDirectives',
    'deviation',
    'checklist-model'
  ])

  .config(['$compileProvider', function($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|data):/);
  }])

  .config(['cqsdbProviderProvider', 'configuration', function(cqsdb, config){
    cqsdb.setBaseUrl(config.cqsdbUrl);
    cqsdb.setApplicationId(config.applicationId);
  }])

  .config(['AuthenticationServiceProvider', 'configuration', function(auth, config) {
    auth.setBaseUrl(config.cqsdbUrl);
  }]);
