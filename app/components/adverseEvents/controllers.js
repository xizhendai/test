'use strict';
angular.module('adverseevents', ['ngRoute', 'ngTable'])
.controller('AdverseEventsIndexCtrl',
    ['$scope', 'cqsdbProvider', '$location', '$filter', 'ngTableParams', '$routeParams', 'categoryTypes',
    'messagingService', '$window', 'schemaService', 'AuthorizationService', 'businessLogic',
    function($scope, cqsdbProvider, $location, $filter, ngTableParams, $routeParams, categoryTypes,
      messagingService, $window, schemaService, authorization, businessLogic){
      //Variables
      $scope.canAdd = false;
      $scope.canEdit = false;
      $scope.canDelete = false;
      var api = cqsdbProvider('StudyEnrollments');
      $scope.studyEnrollment = {};
      $scope.events = [];
      $scope.seriousAdverseEvents = [];
      $scope.adverseEvents = [];
      $scope.category_types = categoryTypes;
      $scope.message = messagingService.getMsg();

      //Methods
      $scope.isLockedDown = function(skipBaseline){
        return businessLogic.isLockedDown($scope.studyEnrollment, skipBaseline);
      };

      var loadStudyEnrollment = function() {
        api.get($routeParams.studyEnrollmentId).then(function(object) {
          $scope.studyEnrollment = object;

          if (object.AdverseEvents) {
            $.map(object.AdverseEvents, function(ae){
              var tmp = ae.event;
              var type = $.grep($scope.category_types, function(type){
                return type.category === tmp.event_category;
              })[0].type;

              tmp.event_type = tmp[type+'_event_type'];
              tmp.id = ae.id;
              $scope.events.push(tmp);
            });
          }

          $scope.adverseEvents = $.grep($scope.events, function(evnt){
            return evnt.serious === 'No';
          });

          $scope.seriousAdverseEvents = $.grep($scope.events, function(evnt){
            return evnt.serious === 'Yes';
          });

          $scope.eventsTableParams = new ngTableParams({
            page: 1,            // show first page
            count: 5,          // count per page
            sorting: {
              name: 'asc'     // initial sorting
            }
          }, {
            total: $scope.adverseEvents.length, // length of data
            counts: [],
            defaultSort: 'asc',
            getData: function($defer, params) {
              // use build-in angular filter
              var orderedData = params.sorting() ?
                $filter('orderBy')($scope.adverseEvents, params.orderBy()) :
                $scope.adverseEvents;
          $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
            }
          });

          $scope.seriousTableParams = new ngTableParams({
            page: 1,            // show first page
            count: 5,          // count per page
            sorting: {
              name: 'asc'     // initial sorting
            }
          }, {
            total: $scope.seriousAdverseEvents.length, // length of data
            counts: [],
            defaultSort: 'asc',
            getData: function($defer, params) {
              // use build-in angular filter
              var orderedData = params.sorting() ?
                $filter('orderBy')($scope.seriousAdverseEvents, params.orderBy()) :
                $scope.seriousAdverseEvents;
              $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
            }
          });

          cqsdbProvider.Role.mine({}, function(roles) {
            schemaService.getPermissions('StudyEnrollments.AdverseEvents').then(function(data) {
              $scope.canAdd = $scope.canEdit = authorization.check(data, roles, 'update', object);
              $scope.canDelete = authorization.check(data, roles, 'delete', object);
            });
          });
        }, function(data){
          messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
          $location.path('/');
        });
      };

      $scope.deleteEvent = function(resource){
        if($window.confirm('Are you sure you want to delete this adverse event?')){
          var partialStudyEnrollment = { 'id': $scope.studyEnrollment.id, 'AdverseEvents': [{ 'id': resource.id, '_delete': true }] };
          api.update(partialStudyEnrollment).then(function(result){
            if(result.success === true){
              var evnt = $scope.adverseEvents.filter(function(x){ return x.id === resource.id})[0];
              $scope.adverseEvents.splice($scope.studyEnrollment.AdverseEvents.indexOf(evnt), 1);
              $scope.eventsTableParams.reload();
              $location.path('/studyenrollments/'+$scope.studyEnrollment.id+'/adverseevents');
            }else if(result.success === false){
              if (result.errors instanceof Object) {
                $scope.errors = result.errors;
                $scope.submitted = false;
              }
            }
          });
        }
      };

      $scope.rowClick = function(path){
        $location.path(path);
      };

      //Initialization
      schemaService.loadSchema();
      loadStudyEnrollment();
    }])
