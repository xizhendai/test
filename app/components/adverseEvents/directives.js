'use strict';
angular.module('adverseEventDirectives', [])
.directive('adverseEvent', function(){
  return {
    restrict: 'E',
    templateUrl: 'components/adverseEvents/aeform.html'
  };
})
.directive('showAdverseEvent', function(){
  return {
    restrict: 'E',
    scope: {
      form: '=adverseEvent',
      disabled: '=isdisabled',
      enum: '=enum',
      isFollowup: '=isFollowup',
      eventTypeGrades: '=grades',
      required: '=requiredfunction',
      category_types: '=categorytypes',
      studyEnrollment: '=studyEnrollment'
    },
    templateUrl: 'components/adverseEvents/aeform.html'
  };
})
.directive('aeId', function(){
  return {
    restrict: 'E',
    scope: {
      pid: '=aeid'
    },
    template: '<span>SAE-{{display}}</span>',
    link: function(scope, element, attr){
      scope.$watch(
        function(){
          return scope.pid;
        }, function(v){
          var pad = "0000";
          scope.display = angular.copy(scope.pid)+"";
          scope.display = pad.substring(0, pad.length - scope.display.length) + scope.display;
        }
      );
    }
  };
})
;
