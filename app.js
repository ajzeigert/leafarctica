function init() {

  // Map resolutions that NASA GIBS specify
  var resolutions = [
    8192, 4096, 2048, 1024, 512, 256
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
    maxZoom: 5
  });
	
	// Adding claim data from geojson.xyz
//	$.getJSON('http://geojson.xyz/naturalearth-3.3.0/ne_10m_admin_0_antarctic_claims.geojson', function(data) {
//		L.geoJson(data).addTo(map);
//	});
	
	// Antarctica boundary (downloaded and extracted)
	$.getJSON('antarctica_boundary.geojson', function(data) {
		L.geoJson(data).addTo(map);
//		console.log(data);
	});
	
	// Add Antarctic ice shelves from geojson.xyz
	$.getJSON('http://geojson.xyz/naturalearth-3.3.0/ne_10m_antarctic_ice_shelves_polys.geojson', function(data) {
		L.geoJson(data).addTo(map);
	});	
	
	// Add Antarctic ice sheets
//	$.getJSON('ice_sheets.geojson', function(data) {
//		L.geoJson(data).addTo(map);
//	});
	
	// Add Antarctic stations
	$.getJSON('stations.geojson', function(data) {
		L.geoJson(data).addTo(map);
	});
	
	// Add Antarctic camps
	$.getJSON('camps.geojson', function(data) {
		L.geoJson(data).addTo(map);
	});
	
	// Add Antarctic camps
	$.getJSON('historic_points.geojson', function(data) {
		L.geoJson(data).addTo(map);
	});
		
	// Module which adds graticule (lat/lng lines)
  L.graticule().addTo(map);
	
	// MODIS layer is bugging out, will come back to that later
// The URL definition
  var GIBSServiceUrl =
    "http://map1{s}.vis.earthdata.nasa.gov/wmts-antarctic/{layer}/default/{time}/{tileMatrixSet}/{z}/{y}/{x}.jpg";

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
			tms: true
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
