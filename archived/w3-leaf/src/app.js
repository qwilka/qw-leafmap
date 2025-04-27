
import { attachDatatree, getDatatree } from './datatree';
import {Vnleafmap} from "./gis"
import {helpHtml} from "./help"

//import './libs/w3.css';
//import '@fortawesome/fontawesome-free/css/all.css';



window.geosearch = function (el) {
  let ip, ll, _html;
  let node = document.getElementById("geosearch");
  ip = node.value;   // el.value
  console.log("in window.geosearch", ip);
  console.log(`Input value: ${ip}`);
  // '58°38′38″N, 003°04′12″W'
  ll = LatLon.parse('58°38′38″N, 003°04′12″W');
  console.log(`58°38′38″N, 003°04′12″W\nlong=${ll.lng} lat=${ll.lat}`);
  ll = null;
  try {
    ll = LatLon.parse(ip);
  } catch (err) {
    console.log(`LatLon.parse(el.value) error1= ${err}`);
    ll = null;
  }
  if (!ll) {    
    try {
      ll = LatLon.parse(ip.replace(" ", ", "));
    } catch (err) {
      console.log(`LatLon.parse(el.value) error2= ${err}`);
      ll = null;
    }
  }

  let geosearchResultNode = document.getElementById("geosearch-result");
  if (ll) {
    _html = "<ul class='w3-ul w3-border w3-small'>";

    _html += `<li> long=${ll.lng} lat=${ll.lat} </li>`;
    _html += "</ul>";
    //let map = app.gis.map;
    let pos = {lat: ll.lat, lng: ll.lng};
    app.gis.map.setView(pos, app.gis.map.getZoom());
    console.log("map.setView", ll.toString());

    if (app.gis.map.hasLayer(app.gis.geoMarker)) {
      app.gis.geoMarker.setLatLng(pos); 
    } else {
      app.gis.geoMarker =  L.marker(pos);
      app.gis.map.addLayer(app.gis.geoMarker);
    }


  } else {
    _html = "<ul class='w3-ul w3-border w3-small'>";

    _html += `<li><span style="color:red">Error parsing «${ip}», re-enter Lat,Long coordinates.</span><br>e.g. for London enter <br>51.5, 0<br>Note: coodinates can be copied from Wikipedia page, e.g.<br>51°30′26″N 0°7′39″W</li>`;
    _html += "</ul>";    
  }

  geosearchResultNode.innerHTML = _html;
}


window.clearGeosearch = function (el) {
  let node = document.getElementById("geosearch");
  node.value = "";
  let rnode = document.getElementById("geosearch-result");
  rnode.innerHTML = ""; //"<ul class='w3-ul w3-border w3-small'></ul>";
  app.gis.map.removeLayer(app.gis.geoMarker);
}


export class VnApp {



