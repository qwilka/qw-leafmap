// var leaflet = require('leaflet');
// window.leaflet = leaflet;
// var L = require('leaflet');
// window.L = L;
//import {component} from "./component";

// weirdly can avoid  «ReferenceError: leaflet is not defined»
// if we comment out the leaflet import (somehow L has got into global scope)
// otherwise, in bundle file   dist/gis/assets/qwgis.js
//   «module.exports = leaflet» -> «module.exports = L»
//import L from 'leaflet';  // ReferenceError: leaflet is not defined

//import 'leaflet.control.layers.tree';
import './libs/layers_tree/L.Control.Layers.Tree.css';
import './libs/layers_tree/L.Control.Layers.Tree';
import './libs/leaflet_hash/leaflet-fullHash';

import {Utm, LatLon} from 'geodesy/utm';

function main() {
   // document.body.appendChild(component());

  fetch(conf_data_path)
  .then((resp) => {
    if (resp.status != 200) {
      console.error(`load_config failure\nurl=«${url}»\nfetch response status code: ${resp.status}`);
    };
    resp.json()
    .catch((err) => {
      console.error("load_config failure\nresp.json():", err);
    })
    .then((confData) => {
      //if (callback) callback(confData);
      //console.log("confData", confData);
      //let app = new VnApp(confData);
      makeGis(confData, 0);
      
    })
    // .catch((err) => {
    //   console.log("load_config failure in callback:", err);
    // });      
  })
  .catch((err) => {
    console.error("load_config failure top-level:", err);
  });

}


window.onload = () => {
    main();
}

var map;
let popup;
let useCache=false; // global over-ride, set useCache=false to re-load all cached data

