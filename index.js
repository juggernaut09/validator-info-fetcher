const express = require("express");
const axios = require("axios");
const Redis = require("ioredis");
const cron = require("node-cron");
const config = require("config");

const app = express();
const redis = new Redis();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/validator/:chain", (req, res) => {
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
      } else {
        res.status(200).send({ message: JSON.parse(response) });
      }
    });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

cron.schedule("* */30 * * * *", async () => {
  console.log("Fetching RPC data at 30 minute-interval");
  try {
    const ChainData = config.get("ChainData");
    for (const key in ChainData) {
      const response = await axios.get(`${ChainData[key]}`);
      if (response != undefined) {
        redis.set(`${key}`, JSON.stringify(response.data));
      } else {
        console.log(`${key} RPC is down`);
      }
    }
  } catch (err) {
    console.log({ error: err.message });
  }
});

const port = config.get("PORT");
app.listen(port, () => {
  console.log(`validator-info-fetcher listening on port ${port}`);
});