  constructor({app_id, gisOptions, ftree_vnleaf_0, id_number=0, title="qwleaf testing..."} = {}) {

    this.id_number = id_number;
    this.id = app_id; //"vnapp-" + id_number.toString();
    //document.title = title;
    // console.log("VnApp app_id", app_id);
    // console.log("VnApp gisOptions", gisOptions);
    //console.log("tree_vnleaf", tree_vnleaf);


    const appNode = document.getElementById(app_id);
 
    // https://www.w3schools.com/w3css/w3css_sidebar.asp
    const sidepanelNode = document.createElement('div');
    this.sidepanel_id = "vn-sidepanel-" + this.id_number.toString();
    sidepanelNode.setAttribute("id", this.sidepanel_id);
    sidepanelNode.setAttribute("class", "w3-sidebar w3-bar-block w3-border-right");
    sidepanelNode.setAttribute("style", "display:none;z-index:2000;width:300px;height:100%;");
    appNode.appendChild(sidepanelNode);

    // Side-panel top ------------------------------------
    const spTopGridRow = document.createElement('div');
    spTopGridRow.setAttribute("class", "w3-row");
    sidepanelNode.appendChild(spTopGridRow);
    const spCloseButtCol = document.createElement('div');
    spCloseButtCol.setAttribute("class", "w3-col w3-right w3-blue-grey");
    spCloseButtCol.setAttribute("style", "width:40px;height:50px;");
    spTopGridRow.appendChild(spCloseButtCol);

    const spCloseButton = document.createElement('button');
    spCloseButton.setAttribute("class", "w3-bar-item w3-button w3-dark-grey");
    spCloseButton.setAttribute("title", "close side panel");
    spCloseButton.setAttribute("style", "width:40px;height:50px;");
    //spCloseButton.setAttribute("id_number", this.id_number.toString());
    spCloseButton.onclick = (evt) => {
      this.sidepanel_close();
    }
    //spCloseButton.innerHTML = "close &times;";
    //const spCloseButtContent = document.createElement('p');
    //spCloseButton.appendChild(spCloseButtContent);
    spCloseButtCol.appendChild(spCloseButton);
    const spCloseButtIcon = document.createElement('i');
    spCloseButtIcon.setAttribute("class", "fas fa-caret-left w3-xxlarge");
    spCloseButton.appendChild(spCloseButtIcon);


    const spTopTitleCol = document.createElement('div');
    spTopTitleCol.setAttribute("class", "w3-rest w3-center w3-blue-grey");
    spTopTitleCol.setAttribute("style", "height:50px;");
    // const spTopTitleColContent = document.createElement('p');
    // let spTopTitleColContent_id = "vn-sidepanel-title-" + this.id_number.toString();
    // spTopTitleColContent.setAttribute("id", spTopTitleColContent_id);
    // spTopTitleColContent.innerHTML = "Visinum GIS";
    // spTopTitleCol.appendChild(spTopTitleColContent);
    spTopGridRow.appendChild(spTopTitleCol);
    this.spTopTitleCol = spTopTitleCol;



    // Side-panel main content ------------------------------------
    const spMainGridRow = document.createElement('div');
    spMainGridRow.setAttribute("class", "w3-row");
    spMainGridRow.setAttribute("style", "height:100%;");
    sidepanelNode.appendChild(spMainGridRow);
    const spTabCol = document.createElement('div');
    spTabCol.setAttribute("class", "w3-col w3-border w3-light-gray");
    spTabCol.setAttribute("style", "width:32px;height:100%;");
    //spTabCol.innerHTML = "g";
    spMainGridRow.appendChild(spTabCol);
    this.spTabCol = spTabCol;

    const spMainCol = document.createElement('div');
    spMainCol.setAttribute("class", "w3-rest");
    //spMainCol.setAttribute("style", "height:50px;");
    spMainGridRow.appendChild(spMainCol);
    this.spMainCol = spMainCol;




    // GIS map ------------------------------------
    appNode.setAttribute("style", "position:fixed; top:0; left:0; bottom:0; right:0;");
    const _map_id = "vn-map-" + id_number.toString();
    const _mapnode = document.createElement('div');
    _mapnode.setAttribute("style", "width: 100%; height: 100%; margin: 0 auto;");
    _mapnode.setAttribute("id", _map_id);
    appNode.appendChild(_mapnode);
    this.gis = new Vnleafmap({id_number:this.id_number, gisOptions:gisOptions});


    // Data tree ------------------------------------
    const datatreeNode = this.createSpWidget("layers", "Select map layers", "fas fa-layer-group");
    //const datatreeNode = document.createElement('div');
    let datatree_id = "vn-datatree-" + this.id_number.toString();
    datatreeNode.setAttribute("id", datatree_id);
    console.log(`datatree_id=${datatree_id}`);

    datatree_id = attachDatatree(ftree_vnleaf_0, this.id_number, this.gis);
    console.log(`datatree_id=${datatree_id}`);
    this.datatree = getDatatree(this.id_number);




    this.createSpWidget("attributions", "Map attributions", "far fa-copyright");



    let geosearchNode = this.createSpWidget("geosearch", "Search", "fas fa-search");
    const geosearchBoxNode = document.createElement('div');
    geosearchBoxNode.setAttribute("id", "geosearchbox");
    geosearchBoxNode.innerHTML = `<div class="w3-container w3-border"> 
    <div class="w3-row w3-section">
    <div class="w3-rest">
      <input class="w3-input w3-border w3-border-green" id="geosearch" name="loc" type="text" placeholder="input Lat,Long coordinates" onchange="geosearch(this)"/>
    </div>
    </div>
      <div class="w3-row w3-section">
      <button class="w3-button w3-left w3-green" onclick="geosearch()">Search</button>
      <button class="w3-button w3-right w3-green" onclick="clearGeosearch()">Clear</button>
      </div>
    </div>`
    geosearchNode.appendChild(geosearchBoxNode);
    const geosearchResultNode = document.createElement('div');
    geosearchResultNode.setAttribute("id", "geosearch-result");
    geosearchNode.appendChild(geosearchResultNode);
    // const geosearchDiv1 = document.createElement('div');
    // geosearchDiv1.setAttribute("class", "w3-container w3-border");
    // const geosearchDiv2 = document.createElement('div');
    // geosearchDiv2.setAttribute("class", "w3-row w3-section");
    // geosearchDiv1.appendChild(geosearchDiv2);
    // const geosearchDiv3 = document.createElement('div');
    // geosearchDiv3.setAttribute("class", "w3-rest");
    // geosearchDiv2.appendChild(geosearchDiv3);
    // const geosearchInput = document.createElement('input');
    // geosearchInput.setAttribute("type", "text");
    // geosearchInput.setAttribute("placeholder", "enter location");
    // geosearchInput.setAttribute("class", "w3-input w3-border");
    // geosearchInput.setAttribute("id", "geosearch");
    // geosearchInput.setAttribute("name", "loc");
    // geosearchInput.setAttribute("onChange", "geosearch(this)");
    // geosearchDiv3.appendChild(geosearchInput);
    // geosearchNode.appendChild(geosearchDiv1);


  let helpWid = this.createSpWidget("help", "Help", "fas fa-question");
  helpWid.innerHTML = helpHtml;


  let optionsWid = this.createSpWidget("options", "Options", "fas fa-cog");
  optionsWid.innerHTML = `<div class="w3-container w3-border"> 
  <h2>Options</h2>
  <p>No set-able options currently available ....</p>
  <hr>
</div>`

    this.showSidepanelWidget("layers");
    //this.sidepanel_open();



  }

