"use strict";
angular.module('app.login').controller('loginController', loginController);
loginController.$inject = ['$scope', '$state'];

function loginController(scope, $state) {
    scope.login = function() {
        console.log('Login Called');
        var isValidLogin = isValidUser();
        if (isValidLogin) {
            navigateToSuccess();
        } else {
            scope.message = "Invalid User";
        }
    }

    function isValidUser() {
        var isValid = false;
        if (_.isUndefined(scope.username)) {
            isValid = false
        } else {
            if (scope.username) {
                isValid = true;
            } else {
                isValid = false;
            }
        }
        return isValid;
    }

    function navigateToSuccess() {
        $state.go('success');
    }
}