function makeGis(confData, id_number) {
    console.log("makeGis confData", confData);

    let mapOpts = confData.gisOptions.mapOptions;
    let gisOpts = confData.gisOptions;
    if (confData.gisOptions.hasOwnProperty('useCache')) {
      useCache = confData.gisOptions.useCache;
    }
    
    // var GEBCO = {
    //     title: "GEBCO",
    //     source: "WMS",
    //     type: "BASEMAP",
    //     ref: ["https://www.gebco.net/"],
    //     baseUrl: "//www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv",
    //     options: {
    //         layers: "GEBCO_LATEST",
    //         CRS: "EPSG:4326",
    //         version: '1.3.0',
    //         format: 'image/png',
    //         transparent: false,
    //         noWrap: true,
    //         opacity: 1.0,
    //         attribution: "<a target='_blank' href='https://www.gebco.net/'>GEBCO</a>"
    //     }
    // }
    // GEBCO.layer = L.tileLayer.wms(GEBCO.baseUrl, GEBCO.options);
    
    map = L.map('map', {
        attributionControl: (mapOpts.attributionControl || false),
        zoom: (mapOpts.zoom || 5),
        minZoom: (mapOpts.minZoom || 2),
        maxZoom: (mapOpts.maxZoom || 14),
        maxBounds: (mapOpts.maxBounds || [[-90,-180], [90,180]]),
        center: (mapOpts.center || [57.0, 2.46]),
        zoomControl: (mapOpts.zoomControl || true)
    });
    map.zoomControl.setPosition('topright');

    if (gisOpts.attributionControl) {
      let attribut = L.control.attribution({ 
          position: 'bottomright', 
          prefix: '<a target="_blank" href="https://qwilka.com">Qwilka</a>'
      });
      attribut.addTo(map);
    }

    if (gisOpts.scaleControl) {
      let scale = L.control.scale({position:'bottomleft', metric:true, imperial:false});
      scale.addTo(map);      
    }

    let WhiteBG = L.tileLayer("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAAQMAAABmvDolAAAAA1BMVEX///+nxBvIAAAAH0lEQVQYGe3BAQ0AAADCIPunfg43YAAAAAAAAAAA5wIhAAAB9aK9BAAAAABJRU5ErkJggg==");

    // var allMapLayers = {
    //   'GEBCO': GEBCO.layer,
    //   'white': WhiteBG
    // };
    var allMapLayers = {};

    let ftree = confData["ftree_vnleaf_" + id_number.toString()];
    if (!ftree) {
      ftree = confData.tree_vnleaf_0;
    }

    // let baseTree = {
    //   label: 'World base maps &#x1f5fa;',
    //   children: [
    //       { label: GEBCO.title, layer: GEBCO.layer },
    //       { label: 'white background', layer: WhiteBG }
    //   ]
    // };
    let baseTree = {
      label: 'World base maps &#x1f5fa;',
      children: []
    };


    // for (let ii=0; ii<ftree.length; ii++) {
    //   let toplevel = ftree[ii], mapObj, layer;
    //   if (toplevel.type === "gis-folder-basemaps") {
    //     for (let jj=0; jj<toplevel.children.length; jj++) {
    //       let layerObj = toplevel.children[jj];
    //       if (layerObj.type !== "gis-layer-basemap") continue;
    //       // console.log("layerObj", layerObj);
    //       let layer = createMapLayer(layerObj, map);
    //       //console.log("layer", layer);
    //       baseTree.children.push({ label: layerObj.title, layer: layer })
    //       allMapLayers[layerObj.data.layerId] = layer;
    //       console.log("layerObj.title", layerObj.title);
    //       console.log("layerObj.selected", layerObj.selected);
    //       if (layerObj.selected) {
    //         console.log("default layer", layer);
    //         map.addLayer(layer);
    //       }
    //       //if (jj==2) break;
    //     }
    //   }
    // }


    //let overlayTree = {label: 'overlays', children: []};
    let overlayTree = [];

    for (let ii=0; ii<ftree.length; ii++) {
      let ftree_toplevel = ftree[ii], mapObj, layer;
      //console.log("ftree_toplevel.type", ftree_toplevel.type)
      if (ftree_toplevel.type === "gis-folder-basemaps") {
        baseTree = makeLayersTree(ftree_toplevel, map, allMapLayers);
      } else if (ftree_toplevel.type.startsWith("gis-folder")) {
        //console.log("ftree_toplevel.title", ftree_toplevel.title)
        overlayTree.push(makeLayersTree(ftree_toplevel, map, allMapLayers));
      }
    }

    let hash = new L.Hash(map, allMapLayers);    

    let layerCtl = L.control.layers.tree(baseTree, overlayTree, {
      collapseAll: '<font color="#909090" size="2">(close all)</font>',
      collapsed: true 
    });
    layerCtl.addTo(map);
    layerCtl.setPosition('topleft');   
    layerCtl.collapseTree(false);
    layerCtl.collapseTree(true); 

    //let popup;
    if (gisOpts.locationPopup) {
      popup = L.popup();
      map.on('contextmenu', (evt) => {locationPopup(evt);});
    }


}

