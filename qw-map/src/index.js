


import { makeMap } from './gis';


window.onload = () => {
  // conf.json is the fixed configuation file, currently cannot make url.searchParams work with fullHash
  // to simplify, everything goes into a single build directory
    let confFile = "conf";
    let url = new URL( window.location.href );
    // url.searchParams not working with fullHash
    // http://localhost:8080/?c=a#5/58.275/-71.323/e1-ez1-cl1
    // if (url.searchParams.has("c")) confFile = url.searchParams.get("conf");
    //confFile = window.location.pathname + confFile + ".json";
    confFile = window.location.pathname + `config-${getHashParams()[4]}.json`;
    loadConfig(confFile);
}


function loadConfig_old(url) {
    console.log("loadConfig: ", url);
    fetch(url)
    .then((resp) => {
      if (resp.status != 200) {
        console.log(`load_config failure\nurl=«${url}»\nfetch response status code: ${resp.status}`);
      };
      resp.json()
      .catch((err) => {
        console.error("loadConfig: Failed to load url:\n", url,"\nProceeding with fallback config.\n", err);
        config_launch(fallbackConfig);
      })
      .then((confData) => {
        console.log("Normal startup with configuration\n", url);
        config_launch(confData);
      })
      // .catch((err) => {
      //   console.log("load_config failure in callback:", err);
      // });      
    })
    .catch((err) => {
      console.log("load_config failure top-level:", err);
    });
}

// https://stackoverflow.com/questions/38235715/fetch-reject-promise-and-catch-the-error-if-status-is-not-ok
function loadConfig(url) {
    console.log("loadConfig: ", url);
    fetch(url)
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      throw new Error(`loadConfig: HTTP error! status: ${response.status}`);
    })
    .then((configData) => {
      console.log("Normal startup with configuration:\n", url);
      config_launch(configData);
    })
    .catch((err) => {
        console.error("loadConfig: error! failed to load url:\n", url,"\n", err, "\nProceeding with fallback config.");
        config_launch(fallbackConfig);
    });
}



function config_launch(conf){
  document.title = conf.title;
  makeMap(conf);

}  


function getUrlParams() {
  let url = new URL( window.location.href );
  let params = {};
  for (const [key, value] of url.searchParams.entries()) {
    params[key] = value;
  }
  return params;
}
function getHashParams() {    
  let url = new URL( window.location.href );
  let params = {};
  if (url.hash) {
    let hash = url.hash.substring(1); // remove the #
    let parts = hash.split("/");
    for (let i = 0; i < parts.length; i++) {
      params[i] = parts[i];
    }
  }
  return params;
}



var fallbackConfig = {
    "title": "Qwilka qw-map [FALLBACK config]",
    "name": "qw-map",
    "description": "A basic webmap using Leaflet." ,
    "version": "2.0.0",
    "author": "SMcE",
    "license": "MIT",
    "repository": "https://github.com/qwilka/qw-map",
    "refs": ["https://qwilka.github.io/gis/1/#5/53.980/-7.300/g1", "https://github.com/qwilka/qw-map"],
    "mapOptions": {
      "zoomControlPosition": "topright",
      "layerControl": true,
      "layerTreeControl": false,
      "layerControlPosition": "topleft",
      "attributionControl": null,    
      "attributionPosition": "bottomright",
      "attributionPrefix": "<a target=\"_blank\" href=\"https://qwilka.github.io/\">Qwilka</a>",
      "hash": true,
      "locationPopup": true
    },
  "layers": [
      {
          "name": "OSM1",
          "title": "OpenStreetMap",
          "id": "o1",
          "parent": "basemaps",
          "type": "tilemap",
          "url": "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          "selected": true,
          "options": {
              "maxZoom": 19,
              "attribution": "&copy; <a href=\"http://www.openstreetmap.org/copyright\">OpenStreetMap</a>"
          }

      },
      {
        "name": "WorldImagery",
        "title": "Esri World Imagery",
        "id": "e1",
        "parent": "basemaps",
        "type": "tilemap",
        "url": "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        "selected": false,
        "options": {
          "attribution": "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
        }

    },
      {
        "name": "EEZ",
        "title": "EEZ boundaries",
        "id": "ez1",
        "parent": "overlays",
        "type": "WMS",
        "url": "http://geo.vliz.be:80/geoserver/MarineRegions/wms",
        "selected": true,
        "options": {
            "layers": "MarineRegions:eez_boundaries",
            "version": "1.1.1",
            "format": "image/png",
            "transparent": true,
            "noWrap": true,
            "opacity": 0.8,
            "attribution": "EEZ boundaries: <a target='_blank' href='http://www.marineregions.org'>Flanders Marine Institute</a>, <a target='_blank' href='https://creativecommons.org/licenses/by/4.0/'>(CC BY 4.0)</a>"
        }

      },
      {
          "name": "coastlines",
          "title": "coastlines (EMODnet)",
          "id": "cl1",
          "parent": "overlays",
          "type": "WMS",
          "url": "http://ows.emodnet-bathymetry.eu/ows",
          "selected": false,
          "options": {
            "layers": "coastlines",
            "CRS": "EPSG:4326",
            "version": "1.3.0",
            "format": "image/png",
            "transparent": true,
            "noWrap": true,
            "opacity": 0.9,
            "attribution": "<a target='_blank' href='https://emodnet.ec.europa.eu/en/bathymetry'>EMODnet, </a>"
          }

      }
  ]
};