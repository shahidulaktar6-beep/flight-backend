const express = require("express");
const fetch = require("node-fetch");

const app = express();

const PORT = process.env.PORT || 10000;

/* ---------------- CONFIG ---------------- */

const AVIATION_KEY =
  "YOUR_AVIATIONSTACK_KEY";

const OPENSKY_USER =
  "YOUR_OPENSKY_USERNAME";

const OPENSKY_PASS =
  "YOUR_OPENSKY_PASSWORD";

/* --------------------------------------- */

app.get("/", async (req, res) => {
  res.send("Flight Backend Running");
});

/* --------------------------------------- */
/* SEARCH FLIGHT                           */
/* Example:
/search?flight=AI744
*/
/* --------------------------------------- */

app.get("/search", async (req, res) => {
  try {
    const flight =
      (req.query.flight || "")
        .toString()
        .trim()
        .toUpperCase();

    if (!flight) {
      return res.status(400).send({
        error: "Missing flight"
      });
    }

    /* ---------------- AVIATIONSTACK ---------------- */

    const aviationUrl =
      `http://api.aviationstack.com/v1/flights?access_key=${AVIATION_KEY}&flight_iata=${flight}`;

    const aviationRes =
      await fetch(aviationUrl);

    const aviationJson =
      await aviationRes.json();

    if (
      !aviationJson.data ||
      aviationJson.data.length === 0
    ) {
      return res.send({
        error: "Flight not found"
      });
    }

    const item =
      aviationJson.data[0];

    const airline =
      item.airline?.name || "";

    const depAirport =
      item.departure?.airport || "";

    const arrAirport =
      item.arrival?.airport || "";

    const status =
      item.flight_status || "";

    /* -------- CALLSIGN CONVERT ---------- */

    let callsign = "";

    if (flight.startsWith("AI")) {
      callsign =
        "AIC" + flight.substring(2);
    } else if (
      flight.startsWith("6E")
    ) {
      callsign =
        "IGO" + flight.substring(2);
    } else if (
      flight.startsWith("UK")
    ) {
      callsign =
        "VTI" + flight.substring(2);
    } else if (
      flight.startsWith("SG")
    ) {
      callsign =
        "SEJ" + flight.substring(2);
    } else {
      callsign = flight;
    }

    /* ---------------- OPENSKY ---------------- */

    const auth = Buffer.from(
      OPENSKY_USER +
        ":" +
        OPENSKY_PASS
    ).toString("base64");

    const openRes =
      await fetch(
        "https://opensky-network.org/api/states/all?lamin=6&lomin=68&lamax=37&lomax=97",
        {
          headers: {
            Authorization:
              "Basic " + auth
          }
        }
      );

    const openJson =
      await openRes.json();

    let live = null;

    if (
      openJson.states &&
      Array.isArray(
        openJson.states
      )
    ) {
      for (const s of openJson.states) {
        const cs =
          (s[1] || "")
            .toString()
            .trim();

        if (
          cs === callsign
        ) {
          live = {
            callsign: cs,
            longitude: s[5],
            latitude: s[6],
            altitude: s[7],
            on_ground: s[8],
            speed: s[9],
            heading: s[10]
          };
          break;
        }
      }
    }

    /* ---------------- FINAL RESPONSE ---------------- */

    res.setHeader(
      "Access-Control-Allow-Origin",
      "*"
    );

    res.send({
      flight: flight,
      airline: airline,
      departure:
        depAirport,
      arrival:
        arrAirport,
      status: status,
      callsign:
        callsign,
      live: live
    });

  } catch (e) {
    res.status(500).send({
      error: e.toString()
    });
  }
});

app.listen(PORT, () => {
  console.log(
    "Running on " + PORT
  );
});
