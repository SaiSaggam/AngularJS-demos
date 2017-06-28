"use strict";
angular.module('app.billCalc', ['ui.router'])
    .config(function($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('billCalc', {
                url: '/bills',
                views: {
                    root: {
                        controller: 'BillCalcController',
                        templateUrl: 'app/billCalc/billCalc.html'
                    }
                },
                resolve: {
                    config: ['BillsConfigService', function(BillsConfigService) {
                        return BillsConfigService.init();
                    }]
                }
            });

    });
