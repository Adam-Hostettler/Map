var map;
var markers = [];
var infoWindow;
var clientID = 'DGCYHZTTYNNSLDTD5UQEKWFAEOBPNRAIIBTIZ3NLGVLN1ZQB';
var clientSecret = 'X4ZBGAGR5SSR15IERDJ4O4O15BOC205FAYJL41TZNP53PZIC';

var markerLocs = [
  {
      name: "Lambeau Field",
      lat: 44.5013406,
      long: -88.0622083
  },
  {
      name: "Bay Beach Amusement Park",
      lat: 44.5319683,
      long: -87.9819806
  },
  {
      name: "Green Bay Packers Hall of Fame",
      lat: 44.5017399,
      long: -88.0604548
  },
  {
      name: "The Children's Museum of Green Bay",
      lat: 44.5166831,
      long: -88.0148948
  },
  {
      name: "Smart Cow",
      lat: 44.4883367,
      long: -88.0652385
  }
];

var viewModel = {
  locations: ko.observableArray(markers),
  selectedLocation: ko.observable(), // for the drop down box to work.
  show: ko.observable(false),
  onChange: function() {
    showMarkers(); // Resets the markers before filtering.
    if (this.selectedLocation() === undefined) { // if the default value on the drop down box is picked it is considered null and shows all markers.
        showMarkers();
        this.toggleSelected(false);
    } else {
        for (var i = 0; i < markers.length; i++) {
            if (markers[i].markerData.title !== this.selectedLocation().markerData.title) { // Hides markers that are not equal to the selected location.
                this.toggleSelected(true);
                markers[i].markerData.setMap(null);
            }
        }
    }
  },
  toggleSelected: function (v) { // flips the show which is bound to visible on the html.
      this.show(v);
  }
};

function LocationData(marker, latitude, longitude, fsInfoObject) {
    return {
        markerData: marker,
        lat: latitude,
        long: longitude,
        fsContent: {
            url: fsInfoObject.url,
            street: fsInfoObject.location.formattedAddress[0],
            city: fsInfoObject.location.formattedAddress[1],
            phone: fsInfoObject.contact.phone
        }
    };
}

function FourSquareInfoObject(fsInfo) {
    var infoObject = {
        url: "",
        contact: {
            phone: ""
        },
        location: {
            formattedAddress: ['', '']
        }
    };

    //If no fsinfo object was passed, return the empty object
    if (fsInfo === null || fsInfo === undefined) {
        return infoObject;
    }

    //If an fsinfo object was passed, check its values
    else {
        if (fsInfo.url !== null && fsInfo.url !== undefined) {
            infoObject.url = fsInfo.url;
        }
        if (fsInfo.contact.phone !== undefined && fsInfo.contact.phone !== null) { // data from foursquare might not be there is error checking.
            infoObject.contact.phone = fsInfo.contact.phone;
        }
        if (fsInfo.location.formattedAddress[0] !== undefined && fsInfo.location.formattedAddress[0] !== null) { // data from foursquare might not be there is error checking.
            infoObject.location.formattedAddress[0] = fsInfo.location.formattedAddress[0];
        }
        if (fsInfo.location.formattedAddress[1] !== undefined && fsInfo.location.formattedAddress[1] !== null) { // data from foursquare might not be there is error checking.
            infoObject.location.formattedAddress[1] = fsInfo.location.formattedAddress[1];
        }

        return infoObject;
    }
}

function initialize() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 44.522924, lng: -88.0394371 },
        zoom: 13
    });
    infoWindow = new google.maps.InfoWindow();
    for (var l = 0; l < markerLocs.length; l++) {
      processLocations(l, infoWindow);
    }
}

