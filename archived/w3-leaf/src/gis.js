


//import {Utm, LatLon} from 'geodesy/utm';
//import {Utm, LatLon} from 'https://cdn.jsdelivr.net/npm/geodesy@2.2.1/utm.min.js';

var useCache=false; // global over-ride, set useCache=false to re-load all cached data

export class Vnleafmap {

  constructor({id_number=0, gisOptions=null} = {}) {
    this.id_number = id_number;
    this.map_id = "vn-map-" + id_number.toString();
    this.geoMarker = null;  
    // console.log(`Vnleafmap map_id=${this.map_id}`);
    // console.log("Vnleafmap gisOptions", gisOptions);
    
    this.map = L.map(this.map_id, gisOptions.mapOptions); 
    if (this.map.zoomControl) {
      this.map.zoomControl.setPosition('topright');
    }
    // this.markers = L.layerGroup();
    // this.markers.addTo( this.map );
    

    if (gisOptions.sidePanel) {
      let ebutton_id = "vn-map-ebutton-" + this.id_number.toString();
      let ebutton = L.easyButton("fas fa-bars", (btn, map) => {
        let sidepanel_id = "vn-sidepanel-" + this.id_number.toString();
        let sb = document.getElementById(sidepanel_id);
        sb.style.display = "block";
      }, 'open side-panel controls', ebutton_id);
      ebutton.addTo( this.map );
    }
    
    if (gisOptions.locationPopup) {
      this.popup = L.popup();
      this.map.on('contextmenu', (evt) => {this.locationPopup(evt);});
    }

    if (gisOptions.scaleControl) {
      let scale = L.control.scale({position:'bottomright', metric:true, imperial:false});
      scale.addTo(this.map);
    }

    if (gisOptions.hasOwnProperty('useCache')) {
      useCache = gisOptions.useCache;
    }

  }

  addLayer(layerObj) {
    //console.log("addLayer layerObj", layerObj);
    let layer;
    switch(layerObj.layerType) {
      case "geojson":
        // layer = this.loadGeojson(layerObj.url);
        layer = loadGeojson(layerObj, this);
        break;
      case "tilemap":
        layer = L.tileLayer(layerObj.url, layerObj.layerOpts);
        break;
      case "WMS":
        layer = L.tileLayer.wms(layerObj.url, layerObj.layerOpts);
        break;
    }
    this.map.addLayer(layer);
    let layerStamp = L.Util.stamp(layer);
    // console.log("addLayer layerStamp", layerStamp);
    // console.log("addLayer layer", layer);
    return layerStamp;
  }

  getLayerByStamp(layerStamp) {
    let _layers = [];
    this.map.eachLayer((layer) => {_layers.push(layer)})
    //console.log("getLayerByStamp _layers", _layers);
    for (let ii=0; ii<_layers.length; ii++) {
      if (_layers[ii]._leaflet_id == layerStamp) {
        return _layers[ii];
      }
    }
  }

  removeLayerByStamp(layerStamp) {
    let layer = this.getLayerByStamp(layerStamp);
    this.map.removeLayer(layer);
  }

  removeAllLayers() {
    this.map.eachLayer( (layer) => {
      this.map.removeLayer(layer);
    });
  }


  getAllAttributions() {
    let _layers = [];
    this.map.eachLayer((layer) => {_layers.push(layer)})
    let _attributions = [];
    //console.log("getLayerByStamp _layers", _layers);
    for (let ii=0; ii<_layers.length; ii++) {
      _attributions.push( _layers[ii].getAttribution() );
    }
    return _attributions;
  }

  getMapBounds() {
    //let wid = findSelectedWidget("gis-");
    let bounds = this.map.getBounds();
    bounds = bounds.toBBoxString();
    //console.log(bounds.toBBoxString());
    return bounds;
  }

  fitBoundsBbox(bbox) {
    this.map.fitBounds([
      [bbox[1], bbox[0]],
      [bbox[3], bbox[2]]
    ]);
  }


  locationPopup(evt, preText=null) {
    let url = "https://wms.gebco.net/mapserv";
    let X = this.map.layerPointToContainerPoint(evt.layerPoint).x;
    let Y = this.map.layerPointToContainerPoint(evt.layerPoint).y;
    let size = this.map.getSize();
    let pustr;
    let popup = this.popup;  // required for callback below
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
      bbox: this.map.getBounds().toBBoxString(),
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
    //pustr += "<br>long. " + (long).toFixed(5) + "&deg;  lat. " + (lat).toFixed(5) + "&deg; (WGS84)";
    pustr += `<br> ${latlong_WGS84.toString()}`;
    pustr += "<br>UTM zone " + utm_ED50.zone + utm_ED50.hemisphere;
    pustr += "<br>E" + (utm_ED50.easting).toFixed(1) + " N" + (utm_ED50.northing).toFixed(1) + " (ED50)";
    this.popup
      .setLatLng(evt.latlng)
      .setContent(pustr)
      .openOn(this.map)
  }




}


function loadGeojson(layerObj, gisOBj) {
  let map = gisOBj.map;
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
                gisOBj.locationPopup(evt, preText);
  
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

// work-around
// sidepanel_close(evt) {
//   let sidepanel_id = "vnsidepanel-" + evt.target.getAttribute("id_number");
//   console.log("sidepanel_close sidepanel_id", sidepanel_id);
//   let sb = document.getElementById(sidepanel_id);
//   sb.style.display = "none";
// }



