
import 'leaflet/dist/leaflet.css';
import L from "leaflet";

//import {Utm, LatLon} from 'geodesy/utm';
// import LatLon from 'geodesy/latlon-ellipsoidal.js';
// import Utm from 'geodesy/utm.js';
import Mgrs, { Utm, LatLon, Dms } from 'geodesy/mgrs.js';

import './libs/fullHash/leaflet-fullHash';
import './libs/control-layers-tree/L.Control.Layers.Tree.css';
import './libs/control-layers-tree/L.Control.Layers.Tree';

import {VnNode, layersTree, basemaps, overlays} from './vntree.js';
window.layersTree = layersTree;

export const makeMap = (confData) => {
    console.log("makeMap: ", confData.title);
    let mapOpts = confData.mapOptions;

    const map = L.map('map', {
        attributionControl: mapOpts.attributionControl===null ? true : false,
        zoom: (mapOpts.zoom || 5),
        minZoom: (mapOpts.minZoom || 2),
        maxZoom: (mapOpts.maxZoom || 14),
        maxBounds: (mapOpts.maxBounds || [[-90,-180], [90,180]]),
        center: (mapOpts.center || [57.0, 2.46]),
        zoomControl: (mapOpts.zoomControl || true)
    });

    mapOpts.zoomControlPosition ? map.zoomControl.setPosition(mapOpts.zoomControlPosition) : map.zoomControl.setPosition('topright');
    

    if (mapOpts.attributionControl && mapOpts.attributionControl!==null) {
        let attribut = L.control.attribution({ 
            position: (mapOpts.attributionPosition || 'bottomright'), 
            prefix: (mapOpts.attributionPrefix || false)
        });
        attribut.addTo(map);
    }


    
    // L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    //     maxZoom: 19,
    //     attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    // }).addTo(map);
    var allMapLayers = {};
    var layerCtl = null;
    if (mapOpts.layerControl) {
      // VnNode, layersTree, baselayers, overlays
      let layers = confData.layers;
      for (let ly of layers) {
        if (ly.parent === "basemaps") {
          new VnNode(ly.title || ly.name, basemaps, ly, null, ly.id);
        }
        if (ly.parent === "overlays") {
          new VnNode(ly.title || ly.name, overlays, ly, null, ly.id);
        }
      }
      console.log(layersTree.to_texttree());
      let baseL = {};
      for (let child of basemaps.get_child()) {
        console.log("basemaps child ", child.name, child.get_data());
        let layer = node2maplayer(child);
        if (!layer) continue;
        baseL[child.name] = layer;
        allMapLayers[child.id] = layer;
        if (child.selected) {
          map.addLayer(layer);
        }
      }       

      let overL = {};
      for (let child of overlays.get_child()) {
        console.log("overlays child ", child.name, child.get_data());
        let layer = node2maplayer(child);
        if (!layer) continue;
        overL[child.name] = layer;
        allMapLayers[child.id] = layer;
        if (child.selected) {
          map.addLayer(layer);
        }
      } 
      
      layerCtl = L.control.layers(baseL, overL,{"hideSingleBase":true}).addTo(map);
      

    } else if (mapOpts.layerTreeControl) {

      let ftree = confData["layerTree"];
      if (!ftree) {
        ftree = confData.tree_vnleaf_0;
      }

      let baseTree = {
        label: 'World base maps &#x1f5fa;',
        children: []
      };
      //var allMapLayers = {};
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

      layerCtl = L.control.layers.tree(baseTree, overlayTree, {
        collapseAll: '<font color="#909090" size="2">(close all)</font>',
        collapsed: true 
      });
      layerCtl.addTo(map);
      //layerCtl.setPosition('topleft');   
      //mapOpts.layerControlPosition ? layerCtl.setPosition(mapOpts.layerControlPosition) : layerCtl.setPosition('topleft');
      //layerCtl.collapseTree(false);
      layerCtl.collapseTree(true); 
    }  else {
      let fallbackLayer = confData.layers[0];
      L.tileLayer(fallbackLayer.url, fallbackLayer.layerOpts).addTo(map);
    }  
    if (layerCtl) mapOpts.layerControlPosition ? 
         layerCtl.setPosition(mapOpts.layerControlPosition) : layerCtl.setPosition('topleft');


    if (mapOpts.hash) {
      let hash = new L.Hash(map, allMapLayers); 
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





function makeLayersTree(ftree_folder, mapref, allMapLayers) {
    let layerTreeChildren = [];
    for (let jj=0; jj<ftree_folder.children.length; jj++) {
      let layerObj = ftree_folder.children[jj];
      if (layerObj.hasOwnProperty('active') && layerObj.active == false) continue;
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

function node2maplayer(vnnode) {
  let layer=false;
  switch(vnnode.type) {
    case "geojson":
      //layer = loadGeojson(layerObj.data);
      break;
    case "tilemap":
      layer = L.tileLayer(vnnode.url, vnnode.options);
      break;
    case "WMS":
      layer = L.tileLayer.wms(vnnode.url, vnnode.options);
      break;
  }
  //mapref.addLayer(layer);
  // let layerStamp = L.Util.stamp(layer);
  // console.log("addLayer layerStamp", layerStamp);
  // console.log("addLayer layer", layer);
  return layer;
}


function createMapLayer(layerObj) {
  let layer=false;
  switch(layerObj.data.layerType) {
    case "geojson":
      //layer = loadGeojson(layerObj.data);
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



function locationPopup(evt, map, popup, preText=null) {
  // https://www.gebco.net/data-products/gebco-web-services/previous-wms
  // https://wms.gebco.net/2014/mapserv?request=getcapabilities&service=wms&version=1.3.0
  //let url = "https://wms.gebco.net/2014/mapserv";
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


  // let params = {
  //   request: 'GetFeatureInfo',
  //   service: 'WMS',
  //   CRS: 'EPSG:4326',
  //   version: '1.3.0',      
  //   bbox: map.getBounds().toBBoxString(),
  //   x: X,
  //   y: Y,
  //   height: size.y,
  //   width: size.x,
  //   layers: 'GEBCO_2014_Grid',
  //   query_layers: 'GEBCO_2014_Grid',
  //   info_format: 'text/html'
  // };
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
  // let getinfo = $.ajax({
  //     url: featInfoUrl,
  //     dataType: "html",
  //     success: function (doc) { console.log("getinfo successfully loaded!\n", doc);},
  //     error: function (xhr) { console.log("getinfo ERROR!\n", xhr.statusText); }
  // })
  // $.when(getinfo).done(function() {
  //     let htmlstr = $.parseHTML( getinfo.responseText );
  //     let body = $(htmlstr).find('body:first');
  //     $.each(htmlstr, function(i, el){
  //         //console.log(i, el)
  //         if (el.nodeName == '#text') {
  //             let targetStr = el.nodeValue
  //             // console.log(i, targetStr);
  //             let test = targetStr.match(/Elevation value \(m\):\s*(-?\d+)/)
  //             if (test) {
  //                 let elevation = test[1];
  //                 if (elevation>=0) {
  //                     pustr += "<br>elevation " + elevation + " m (GEBCO)";
  //                 } else {
  //                     pustr += "<br>depth " + elevation + " m (GEBCO)";
  //                 }
  //                 // console.log("elevation=", elevation)
  //                 popup.setContent(pustr)
  //             }
  //         }
  //     });
  // });  


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

