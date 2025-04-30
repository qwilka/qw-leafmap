


import { makeMap } from './gis';


window.onload = () => {
  // conf.json is the fixed configuation file, currently cannot make url.searchParams work with fullHash
  // to simplify, everything goes into a single build directory
    let confFile = "conf.json";
    let url = new URL( window.location.href );
    // url.searchParams not working with fullHash
    // http://localhost:8080/?c=a#5/58.275/-71.323/e1-ez1-cl1
    // if (url.searchParams.has("c")) confFile = url.searchParams.get("conf");
    // confFile = "/data/" + confFile + ".json";
    loadConfig(confFile);
}


function loadConfig(url) {
    //console.log("load_config server:", window.location.href);
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


function config_launch(conf){
  document.title = conf.title;
  makeMap(conf);

}  



var fallbackConfig = {
  "title": "Qwilka-leaf-map [FALLBACK]",
    "name": "qwilka-leaf-map",
    "description": "A basic web application using Leaflet." ,
    "version": "0.0.2",
    "author": "SMcE",
    "repository": "https://github.com/qwilka/basic-map-leaf",
    "url": "",
    "refs": ["https://qwilka.github.io/", "http://www.qwilka.com/"],
  "mapOptions": {
    "zoomControlPosition": "topleft",
    "layerControl": false,
    "layerTreeControl": false,
    "layerControlPosition": "topleft",
    "attributionControl": false,    
    "attributionPosition": "bottomright",
    "attributionPrefix": "<a target=\"_blank\" href=\"https://qwilka.github.io/\">Qwilka</a>",
    "hash": true
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