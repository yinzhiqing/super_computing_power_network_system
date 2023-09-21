var ethers = require("ethers");
//var url = "http://106.14.38.214:6060";
var url = "http://127.0.0.1:8545";

var init = function () {
  var customWsProvider = new ethers.providers.WebSocketProvider(url);

  customWsProvider.on("TaskData", (tx) => {
      console.log(tx);
      /*
      customWsProvider.getTransaction(tx).then(function (transaction) {
      console.log(transaction);
    });
      */
  });

  customWsProvider._websocket.on("error", async () => {
    console.log(`Unable to connect to  retrying in 3s...`);
    setTimeout(init, 3000);
  });
  customWsProvider._websocket.on("close", async (code) => {
    console.log(
      `Connection lost with code ${code}! Attempting reconnect in 3s...`
    );
    customWsProvider._websocket.terminate();
    setTimeout(init, 3000);
  });
};

init();