function locationPopup(evt, preText=null) {
  let url = "https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv";
  let X = map.layerPointToContainerPoint(evt.layerPoint).x;
  let Y = map.layerPointToContainerPoint(evt.layerPoint).y;
  let size = map.getSize();
  let pustr;
  if (preText) {
    pustr = preText + "<br>Location coordinates:";
  } else {
    pustr = "Location coordinates:";
  }
  let params = {
    request: 'GetFeatureInfo',
    service: 'WMS',
    srs: 'EPSG:4326',
    version: '1.1.1',      
    bbox: map.getBounds().toBBoxString(),
    x: X,
    y: Y,
    height: size.y,
    width: size.x,
    layers: 'GEBCO_LATEST_2',
    query_layers: 'GEBCO_LATEST_2',
    info_format: 'text/html'
  };
  let featInfoUrl = url + L.Util.getParamString(params, url, true);
  let getinfo = $.ajax({
      url: featInfoUrl,
      dataType: "html",
      success: function (doc) { console.log("getinfo successfully loaded!\n", doc);},
      error: function (xhr) { console.log("getinfo ERROR!\n", xhr.statusText); }
  })
  $.when(getinfo).done(function() {
      let htmlstr = $.parseHTML( getinfo.responseText );
      let body = $(htmlstr).find('body:first');
      $.each(htmlstr, function(i, el){
          //console.log(i, el)
          if (el.nodeName == '#text') {
              let targetStr = el.nodeValue
              // console.log(i, targetStr);
              let test = targetStr.match(/Elevation value \(m\):\s*(-?\d+)/)
              if (test) {
                  let elevation = test[1];
                  if (elevation>=0) {
                      pustr += "<br>elevation " + elevation + " m (GEBCO)";
                  } else {
                      pustr += "<br>depth " + elevation + " m (GEBCO)";
                  }
                  // console.log("elevation=", elevation)
                  popup.setContent(pustr)
              }
          }
      });
  });  
  let lat = evt.latlng.lat;
  let long = evt.latlng.lng;
  console.log("long", long, "lat", lat);
  let latlong_WGS84 = new LatLon(lat, long);
  let latlong_ED50 = latlong_WGS84.convertDatum(LatLon.datums.ED50);
  console.log("latlong_WGS84 ", latlong_WGS84.toString());
  // work-around required to recover method toUtm() (cannot use .convertDatum() directly)
  latlong_ED50 = new LatLon(latlong_ED50.lat, latlong_ED50.lon, 0, LatLon.datums.ED50);
  let utm_ED50 = latlong_ED50.toUtm();
  //let pustr = "Location coordinates:";
  pustr += "<br>long. " + (long).toFixed(5) + "&deg;  lat. " + (lat).toFixed(5) + "&deg; (WGS84)";
  pustr += "<br>UTM zone " + utm_ED50.zone + utm_ED50.hemisphere;
  pustr += "<br>E" + (utm_ED50.easting).toFixed(1) + " N" + (utm_ED50.northing).toFixed(1) + " (ED50)";
  popup
    .setLatLng(evt.latlng)
    .setContent(pustr)
    .openOn(map)
}

function createMapLayer(layerObj) {
  let layer=false;
  switch(layerObj.data.layerType) {
    case "geojson":
      //layer = loadGeojsonLajax(layerObj.data);
      layer = loadGeojson(layerObj.data);
      //let rdata = await loadGeojsonA(layerObj.data);
      //let rdata = geojWrap(layerObj.data);
      //console.log("loadGeojsonA data", rdata);
      break;
    case "tilemap":
      layer = L.tileLayer(layerObj.data.url, layerObj.data.layerOpts);
      break;
    case "WMS":
      layer = L.tileLayer.wms(layerObj.data.url, layerObj.data.layerOpts);
      break;
  }
  //mapref.addLayer(layer);
  // let layerStamp = L.Util.stamp(layer);
  // console.log("addLayer layerStamp", layerStamp);
  // console.log("addLayer layer", layer);
  return layer;
}


function makeLayersTree(ftree_folder, mapref, allMapLayers) {
  let layerTreeChildren = [];
  for (let jj=0; jj<ftree_folder.children.length; jj++) {
    let layerObj = ftree_folder.children[jj];
    //console.log("layerObj.title", layerObj.title);
    //console.log("layerObj.type", layerObj.type);
    if (layerObj.type.startsWith("gis-layer")) {
      // console.log("layerObj", layerObj);
      let layer = createMapLayer(layerObj);
      if (!layer) continue;
      //console.log("layer", layerObj.title, layer);
      layerTreeChildren.push({ label: layerObj.title, layer: layer });
      if (layerObj.data.layerId) {
        allMapLayers[layerObj.data.layerId] = layer;
      }
      // console.log("layerObj.title", layerObj.title);
      // console.log("layerObj.selected", layerObj.selected);
      if (layerObj.selected) {
        //console.log("default layer", layer);
        mapref.addLayer(layer);
      }
    } else if (layerObj.type.startsWith("gis-folder")) {
      //console.log("recursive layerObj.type gis-folder", layerObj.type);
      //let layerTreeFolder = {label:layerObj.title, children:[]};
      let obj = makeLayersTree(layerObj, mapref, allMapLayers);
      layerTreeChildren.push(obj);
    };
  }
  let layerTreeObj = {
    label: ftree_folder.title,
    children: layerTreeChildren
  }
  return layerTreeObj;
}

// async function geojWrap(layerObj) {
//   let response = await loadGeojsonA(layerObj);
//   return response;
// }

// async function loadGeojsonA(layerObj) {
//   let response = await fetch(layerObj.url);
//   let data = await response.json();
//   return data;
// }

