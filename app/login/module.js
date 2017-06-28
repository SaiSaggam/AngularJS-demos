"use strict";
angular.module('app.login', ['ui.router'])
    .config(function($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('login', {
                url: '/login',
                views: {
                    root: {
                        controller: 'loginController',
                        templateUrl: 'app/login/login.html'
                    }
                },
                resolve: {
                    config: ['BillsConfigService', function(BillsConfigService) {
                        return BillsConfigService.init();
                    }]
                }
            });
        $urlRouterProvider.otherwise('/login');
    });