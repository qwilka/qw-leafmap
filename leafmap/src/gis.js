
import 'leaflet/dist/leaflet.css';
import L from "leaflet";

//import {Utm, LatLon} from 'geodesy/utm';
// import LatLon from 'geodesy/latlon-ellipsoidal.js';
// import Utm from 'geodesy/utm.js';
import Mgrs, { Utm, LatLon, Dms } from 'geodesy/mgrs.js';

import './libs/fullHash/leaflet-fullHash-config';
import './libs/control-layers-tree/L.Control.Layers.Tree.css';
import './libs/control-layers-tree/L.Control.Layers.Tree';

import {VnNode, layersTree, basemaps, overlays} from './vntree';
window.layersTree = layersTree;




export const makeMap = (confData) => {
    console.log("makeMap: ", confData.title);
    let mapOpts = confData.mapOptions;

    const map = L.map('map', {
        attributionControl: mapOpts.attributionControl===true || false,
        zoom: (mapOpts.zoom || 8),
        minZoom: (mapOpts.minZoom || 2),
        maxZoom: (mapOpts.maxZoom || 16),
        maxBounds: (mapOpts.maxBounds || [[-90,-180], [90,180]]),
        center: (mapOpts.center || [53.711, -7.361]),
        zoomControl: (mapOpts.zoomControl || false)
    });

    if (mapOpts.zoomControl) {
      mapOpts.zoomControlPosition ? 
      map.zoomControl.setPosition(mapOpts.zoomControlPosition) : 
      map.zoomControl.setPosition('topright');
    }
    

    if (mapOpts.attributionControl==="custom") {
        let attribut = L.control.attribution({ 
            position: (mapOpts.attributionPosition || 'bottomright'), 
            prefix: (mapOpts.attributionPrefix || false)
        });
        attribut.addTo(map);
    }

        // }).addTo(map);
    var allMapLayers = {};
    if (confData.layers) {
      let newnode=null;
      for (let ly of confData.layers) {
        let parentNode = layersTree.get_node_by_name(ly.parent);
        if (parentNode) {
          newnode = new VnNode(ly.title || ly.name, parentNode, ly, null, ly.id);
          newnode.layer = node2maplayer(newnode);
          if (newnode.layer) {
            allMapLayers[newnode.id] = newnode.layer;
            if (newnode.selected)  map.addLayer(newnode.layer);
          }           
        } else {
          console.warn("No parent node found for layer", ly.name);
        }
      }
      console.log(layersTree.to_texttree());
    }



    var layerCtl = null;
    if (mapOpts.layerControl===true) {
      let baseL = {};
      for (let child of basemaps.get_child()) {
        // console.log("basemaps child ", child.name, child.get_data());
        if (child.get_data('deactivate')) continue;
        if (!child.layer) continue;
        baseL[child.name] = child.layer;
      }       

      let overL = {};
      for (let child of overlays.get_child()) {
        // console.log("overlays child ", child.name, child.get_data());
        if (child.get_data('deactivate')) continue;
        if (!child.layer) continue;
        overL[child.name] = child.layer;
      } 
      
      layerCtl = L.control.layers(baseL, overL,{"hideSingleBase":true,
        "collapsed": true, 
        "position": mapOpts.layerControlPosition || 'topleft'
      }).addTo(map);
      

    } else if (mapOpts.layerControl==="tree") {

      let baseL = basemaps.to_layerTreeObj();
      console.log("baseL", baseL);

      let overL = overlays.to_layerTreeObj().children;

      layerCtl = L.control.layers.tree(baseL, overL, {
        collapseAll: '<font color="#909090" size="2">(close all)</font>',
        namedToggle: false,
        selectorBack: false,
        closedSymbol: '<font color="#000000" size="4">&#x1F782; &#x1f5c0;</font>',
        openedSymbol: '<font color="#000000" size="4">&#x1F783; &#x1f5c1;</font>',
        collapsed: true
      });
      layerCtl.addTo(map);
      layerCtl.setPosition(mapOpts.layerControlPosition || 'topleft');   
      layerCtl.collapseTree(true); 
    }  


    if (mapOpts.hash) {
      let hash = new L.Hash(map, allMapLayers); 
    }

    if (mapOpts.scaleControl) {
      let scale = L.control.scale({position: mapOpts.scaleControlPosition || 'topright', 
        metric: mapOpts.scaleControlMetric || true, 
        imperial: mapOpts.scaleControlImperial || false,
        maxWidth: mapOpts.scaleControlMaxWidth || 100
      });
      scale.addTo(map);      
    }


    //let popup;
    if (mapOpts.locationPopup) {
      let geoPopup = L.popup();
      map.on('contextmenu', (evt) => {
        let pustr = locationPopup(evt, map, geoPopup);
        geoPopup.setLatLng(evt.latlng)
        .setContent(pustr)
        .openOn(map);    
      });
  
    }





}



function node2maplayer(vnnode, map=null) {
  let layer=null;
  switch(vnnode.type.toLowerCase()) {
    case "geojson":
      layer = loadGeojson(vnnode.url, vnnode.get_data(), map);
      break;
    case "tilemap":
      layer = L.tileLayer(vnnode.url, vnnode.options);
      break;
    case "wms":
      layer = L.tileLayer.wms(vnnode.url, vnnode.options);
      break;
  }
  return layer;
}