function loadGeojson(layerObj) {
  let attribution = null;
  if (layerObj.hasOwnProperty("layerOpts")) {
    attribution = layerObj.layerOpts.attribution || null;
  }
  let layer  = new L.GeoJSON(null, {
    style: function(feature) {
            let linestyle = {color: "#ff0000", weight: 2, opacity: 1.0};
            if (layerObj.hasOwnProperty('style')) {
              if (layerObj.style.hasOwnProperty('default')) {
                Object.assign(linestyle, layerObj.style.default);
                if (layerObj.style.default.color === true && feature.properties.hasOwnProperty('color')) {
                  let _color = feature.properties.color;
                  if (/^(0x)?[0-9a-fA-F]+$/.test(_color)) {
                    if (_color.startsWith("0x")) {
                      _color = _color.slice(2);
                    }
                    if (!_color.startsWith("#")) {
                      _color = "#" + _color;
                    }
                  }              
                  linestyle.color = _color;
                }
              }
              for (const [key, styObj] of Object.entries(layerObj.style)) {
                if (key.indexOf('|')>0) {
                  let [prop, val] = key.split("||");
                  if (feature.properties.hasOwnProperty(prop)) {
                    if (feature.properties[prop].toLowerCase() === val.toLowerCase()) {
                      Object.assign(linestyle, styObj);
                    }
                  }
                }
              }
            } else if (feature.properties.hasOwnProperty('style')) {
              linestyle = feature.properties.style;
            } 
            // if (layerObj.style.default.color === true && feature.properties.hasOwnProperty('color')) {
            //   let _color = feature.properties.color;
            //   if (/^(0x)?[0-9a-fA-F]+$/.test(_color)) {
            //     if (_color.startsWith("0x")) {
            //       _color = _color.slice(2);
            //     }
            //     if (!_color.startsWith("#")) {
            //       _color = "#" + _color;
            //     }
            //   }              
            //   linestyle.color = _color;
            // }
            return linestyle;      
    },
    onEachFeature: function (feature, layer) {
        layer.on({
            click: function (evt) {
              L.DomEvent.stopPropagation(evt);
              let lat = evt.latlng.lat;
              let long = evt.latlng.lng;
              let contstr = '';
              if (feature.properties.hasOwnProperty('name')) {
                contstr += '<b>'+feature.properties.name+'</b>';
              }
              if (layerObj.hasOwnProperty('popupProps')) {
                for (let ii=0; ii<layerObj.popupProps.length; ii++) {
                  let _parts = layerObj.popupProps[ii].split("||");
                  let prop = _parts[0], field = _parts[0];
                  if (_parts.length>1) {
                    field = _parts[1];
                  }
                  if (feature.properties.hasOwnProperty(prop)) {
                    contstr += `<br>${field}: ${feature.properties[prop]}`;
                  }
                }
              }
              //let contstr = '<b>'+feature.properties.name+'</b>';
              // if (feature.properties.hasOwnProperty('description')) {
              //   contstr += '<br>' + feature.properties.description;
              // }
              // if (feature.properties.hasOwnProperty('vn_uri')) {
              //   contstr += '<br>' + feature.properties.vn_uri;
              // }
              if (feature.properties.hasOwnProperty('KP')) {
                let KP_near = getFeatureKPvalue(feature);
                contstr += '<br> KP: '+parseFloat(KP_near).toFixed(3);
                //contstr += '<br> distance: '+parseFloat(near.properties.location).toFixed(3);
              }
              let popup = L.popup();
              popup
                  .setLatLng(evt.latlng)
                  .setContent(contstr)
                  .openOn(map)
            },
            contextmenu: function (evt) {
                L.DomEvent.stopPropagation(evt);
                let preText = "";
                if (feature.properties.hasOwnProperty('name')) {
                  preText += '<b>'+feature.properties.name+'</b>';
                }
                if (feature.properties.hasOwnProperty('KP')) {
                  let KP_near = getFeatureKPvalue(feature);
                  preText += '<br> KP: '+parseFloat(KP_near).toFixed(3);
                  //contstr += '<br> distance: '+parseFloat(near.properties.location).toFixed(3);
                }
                locationPopup(evt, preText);
  
            }
        });
    },
    attribution: attribution,
    pointToLayer: function(feature, latlng) {
      return L.circleMarker(latlng, layerObj.layerOpts.geojsonMarkerOptions);
    }
  });   
  let dataObj=false;   
  if (useCache && layerObj.cache) {
    dataObj = localStorage.getItem(layerObj.layerId);
  }
  if (dataObj) {
    console.log(`localStorage retrieving ${layerObj.layerId}`);
    //dataObj = LZString.decompress(dataObj);
    dataObj = LZString.decompressFromUTF16(dataObj);
    //console.log(`after LZString.decompress ${dataObj}`);
    dataObj = JSON.parse(dataObj);
    console.log(`dataObj.cache_timestamp ${dataObj.cache_timestamp}`);
    layer.addData(dataObj.data);
  } else {
    fetch(layerObj.url)
    .then((resp) => {
      if (resp.status != 200) {
        console.error(`loadGeojson failure\nurl=«${url}»\nfetch response status code: ${resp.status}`);
      };
      resp.json()
      .catch((err) => {
        console.error("loadGeojson failure\nresp.json():", err);
      })
      .then((data) => {
        //if (callback) callback(confData);
        console.log("loadGeojson data", data);
        layer.addData(data);
        dataObj = {
          cache_timestamp: Date.now(),
          type: "geojson",
          data: data
        };
        dataObj = JSON.stringify(dataObj);
        console.log("dataObj length", dataObj.length);
        //dataObj = LZString.compress(dataObj);
        dataObj = LZString.compressToUTF16(dataObj);
        console.log("compressed length", dataObj.length);
        try {
          localStorage.setItem(layerObj.layerId, dataObj);
        } catch (exception) {
          console.error(`localStorage ${exception} ${layerObj.layerId}`);
        }
  
  
      })
      // .catch((err) => {
      //   console.log("load_config failure in callback:", err);
      // });      
    })
    .catch((err) => {
      console.error(`loadGeojson fetch(${layerObj.url}) failure: ${err}`);
    });
  }
  return layer;
}

