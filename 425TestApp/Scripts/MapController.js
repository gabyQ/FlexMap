var lastKeyPress = "left";
// The initial latlng of the route
var origin = { lat: 37.869085, lng: -122.254775 };
// The initial map in explore mode
var map;
// The panorama at the current location
var panorama;
// An array of markers on the map
var markers = [];
// The geocoder to translate addresses into latlng
var geocoder = new google.maps.Geocoder();

$(document).ready(function () {
    
});

// Initializes the driving route
function initRoute(rotueData) {
    var directionsService = new google.maps.DirectionsService();
    var directionsRoute = directionsService.route({
        destination: routeData[0],
        origin: new google.maps.LatLng(33.9063, -116.56344000000001),
        travelMode: google.maps.TravelMode.DRIVING
    }, function (DirectionsResult, DirectionsStatus) {
        var routeSequence = StreetviewSequence('#routeMap', {
            route: DirectionsResult,
            duration: 20000,
            totalFrames: DirectionsResult.routes[0].overview_path.length,
            width: 800,
            height: 400,
            key: 'AIzaSyBaTYevhHwHQewpC-trmY28KO01yIbwPcI'
        });

        routeSequence.done(function (player) {
            console.log(DirectionsResult);
            player.play();
            player.pause();
            $("body").keydown(function (e) {
                // left arrow
                if (((e.keyCode || e.which) == 37)) {
                    // TODO: Increase the speed of playback to simulate a more intense bend (driving faster)
                    if (player.isActive()) {
                        return;
                    }
                    player.reverse();
                }
                // right arrow
                if (((e.keyCode || e.which) == 39)) {
                    // TODO: Increase the speed of playback to simulate a more intense bend (driving faster)
                    if (player.isActive()) {
                        return;
                    }
                    player.play();
                }
            });

            $("body").keyup(function (e) {
                if (((e.keyCode || e.which) == 37)) {
                    player.pause();
                    var p = (player.getProgress()) / (options.totalFrames - 1);
                    var panorama = player.getRouteData(p);
                    console.log(p);
                    console.log(panorama);
                    lastKeyPress = "left";
                }
                // right arrow
                if (((e.keyCode || e.which) == 39)) {
                    player.pause();
                    var panorama = player.getRouteData(player.getProgress());
                    console.log(panorama);
                    lastKeyPress = "right";
                }
            });
            //player.play();
        });
    });
}

// Initialize the map for explore view
function initMap() {
    var berkeley = { lat: 37.869085, lng: -122.254775 };
    var sv = new google.maps.StreetViewService();

    panorama = new google.maps.StreetViewPanorama(document.getElementById('panorama'), {
        disableDefaultUI: true
    });

    // Set up the map.
    map = new google.maps.Map(document.getElementById('map'), {
        center: berkeley,
        zoom: 16,
        streetViewControl: false,
        mapTypeControl: false
    });

    // Set the initial Street View camera to the center of the map
    sv.getPanorama({ location: berkeley, radius: 50 }, processSVData);

    // Look for a nearby Street View at the center of the map
    map.addListener('mouseup', function (event) {
        sv.getPanorama({ location: map.getCenter(), radius: 50 }, processSVData);
    });
    initKeyListeners();
}

function initKeyListeners() {
    $("body").keyup(function (e) {
        // Listen for the spacebar or the bend gesture to toggle entering route data
        if ((e.keyCode || e.which) == 32) {
            $("#routeInputContainer").toggle();
        }
        // Listen for enter key to submit origin and destination
        if ((e.keyCode || e.which) == 32) {
            // Only submit if the route input container is visible
            if (!($("#routeInputContainer").attr("display") == "none")) {
                var routeData = getRouteParams();
                console.log(routeData);
                //initRoute(routeData);
            }
        }
    });
}

function getRouteParams() {
    var originName = $("#fromInfo").value();
    var destinationName = $("#toInfo").value();
    
    var originCode = geoCodeAddress($(originName).trim());
    console.log(originCode);
    var origin = new google.maps.LatLng(33.8974391098385, -116.6136966801696);
    return [originCode, destinationCode];
}

function geocodeAddress(address) {
    geocoder.geocode({ 'address': address }, function (results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
            resultsMap.setCenter(results[0].geometry.location);
            console.log(results);
            return results;
        } else {
            console.log('Geocode was not successful for the following reason: ' + status);
        }
    });
}

// Update the marker and the panorama to the center of the map
function processSVData(data, status) {
    if (status === google.maps.StreetViewStatus.OK) {
        clearMarkers();
        var marker = new google.maps.Marker({
            position: data.location.latLng,
            map: map,
            title: data.location.description
        });
        markers.push(marker);
         
        panorama.setPano(data.location.pano);
        panorama.setPov({
            heading: 270,
            pitch: 0
        });
        panorama.setVisible(true);
    } else {
        console.error('Street View data not found for this location.');
    }
}

// Sets the map on all markers in the array.
function setMapOnAll(map) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
    }
}

// Removes the markers from the map, but keeps them in the array.
function clearMarkers() {
    setMapOnAll(null);
    markers = [];
}

function toggleStreetView() {
    var toggle = panorama.getVisible();
    if (toggle == false) {
        panorama.setVisible(true);
    } else {
        panorama.setVisible(false);
    }
}
