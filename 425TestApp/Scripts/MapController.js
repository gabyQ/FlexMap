var lastKeyPress = "left";
// The initial latlng of the route
var origin;
var destination;
// The initial map in explore mode
var map;
// The panorama at the current location
var panorama;
// An array of markers on the map
var markers = [];
// Explore view or route view
var mode = "explore";

$(document).ready(function () {
    
});

// Initializes the driving route
function initRoute() {
    mode = "route";
    toggleMode();
    var directionsService = new google.maps.DirectionsService();
    var directionsRoute = directionsService.route({
        destination: destination,
        origin: origin,
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

// Shows the appropriate maps based on mode
function toggleMode() {
    if (mode == "explore") {
        $("#map").show();
        $("#panorama").show();
    }
    else {
        $("body").off("keypress");
        $("#map").hide();
        $("#panorama").hide();
    }
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
        if ((e.keyCode || e.which) == 38) {
            $("#routeInputContainer").toggle();
        }
        // Listen for enter key to submit origin and destination
        if ((e.keyCode || e.which) == 13) {
            // Only submit if the route input container is visible
            if (!($("#routeInputContainer").attr("display") == "none")) {
                origin = null;
                destination = null;
                geocodeAddress($.trim($("#fromInfo").val()), "origin"),
                geocodeAddress($.trim($("#toInfo").val()), "destination");
            }
        }
    });
}

// Sets the origin and destination. If one of them are null, the other will initialize the route.
function setRouteParams(r, type) {
    if (type == "origin") {
        origin = r;
        if (!(destination == null)) {
            if ($("#routeMap canvas")) {
                $("#routeMap canvas").remove();
            }
            initRoute();
        }
        console.log(origin);
    }
    if (type == "destination") {
        destination = r;
        if (!(origin == null)) {
            if ($("#routeMap canvas")) {
                $("#routeMap canvas").remove();
            }
            initRoute();
        }
        console.log(destination);
    }
}

function geocodeAddress(address, type) {
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({ 'address': address }, function (results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
            if (results[0]) {
                setRouteParams(results[0].geometry.location, type);
                return results[0].geometry.location;
            }
            // TODO: show no results found
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
