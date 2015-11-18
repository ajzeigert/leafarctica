function init() {

  // Map resolutions that NASA GIBS specify
  var resolutions = [
    8192, 4096, 2048, 1024, 512, 256, 128
  ];

  // The polar projection
  var EPSG3031 = new L.Proj.CRS('EPSG:3031', '+proj=stere +lat_0=-90 +lat_ts=-71 +lon_0=0 +k=1 +x_0=0 +y_0=0 +ellps=WGS84 +datum=WGS84 +units=m +no_defs', {
    resolutions: resolutions,
    origin: [-4194304, 4194304],
    bounds: L.bounds (
      [-4194304, -4194304],
      [4194304, 4194304]
    )
  });
	
	// Finally construct the map and add our initial modis layer
  var map = new L.Map('map', {
    // continuousWorld because polar crosses dateline
    continuousWorld: true,
    worldCopyJump: false,
    center: [-90, 0],
    zoom: 0,
    // Projection set here
    crs: EPSG3031,
    maxZoom: 10,
		zoomControl: false
//		bounds: EPSG3031.bounds
  });
	
	var control = L.control.zoom({
		position: 'topright'
	}).addTo(map);
	
	
	// Adding claim data from geojson.xyz
//	$.getJSON('http://geojson.xyz/naturalearth-3.3.0/ne_10m_admin_0_antarctic_claims.geojson', function(data) {
//		L.geoJson(data).addTo(map);
//	});
	
	// Add Antarctic ice shelves from geojson.xyz
	$.getJSON('http://geojson.xyz/naturalearth-3.3.0/ne_10m_antarctic_ice_shelves_polys.geojson', function(data) {
//		console.log(data)
		L.geoJson(data,{
			style: {
				stroke: false,
				fillOpacity: 0.7,
				fillColor: "#7aa0b4"
			},
			onEachFeature: function(feature, layer){
				layer.bindPopup(
					'<h3>Antarctic ice sheet</h3>'
				)
			}
		}).addTo(map);
	});	
	
	// Antarctica boundary (downloaded and extracted from geojson.xyz to avoid 4MB geojson load/filter)
	$.getJSON('antarctica_boundary.geojson', function(data) {
		L.geoJson(data, {
			style: {
				weight: 2,
				fill: false,
				color: '#000',
				dashArray: '5,8',
				lineCap: 'square',
				opacity: 1
			}
		}).addTo(map);
//		console.log(data);
	});
	
	map.attributionControl.addAttribution("Boundary and ice shelf data via <a href='http://geojson.xyz'>geojson.xyz</a>")
	
	// Add Antarctic ice sheets
//	$.getJSON('ice_sheets.json', function(data) {
//		console.log(data);
//		var ice_sheets = topojson.object(data, data.objects.ice_sheets);
//		console.log(ice_sheets);
//		L.geoJson(ice_sheets).addTo(map);
//	});
	
	// Add Antarctic stations
	var stationMarker = L.MakiMarkers.icon({icon: "warehouse", color: "#208075", size: "s"});
	
	var stations = L.geoJson(null ,{
			pointToLayer: function(feature, latlng){
				return L.marker(latlng, {icon: stationMarker, title: feature.properties.facility_n})
			},
			onEachFeature: function (feature, layer) {
				layer.bindPopup(
					'<h3>' + feature.properties.facilty_ty + '</h3>' +
					'<p><strong>Name:</strong> ' + feature.properties.facility_n + '</p>' +
					'<p><strong>First opened:</strong> ' + feature.properties.first_open + '</p>' +
					'<p><strong>Country:</strong> ' + feature.properties.national_p + '</p>' +
					'<p><strong>Peak population:</strong> ' + feature.properties.peak_popul + '</p>' +
					'<p><strong>Notes:</strong> ' + feature.properties.notes + '</p>'
				);
    	}
		}).addTo(map);
	
	$.getJSON('stations.geojson', function(data) {
//		console.log(data);
		stations.addData(data); 
	});
	
	// Add Antarctic camps
	var campMarker = L.MakiMarkers.icon({icon: "campsite", color: "#a55", size: "s"});
	
	var camps = L.geoJson(null, {
			pointToLayer: function(feature, latlng){
				return L.marker(latlng, {icon: campMarker, title: feature.properties.hmn00nam})
			},
			onEachFeature: function (feature, layer) {
				layer.bindPopup(
					'<h3>Camp</h3>' +
					'<p><strong>Type:</strong> ' + feature.properties.feature_ty + ', ' + feature.properties.temporal + '</p>' +
					'<p><strong>First opened:</strong> ' + feature.properties.hmn00dat + '</p>' +
					'<p><strong>Country:</strong> ' + feature.properties.hmn00nat + '</p>' +
					'<p><strong>Capacity:</strong> ' + feature.properties.capacity + '</p>' +
					'<p><strong>Notes:</strong> ' + feature.properties.notes + '</p>'
				);
			}
		}).addTo(map);
	
	$.getJSON('camps.geojson', function(data) {
//		console.log(data);
		camps.addData(data); 
	});
	
	// Add historic points
	
	var historyMarker = L.MakiMarkers.icon({icon: "star-stroked", color: "#666", size: "s"});
	
	var history = L.geoJson(null, {
			pointToLayer: function(feature, latlng){
				return L.marker(latlng, {icon: historyMarker, title: feature.properties.brief_desc})
			},
			onEachFeature: function (feature, layer) {
				layer.bindPopup(
					'<h3>Historical marker</h3>' +
					'<p><strong>Description:</strong> ' + feature.properties.full_descr + '</p>'
				);
			}
		}).addTo(map);
	
	$.getJSON('historic_points.geojson', function(data) {
//		console.log(data);
		history.addData(data);
	});
	
	map.attributionControl.addAttribution("Station, camp and historical marker data via <a href='http://add.antarctica.ac.uk/'>Antarctic Digital Database</a>")
		
	var overlays = {
		"Historical markers": history,
		"Camps": camps,
		"Stations": stations
	};
	
	var layerControl = L.control.layers(null, overlays).addTo(map);
	
	// Module which adds graticule (lat/lng lines)
  L.graticule().addTo(map);
	
	// MODIS layer is bugging out, will come back to that later
// The URL definition
  var GIBSServiceUrl =
    "https://map1{s}.vis.earthdata.nasa.gov/wmts-antarctic/{layer}/default/{time}/{tileMatrixSet}/{z}/{y}/{x}.jpg";

  // A function which generate a MODIS leaflet layer for a single datetime. We
  // need this because we need to generate a new layer when we change the
  // datetime <input>
  function genModisLayer(time){
    return L.tileLayer(GIBSServiceUrl, {
      layer: "MODIS_Aqua_CorrectedReflectance_TrueColor",
      tileMatrixSet: "EPSG3031_250m",
      format: "image%2Fjpeg",
      time: time,
      tileSize: 512,
      subdomains: "abc",
      noWrap: true,
      continuousWorld: true,
      attribution:
        "<a href='https://earthdata.nasa.gov/gibs'>" +
      "NASA EOSDIS GIBS</a>&nbsp;&nbsp;&nbsp;" +
        "<a href='https://github.com/nasa-gibs/web-examples/blob/release/leaflet/js/antarctic-epsg3031.js'>" +
      "View Source" +
        "</a>",
//			tms: true
    });
  }

  // Get a reference to the <input type="date">
  var dateEl = document.querySelector('#date');

  // On date change generate a new layer of the current date and remove the old layer
  dateEl.addEventListener('change', function() {
    map.removeLayer(modisLayer);
    modisLayer = genModisLayer(dateEl.value);
    map.addLayer(modisLayer);
  })

  // Set the current <input type="date"> and generate the initial layer
  var modisLayer = genModisLayer('2014-12-01')
  dateEl.value = '2014-12-01';
	
	map.addLayer(modisLayer);
	
  // Module which add a url hash with the current lat/lng
  var hash = new L.Hash(map);
	
  // Initialise bounds hack
  constrainMapToBounds(map, EPSG3031, L.point(4194304, -4194304));

}

// When the DOM is ready initialise the map
document.addEventListener("DOMContentLoaded", init);
