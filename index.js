const express = require("express");
const axios = require("axios");
const Redis = require("ioredis");
const cron = require("node-cron");
const res = require("express/lib/response");
const dotenv = require("dotenv");
dotenv.config();

const app = express();

const MOCK_API = "https://jsonplaceholder.typicode.com/users/";
const redis = new Redis();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/witval/:chain", (req, res) => {
  try {
    const chain = req.params.chain;
    if (chain == undefined) {
      res.status(500).send({ error: "Make sure to send valid chain" });
    }
    redis.get(`${chain}`, (err, response) => {
      if (err) {
        res.status(500).send({ error: err.message });
      } else if (response == undefined) {
        res.status(500).send({ error: "Make sure to send valid chain" });    
      }else {
        res.status(200).send({ message: JSON.parse(response) });
      }
    });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

cron.schedule("*/30 * * * *", async () => {
  console.log("Fetching RPC data for every 30 minutes");
  try {
    // AKASH
    const akash_response = await axios.get(process.env.AKASH);
    if (akash_response != undefined) {
      redis.set("akash", JSON.stringify(akash_response.data));
    } else {
      console.log("AKASH RPC is down");
    }

    // COSMOS
    const cosmos_response = await axios.get(process.env.COSMOS);
    if (cosmos_response != undefined) {
      redis.set("cosmos", JSON.stringify(cosmos_response.data));
    } else {
      console.log("COSMOS RPC is down");
    }

    // SENTINEL
    const sentinel_response = await axios.get(process.env.SENTINEL);
    if (sentinel_response != undefined) {
      redis.set("sentinel", JSON.stringify(sentinel_response.data));
    } else {
      console.log("SENTINEL RPC is down");
    }

    // REGEN
    const regen_response = await axios.get(process.env.REGEN);
    if (regen_response != undefined) {
      redis.set("regen", JSON.stringify(regen_response.data));
    } else {
      console.log("REGEN RPC is down");
    }

    // OSMOSIS
    const osmosis_response = await axios.get(process.env.OSMOSIS);
    if (osmosis_response != undefined) {
      redis.set("osmosis", JSON.stringify(osmosis_response.data));
    } else {
      console.log("OSMOSIS RPC is down");
    }

    // DESMOS
    const desmos_response = await axios.get(process.env.DESMOS);
    if (desmos_response != undefined) {
      redis.set("desmos", JSON.stringify(desmos_response.data));
    } else {
      console.log("DESMOS RPC is down");
    }

    // JUNO
    const juno_response = await axios.get(process.env.JUNO);
    if (juno_response != undefined) {
      redis.set("juno", JSON.stringify(juno_response.data));
    } else {
      console.log("JUNO RPC is down");
    }

    // STARGAZE
    const stargaze_response = await axios.get(process.env.STARGAZE);
    if (stargaze_response != undefined) {
      redis.set("stargaze", JSON.stringify(stargaze_response.data));
    } else {
      console.log("STARGAZE RPC is down");
    }

    // EMONEY
    const emoney_response = await axios.get(process.env.EMONEY);
    if (emoney_response != undefined) {
      redis.set("emoney", JSON.stringify(emoney_response.data));
    } else {
      console.log("EMONEY RPC is down");
    }

    // COMDEX
    const comdex_response = await axios.get(process.env.COMDEX);
    if (comdex_response != undefined) {
      redis.set("comdex", JSON.stringify(comdex_response.data));
    } else {
      console.log("COMDEX RPC is down");
    }

    // AGORIC
    const agoric_response = await axios.get(process.env.AGORIC);
    if (agoric_response != undefined) {
      redis.set("agoric", JSON.stringify(agoric_response.data));
    } else {
      console.log("AGORIC RPC is down");
    }
  } catch (err) {
    console.log({ error: err.message });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`validator-info-fetcher listening on port ${process.env.PORT}`);
});
