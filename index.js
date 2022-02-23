const express = require("express");
const axios = require("axios");
const Redis = require("ioredis");
const cron = require("node-cron");
const config = require("config");
var cors = require('cors')
var morgan = require('morgan')
var https = require("https")


const app = express();
const redis = new Redis();

// Set the application enviorment 
if (process.env.APP_ENV == null || process.env.APP_ENV == undefined) {
  process.env.APP_ENV = "dev"
}

// logs 
function log(...args) {
  console.log(`INFO: ${new Date()} > ${args.join(" ")}`)
}

function logError(...args) {
  console.log(`Err : ${new Date()} > ${args.join(" ")}`)
}

// logs for requests 
app.use(morgan('combined'))

// adding cors to express 
var allowlist = [
  'https://*.vitwit.com',
  'https://api.staking.vitwit.com',
  'https://api.staking.vitwit.com:3001'
]

const corsOptions = {
  methods: ['GET'],
  origin: (origin, callback) => {
    if (process.env.APP_ENV = "dev") {
      callback(null, true)
    } else {
      if (allowlist.indexOf(origin) !== -1) {
        callback(null, true)
      } else {
        callback('CORS-enabled')
      }
    }
  }
}

app.use(cors(corsOptions))

app.get("/", (req, res, next) => {
  res.send("Hello From witval validator (https://api.staking.vitwit.com)");
});

app.get("/validator/:chain", (req, res, next) => {
  try {
    const chain = req.params.chain;
    if (chain == undefined) {
      return res.status(500).send({ error: "Make sure to send valid chain" });
    }
    let chainData = config.get("chainData")
    let chainKeys = Object.keys(chainData)
    if (chainKeys.indexOf(chain) == -1) {
      return res.status(500).send({ "error": "Make sure to send valid chain", "chains": chainKeys });
    }
    redis.get(`${chain}`, (err, response) => {
      if (err) {
        return res.status(500).send({ error: err.message });
      } else {
        return res.status(200).send({ message: JSON.parse(response) });
      }
    });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
});


function fetchValidatorInfomation() {
  try {
    const chainData = config.get("chainData");
    for (const key in chainData) {
      let fetchInfo = async (chainData, key) => {
        let { lcd, valoper, additionalInfo, currency, stakingUrl } = chainData[key]
        let validatorUrl = `${lcd}/cosmos/staking/v1beta1/validators/${valoper}`
        let stakingParamUrl = `${lcd}/cosmos/staking/v1beta1/params`
        const validatorResponse = await axios.get(validatorUrl, {
          httpsAgent: new https.Agent({
            rejectUnauthorized: false
          })
        });
        const stakingParams = await axios.get(stakingParamUrl, {
          httpsAgent: new https.Agent({
            rejectUnauthorized: false
          })
        })

        if (validatorResponse.status == 200 && stakingParams.status == 200) {
          let validatorInformation = {
            ...validatorResponse.data,
            "stakingParams": stakingParams.data,
            currency,
            stakingUrl,
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
  log(`application APP_ENV : ${process.env.APP_ENV}`)
  log(`validator - info - fetcher listening on port ${port}`);
  log(`fetching the validator informations`)
  fetchValidatorInfomation()
});
