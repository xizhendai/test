'use strict';
angular.module('rangeService', ['cqsdbProviders'])
.factory('rangeService', function(cqsdbProvider){
  var _api = cqsdbProvider('ReferenceRanges');
  return _api.list().then(function(ranges){
    return function(siteName, date){
      var activeRanges;
      activeRanges = ranges.filter(function(x){
        return x.siteName === siteName && x.startDate < date && (!x.endDate || date < x.endDate);
      });
      return activeRanges[0];
    };
  });
});
