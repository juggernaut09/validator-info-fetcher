const express = require("express");
const axios = require("axios");
const Redis = require("ioredis");
const cron = require("node-cron");
const config = require("config");

const app = express();
const redis = new Redis();


function log(...args) {
  console.log(`INFO: ${new Date()} > ${args.join(" ")}`)
}

function logError(...args) {
  console.log(`Err : ${new Date()} > ${args.join(" ")}`)
}


app.get("/", (req, res) => {
  res.send("Hello From witval validator (https://staking.vitwit.com)");
});

app.get("/validator/:chain", (req, res) => {
  try {
    const chain = req.params.chain;
    if (chain == undefined) {
      res.status(500).send({ error: "Make sure to send valid chain" });
    }
    let chainData = config.get("chainData")
    let chainKeys = Object.keys(chainData)
    if (chainKeys.indexOf(chain) == -1) {
      res.status(500).send({ "error": "Make sure to send valid chain", "chains": chainKeys });
    }
    redis.get(`${chain}`, (err, response) => {
      if (err) {
        res.status(500).send({ error: err.message });
      } else {
        res.status(200).send({ message: JSON.parse(response) });
      }
    });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});


function fetchValidatorInfomation() {
  try {
    const chainData = config.get("chainData");
    for (const key in chainData) {
      let fetchInfo = async (chainData, key) => {
        let { lcd, valoper, additionalInfo } = chainData[key]
        let validatorUrl = `${lcd}/cosmos/staking/v1beta1/validators/${valoper}`
        let stakingParamUrl = `${lcd}/cosmos/staking/v1beta1/params`
        const validatorResponse = await axios.get(validatorUrl);
        const stakingParams = await axios.get(stakingParamUrl)

        if (validatorResponse.status == 200 && stakingParams.status == 200) {
          let validatorInformation = {
            ...validatorResponse.data,
            "stakingParams": stakingParams.data,
            "additionInfo": additionalInfo
          }

          log(`validator infomation is fetched : ${key}`)
          let result = await redis.set(key, JSON.stringify(validatorInformation));
          log(`${key} data is inserted ${result}`)
        } else {
          logError(`${key} RPC is down`);
        }
      }

      // fetch the validator information across all chains async 
      fetchInfo(chainData, key)
    }
  } catch (err) {
    logError(err.message);
  }
}

cron.schedule(config.get("cronExpression"), () => {
  log(`Fetching RPC data at 30 minute-interval`);
  fetchValidatorInfomation()
});

const port = config.get("port");
app.listen(port, () => {
  log(`validator - info - fetcher listening on port ${port}`);
  log(`fetching the validator informations`)
  fetchValidatorInfomation()
});
