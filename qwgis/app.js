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


function makeGis(confData, id_number) {
    console.log("makeGis confData", confData);

    let mapOpts = confData.gisOptions.mapOptions;
    let gisOpts = confData.gisOptions;

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
    
    
    let map = L.map('map', {
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
          prefix: '<a target="_blank" href="https://qwilka.github.io/post/2018-04-19-introducing-qwilka-gis/">About Qwilka GIS</a>'
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


    for (let ii=0; ii<ftree.length; ii++) {
      let toplevel = ftree[ii], mapObj, layer;
      if (toplevel.type === "gis-folder-basemaps") {
        for (let jj=0; jj<toplevel.children.length; jj++) {
          let layerObj = toplevel.children[jj];
          if (layerObj.type !== "gis-layer-basemap") continue;
          // console.log("layerObj", layerObj);
          let layer = addMapLayer(layerObj, map);
          //console.log("layer", layer);
          baseTree.children.push({ label: layerObj.title, layer: layer })
          allMapLayers[layerObj.data.layerId] = layer;
          console.log("layerObj.title", layerObj.title);
          console.log("layerObj.selected", layerObj.selected);
          if (layerObj.selected) {
            console.log("default layer", layer);
            map.addLayer(layer);
          }
          //if (jj==2) break;
        }
      }
    }


    // let baseTree = {
    //   label: 'World base maps &#x1f5fa;',
    //   children: [
    //       { label: GEBCO.title, layer: GEBCO.layer },
    //       { label: 'white background', layer: WhiteBG }
    //   ]
    // };
    // let overlayTree = {
    //   label: 'overlays',
    //   children: [
    //       { label: GEBCO.title, layer: GEBCO.layer },
    //       { label: 'blank', layer: WhiteBG }
    //   ]
    // };
    let overlayTree = {label: 'overlays', children: []};

    var layerCtl = L.control.layers.tree(baseTree, overlayTree, {
      collapsed: true,
      collapseAll: '<font color="#909090" size="2">(close all)</font>'  
    });
    layerCtl.addTo(map);
    layerCtl.collapseTree(true);
    layerCtl.collapseTree(true);
    layerCtl.setPosition('topleft');

    //  console.log("allMapLayers", allMapLayers);
    var hash = new L.Hash(map, allMapLayers);

}

function addMapLayer(layerObj, mapref) {
  //console.log("addLayer layerObj", layerObj);
  let layer;
  switch(layerObj.data.layerType) {
    // case "geojson":
    //   layer = loadGeojson(layerObj.url);
    //   break;
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
