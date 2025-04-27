




export const attachDatatree = (treeData=null, id_number=0, targetWidget=null) => {
  const datatree_id = "vn-datatree-" + id_number.toString();
  $("#"+datatree_id).fancytree({
    extensions: ["glyph"],
    glyph: {
      preset: "awesome5",
      map: {}
    },
    imagePath: "",
    types: {
      "folder-gis-basemaps": {iconTooltip: "select the base map"},
      "gis-layer-basemap": {icon: false},
      "gis-layer": {icon: false},
      "DISABLED": {icon: "far fa-eye-slash", "iconTooltip": "DISABLED"},
      "gis-folder-flag-au": {icon:  "flag-icon-background flag-icon-au"},
      "gis-folder-flag-dk": {icon:  "flag-icon-background flag-icon-dk"},
      "gis-folder-flag-gb": {icon:  "flag-icon-background flag-icon-gb"},
      "gis-folder-flag-gb-sct": {icon:  "flag-icon-background flag-icon-gb-sct"},
      "gis-folder-flag-ie": {icon:  "flag-icon-background flag-icon-ie"},
      "gis-folder-flag-no": {icon:  "flag-icon-background flag-icon-no"},
      "gis-folder-flag-us": {icon:  "flag-icon-background flag-icon-us"},
    },
    icon: icon_datatree,
    iconTooltip: iconTooltip_datatree,
    select: select_datatree,
    lazyLoad: lazyLoad_datatree,
    init: onInit,
    source: treeData,
    id_number: id_number,
    targetWidget: targetWidget,
    treeId: "vn-fancytree-" + id_number.toString(),
    createNode: onCreateNode
  });

  $.contextMenu({
    selector: "#"+datatree_id+" span.fancytree-title",
    build: build_contextMenu
  });

  return datatree_id;
}

const onCreateNode = (evt, data) => {
  //console.log("datatree onCreateNode node.title", data.node.title);
  let node = data.node;
  if (!node.data.hasOwnProperty('_widgetData')) {
    //console.log("datatree onCreateNode", node.title, "_widgetData={}");
    node.data._widgetData = {};
  }
}


const icon_datatree = (evt, data) => {
  return data.typeInfo.icon;
}

const iconTooltip_datatree = (evt, data) => {
  return data.typeInfo.iconTooltip;
}

const select_datatree = (evt, data) => {
  let gis = data.tree.getOption("targetWidget");
  let node = data.node;
  switch(data.node.type) {
    case "gis-layer-basemap":
      tree_add_all_layers(data.tree);
      break;
    case "gis-layer":
      if (node.isSelected()) {
        let layerObj = Object.assign({}, node.data);
        // if (!node.data.hasOwnProperty('_widgetData')) {
        //   node.data._widgetData = {};
        // }
        node.data._widgetData.layerStamp = gis.addLayer(layerObj);;
      } else {
        gis.removeLayerByStamp(node.data._widgetData.layerStamp);
      }
      break;
    default:
      console.log(`select_datatree ${node.title} ${node.type}`);
  }
}

const lazyLoad_datatree = (evt, data) => {
  let node = data.node;
  data.result = {
    url: node.data.fancytree,
    data: {mode: "children", parent: node.key},
    cache: false
  }
}

const onInit = (evt, data) => {
  tree_add_all_layers(data.tree);
}

const tree_add_all_layers = (tree) => {
  let gis = tree.getOption("targetWidget");
  let root = tree.getRootNode();
  gis.removeAllLayers();
  root.visit((node) => {
    //console.log("onInit title", node.title,"key", node.key);
    node.data._widgetData = {}; // for temporary data
    if (node.type && node.isSelected() && 
        ["gis-layer", "gis-layer-basemap"].includes(node.type) ) {
      let layerObj = Object.assign({}, node.data);
      //console.log("onInit layerObj", layerObj);
      node.data._widgetData.layerStamp = gis.addLayer(layerObj);
    }
  });
}


const build_contextMenu = ($trigger, evt) => {
  let node = $.ui.fancytree.getNode($trigger);
  let gis = node.tree.getOption("targetWidget");
  //let tree = node.tree;
  switch(node.type) {
    case "gis-layer":
      return {
        items: {
          "fitBoundsBbox": {
            name: "zoom-to",
            icon: "fas fa-arrows-alt",
            disabled: function(key, opt) {
              return !node.data.hasOwnProperty("bbox");
            },
            callback: function(key, opt) {
              gis.fitBoundsBbox(node.data.bbox);
            }
        },
          "console-message": {
            name: "msg to console",
            icon: "fas fa-globe",
            callback: (key, opt) => {
              console.log("gis-widget: console-message: testing context menu");
              //commands.execute('message-to-console', {msg: "gis-widget: testing context menu"});
              //let gis = node.tree.getOption("targetWidget");
              let bounds = gis.getMapBounds();
              console.log("map bounds: ", bounds)
            }
          },
        }
      }
    }
}


export const getDatatree = (id_number=0) => {
  const datatree_id = "vn-datatree-" + id_number.toString();
  let datatree = $.ui.fancytree.getTree("#"+datatree_id);
  return datatree;

}

export const getDatatreeDict = (id_number=0) => {
  const datatree_id = "vn-datatree-" + id_number.toString();
  let tree = $.ui.fancytree.getTree("#"+datatree_id);
  let dd = tree.toDict(true);
  return dd;

}