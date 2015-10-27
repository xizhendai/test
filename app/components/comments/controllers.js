'use strict';

/**
 * @ngdoc function
 * @name hem1538App.controller:CommentCtrl
 * @description
 * # CommentCtrl
 * Controller of the hem1538App
 */
angular.module('comment', ['ngRoute'])
.controller('CommentCtrl',
  ['$scope', '$routeParams', 'cqsdbProvider', '$location', 'action', 'messagingService', 'schemaService',
  "AuthenticationService", 'errorMessagesHelper', '$window', 'AuthorizationService', 'businessLogic',
  function ($scope, $routeParams, cqsdbProvider, $location, action, messagingService, schemaService,
    auth, errorMessagesHelper, $window, authorization, businessLogic) {
    //Attributes
    $scope.canEdit = false;
    $scope.canVerify = false;
    $scope.canComment = false;
    $scope.disabled = (action === 'show');
    var api = cqsdbProvider('StudyEnrollments');
    $scope.studyEnrollment = {};
    $scope.partialStudyEnrollment = { 'id': $routeParams.studyEnrollmentId, 'Comments': [] };
    $scope.commentForm = {};
    $scope.errors = {};
    $scope.messages = [];
    $scope.username = function() { return auth.username(); };

    //Methods
    $scope.isLockedDown = function(skipBaseline){
      return businessLogic.isLockedDown($scope.studyEnrollment, skipBaseline);
    };

    var initialize = function () {
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
        if(action === 'new'){
        }else{
          var idx = $routeParams.commentId;
          var coms = $.grep(object.Comments, function(com){
            return com.id === idx;
          });
          if (coms.length > 0) {
            $scope.commentForm = coms[0];
          } else {
            $location.path('/studyenrollments/' + $routeParams.studyEnrollmentId);
          }
        }
        $scope.partialStudyEnrollment.Comments.push($scope.commentForm);
      }, function(data){
        messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
        $location.path('/');
      });
    };

    $scope.submit = function () {
      $scope.submitted = true;
      $window.scrollTo(0,0);
      if(action === 'new'){
        $scope.commentForm.enteredBy = $scope.username();
      }
      $scope.errors = {};
      $scope.messages = [];
      api.update($scope.partialStudyEnrollment).then(function (result) {
        if (result && result.success === true) {
          messagingService.setMsg($scope.notifications('StudyEnrollments.Comments', 'create'));
          $location.path('/studyenrollments/' + $scope.studyEnrollment.id).search({ 'tab': 'logForms' });;
        } else if (result && result.success === false) {
          if (result.errors instanceof Object) {
            $scope.errors = $.grep(result.errors.Comments, function(cmt) {
              return cmt.id === ($scope.commentForm.id || "null");
            })[0];
            $scope.messages = errorMessagesHelper.squash('', result.errors);
            if ($scope.errors) {
              $scope.errors = errorMessagesHelper.rehash($scope.errors);
            } else {
              $scope.errors = {};
            }
          }
          $scope.submitted = false;
        }
      }, function(data){
        messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
        $location.path('/');
      });
    };

    $scope.verify = function(){
      var obj = { id: $scope.studyEnrollment.id, Comments: [{ id: $scope.commentForm.id, _verify: true}] };
      api.verify(obj).then(function(object){
        if (object.success) {
          if(!$scope.commentForm.__verifications){ $scope.commentForm.__verifications = []; }
          $scope.commentForm.__verifications.push({action: 'verified', timestamp: new Date().toISOString()});
          $scope.message = "Comment verified successfully";
        }
      }, function(data){
        messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
        $location.path('/');
      });
    };

    $scope.comment = function() {
      var obj = { id: $scope.studyEnrollment.id, Comments: [{ id: $scope.commentForm.id, _commentText: $scope.commentText }] };
      api.comment(obj).then(function(response) {
        if (response.success) {
          if(!$scope.commentForm.__comments){ $scope.commentForm.__comments = []; }
          var d = new Date().toISOString();
          $scope.commentForm.__verifications.push({ action: 'unverified', timestamp: d });
          $scope.commentForm.__comments.push({ 'text': $scope.commentText, userId: '', timestamp: d });
          $scope.commentText = '';
          $scope.message = "Comment added";
        }
      }, function(error) {
        messagingService.setMsg("There was an error communicating with the server. Please try again later or contact support if the problem persists.");
        $location.path('/');
      });
    };

    //Initialization
    initialize();
    schemaService.loadSchema();
    schemaService.notificationService().then(function(data){ $scope.notifications = data; });
    schemaService.labelFactory()
      .then(function(data){ $scope.labelService = data; });
  }])
.config(['$routeProvider',
  function ($routeProvider) {
    $routeProvider.
    when('/studyenrollments/:studyEnrollmentId/comments/new', {
      templateUrl: 'components/comments/form.html',
      controller: 'CommentCtrl',
      resolve: {
        action: function () {
          return 'new';
        }
      }
    }).
    when('/studyenrollments/:studyEnrollmentId/comments/:commentId', {
      templateUrl: 'components/comments/form.html',
      controller: 'CommentCtrl',
      resolve: {
        action: function () {
          return 'show';
        }
      }
    }).
    when('/studyenrollments/:studyEnrollmentId/comments/:commentId/edit', {
      templateUrl: 'components/comments/form.html',
      controller: 'CommentCtrl',
      resolve: {
        action: function () {
          return 'edit';
        }
      }
    });
  }]);
