
import {VnApp} from "./app"

//window.app = null;

function main() {
  // document.body.appendChild(component());

  let url = new URL( window.location.href );
  let confFile, confStem, confDir="/gis/assets/", _confD;
  if (url.searchParams.has("conf")) {
    confStem = url.searchParams.get("conf");
    confFile = confDir + confStem + ".vnleaf.json";
  } else {
    //confFile = confDir + "qwgis.vnleaf.json";
    console.log("main using default config", conf_data_path);
    confFile = conf_data_path;
  }

 fetch(confFile)
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
     console.log("confData", confData);
     app = new VnApp(confData);
     //window.app = app;
     //makeGis(confData, 0);
     
   })
   // .catch((err) => {
   //   console.log("load_config failure in callback:", err);
   // });      
 })
 .catch((err) => {
   console.error(`fetch(${confFile}) failure top-level: ${err}`);
 });
 

}


window.onload = () => {
   main();
}