function processLocations(l, infoWindow) { // Had to add this to fix the jshint function in a loop issue.
var fsURL = "https://api.foursquare.com/v2/venues/search?ll=" + markerLocs[l].lat + "," + markerLocs[l].long + "&client_id=" + clientID + "&client_secret=" + clientSecret + "&v=20170630" + "&query=" + markerLocs[l].name;
var formattedURL = encodeURI(fsURL); //Used to fill in special char so it passes to fs correctly.

//markerData
var position = new google.maps.LatLng(markerLocs[l].lat, markerLocs[l].long);
var marker = new google.maps.Marker({
  position: position,
  title: markerLocs[l].name,
  animation: google.maps.Animation.DROP,
});
//end markerData

$.ajax({
    url: formattedURL,
    type: 'GET',
    dataType: 'json',
    cache: false,
    error: function (request, error) {
        // ajax FourSquare error handling.
        //create a blank info object
        var info = new FourSquareInfoObject(null);

        //create locationData object
        var locationData = new LocationData(marker, markerLocs[l].lat, markerLocs[l].long, info);

        //alert ("Error loading FourSquare. Please try again later.");
        alert('FourSquare is not responding, Foursquare data will not be present for ' + locationData.markerData.title);

        var content = '<div><p>Failed to load data from FourSquare. Please try again.</p></div>';

        //update the markers and add event listeners
        finishScreenUpdate(locationData, content);
    },

    success: function (data) {
      //create our FourSquare info object
      var info = new FourSquareInfoObject(data.response.venues[0]);

      //create locationData object
      var locationData = new LocationData(marker, markerLocs[l].lat, markerLocs[l].long, info);

      var content = '<div id="infoWindow"><span id="infoWindowTitle">' +
          locationData.markerData.title +
          '</span><fieldset id="fieldset"><legend>Venue Details:</legend><p>street: ' +
          locationData.fsContent.street +
          '</p><p>city: ' +
          locationData.fsContent.city +
          '</p><p>phone: ' +
          locationData.fsContent.phone +
          '</p><p>url: <a target="_blank" href="' +
          locationData.fsContent.url +
          '">' +
          locationData.fsContent.url +
          '</a></p></fieldset><p><img id="foursquareImg" src="img/foursquare.png"></p></div>';

      //update the markers and add event listeners
      finishScreenUpdate(locationData, content);
    }
  });
}

function finishScreenUpdate(locationData, content) {
    //Add event listener
    locationData.markerData.addListener('click', function () {
        populateInfoWindow(locationData, content);
    });

    //Add locationData to markers array
    markers.push(locationData);

    // make sure markers has all the locations before trying to show markers.
    if (markers.length == markerLocs.length) {
        ko.applyBindings(viewModel);
        showMarkers();
    }
}

function populateInfoWindow(locationData, content) {
    infoWindow.marker = locationData.markerData;
    // make sure that the infoWindow data is set to the correct markers.
    for (var i = 0; i < markers.length; i++) {
        if (locationData.markerData.title === markers[i].markerData.title) {
            locationData.markerData.setAnimation(google.maps.Animation.BOUNCE);
            cancelAnimation(locationData.markerData);
            if (content === null || content === undefined){
                  content = '<div id="infoWindow"><span id="infoWindowTitle">' +
                  locationData.markerData.title +
                  '</span><fieldset id="fieldset"><legend>Venue Details:</legend><p>street: ' +
                  locationData.fsContent.street +
                  '</p><p>city: ' +
                  locationData.fsContent.city +
                  '</p><p>phone: ' +
                  locationData.fsContent.phone +
                  '</p><p>url: <a target="_blank" href="' +
                  locationData.fsContent.url +
                  '">' +
                  locationData.fsContent.url +
                  '</a></p></fieldset><p><img id="foursquareImg" src="img/foursquare.png"></p></div>';
            }
            infoWindow.setContent(content);
            infoWindow.open(map, locationData.markerData);
        }
    }
}

function cancelAnimation(marker) {
  setTimeout(function () { marker.setAnimation(null); }, 750);
}

function showMarkers() {
    var bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < markers.length; i++) {
        markers[i].markerData.setMap(map);
        bounds.extend(markers[i].markerData.position);
    }
    map.fitBounds(bounds);
}

function errorHandle() { // Google error.
    console.log("Error loading Google Maps. Please try again later.");
    alert("Error loading Google Maps. Please try again later.");
}
