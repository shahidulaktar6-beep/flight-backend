const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 10000;

/* ===============================
   PUT YOUR REAL KEYS HERE
================================= */

const AVIATION_KEY = "3b55c056165cb37a2b6d8949ad53573f";

const OPENSKY_USER = "sam2002";
const OPENSKY_PASS = "Mamba@121";

/* ===============================
   ROOT
================================= */

app.get("/", (req, res) => {
  res.send("Hybrid Flight Backend Running");
});

/* ===============================
   SEARCH FLIGHT
   Example:
   /search?flight=AI744
================================= */

app.get("/search", async (req, res) => {
  try {
    const flight = (req.query.flight || "")
      .toString()
      .trim()
      .toUpperCase();

    if (!flight) {
      return res.status(400).json({
        error: "Missing flight number",
      });
    }

    /* ===============================
       STEP 1: AVIATIONSTACK DETAILS
    ================================= */

    const aviationUrl =
      `http://api.aviationstack.com/v1/flights?access_key=${AVIATION_KEY}&flight_iata=${flight}`;

    const aviationRes = await fetch(aviationUrl);
    const aviationJson = await aviationRes.json();

    if (
      !aviationJson.data ||
      aviationJson.data.length === 0
    ) {
      return res.json({
        error: "Flight not found",
      });
    }

    const item = aviationJson.data[0];

    const airline =
      item.airline?.name || "";

    const departure =
      item.departure?.airport || "";

    const arrival =
      item.arrival?.airport || "";

    const depIata =
      item.departure?.iata || "";

    const arrIata =
      item.arrival?.iata || "";

    const status =
      item.flight_status || "";

    const scheduledDeparture =
      item.departure?.scheduled || "";

    const scheduledArrival =
      item.arrival?.scheduled || "";

    /* ===============================
       STEP 2: CONVERT TO CALLSIGN
    ================================= */

    let callsign = "";

    if (flight.startsWith("AI")) {
      callsign = "AIC" + flight.substring(2);
    } else if (flight.startsWith("6E")) {
      callsign = "IGO" + flight.substring(2);
    } else if (flight.startsWith("UK")) {
      callsign = "VTI" + flight.substring(2);
    } else if (flight.startsWith("SG")) {
      callsign = "SEJ" + flight.substring(2);
    } else if (flight.startsWith("IX")) {
      callsign = "AXB" + flight.substring(2);
    } else {
      callsign = flight;
    }

    /* ===============================
       STEP 3: OPENSKY LIVE DATA
    ================================= */

    const auth = Buffer.from(
      OPENSKY_USER + ":" + OPENSKY_PASS
    ).toString("base64");

    const openskyUrl =
      "https://opensky-network.org/api/states/all?lamin=6&lomin=68&lamax=37&lomax=97";

    const openRes = await fetch(openskyUrl, {
      headers: {
        Authorization: "Basic " + auth,
      },
    });

    const openJson = await openRes.json();

    let live = null;

    if (
      openJson.states &&
      Array.isArray(openJson.states)
    ) {
      for (const s of openJson.states) {
        const cs = (s[1] || "")
          .toString()
          .trim();

        if (cs === callsign) {
          live = {
            callsign: cs,
            longitude: s[5],
            latitude: s[6],
            altitude: s[7],
            on_ground: s[8],
            speed: s[9],
            heading: s[10],
            vertical_rate: s[11],
          };
          break;
        }
      }
    }

    /* ===============================
       FINAL RESPONSE
    ================================= */

    res.setHeader(
      "Access-Control-Allow-Origin",
      "*"
    );

    res.json({
      success: true,

      source: "Aviationstack + OpenSky",

      flight: flight,
      callsign: callsign,

      airline: airline,

      departure: departure,
      departure_iata: depIata,

      arrival: arrival,
      arrival_iata: arrIata,

      status: status,

      scheduled_departure:
        scheduledDeparture,

      scheduled_arrival:
        scheduledArrival,

      live: live,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      error: e.toString(),
    });
  }
});

/* =============================== */

app.listen(PORT, () => {
  console.log(
    "Server running on port " + PORT
  );
});