function loadGeojsonLajax(layerObj) {
  let url = layerObj.url;
  console.log("loadGeojsonLajax", layerObj.url);
  //let map = this.map;
  let popup = L.popup();
  //let layer  = new L.GeoJSON.AJAX(url ,  loadGeoJObj);
  let layer  = new L.GeoJSON.AJAX(url ,  {
    dataType: 'json',
    local: true,
    style: function(feature) {
            let linestyle;
            if (feature.properties.hasOwnProperty('style')) {
              linestyle = feature.properties.style;
            } else {
              linestyle = {color: "#ff0000", weight: 2, opacity: 1.0};
            }
            return linestyle;      
    },
    onEachFeature: function (feature, layer) {
        layer.on({
            click: function (evt) {
              L.DomEvent.stopPropagation(evt);
              let lat = evt.latlng.lat;
              let long = evt.latlng.lng;
              let contstr = '';
              if (feature.properties.hasOwnProperty('description')) {
                contstr += '<b>'+feature.properties.name+'</b>';
              }
              if (feature.properties.hasOwnProperty('description')) {
                contstr += '<br>' + feature.properties.description;
              }
              if (feature.properties.hasOwnProperty('vn_uri')) {
                contstr += '<br>' + feature.properties.vn_uri;
              }
              if (feature.properties.hasOwnProperty('KP')) {
                let KP_near = getFeatureKPvalue(feature);
                contstr += '<br> KP: '+parseFloat(KP_near).toFixed(3);
                //contstr += '<br> distance: '+parseFloat(near.properties.location).toFixed(3);
              }
              let popup = L.popup();
              popup
                  .setLatLng(evt.latlng)
                  .setContent(contstr)
                  .openOn(map)
            },
            contextmenu: function (evt) {
                L.DomEvent.stopPropagation(evt);
                let preText=feature.properties.name+'</b>';
                if (feature.properties.hasOwnProperty('KP')) {
                  let KP_near = getFeatureKPvalue(feature);
                  preText += '<br> KP: '+parseFloat(KP_near).toFixed(3);
                  //contstr += '<br> distance: '+parseFloat(near.properties.location).toFixed(3);
                }
                locationPopup(evt, preText);
  
            }
        });
    },
    middleware: function(data) {
      console.log("middleware", data); 
  
      setTimeout(function () {
        let sdata, compressed;
        sdata = JSON.stringify(data);
        console.log("sdata length", sdata.length);
        compressed = LZString.compress(sdata);
        console.log("compressed length", compressed.length);
        let decompressed = LZString.decompress(compressed);
        console.log("decompressed length", decompressed.length);
        console.log("decompressed data", decompressed);
        console.log("layerObj.title", layerObj.title);
        
      });
      return data;
    }
  });
  //console.log("geojson layer", layer)
  return layer;
}


