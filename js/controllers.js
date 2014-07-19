/******************
Controllers
******************/	

var openHealthDataAppControllers = angular.module('openHealthDataAppControllers', []);

openHealthDataAppControllers.controller('mapCtrl', ['$scope', '$rootScope', '$http', '$location', '$q', 'Geosearch', 'Search', '$filter', '$modal', 'localStorageService',
  function($scope, $rootScope, $http, $location, $q, Geosearch, Search, $filter, $modal, localStorageService) {

    $rootScope.$on('$locationChangeSuccess', function() {
        ga('send', 'pageview', $location.path());
    });
    
    $scope.map =
    Geosearch.map = {
        center: {
            latitude: 36.847010,
            longitude: -76.292430
          },
        zoom: 18,
        options: {
            streetViewControl: false,
            panControl: true,
            panControlOptions: {
                position: google.maps.ControlPosition.LEFT_BOTTOM
            },
            zoomControl: true,
            zoomControlOptions: {
                style: google.maps.ZoomControlStyle.LARGE,
                position: google.maps.ControlPosition.LEFT_BOTTOM
            },
            styles: [{
                "featureType": "poi",
                "stylers": [{ "visibility": "off" }]
            },{
                "featureType": "transit",
                "stylers": [{ "visibility": "off" }]
            }]
        }
    };

    // console.log(Geosearch.map);

    $scope.dist = 1000;

    $rootScope.showPosition = function(position) {

        //outside Virginia check.
        //- Latitude  36° 32′ N to 39° 28′ N
        // 36.533333 - 39.466667
        //- Longitude  75° 15′ W to 83° 41′ W
        // 75.25 - 83.683333

      if (_.isUndefined(position)) {

        console.log('Geolocation unavailable');

      } else {
        
        if ( ((position.coords.latitude > 36.533333 ) &&
             (position.coords.latitude < 39.466667 ) )
            &&
            ((position.coords.longitude < -75.25 ) &&
             (position.coords.longitude > -83.683333 ))) {
          
          console.log('coordinates are within Virgina');

          if (!_.isUndefined(position)) {
            Geosearch.map.center.latitude = position.coords.latitude;
            Geosearch.map.center.longitude = position.coords.longitude;
          }

        } else {
          console.log('Coming from out of state, so falling back to Norfolk.');
        }

      }

      $scope.results = 
      Geosearch.results = Geosearch.query({lat: $scope.map.center.latitude, lon: $scope.map.center.longitude, dist: $scope.dist}, function(){

          Geosearch.results = _.values(_.reject(Geosearch.results, function(el){
            return _.isUndefined(el.name);
          }));

          Geosearch.results.forEach(function(el, index){
            el.dist = el.dist * 0.000621371;
          });

          Geosearch.results = $filter('orderBy')(Geosearch.results, 'dist');
          $rootScope.$broadcast('geosearchFire');

      });
    };

    $scope.showError = function() {
      console.log("Geolocation is not supported by this browser. Fallback to Norfolk");
      $rootScope.showPosition();

    };

    $rootScope.getLocation = function(){
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition($scope.showPosition, $scope.showError);
      } else {
        $scope.error = "Geolocation is not supported by this browser.";
      }
    };

    $rootScope.getLocation();
    
    $rootScope.toRad = function(Value) {
        return Value * Math.PI / 180;
    };

    $rootScope.distanceCalculation = function(input) {

      var lat2 = input.latitude;
      var lon2 = input.longitude;

      var lat1 = $scope.map.center.latitude;
      var lon1 = $scope.map.center.longitude;

      var R = 6378.137; // km
      var dLat = $scope.toRad(lat2-lat1);
      var dLon = $scope.toRad(lon2-lon1);
      lat1 = $scope.toRad(lat1);
      lat2 = $scope.toRad(lat2);

      var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      var d = R * c;

      return d * 0.62137;
      
    };

    $rootScope.open = function (size) {

      // console.log('open modal');
      var modalInstance = $modal.open({
        templateUrl: 'partials/modal.html',
        controller: ModalInstanceCtrl,
        size: size,
        windowClass: 'modalContainer',
        backdrop: false,
        resolve: {
          items: function () {
            return $scope.items;
          }
        }
      });

      modalInstance.result.then(function (selectedItem) {
        $rootScope.close = function(){
          modalInstance.close();
        }
      }, function () {
        // $log.info('Modal dismissed at: ' + new Date());
      });
    };

    if ($location.url() === '/') {
      $scope.open();
    }

  }]);

var ModalInstanceCtrl = function ($rootScope, $scope, $modalInstance, items, localStorageService) {

  $scope.ok = function () {

    if ($rootScope.dontshow ) {
      localStorageService.set('Has Read', 'true');
      console.log(localStorageService.get('Has Read'));
    }
    $modalInstance.close();

  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
};

openHealthDataAppControllers.controller('restaurantDetailCtrl', ['$scope', '$routeParams', '$http', '$location', '$rootScope', 'Geosearch', 'Inspections', 
  function($scope, $routeParams, $http, $location, $rootScope, Geosearch, Inspections) {

    $rootScope.isVisible = false;

    $scope.results = Inspections.query({vendorid: $routeParams.id}, function(){
      Geosearch.map.center = $scope.results[$routeParams.id].coordinates; 
    });

}]);

openHealthDataAppControllers.controller('searchCtrl', ['$scope', '$rootScope', 'Search', '$filter',
  function($scope, $rootScope, Search, $filter){

    $rootScope.toggleList = function(){
      console.log('clicked toggleList');
      if ($rootScope.isVisible) {
        $rootScope.isVisible = false;
      } else {
        $rootScope.isVisible = true;
      }
    };

    $rootScope.toggleSearchField = function(){
      console.log('clicked search button');
      $rootScope.isSearchbarVisible = !$rootScope.isSearchbarVisible;
    };

    $scope.nameSearch = function() {
      console.log("Searching for " + $scope.query + ".");
      $rootScope.isSearchbarVisible = false;
      
      Search.results = Search.query({name: $scope.query}, function(){
        
        Search.results = _.values(_.reject(Search.results, function(el){
          return _.isUndefined(el.name);
        }));

        if (Search.results.length === 0) {
          $rootScope.alerts.push({type:'danger', msg:'Couldn\'t find any results!'});
        }
        
        Search.results.forEach(function(el, index){
          if (!_.isUndefined(el.coordinates)) {
            el.dist = $rootScope.distanceCalculation(el.coordinates);
          } else {
            Search.results.splice(index,1);
          }
        });
        
        Search.results = $filter('orderBy')(Search.results, 'dist');
        $rootScope.$broadcast('searchFire');

      });

    };

  }]);


openHealthDataAppControllers.controller('searchResultsCtrl', ['$scope', '$rootScope', '$location', 'Search', 'Geosearch',
  function($scope, $rootScope, $location, Search, Geosearch){

    $rootScope.$on('searchFire', function(){
      $scope.results = Search.results;
      $rootScope.isVisible = true;
    });

    $rootScope.alerts = [];

    $rootScope.closeAlert = function(index) {
      $scope.alerts.splice(index, 1);
    };

    $rootScope.$on('geosearchFire', function(){
      $scope.results = Geosearch.results;      
      if ($location.url() === '/') {
        $rootScope.isVisible = true;
      }

    });

    $scope.map = Geosearch.map;

    // console.log("Geosearch map in search results" + Geosearch.map)

    $rootScope.isVisible = false;

  }]);