  // geosearch(e) {
  //   let sb = document.getElementById("geosearch");
  //   console.log("geosearch:", sb.value, e);
  // }

  sidepanel_open() {
    let sb = document.getElementById(this.sidepanel_id);
    sb.style.display = "block";
  }

  sidepanel_close() {
    let sidepanel_id = "vn-sidepanel-" + this.id_number;
    // console.log("sidepanel_close sidepanel_id", sidepanel_id);
    let sb = document.getElementById(sidepanel_id);
    sb.style.display = "none";
  }

  showSidepanelWidget(dataIdent) {
    //this.spTabCol
    //this.spMainCol.childNodes
    for (let ii=0; ii<this.spMainCol.childNodes.length; ii++) {
      let currNode = this.spMainCol.childNodes[ii];
      //console.log("showSidepanelWidget", ii, currNode);
      let currIdent = currNode.getAttribute("data-ident");
      //console.log("data-ident", ii, currIdent);
      if (dataIdent===currIdent) {
        let title = currNode.getAttribute("data-title");
        this.spTopTitleCol.innerHTML = "<p>" + title + "</p>";
        currNode.style.display = "block";
      } else {
        currNode.style.display = "none";
      }
    }

  }

  createSpWidget(ident, title, iconClass) {
    const spWidgetNode = document.createElement('div');
    spWidgetNode.setAttribute("style", "display:none;");
    spWidgetNode.setAttribute("id", "sp-" + ident);
    spWidgetNode.setAttribute("data-ident", ident);
    spWidgetNode.setAttribute("data-title", title);
    this.spMainCol.appendChild(spWidgetNode);  

    const spTabButton = document.createElement('button');
    spTabButton.setAttribute("class", "w3-button w3-dark-grey");
    spTabButton.setAttribute("style", "margin:1px;padding:4px 2px 2px 2px;height:32px;width:32px;");
    spTabButton.setAttribute("title", title);   

    // if (this.datatree) {
    //   let rootnode = this.datatree.getRootNode();
    //   rootnode.visit((node) => {console.log(node.title)});
    // }


    let cFunc;  // cannot call this onClickFunc ????
    switch (ident) {
      case 'attributions':
        cFunc = (evt) => {
          this.showSidepanelWidget(ident);
          let _atts = this.gis.getAllAttributions();
          let _html = "<ul class='w3-ul w3-border w3-small'>";
          let _att_previous = "";
          for (let ii=0; ii<_atts.length; ii++) {
            if (!_atts[ii]) continue;
            if (_att_previous === _atts[ii]) continue;
            _att_previous = _atts[ii];
            let title="", rootnode = this.datatree.getRootNode();
            rootnode.visit((node) => {
              if (node.data.hasOwnProperty('layerOpts') && node.data.layerOpts.hasOwnProperty('attribution') && node.data.layerOpts.attribution === _atts[ii]) {
                title =  `<b>${node.title}</b>: `;
                return false;
              }              
            });
            _html += "<li>" + title + _atts[ii] + "</li>";
          }
          _html += "</ul>";
          spWidgetNode.innerHTML = _html;
        }
        break;
        default:
        cFunc = (evt) => {
          this.showSidepanelWidget(ident);
        }
    }
    spTabButton.onclick = cFunc;
    const spTabButtonIcon = document.createElement('i');
    spTabButtonIcon.setAttribute("class", iconClass);
    spTabButton.appendChild(spTabButtonIcon);
    this.spTabCol.appendChild(spTabButton);

    return spWidgetNode;
  }


  onActivateRequest(msg) {
    console.log("onActivateRequest(", this.id, msg);
    //this.update();
  }

  onAfterHide(msg) {
    console.log("onAfterHide", this.id, msg);
  }

  onAfterShow(msg) {
    console.log("onAfterShow", this.id, msg);
  }

  onAfterAttach(msg) {
    console.log("onAfterAttach", this.id, msg);
  }

  onCloseRequest(msg) {
    console.log("onCloseRequest", this.id, msg);
    //super.onCloseRequest(msg);
  }

  onResize(msg) {
    if (this.map) {
      console.log("onResize", this.id, msg);
      // setTimeout(() => {
      //   this.map.updateSize();
      // }, 100);
    }
  }


}


