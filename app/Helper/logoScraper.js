const { LogoScrape } = require("logo-scrape");
const axios = use("axios");
const { API_TYPE, URLS, KEYS } = require("../Helper/constants");
const Drive = use("Drive");
const createRandomName = require("./randomString");
const logger = require("./logger");
const Config = use("App/Models/Admin/ConfigModule/Config");

async function logoScraper(urls, auth, vendor_id) {
  let result = [];
  logger.logApi(API_TYPE.LOGO_SCRAPE, vendor_id, auth.user.id);
  const logosUrls = await LogoScrape.getLogos(urls);
  logosUrls.forEach((element) => {
    let index = 0;
    index = element.findIndex((x) => x.size == "192x192");
    if (index === -1) {
      result.push(element[0]);
    } else {
      result.push(element[index]);
    }
  });
  return result;
}

async function uploadToS3(url) {
  try {
    let results = await axios.get(url, {
      responseType: "stream",
    });
    const result = await Drive.disk("s3").put(
      createRandomName(10),
      results.data,
      {
        ContentType: results.headers["content-type"],
        ACL: "public-read",
      }
    );
    return result;
  } catch (ex) {
    return null;
    throw new Error("Ritekit fetch failed");
  }
}

async function fetchRiteKiteLogo(urls, auth, vendor_id) {
  try {
    const url = URLS.RITEKITE_URL;
    let client_id = await Config.findOrCreate(
      { key: KEYS.RITEKIT_CLIENT_ID },
      { key: KEYS.RITEKIT_CLIENT_ID, value: "demo" }
    );
    let params = {
      generateFallbackLogo: 1,
      client_id: client_id.value,
      domain: urls,
    };

    logger.logApi(API_TYPE.RITE_KITE_API, vendor_id, auth.user.id);

    const response = await axios.get(url, { params });
    let result = await uploadToS3(response.data.permanentUrl);
    return result;
  } catch (ex) {
    if (ex.response && ex.response.status === 401) {
      throw new Error("Ritekit API call failed");
    }
  }
}

async function fetchRiteKiteLogoCronJobs(urls,vendor_id) {
  try {
    const url = URLS.RITEKITE_URL;
    let client_id = await Config.findOrCreate(
      { key: KEYS.RITEKIT_CLIENT_ID },
      { key: KEYS.RITEKIT_CLIENT_ID, value: "demo" }
    );
    let params = {
      generateFallbackLogo: 1,
      client_id: client_id.value,
      domain: urls,
    };

    logger.logApi(API_TYPE.RITE_KITE_API, vendor_id);
    console.log(url);
    const response = await axios.get(url, { params });
    console.log("Rite_kit_logo_response",response.data.permanentUrl);
    let result = await uploadToS3(response.data.permanentUrl);
    console.log("Rite_kit_logo",result)
    return result;
  } catch (ex) {
    // if (ex.response && ex.response.status === 401) {
    //   throw new Error("Ritekit API call failed");
    // }
    console.log("Rite_kit_logo_error",ex.response)
    return null
  }
}
module.exports = { logoScraper, fetchRiteKiteLogo, fetchRiteKiteLogoCronJobs, uploadToS3 };
