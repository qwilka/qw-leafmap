
import 'leaflet/dist/leaflet.css';
import L from "leaflet";

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