// click: function (evt) {console.log(`geojson «clicked» feature=${feature} layer=${layer} evt=${evt}`);},

let loadGeoJObj = {
  dataType: 'json',
  local: true,
  style: function(feature) {
          let linestyle;
          if (feature.properties.hasOwnProperty('style')) {
            linestyle = feature.properties.style;
          } else {
            linestyle = {color: "#ff0000", weight: 2, opacity: 1.0};
          }
          return linestyle;      
  },
  onEachFeature: function (feature, layer) {
      layer.on({
          click: function (evt) {
            L.DomEvent.stopPropagation(evt);
            let lat = evt.latlng.lat;
            let long = evt.latlng.lng;
            let contstr = '';
            if (feature.properties.hasOwnProperty('description')) {
              contstr += '<b>'+feature.properties.name+'</b>';
            }
            if (feature.properties.hasOwnProperty('description')) {
              contstr += '<br>' + feature.properties.description;
            }
            if (feature.properties.hasOwnProperty('vn_uri')) {
              contstr += '<br>' + feature.properties.vn_uri;
            }
            if (feature.properties.hasOwnProperty('KP')) {
              let KP_near = getFeatureKPvalue(feature);
              contstr += '<br> KP: '+parseFloat(KP_near).toFixed(3);
              //contstr += '<br> distance: '+parseFloat(near.properties.location).toFixed(3);
            }
            let popup = L.popup();
            popup
                .setLatLng(evt.latlng)
                .setContent(contstr)
                .openOn(map)
          },
          contextmenu: function (evt) {
              L.DomEvent.stopPropagation(evt);
              let preText=feature.properties.name+'</b>';
              if (feature.properties.hasOwnProperty('KP')) {
                let KP_near = getFeatureKPvalue(feature);
                preText += '<br> KP: '+parseFloat(KP_near).toFixed(3);
                //contstr += '<br> distance: '+parseFloat(near.properties.location).toFixed(3);
              }
              locationPopup(evt, preText);

          }
      });
  },
  middleware: function(data) {
    console.log("middleware", data); 

    setTimeout(function () {
      let sdata, compressed;
      sdata = JSON.stringify(data);
      console.log("sdata length", sdata.length);
      compressed = LZString.compress(sdata);
      console.log("compressed length", compressed.length);
      let decompressed = LZString.decompress(compressed);
      console.log("decompressed length", decompressed.length);
      console.log("decompressed data", decompressed);
      console.log("layerObj.title", layerObj.title);
      
    });
    return data;
  }
}

// function compressData(data) {
//   let sdata = JSON.stringify(data);
//   console.log("sdata length", sdata.length);
//   let compressed = LZString.compress(sdata);
//   console.log("compressed length", compressed.length);
// }