function locationPopup(evt, map, popup, preText=null) {
  let url = "https://wms.gebco.net/mapserv";
  let X = map.layerPointToContainerPoint(evt.layerPoint).x;
  let Y = map.layerPointToContainerPoint(evt.layerPoint).y;
  let size = map.getSize();
  let pustr;
  if (preText) {
    pustr = preText + "<br>Location coordinates:";
  } else {
    pustr = "Location coordinates:";
  }

  let lat = evt.latlng.lat;
  let long = evt.latlng.lng;
  pustr += "<br>long. " + (long).toFixed(5) + "&deg;  lat. " + (lat).toFixed(5) + "&deg; (WGS84)";


  console.log("long", long, "lat", lat);
  let latlong_WGS84 = new LatLon(lat, long);
  console.log("latlong_WGS84 ", latlong_WGS84.toString());

  let utm_wgs84 = latlong_WGS84.toUtm();
  pustr += "<br>UTM zone " + utm_wgs84.zone + utm_wgs84.hemisphere;
  pustr += "<br>E" + (utm_wgs84.easting).toFixed(1) + " N" + (utm_wgs84.northing).toFixed(1) + " (WGS84)";

  let latlong_ED50 = latlong_WGS84.convertDatum(LatLon.datums.ED50);
  // work-around required to recover method toUtm() (cannot use .convertDatum() directly)
  latlong_ED50 = new LatLon(latlong_ED50.lat, latlong_ED50.lon, 0, LatLon.datums.ED50);
  let utm_ED50 = latlong_ED50.toUtm();  
  //pustr += "<br>UTM zone " + utm_ED50.zone + utm_ED50.hemisphere;
  pustr += "<br>E" + (utm_ED50.easting).toFixed(1) + " N" + (utm_ED50.northing).toFixed(1) + " (ED50)";


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
  infoRequest(featInfoUrl, pustr, popup);

  return pustr;
}

async function infoRequest(url, pustr, popup){
  console.log("infoRequest url ", url);
  let elevation = null;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const rtext = await response.text();
    console.log(rtext);

    let test = rtext.match(/Elevation value \(m\):\s*(-?\d+)/)
    if (test) {
        //console.log("test elevation string: ", test);
        let elevation = test[1];
        if (elevation>=0) {
            pustr += "<br>elevation " + elevation + " m (GEBCO)";
        } else {
            pustr += "<br>depth " + elevation + " m (GEBCO)";
        }
        // console.log("elevation=", elevation)
        popup.setContent(pustr)
    }
  } catch (error) {
    console.error(error.message);
  }
}




function loadGeojson(url, layerData, map) {
  let attribution = null;
  if (layerData.hasOwnProperty("options")) {
    attribution = layerData.options.attribution || null;
  }
  let layer  = new L.GeoJSON(null, {
    style: function(feature) {
            let linestyle = {color: "#ff0000", weight: 2, opacity: 1.0};
            if (layerData.hasOwnProperty('style')) {
              if (layerData.style.hasOwnProperty('default')) {
                Object.assign(linestyle, layerData.style.default);
                if (layerData.style.default.color === true && feature.properties.hasOwnProperty('color')) {
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
              for (const [key, styObj] of Object.entries(layerData.style)) {
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
            // if (layerData.style.default.color === true && feature.properties.hasOwnProperty('color')) {
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
              if (layerData.hasOwnProperty('popupProps')) {
                for (let ii=0; ii<layerData.popupProps.length; ii++) {
                  let _parts = layerData.popupProps[ii].split("||");
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
      return L.circleMarker(latlng, layerData.layerOpts.geojsonMarkerOptions);
    }
  });   
  let dataObj=false;   
  if (layerData.cache) {
    dataObj = localStorage.getItem(layerData.id);
  }
  if (dataObj) {
    console.log(`loadGeojson: localStorage retrieving ${layerData.id}`);
    //dataObj = LZString.decompressFromUTF16(dataObj);
    //console.log(`after LZString.decompress ${dataObj}`);
    dataObj = JSON.parse(dataObj);
    console.log(`loadGeojson: dataObj.cache_timestamp ${dataObj.cache_timestamp}`);
    // console.log("loadGeojson: dataObj: ", dataObj);
    layer.addData(dataObj.data);
  } else {
    fetch(url)
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
        if (layerData.cache) {
          dataObj = {
            cache_timestamp: Date.now(),
            type: "geojson",
            data: data
          };
          dataObj = JSON.stringify(dataObj);
          console.log("dataObj length", dataObj.length);
          // https://dev.to/ternentdotdev/json-compression-in-the-browser-with-gzip-and-the-compression-streams-api-4135
          //dataObj = LZString.compressToUTF16(dataObj);
          console.log("compressed length", dataObj.length);
          try {
            localStorage.setItem(layerData.id, dataObj);
          } catch (exception) {
            console.error(`localStorage ${exception} ${layerData.id}`);
          }
        }
      })
      // .catch((err) => {
      //   console.log("load_config failure in callback:", err);
      // });      
    })
    .catch((err) => {
      console.error(`loadGeojson fetch(${url}) failure: ${err}`);
    });
  }
  return layer;
}
