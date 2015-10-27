'use strict';

angular.module('queryVerify', [])

.directive('queryVerify', function() {
  return {
    restrict: 'E',
    scope: {
      object: '=',
      isDisabled: '=',
      canVerify: '@',
      canQuery: '@',
      canComment: '@',
      verify: '&',
      comment: '&',
      commentText: '='
    },
    templateUrl: 'views/directives/queryVerify.html',
    link: function(scope, element, attr) {

      scope.isVerified = function() {
        var v = scope.object && scope.object.__verifications;
        return v && v.length > 0 && v[v.length - 1].action === 'verified';
      };

      scope.verifiedDate = function() {
        var v = scope.object && scope.object.__verifications;
        return v && v.length > 0 && v[v.length - 1].action === 'verified' && v[v.length - 1].timestamp;
      };

      scope.hasComments = function() {
        return scope.object && scope.object.__comments && scope.object.__comments.length > 0;
      };

      scope.isQueried = function() {
        if (!scope.isVerified()) {
          var v = scope.object && scope.object.__verifications;
          var c = scope.object && scope.object.__comments;
          if (!v || v.length === 0) {
            return c && c.length > 0;
          } else {
            var ud = v[v.length - 1].timestamp;
            var c1 = c.filter(function(z) { return z.timestamp >= ud; });
            return c1.length > 0;
          }
        } else {
          return false;
        }
      };

      scope.queriedDate = function() {
        if (scope.isQueried) {
          var v = scope.object && scope.object.__verifications;
          var c = scope.object && scope.object.__comments;
          if (!v || v.length === 0) {
            return c && c.length > 0 && c[0].timestamp.substring(0,10);
          } else {
            var ud = v[v.length - 1].timestamp;
            var c1 = c.filter(function(z) { return z.timestamp >= ud; });
            return c1 && c1.length > 0 && c1[0].timestamp;
          }
        } else {
          return false;
        }
      };

    }
  };
});
