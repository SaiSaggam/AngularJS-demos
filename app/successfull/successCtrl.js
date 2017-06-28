"use strict";

angular.module('app.success').controller('SuccessController', SuccessController);
SuccessController.$inject = ['$scope', '$state'];

function SuccessController(scope, $state) {
    scope.toBillCalc = function() {
        console.log('Success Page -- Bill Calculation Called');
        $state.go('billCalc')
    }
}
