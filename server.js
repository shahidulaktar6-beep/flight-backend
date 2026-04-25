const express = require("express");
const fetch = require("node-fetch");

const app = express();

app.get("/", async (req, res) => {
  try {
    const username = "YOUR_OPENSKY_USERNAME";
    const password = "YOUR_OPENSKY_PASSWORD";

    const auth = Buffer.from(
      username + ":" + password
    ).toString("base64");

    const response = await fetch(
      "https://opensky-network.org/api/states/all?lamin=6&lomin=68&lamax=37&lomax=97",
      {
        headers: {
          Authorization: "Basic " + auth
        }
      }
    );

    const data = await response.text();

    res.setHeader(
      "Access-Control-Allow-Origin",
      "*"
    );

    res.send(data);

  } catch (e) {
    res.status(500).send({
      error: e.toString()
    });
  }
});

app.listen(10000, () => {
  console.log("Running");
});