.controller('AdverseEventsCtrl',
    ['$scope', '$routeParams', 'cqsdbProvider', '$location', 'schemaService', 'toxicityGrades',
    'categoryTypes', 'messagingService', 'errorMessagesHelper', '$window', 'AuthorizationService',
    'businessLogic', 'action', '$filter',
    function($scope, $routeParams, cqsdbProvider, $location, schemaService, toxicityGrades,
      categoryTypes, messagingService, errorMessagesHelper, $window, authorization,
      businessLogic, action, $filter) {
      //Atributes
      $scope.canAdd = false;
      $scope.canVerifyBase = false;
      $scope.canVerifyFollowup = false;
      $scope.canCommentBase = false;
      $scope.canCommentFollowup = false;
      $scope.action = action;
      $scope.disabled = action === 'show';
      $scope.errors = {};
      $scope.messages = [];
      var api = cqsdbProvider('StudyEnrollments');
      $scope.studyEnrollment = {};
      $scope.partialStudyEnrollment = { 'id': $routeParams.studyEnrollmentId, 'AdverseEvents': [] };
      $scope.adverseEvent = {};
      $scope.toxicityGrades = toxicityGrades;
      $scope.eventTypeGrades = ['Please select an Event category and type'];
      $scope.category_types = categoryTypes;
      $scope.isFollowup = false;
      $scope.message = messagingService.getMsg();
      $scope.commentText = {};
      $scope.activeFollowup = $routeParams.followup;

      //methods
      $scope.verifyObject = function(obj, objType, updateParams){
        var params = {
          id: $scope.studyEnrollment.id,
          AdverseEvents: []
        };
        if(objType === 'Adverse event'){
          params.AdverseEvents.push(updateParams);
        }else{
          params.AdverseEvents.push({id: $scope.adverseEvent.id, Followups: []});
          params.AdverseEvents[0].Followups.push(updateParams);
        }
        api.verify(params).then(function(object){
          if (object.success) {
            if(!obj.__verifications){ obj.__verifications = []};
            obj.__verifications.push({action: 'verified', timestamp: new Date().toISOString()});
            $scope.message = objType + " verified successfully";
          }
        }, function(data){
          messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
          $location.path('/');
        });
      };

      $scope.comment = function() {
        var obj = { id: $scope.studyEnrollment.id, AdverseEvents: [{ id: $scope.adverseEvent.id, event: { '_commentText': $scope.commentText[0] } }] };
        api.comment(obj).then(function(response) {
          if (response.success) {
            if(!$scope.adverseEvent.event.__comments){ $scope.adverseEvent.event.__comments = []; }
            var d = new Date().toISOString();
            $scope.adverseEvent.event.__verifications.push({ action: 'unverified', timestamp: d });
            $scope.adverseEvent.event.__comments.push({ 'text': $scope.commentText[0], userId: '', timestamp: d });
            $scope.commentText[0] = '';
            $scope.message = "Comment added";
          }
        }, function(error) {
          messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
          $location.path('/');
        });
      };

      $scope.commentFollowup = function(idx, followup){
        var obj = { id: $scope.studyEnrollment.id, AdverseEvents: [{ id: $scope.adverseEvent.id, Followups: [{ id: followup.id, event: { '_commentText': $scope.commentText[idx] } }] }] };
        api.comment(obj).then(function(response) {
          if (response.success) {
            if(!followup.event.__comments){ followup.event.__comments = []; }
            var d = new Date().toISOString();
            followup.event.__verifications.push({ action: 'unverified', timestamp: d });
            followup.event.__comments.push({ 'text': $scope.commentText[idx], userId: '', timestamp: d });
            $scope.commentText[idx] = '';
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

      $scope.getGrades = function(){
        if($scope.adverseEvent && $scope.adverseEvent.event){
          var thing = $scope.category_types.filter(function(obj){ return obj.category === $scope.adverseEvent.event.event_category; })[0];
          var eventType = (thing ? thing.type+'_event_type' : '');
          $scope.eventTypeGrades = ($scope.adverseEvent.event ? $scope.toxicityGrades[$scope.adverseEvent.event[eventType]] : '');
        }
      };

      $scope.isDead = function(){
        if($scope.enum && $scope.adverseEvent && $scope.adverseEvent.event){
          var deathIndex = $scope.enum.serious_reason.indexOf('Death');
          if($scope.adverseEvent.event.grade ==='5'){
            $scope.adverseEvent.event.serious = 'Yes';
            $scope.adverseEvent.event.serious_reason = 'Death';
            $scope.adverseEvent.event.ongoing = 'Resolved';
            if(deathIndex === -1){
              $scope.enum.serious_reason.push('Death');
            }
          }else{
            if(deathIndex !== -1){
              $scope.enum.serious_reason.splice(deathIndex, 1);
            }
          }
        }
      };

      var loadStudyEnrollment = function() {
        api.get($routeParams.studyEnrollmentId).then(function(object) {
          $scope.studyEnrollment = object;
          $scope.grandparent = $scope.studyEnrollment;
          if (action === 'edit' || action === 'new') {
            if ($scope.isLockedDown(true)) {
              messagingService.setMsg('This record is locked for editing due to eligibility.');
              $location.path('/studyenrollments/'+object.id);
            }
            if ($scope.isLockedDown()) {
              messagingService.setMsg('Please complete Baseline Covariates first.');
              $location.path('/studyenrollments/'+object.id);
            }
          }
          if(action === 'new'){
          }else if($routeParams.adverseEventId){
            var idx = $routeParams.adverseEventId;
            var eventById = $.grep(object.AdverseEvents, function(event){
              return event.id === idx;
            });
            if(eventById.length > 0){
              $scope.adverseEvent = eventById[0];
            } else {
              $location.path('/studyenrollments/'+$routeParams.studyEnrollmentId);
            }
            if($scope.adverseEvent.serious === 'Yes') {
              // Can't edit serious AE
              $location.path('/studyenrollments/'+$routeParams.studyEnrollmentId+'/adverseevents/'+$routeParams.adverseEventId);
            }
          }
          $scope.partialStudyEnrollment.AdverseEvents.push($scope.adverseEvent);
          $scope.form = $scope.adverseEvent;
          cqsdbProvider.Role.mine({}, function(roles) {
            schemaService.getPermissions('StudyEnrollments.AdverseEvents').then(function(data) {
              if ((action === 'new' || action === 'edit') && !authorization.check(data, roles, 'update', object) || (action === 'edit' && $scope.adverseEvent.event.serious === "Yes")) {
                messagingService.setMsg('You can\'t do that.');
                $location.path('/studyenrollments/' + $routeParams.studyEnrollmentId + '/adverseevents/' + $routeParams.adverseEventId);
              }
              $scope.canAdd = authorization.check(data, roles, 'update', object);
              $scope.canVerifyBase = authorization.check(data, roles, 'verify', object);
              $scope.canCommentBase = authorization.check(data, roles, 'comment', object);
            });
            schemaService.getPermissions('StudyEnrollments.AdverseEvents.Followups').then(function(data) {
              $scope.canVerifyFollowup = authorization.check(data, roles, 'verify', object);
              $scope.canCommentFollowup = authorization.check(data, roles, 'comment', object);
            });
          });
        }, function(data){
          messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
          $location.path('/');
        });
      };

      $scope.submit = function() {
        $scope.submitted = true;
        $window.scrollTo(0,0);
        if(action === 'new'){
          $scope.adverseEvent.event.followup_date = $filter('date')(new Date(), 'yyyy-MM-dd');
          $scope.adverseEvent.event.followup_comment = 'Initial entry';
        }
        $scope.errors = {};
        $scope.messages = [];
        api.update($scope.partialStudyEnrollment).then(function(result) {
          if (result && result.success === true) {
            messagingService.setMsg($scope.notifications('StudyEnrollments.AdverseEvents', 'create'));
            $location.path('/studyenrollments/'+$scope.studyEnrollment.id+'/adverseevents');
          }else if(result && result.success === false) {
            $scope.submitted = false;
            if (result.errors instanceof Object) {
              if(result.errors.AdverseEvents){
                $scope.errors = $.grep(result.errors.AdverseEvents, function(evt) {
                  return evt.id === ($scope.adverseEvent.id || "null");
                })[0];
              }
              $scope.messages = errorMessagesHelper.squash('', result.errors);
              if ($scope.errors) {
                $scope.errors = errorMessagesHelper.rehash($scope.errors);
              } else {
                $scope.errors = {};
              }
            }
          }
        }, function(data) {
          messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
          $location.path('/');
        });
      };

      $scope.hasFollowups = function(){
        return $scope.adverseEvent && $scope.adverseEvent.Followups && $scope.adverseEvent.Followups.length > 0
      };

      //initialization
      schemaService.loadSchema();
      loadStudyEnrollment();
      schemaService.getAllValues('StudyEnrollments.components.adverse_event')
        .then(function(data){ $scope.enum = data; });
      schemaService.requiredFactory()
        .then(function(data){ $scope.required = data; });
      schemaService.notificationService().then(function(data){ $scope.notifications = data; });
      schemaService.warningService().then(function(data){ $scope.warnings = data });
      schemaService.labelFactory()
        .then(function(data){ $scope.labelService = data; });
    }])
.controller('FollowupsCtrl',
    ['$scope', '$routeParams', 'cqsdbProvider', '$location', 'schemaService', 'toxicityGrades',
    'categoryTypes','messagingService', 'errorMessagesHelper', '$window', 'AuthorizationService',
    'businessLogic', '$filter',
    function($scope, $routeParams, cqsdbProvider, $location, schemaService, toxicityGrades,
      categoryTypes, messagingService, errorMessagesHelper, $window, authorization,
      businessLogic, $filter) {
      //Atributes
      $scope.disabled = false;
      $scope.errors = {};
      $scope.messages = [];
      var api = cqsdbProvider('StudyEnrollments');
      $scope.studyEnrollment = {};
      $scope.partialStudyEnrollment = { 'id': $routeParams.studyEnrollmentId, 'AdverseEvents': [ { 'id': $routeParams.adverseEventId, 'Followups': [] } ] };
      $scope.adverseEvent = {};
      $scope.followup = {};
      $scope.toxicityGrades = toxicityGrades;
      $scope.eventTypeGrades = ['Please select an Event category and type'];
      $scope.category_types = categoryTypes;
      $scope.isFollowup = true;

      //methods
      $scope.isLockedDown = function(skipBaseline){
        return businessLogic.isLockedDown($scope.studyEnrollment, skipBaseline);
      };

      $scope.getGrades = function(){
        if($scope.followup && $scope.followup.event){
          var thing = $scope.category_types.filter(function(obj){ return obj.category === $scope.followup.event.event_category; })[0];
          var eventType = (thing ? thing.type+'_event_type' : '');
          $scope.eventTypeGrades = ($scope.followup.event ? $scope.toxicityGrades[$scope.followup.event[eventType]] : '');
        }
      };

      $scope.isDead = function(){
        if($scope.followup && $scope.followup.event && $scope.enum){
          var deathIndex = $scope.enum.serious_reason.indexOf('Death');
          if($scope.form.event.grade ==='5'){
            $scope.form.event.serious = 'Yes';
            $scope.form.event.serious_reason = 'Death';
            $scope.form.event.ongoing = 'Resolved';
            if(deathIndex === -1){
              $scope.enum.serious_reason.push('Death');
            }
          }else{
            if(deathIndex !== -1){
              $scope.enum.serious_reason.splice(deathIndex, 1);
            }
          }
        }
      };

      var loadStudyEnrollment = function() {
        api.get($routeParams.studyEnrollmentId).then(function(object) {
          $scope.studyEnrollment = object;
          if ($scope.isLockedDown(true)) {
            messagingService.setMsg('This record is locked for editing due to eligibility.');
            $location.path('/studyenrollments/'+object.id);
          }
          if ($scope.isLockedDown()) {
            messagingService.setMsg('Please complete Baseline Covariates first.');
            $location.path('/studyenrollments/'+object.id);
          }
          var idx = $routeParams.adverseEventId;
          var eventById = $.grep(object.AdverseEvents, function(event){
            return event.id === idx;
          });
          if(eventById.length > 0){
            $scope.adverseEvent = eventById[0];
            $scope.grandparent = $scope.adverseEvent;
          } else {
            $location.path('/studyenrollments/'+$routeParams.studyEnrollmentId);
          }
          if($scope.adverseEvent.serious === 'No') {
            // Can't add followups to non-serious AE
            $location.path('/studyenrollments/'+$routeParams.studyEnrollmentId+'/adverseevents/'+$routeParams.adverseEventId);
          }
          $scope.copyEvent();
          $scope.form = $scope.followup;
          $scope.partialStudyEnrollment.AdverseEvents[0].Followups.push($scope.followup);
          cqsdbProvider.Role.mine({}, function(roles) {
            schemaService.getPermissions('StudyEnrollments.AdverseEvents.Followups').then(function(data) {
              if (!authorization.check(data, roles, 'update', object)) {
                messagingService.setMsg('You can\'t do that.');
                $location.path('/studyenrollments/' + $routeParams.studyEnrollmentId + '/adverseevents/' + $routeParams.adverseEventId);
              }
            });
          });
        }, function(data){
          messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
          $location.path('/');
        });
      };

      $scope.copyEvent = function(){
        if($scope.adverseEvent.Followups && $scope.adverseEvent.Followups.length > 0){
          $scope.followup.event = angular.copy($scope.adverseEvent.Followups[$scope.adverseEvent.Followups.length -1].event);
        }else{
          $scope.followup.event = angular.copy($scope.adverseEvent.event);
        }
        $scope.followup.event.followup_date = $filter('date')(new Date(), 'yyyy-MM-dd');
        $scope.followup.event.followup_comment = '';
      };

      $scope.submit = function() {
        $scope.submitted = true;
        $window.scrollTo(0,0);
        $scope.errors = {};
        $scope.messages = [];
        api.update($scope.partialStudyEnrollment).then(function(result) {
          if (result && result.success === true) {
            $location.path('/studyenrollments/'+$scope.studyEnrollment.id+'/adverseevents/'+$scope.adverseEvent.id);
          }else if(result && result.success === false) {
            if (result.errors instanceof Object) {
              $scope.errors = $.grep(result.errors.AdverseEvents, function(event) {
                return event.id === ($scope.adverseEvent.id || "null");
              })[0];
              if ($scope.errors) {
                if($scope.errors.Followups){
                  $scope.errors = $.grep($scope.errors.Followups, function(followup) {
                    return followup.id === ($scope.followup.id || "null");
                  })[0];
                }
                $scope.messages = errorMessagesHelper.squash('', result.errors);
                if ($scope.errors) {
                  $scope.errors = errorMessagesHelper.rehash($scope.errors);
                } else {
                  $scope.errors = {};
                }
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
      };

      $scope.hasFollowups = function(){
        return $scope.adverseEvent && $scope.adverseEvent.Followups && $scope.adverseEvent.Followups.length > 0
      };
      //initialization
      schemaService.loadSchema();
      loadStudyEnrollment();
      schemaService.getAllValues('StudyEnrollments.components.adverse_event')
        .then(function(data){ $scope.enum = data; });
      schemaService.requiredFactory()
        .then(function(data){ $scope.required = data; });
      schemaService.warningService().then(function(data){ $scope.warnings = data });
      schemaService.labelFactory()
        .then(function(data){ $scope.labelService = data; });
    }])
.config(['$routeProvider',
    function($routeProvider){
      $routeProvider
  .when('/studyenrollments/:studyEnrollmentId/adverseevents',{
    templateUrl:  'components/adverseEvents/index.html',
    controller:   'AdverseEventsIndexCtrl'
  })
  .when('/studyenrollments/:studyEnrollmentId/adverseevents/new',{
    templateUrl:  'components/adverseEvents/form.html',
    controller:   'AdverseEventsCtrl',
    resolve: {
      action: function () { return 'new'; }
    }
  })
  .when('/studyenrollments/:studyEnrollmentId/adverseevents/:adverseEventId',{
    templateUrl:  'components/adverseEvents/show.html',
    controller:   'AdverseEventsCtrl',
    resolve: {
      action: function () { return 'show'; }
    }
  })
  .when('/studyenrollments/:studyEnrollmentId/adverseevents/:adverseEventId/edit',{
    templateUrl:  'components/adverseEvents/form.html',
    controller:   'AdverseEventsCtrl',
    resolve: {
      action: function () { return 'edit'; }
    }
  })
  .when('/studyenrollments/:studyEnrollmentId/adverseevents/:adverseEventId/followups/new',{
    templateUrl:  'components/adverseEvents/followupForm.html',
    controller:   'FollowupsCtrl'
  });
}]);
