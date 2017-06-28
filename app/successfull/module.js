"use strict";
angular.module('app.success', ['ui.router'])
    .config(function($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('success', {
                url: '/success',
                views: {
                    root: {
                        controller: 'SuccessController',
                        templateUrl: 'app/successfull/success.html'
                    }
                }
            });

    });
