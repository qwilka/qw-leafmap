


import { makeMap } from './gis';


window.onload = () => {
    let confFile = "conf1";
    let url = new URL( window.location.href );
    if (url.searchParams.has("conf")) confFile = url.searchParams.get("conf");
    confFile = "/data/" + confFile + ".json";
    loadConfig_launch(confFile, makeMap);
}


function loadConfig_launch(url, callback) {
    //console.log("load_config server:", window.location.href);
    fetch(url)
    .then((resp) => {
      if (resp.status != 200) {
        console.log(`load_config failure\nurl=«${url}»\nfetch response status code: ${resp.status}`);
      };
      resp.json()
      .catch((err) => {
        console.log("load_config failure\nresp.json():", err, "\nProceeding with fallback config.");
        callback({
            "title": "Fallback config",
        });
      })
      .then((confData) => {
        callback(confData);
      })
      // .catch((err) => {
      //   console.log("load_config failure in callback:", err);
      // });      
    })
    .catch((err) => {
      console.log("load_config failure top-level:", err);
    });
  }
