
import 'leaflet/dist/leaflet.css';
import L from "leaflet";

import './libs/fullHash/leaflet-fullHash';
import './libs/tree/L.Control.Layers.Tree.css';
import './libs/tree/L.Control.Layers.Tree';


export const makeMap = (confData) => {
    console.log("starting 2 makeMap: ", confData.title);
    let mapOpts = confData.mapOptions;

    const map = L.map('map', {
        attributionControl: false,
        zoom: (mapOpts.zoom || 5),
        minZoom: (mapOpts.minZoom || 2),
        maxZoom: (mapOpts.maxZoom || 14),
        maxBounds: (mapOpts.maxBounds || [[-90,-180], [90,180]]),
        center: (mapOpts.center || [57.0, 2.46]),
        zoomControl: (mapOpts.zoomControl || true)
    });

    mapOpts.zoomControlPosition ? map.zoomControl.setPosition(mapOpts.zoomControlPosition) : map.zoomControl.setPosition('topright');
    

    if (mapOpts.attributionControl) {
        let attribut = L.control.attribution({ 
            position: (mapOpts.attributionPosition || 'bottomright'), 
            prefix: (mapOpts.attributionPrefix || false)
        });
        attribut.addTo(map);
    }


    
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);



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