'use strict';
angular.module('cqsFilters', [])
  .filter('initialsFilter', function(){
    return function(person){
      var first = person.first_initial;
      var middle = person.middle_initial;
      var last = person.last_initial;
      if (first === undefined) { first = '-'; }
      if (middle === undefined) { middle = '-'; }
      if (last === undefined) { last = '-'; }
      return first+' '+middle+' '+last;
    };
  });
