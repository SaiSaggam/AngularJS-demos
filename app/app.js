var app = angular.module("app", ['mega-menu', 'ui.router', 'ui.bootstrap', 'app.login', 'app.success', 'ng-ripple', 'app.billCalc', 'cfp.hotkeys'])
    .config(function($provide, $httpProvider, $stateProvider, $urlRouterProvider) {})
    .run(['rippleConfig', 'BillsConfigService', function(rippleConfig, BillsConfigService) {
        rippleConfig.rippleOpacity = .2;
        rippleConfig.rippleDelay = 100;
    }]);