function getFeatureKPvalue(feature) {
  let KP = feature.properties.KP;
  //let pldist = feature.properties.distance;
  //console.log(feature.coordinates);
  let pl = turf.lineString(feature.geometry.coordinates);
  let pt = turf.point([long, lat]);
  let near = turf.nearestPointOnLine(pl, pt);
  console.log(near.geometry.coordinates, near.properties.index, near.properties.dist, near.properties.location);
  console.log("index, dist, location", near.properties.index, near.properties.dist, near.properties.location);
  let pt_loc = near.properties.location;
  console.log("pt_loc", pt_loc);
  let idx = near.properties.index;
  // var KP1 = KP[idx];
  // var KP2 = KP[idx+1];
  let pt1 = turf.point(feature.geometry.coordinates[idx]);
  let pt1_near = turf.nearestPointOnLine(pl, pt1);
  let pt1_loc = pt1_near.properties.location;
  console.log("pt1_loc", pt1_loc);
  let pt2 = turf.point(feature.geometry.coordinates[idx+1]);
  let pt2_near = turf.nearestPointOnLine(pl, pt2);
  let pt2_loc = pt2_near.properties.location;
  console.log("pt2_loc", pt2_loc);
  //let contstr = "'CLR22 Processed ROV Position'";
  let eta = (pt_loc - pt1_loc)/(pt2_loc - pt1_loc);
  let KP_near = KP[idx]*(1 - eta) + KP[idx+1]*eta; 
  console.log("eta, KP_near, distance", eta, KP_near, near.properties.location);
  return KP_near;
}

// function loadGeojson(layerObj) {
//   let url = layerObj.url;
//   console.log("loadGeojson", layerObj.url);
//   //let map = this.map;
//   let popup = L.popup();
//   let layer  = new L.GeoJSON.AJAX(url ,{
//     dataType: 'json',
//     local: true,
//     style: function(feature) {
//             let linestyle;
//             if (feature.properties.hasOwnProperty('style')) {
//               linestyle = feature.properties.style;
//             } else {
//               linestyle = {color: "#ff0000", weight: 2, opacity: 1.0};
//             }
//             return linestyle;      
//     },
//     onEachFeature: function (feature, layer) {
//         layer.on({
//             contextmenu: function onGeojsonLayerClick(evt) {
//                 L.DomEvent.stopPropagation(evt);
//                 let lat = evt.latlng.lat;
//                 let long = evt.latlng.lng;
//                 let contstr = '<b>'+feature.properties.name+'</b>';
//                 if (feature.properties.hasOwnProperty('description')) {
//                   contstr += '<br>' + feature.properties.description;
//                 }
//                 if (feature.properties.hasOwnProperty('vn_uri')) {
//                   contstr += '<br>' + feature.properties.vn_uri;
//                 }
//                 if (feature.properties.hasOwnProperty('KP')) {
//                   let KP = feature.properties.KP;
//                   //let pldist = feature.properties.distance;
//                   //console.log(feature.coordinates);
//                   let pl = turf.lineString(feature.geometry.coordinates);
//                   let pt = turf.point([long, lat]);
//                   let near = turf.nearestPointOnLine(pl, pt);
//                   console.log(near.geometry.coordinates, near.properties.index, near.properties.dist, near.properties.location);
//                   console.log("index, dist, location", near.properties.index, near.properties.dist, near.properties.location);
//                   let pt_loc = near.properties.location;
//                   console.log("pt_loc", pt_loc);
//                   let idx = near.properties.index;
//                   // var KP1 = KP[idx];
//                   // var KP2 = KP[idx+1];
//                   let pt1 = turf.point(feature.geometry.coordinates[idx]);
//                   let pt1_near = turf.nearestPointOnLine(pl, pt1);
//                   let pt1_loc = pt1_near.properties.location;
//                   console.log("pt1_loc", pt1_loc);
//                   let pt2 = turf.point(feature.geometry.coordinates[idx+1]);
//                   let pt2_near = turf.nearestPointOnLine(pl, pt2);
//                   let pt2_loc = pt2_near.properties.location;
//                   console.log("pt2_loc", pt2_loc);
//                   //let contstr = "'CLR22 Processed ROV Position'";
//                   let eta = (pt_loc - pt1_loc)/(pt2_loc - pt1_loc);
//                   let KP_near = KP[idx]*(1 - eta) + KP[idx+1]*eta; 
//                   console.log("eta, KP_near, distance", eta, KP_near, near.properties.location)
//                   contstr += '<br> KP: '+parseFloat(KP_near).toFixed(3);
//                   //contstr += '<br> distance: '+parseFloat(near.properties.location).toFixed(3);
//                 }

//                 popup
//                     .setLatLng(evt.latlng)
//                     .setContent(contstr)
//                     .openOn(map)
//             }
//         });
//     },
//   }  );
//   //console.log("geojson layer", layer)
//   return layer;
// }