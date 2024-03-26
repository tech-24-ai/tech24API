const { LogoScrape } = require("logo-scrape");
const axios = use("axios");
const { API_TYPE, URLS, KEYS } = require("../Helper/constants");
const Drive = use("Drive");
const createRandomName = require("./randomString");
const logger = require("./logger");
const LoggerDebug = use("Logger");
const patents_service = require("../services/patents.service");
const isImageURL = require("image-url-validator").default;
const Config = use("App/Models/Admin/ConfigModule/Config");
const Vendor = use("App/Models/Admin/VendorModule/Vendor");
const VendorKeyPeoples = use("App/Models/Admin/VendorModule/VendorKeyPeoples");
const VendorLocations = use("App/Models/Admin/VendorModule/VendorLocations");
const Country = use("App/Models/Admin/LocationModule/Country");
const Industry = use("App/Models/Admin/ProductModule/Industry");
const IndustryVendor = use("App/Models/Admin/VendorModule/IndustryVendor");
const NubelaLogs = use("App/Models/NubelaLogs");
const VendorEmployeeJobCounts = use(
  "App/Models/Admin/VendorModule/VendorEmployeeJobCounts"
);
const VendorAcquisitionLists = use(
  "App/Models/Admin/VendorModule/VendorAcquisitionLists"
);
const VendorFundingList = use(
  "App/Models/Admin/VendorModule/VendorFundingList"
);
const Product = use("App/Models/Product");
const WrongProduct = use("App/Models/Admin/ProductModule/WrongProductList");
const Consultant = use("App/Models/Admin/ConsultantModule/Consultant");

const moment = require("moment");
const _ = require("lodash");
const { RemoteCredentials } = require("aws-sdk");
const _logoScraper = require("./logoScraper");
var is_cron_job = false;

async function makeNubelaCall(authToken, url, params = {}) {
  let headers = {
    Authorization: authToken.value,
    // Authorization: "Bearer pcHZ2-x5gaXlt7TyAxHhhQ",//
    // Authorization: "Bearer e855c51c-3cf8-4f3a-bbba-c03fe7fa2bea",
  };

  try {
    var res = await axios.get(url, { headers, params });
    return res;
  } catch (error) {
    console.log("Err", error);
    return null;
  }
}

async function fetchAllVisitorLinkedInInfo() {
  const query = Visitor.query();

  query.whereRaw(
    "register_from = (?) AND (linkedin_link is null OR updated_at < (?))",
    ["linkedin", moment().subtract(3, "M").toISOString()]
  );

  //query.orWhere("profile_pic_url", null);
  //query.orWhere("occupation", null);
  //query.orWhere("headline", null);

  query.select("id as visitor_id");
  query.select("name");
  query.select("email");

  var arrEmails = [];
  const data = (await query.fetch()).toJSON();
  data.splice(0, 5);
  for (let i = 0; i < data.length; i++) {
    const email = data.email;
    arrEmails.push(email);
  }
  const body = {
    items: arrEmails,
    callbackUrl:
      "https://5357-103-142-161-101.in.ngrok.io/fetchCondidateCallback",
  };
  return searchCondidateData(body);
}

async function searchCondidateData(body = {}) {
  let apikey = await Config.findOrCreate(
    { key: KEYS.SIGNALHIRE_API_KEY },
    { key: KEYS.SIGNALHIRE_API_KEY, value: "demo" }
  );
  let headers = {
    apikey: apikey.value,
  };
  try {
    var res = await axios.post(URLS.SIGNALHIRE_CANDIDATE_SEARCH_URL, body, {
      headers: headers,
    });
    return res;
  } catch {
    return null;
  }
}

async function updateVendorBasicInfo(
  vendor_id,
  linkedin_url,
  extra_data = true
) {
  // const vendorDetails = await Vendor.findByOrFail("id", vendor_id);

  if (!linkedin_url) throw new Error("Linkedin URL is not specified");

  let authToken = await Config.findOrCreate(
    { key: KEYS.NUBELA_AUTH_TOKEN_LINKEDIN },
    { key: KEYS.NUBELA_AUTH_TOKEN_LINKEDIN, value: "demo" }
  );

  // Fetch vendor details
  let vendor_details = await fetchVendorLinkedinDetails(
    authToken,
    linkedin_url
  );
  const result = vendor_details;

  if (result && result != null) {
    let hqCountry;
    var updatedVendorInfo = {};
    const query = await Vendor.findOrFail(vendor_id);

    if (result.description) updatedVendorInfo["notes"] = result.description;
    if (result.website) updatedVendorInfo["website"] = result.website;
    if (result.founded_year) updatedVendorInfo["founded"] = result.founded_year;
    if (result.tagline) updatedVendorInfo["tagline"] = result.tagline;
    if (result.profile_pic_url)
      updatedVendorInfo["logo_linkedin_url"] = result.profile_pic_url;

    if (result.extra && result.extra.twitter_id) {
      updatedVendorInfo["twitter_handle"] = result.extra.twitter_id;
    } else {
      LoggerDebug.transport("vendorfile").info(
        `Vendor Twitter Data Not Found ${JSON.stringify(updatedVendorInfo)}`
      );
    }

    try {
      if (result.extra && result.extra.stock_symbol) {
        var stock = result.extra.stock_symbol;
        stock = stock.split(":")[1];
        updatedVendorInfo["ticker"] = stock;
      } else {
        LoggerDebug.transport("vendorfile").info(
          `Vendor Ticker Data Not Found ${JSON.stringify(updatedVendorInfo)}`
        );
      }
    } catch (ex) {
      error_message.push({
        vendor_id: element.id,
        message: ex.message,
      });
    }

    if (
      extra_data &&
      result.acquisitions &&
      result.acquisitions.acquired &&
      result.acquisitions.acquired.length
    )
      await updateAcquisition(
        result.acquisitions.acquired,
        authToken,
        vendor_id
      );
    if (extra_data && result.funding_data && result.funding_data.length)
      await updateFunding(result.funding_data, vendor_id);

    // if (result.profile_pic_url)
    //   updatedVendorInfo['image'] = result.profile_pic_url

    if (result.company_type) {
      if (result.company_type.toLowerCase().includes("public")) {
        updatedVendorInfo["company_type"] = "public";
      } else if (result.company_type.toLowerCase().includes("private")) {
        updatedVendorInfo["company_type"] = "private";
      } else {
        updatedVendorInfo["company_type"] = result.company_type;
      }
    }

    // update the Head Quarter
    if (result.hq && result.hq.country) {
      hqCountry = await Country.query()
        .where("sortname", result.hq.country)
        .fetch();
      updatedVendorInfo["main_country"] = hqCountry.id;
    }

    // Update new industry
    if (extra_data && result.industry) {
      let IndustryId = await Industry.findOrCreate(
        { name: result.industry },
        { name: result.industry }
      );
      await IndustryVendor.findOrCreate(
        {
          vendor_id: vendor_id,
          industry_id: IndustryId.id,
        },
        {
          vendor_id: vendor_id,
          industry_id: IndustryId.id,
        }
      );
    }

    if (result.company_size && result.company_size.length) {
      let empInfo = "";
      if (result.company_size[0] != null && result.company_size[1] != null) {
        empInfo = result.company_size[0] + "-" + result.company_size[1];
        updatedVendorInfo["number_employees"] = empInfo;
      } else if (result.company_size[0] != null) {
        updatedVendorInfo["number_employees"] = result.company_size[0] + "+";
      } else if (result.company_size[1] != null) {
        updatedVendorInfo["number_employees"] = result.company_size[1] + "+";
      }
    }

    if (extra_data && result.company_size_on_linkedin) {
      let yearAndQuarter = getCurrentYearAndQuarter();

      const queryVEJC = VendorEmployeeJobCounts.query();
      queryVEJC.where("year", yearAndQuarter.year);
      queryVEJC.where("quarter", yearAndQuarter.quarter);
      queryVEJC.where("vendor_id", vendor_id);
      let resultVEJC = await queryVEJC.fetch();
      let parsedResultVEJC = resultVEJC.toJSON();

      if (parsedResultVEJC.length) {
        const queryVEJCToUpdate = await VendorEmployeeJobCounts.findOrFail(
          parsedResultVEJC[0].id
        );
        queryVEJCToUpdate.total_employee = result.company_size_on_linkedin;
        await queryVEJCToUpdate.save();
      } else {
        const queryVEJCToSave = new VendorEmployeeJobCounts();
        queryVEJCToSave.vendor_id = vendor_id;
        queryVEJCToSave.total_employee = result.company_size_on_linkedin;
        queryVEJCToSave.year = yearAndQuarter.year;
        queryVEJCToSave.quarter = yearAndQuarter.quarter;
        queryVEJCToSave.quarter = yearAndQuarter.quarter;
        await queryVEJCToSave.save();
      }
    }

    if (extra_data && result.locations && result.locations.length) {
      // deleting all exiting location which are fetched from API
      await VendorLocations.query()
        .where("vendor_id", vendor_id)
        .where("is_extracted_from_api", "1")
        .delete();

      let data = [];
      let locations = result.locations;

      const countryQuery = Country.query();
      countryQuery.select("countries.*");
      const countryResult = await countryQuery.fetch();
      const parsedCountryResult = countryResult.toJSON();

      // if (is_cron_job)
      //   LoggerDebug.transport("cronfile").info(
      //     `Vendor Locations ${locations.length}`
      //   );
      // adding vendor locations
      locations.forEach((element) => {
        let country = _.find(parsedCountryResult, {
          sortname: element.country,
        });
        if (country) {
          let newLocation = {
            vendor_id: vendor_id,
            country_id: country.id,
            office_location: element.city,
            latitude: country.latitude,
            longitude: country.longitude,
            is_active: 1,
            is_headoffice: element.is_hq ? 1 : 0,
            is_extracted_from_api: "1",
          };

          data.push(newLocation);
        }
      });
      await VendorLocations.createMany(data);
    }

    // if (is_cron_job)
    //   LoggerDebug.transport("cronfile").info(
    //     `Vendor Data updated ${JSON.stringify(updatedVendorInfo)}`
    //   );

    query.merge(updatedVendorInfo);
    await query.save();
    return vendor_details;
  } else {
    LoggerDebug.transport("vendorfile").info(
      `VendorData  Not Found ${JSON.stringify(updatedVendorInfo)}`
    );
    return null;
  }
}

async function updateVendorInfo(vendor_id, linkedin_url, extra_data = true) {
  // const vendorDetails = await Vendor.findByOrFail("id", vendor_id);

  if (!linkedin_url) throw new Error("Linkedin URL is not specified");

  let authToken = await Config.findOrCreate(
    { key: KEYS.NUBELA_AUTH_TOKEN_LINKEDIN },
    { key: KEYS.NUBELA_AUTH_TOKEN_LINKEDIN, value: "demo" }
  );

  // Fetch vendor details
  let vendor_details = await fetchVendorLinkedinDetails(
    authToken,
    linkedin_url
  );
  LoggerDebug.transport("vendorfile").info(
    `Nubela VendorData for VendorId : ${vendor_id}  ${JSON.stringify(
      vendor_details
    )}`
  );
  const result = vendor_details;

  const nlogs = new NubelaLogs();
  nlogs.vendor_id = vendor_id;
  nlogs.json_data = JSON.stringify(vendor_details);
  nlogs.type = "NUBELA_DATA_FETCH";
  await nlogs.save();

  if (result && result != null) {
    let hqCountry;
    var updatedVendorInfo = {};
    var removableSymbols = ["👉"];

    if (result.description) {
      removableSymbols.map((s) => {
        result.description = result.description.replace(new RegExp(s, "g"), "");
      });
      updatedVendorInfo["notes"] = result.description;
    }

    if (result.website) updatedVendorInfo["website"] = result.website;
    if (result.founded_year) updatedVendorInfo["founded"] = result.founded_year;
    if (result.tagline) {
      removableSymbols.map((s) => {
        result.tagline = result.tagline.replace(new RegExp(s, "g"), "");
      });
      updatedVendorInfo["tagline"] = result.tagline;
    }
    if (result.profile_pic_url)
      updatedVendorInfo["logo_linkedin_url"] = result.profile_pic_url;
    if (result.company_size_on_linkedin)
      updatedVendorInfo["company_size_on_linkedin"] =
        result.company_size_on_linkedin;

    if (result.extra && result.extra.twitter_id) {
      updatedVendorInfo["twitter_handle"] = result.extra.twitter_id;
    } else {
      LoggerDebug.transport("vendorfile").info(
        `Vendor Twitter Data Not Found ${JSON.stringify(updatedVendorInfo)}`
      );
    }

    try {
      if (result.extra && result.extra.stock_symbol) {
        var stock = result.extra.stock_symbol;
        stock = stock.split(":")[1];
        updatedVendorInfo["ticker"] = stock;
      } else {
        LoggerDebug.transport("vendorfile").info(
          `Vendor Ticker Data Not Found ${JSON.stringify(updatedVendorInfo)}`
        );
      }
    } catch (ex) {
      error_message.push({
        vendor_id: element.id,
        message: ex.message,
      });
    }

    if (result.company_type) {
      if (result.company_type.toLowerCase().includes("public")) {
        updatedVendorInfo["company_type"] = "public";
      } else if (result.company_type.toLowerCase().includes("private")) {
        updatedVendorInfo["company_type"] = "private";
      } else {
        updatedVendorInfo["company_type"] = result.company_type;
      }
    }

    // update the Head Quarter
    if (result.hq && result.hq.country) {
      hqCountry = (
        await Country.query().where("sortname", result.hq.country).fetch()
      ).toJSON();
      if (hqCountry.length) {
        updatedVendorInfo["main_country"] = hqCountry[0].id;
      }
    }

    if (result.company_size && result.company_size.length) {
      let empInfo = "";
      if (result.company_size[0] != null && result.company_size[1] != null) {
        empInfo = result.company_size[0] + "-" + result.company_size[1];
        updatedVendorInfo["number_employees"] = empInfo;
      } else if (result.company_size[0] != null) {
        updatedVendorInfo["number_employees"] = result.company_size[0] + "+";
      } else if (result.company_size[1] != null) {
        updatedVendorInfo["number_employees"] = result.company_size[1] + "+";
      }
    }

    if (result.company_size_on_linkedin) {
      let yearAndQuarter = getCurrentYearAndQuarter();

      const queryVEJC = VendorEmployeeJobCounts.query();
      queryVEJC.where("year", yearAndQuarter.year);
      queryVEJC.where("quarter", yearAndQuarter.quarter);
      queryVEJC.where("vendor_id", vendor_id);
      let resultVEJC = await queryVEJC.fetch();
      let parsedResultVEJC = resultVEJC.toJSON();

      if (parsedResultVEJC.length) {
        const queryVEJCToUpdate = await VendorEmployeeJobCounts.findOrFail(
          parsedResultVEJC[0].id
        );
        queryVEJCToUpdate.total_employee = result.company_size_on_linkedin;
        await queryVEJCToUpdate.save();
      } else {
        const queryVEJCToSave = new VendorEmployeeJobCounts();
        queryVEJCToSave.vendor_id = vendor_id;
        queryVEJCToSave.total_employee = result.company_size_on_linkedin;
        queryVEJCToSave.year = yearAndQuarter.year;
        queryVEJCToSave.quarter = yearAndQuarter.quarter;
        queryVEJCToSave.quarter = yearAndQuarter.quarter;
        await queryVEJCToSave.save();
      }
    }

    if (result.locations && result.locations.length) {
      // deleting all exiting location which are fetched from API
      await VendorLocations.query()
        .where("vendor_id", vendor_id)
        .where("is_extracted_from_api", "1")
        .delete();

      let data = [];
      let locations = result.locations;

      const countryQuery = Country.query();
      countryQuery.select("countries.*");
      const countryResult = await countryQuery.fetch();
      const parsedCountryResult = countryResult.toJSON();

      // if (is_cron_job)
      //   LoggerDebug.transport("cronfile").info(
      //     `Vendor Locations ${locations.length}`
      //   );
      // adding vendor locations
      locations.forEach((element) => {
        let country = _.find(parsedCountryResult, {
          sortname: element.country,
        });
        if (country) {
          let newLocation = {
            vendor_id: vendor_id,
            country_id: country.id,
            office_location: element.city,
            latitude: country.latitude,
            longitude: country.longitude,
            is_active: 1,
            is_headoffice: element.is_hq ? 1 : 0,
            is_extracted_from_api: "1",
          };

          data.push(newLocation);
        }
      });
      await VendorLocations.createMany(data);
    }

    if (result.industry) {
      let IndustryId = await Industry.findOrCreate(
        { name: result.industry },
        { name: result.industry }
      );
      await IndustryVendor.findOrCreate(
        {
          vendor_id: vendor_id,
          industry_id: IndustryId.id,
        },
        {
          vendor_id: vendor_id,
          industry_id: IndustryId.id,
        }
      );
    }

    //Save Logo on S3
    if (
      updatedVendorInfo.logo_linkedin_url &&
      updatedVendorInfo.logo_linkedin_url != null &&
      updatedVendorInfo.logo_linkedin_url != undefined
    ) {
      //Save in S3
      var newUrl = await _logoScraper.uploadToS3(
        updatedVendorInfo.logo_linkedin_url
      );
      if (newUrl) updatedVendorInfo["linkedin_logo"] = newUrl;
    }

    return updatedVendorInfo;
  } else {
    LoggerDebug.transport("vendorfile").info(
      `VendorData  Not Found ${JSON.stringify(updatedVendorInfo)}`
    );
    return null;
  }
}

async function fetchLinkedinURL(authToken, emailId) {
  let params = { work_email: emailId };
  let response = await makeNubelaCall(
    authToken,
    `${URLS.LINKEDIN_PROFILE_URL_FROM_EMAILID_URL}`,
    params
  );

  if (response && response.data) {
    return response.data;
  } else {
    throw new Error("Handler Email Invalid");
  }
}

async function getLinkedinURLFromEmail(emailId) {
  if (!emailId) throw new Error("Email Id is not specified");

  let authToken = await Config.findOrCreate(
    { key: KEYS.NUBELA_AUTH_TOKEN_LINKEDIN },
    { key: KEYS.NUBELA_AUTH_TOKEN_LINKEDIN, value: "demo" }
  );

  // Fetch linkedin url
  let linkedinURL = await fetchLinkedinURL(authToken, emailId);
  return linkedinURL;
}

async function fetchLinkedinProfile(authToken, linkedinURL) {
  let params = { url: linkedinURL, use_cache: "if-present" };
  let response = await makeNubelaCall(
    authToken,
    `${URLS.LINKEDIN_PROFILE_DETAILS_FROM_LINK}`,
    params
  );

  if (response && response.data) {
    return response.data;
  } else {
    throw new Error("Handler Linkedin URL Invalid");
  }
}

async function getLinkedinDetailsFromURL(linkedinURL) {
  if (!linkedinURL) throw new Error("Linkedin URL Id is not specified");

  let authToken = await Config.findOrCreate(
    { key: KEYS.NUBELA_AUTH_TOKEN_LINKEDIN },
    { key: KEYS.NUBELA_AUTH_TOKEN_LINKEDIN, value: "demo" }
  );

  // Fetch linkedin url
  let linkedinProfile = await fetchLinkedinProfile(authToken, linkedinURL);
  return linkedinProfile;
}

function getYearQuarter(date) {
  let formatedDate = new Date(date);
  if (
    formatedDate >= new Date(`04-01-${formatedDate.getFullYear()}`) &&
    formatedDate <= new Date(`06-30-${formatedDate.getFullYear()}`)
  ) {
    return {
      year: new Date(date).getFullYear(),
      quarter: "Q1",
    };
  } else if (
    formatedDate >= new Date(`07-01-${formatedDate.getFullYear()}`) &&
    formatedDate <= new Date(`09-30-${formatedDate.getFullYear()}`)
  ) {
    return {
      year: new Date(date).getFullYear(),
      quarter: "Q2",
    };
  } else if (
    formatedDate >= new Date(`10-01-${formatedDate.getFullYear()}`) &&
    formatedDate <= new Date(`12-31-${formatedDate.getFullYear()}`)
  ) {
    return {
      year: new Date(date).getFullYear(),
      quarter: "Q3",
    };
  } else if (
    (formatedDate >= new Date(`01-01-${formatedDate.getFullYear() - 1}`) &&
      formatedDate <= new Date(`03-31-${formatedDate.getFullYear()}`)) ||
    (formatedDate >= new Date(`01-01-${formatedDate.getFullYear()}`) &&
      formatedDate <= new Date(`03-31-${formatedDate.getFullYear() + 1}`))
  ) {
    return {
      year: new Date(date).getFullYear() - 1,
      quarter: "Q4",
    };
  }
}

function getCurrentYearAndQuarter() {
  let month = moment().month() + 1;
  let year = moment().year();
  let quarter = "";

  if (month < 4) {
    quarter = "Q4";
    year = year - 1;
  } else if (month < 7) {
    quarter = "Q1";
  } else if (month < 10) {
    quarter = "Q2";
  } else if (month < 13) {
    quarter = "Q3";
  }

  return { year, quarter };
}

async function fetchDetailsFromNubelaLogs() {
  const query1 = NubelaLogs.query();
  query1.where("vendor_id", ">", "9049");

  var result = await query1.fetch();
  var vendors = await result.toJSON();
  vendors = vendors.splice(0, 176);
  for (let index = 0; index < vendors.length; index++) {
    const element = vendors[index];
    const vendor = await Vendor.findOrFail(element.vendor_id);
    const json = JSON.parse(element.json_data);
    const vendor_id = element.vendor_id;

    var removableSymbols = ["👉"];

    if (json.description) {
      removableSymbols.map((s) => {
        json.description = json.description.replace(new RegExp(s, "g"), "");
      });
      vendor.notes = json.description;
    }

    if (json.website) vendor.website = json.website;
    if (json.founded_year) vendor.founded = json.founded_year;
    if (json.tagline) {
      removableSymbols.map((s) => {
        json.tagline = json.tagline.replace(new RegExp(s, "g"), "");
      });
      vendor.tagline = json.tagline;
    }
    if (json.profile_pic_url) vendor.logo_linkedin_url = json.profile_pic_url;
    if (json.company_size_on_linkedin)
      vendor.company_size_on_linkedin = json.company_size_on_linkedin;

    if (json.company_type) {
      if (json.company_type.toLowerCase().includes("public")) {
        vendor.company_type = "public";
      } else if (json.company_type.toLowerCase().includes("private")) {
        vendor.company_type = "private";
      } else {
        vendor.company_type = json.company_type;
      }
    }

    // update the Head Quarter
    if (json.hq && json.hq.country) {
      hqCountry = (
        await Country.query().where("sortname", json.hq.country).fetch()
      ).toJSON();
      if (hqCountry.length) {
        vendor.main_country = hqCountry[0].id;
      }
    }

    if (json.company_size && json.company_size.length) {
      let empInfo = "";
      if (json.company_size[0] != null && json.company_size[1] != null) {
        empInfo = json.company_size[0] + "-" + json.company_size[1];
        vendor.number_employees = empInfo;
      } else if (json.company_size[0] != null) {
        vendor.number_employees = json.company_size[0] + "+";
      } else if (json.company_size[1] != null) {
        vendor.number_employees = json.company_size[1] + "+";
      }
    }

    if (json.company_size_on_linkedin) {
      let yearAndQuarter = getCurrentYearAndQuarter();

      const queryVEJC = VendorEmployeeJobCounts.query();
      queryVEJC.where("year", yearAndQuarter.year);
      queryVEJC.where("quarter", yearAndQuarter.quarter);
      queryVEJC.where("vendor_id", vendor_id);
      let resultVEJC = await queryVEJC.fetch();
      let parsedResultVEJC = resultVEJC.toJSON();

      if (parsedResultVEJC.length) {
        const queryVEJCToUpdate = await VendorEmployeeJobCounts.findOrFail(
          parsedResultVEJC[0].id
        );
        queryVEJCToUpdate.total_employee = json.company_size_on_linkedin;
        await queryVEJCToUpdate.save();
      } else {
        const queryVEJCToSave = new VendorEmployeeJobCounts();
        queryVEJCToSave.vendor_id = vendor_id;
        queryVEJCToSave.total_employee = json.company_size_on_linkedin;
        queryVEJCToSave.year = yearAndQuarter.year;
        queryVEJCToSave.quarter = yearAndQuarter.quarter;
        queryVEJCToSave.quarter = yearAndQuarter.quarter;
        await queryVEJCToSave.save();
      }
    }

    if (json.locations && json.locations.length) {
      // deleting all exiting location which are fetched from API
      await VendorLocations.query()
        .where("vendor_id", vendor_id)
        .where("is_extracted_from_api", "1")
        .delete();

      let data = [];
      let locations = json.locations;

      const countryQuery = Country.query();
      countryQuery.select("countries.*");
      const countryResult = await countryQuery.fetch();
      const parsedCountryResult = countryResult.toJSON();

      // if (is_cron_job)
      //   LoggerDebug.transport("cronfile").info(
      //     `Vendor Locations ${locations.length}`
      //   );
      // adding vendor locations
      locations.forEach((element) => {
        let country = _.find(parsedCountryResult, {
          sortname: element.country,
        });
        if (country) {
          let newLocation = {
            vendor_id: vendor_id,
            country_id: country.id,
            office_location: element.city,
            latitude: country.latitude,
            longitude: country.longitude,
            is_active: 1,
            is_headoffice: element.is_hq ? 1 : 0,
            is_extracted_from_api: "1",
          };

          data.push(newLocation);
        }
      });
      await VendorLocations.createMany(data);
    }

    if (json.industry) {
      let IndustryId = await Industry.findOrCreate(
        { name: json.industry },
        { name: json.industry }
      );
      await IndustryVendor.findOrCreate(
        {
          vendor_id: vendor_id,
          industry_id: IndustryId.id,
        },
        {
          vendor_id: vendor_id,
          industry_id: IndustryId.id,
        }
      );
    }

    if (
      json.linkedin_url &&
      json.linkedin_url != null &&
      json.linkedin_url != undefined
    ) {
      //Save in S3
      var data = await fetchVendorLinkedinLogo(json.linkedin_url);
      if (data) {
        const picUrl = data.tmp_profile_pic_url;

        var newUrl = await _logoScraper.uploadToS3(picUrl);
        if (newUrl) {
          vendor.linkedin_logo = newUrl;
        }
      }
    }
    await vendor.save();
  }
}

async function fetchVendorInfo() {
  let error_message = [];
  is_cron_job = true;
  const query = Vendor.query();

  const query1 = NubelaLogs.query();
  query1.select("vendor_id");

  const result = await query1.fetch();
  const vendorIds = await result.toJSON();
  let ids = [];
  for (let i = 0; i < vendorIds.length; i++) {
    ids.push(vendorIds[i].vendor_id);
  }
  console.log(ids);
  query.where((query1) => {
    query1.whereNull("logo_linkedin_url");
    query1.whereNull("company_size_on_linkedin");
    query1.where({ is_deleted: 0 });
    query1.where("id", ">", "9534");
    query1.whereNotIn("id", ids);
  });

  var data = (await query.fetch()).toJSON();

  data = data.splice(0, 231);
  // return data;
  for (let index = 0; index < data.length; index++) {
    const element = data[index];
    const vendor = await Vendor.findOrFail(element.id);
    LoggerDebug.transport("vendorfile").info(
      `Finding Data for Vendor ${element.name}`
    );

    try {
      var info = await updateVendorInfo(
        element.id,
        element.linkedin_url,
        false
      );

      //Fetch Assign Name
      //Temp Comment
      // const { assignees } = await patents_service.fetchAssign(element.name);

      // if (assignees && assignees.length > 0) {
      //   const assignNames = [
      //     ...new Set(assignees.map((d) => d.assignee_organization)),
      //   ];
      //   vendor.merge({ company: assignNames.toString() });
      // } else {
      //   LoggerDebug.transport("vendorfile").info(
      //     `No assignees found for Vendor : ${element.name}`
      //   );
      // }
      vendor.merge(info);

      LoggerDebug.transport("vendorfile").info(
        `Nubela VendorData before save : ${element.name}  ${JSON.stringify(
          info
        )}`
      );

      await vendor.save();
    } catch (ex) {
      error_message.push({
        vendor_id: element.id || element.name,
        message: ex.message,
      });

      LoggerDebug.transport("vendorfile").info(
        `Vendor Error ${JSON.stringify(error_message)}`
      );
    } finally {
      await new Promise((res, rej) => {
        setTimeout(() => {
          res(true);
        }, 500);
      });
    }
  }
  return error_message;
}

async function getVendorLogosFromLinkedInUrl() {
  let index = 0;
  const query = Vendor.query();
  query.whereNull("linkedin_logo");
  query.whereNotNull("linkedin_url");
  query.limit(1000);

  const result = await query.fetch();
  const vendorData = result.toJSON();
  var resultData = [];

  if (vendorData && vendorData.length > 0) {
    for (index = 0; index < vendorData.length; index++) {
      const findVendor = vendorData[index];

      var data = await fetchVendorLinkedinLogo(findVendor.linkedin_url);

      if (data) {
        const picUrl = data.tmp_profile_pic_url;
        const url = await _logoScraper.uploadToS3(picUrl);

        if (url != null) {
          const updateQuery = await Vendor.findOrFail(findVendor.id);
          updateQuery.linkedin_logo = url;
          updateQuery.logo_linkedin_url = picUrl;

          var result1 = await updateQuery.save();
          console.log(result1);
          findVendor["done"] = true;
        } else {
          findVendor["done"] = false;
        }
      } else {
        findVendor["done"] = false;
      }

      resultData.push(findVendor);
    }
  }

  return resultData;
}

async function updateConsultantLogoFromLinkedInUrl() {
  let index = 0;
  const query = Consultant.query();
  query.whereNull("image");
  query.whereNotNull("linkedin_url");
  query.where({ is_company: true });
  query.limit(500);

  const result = await query.fetch();
  const consultantData = result.toJSON();
  var resultData = [];

  if (consultantData && consultantData.length > 0) {
    for (index = 0; index < consultantData.length; index++) {
      const findConsultant = consultantData[index];

      var data = await fetchVendorLinkedinLogo(findConsultant.linkedin_url);
      // console.log("LogoData", data);

      if (data) {
        const picUrl = data.tmp_profile_pic_url;
        const url = await _logoScraper.uploadToS3(picUrl);

        if (url != null) {
          const updateQuery = await Consultant.findOrFail(findConsultant.id);
          updateQuery.image = url;

          var result1 = await updateQuery.save();
          console.log(result1);
          findConsultant["done"] = true;
        } else {
          findConsultant["done"] = false;
        }
      } else {
        findConsultant["done"] = false;
      }

      resultData.push(findConsultant);
    }
  }

  return resultData;
}

async function updateVendorLinkedinUrl() {
  let error_message = [];
  is_cron_job = true;
  const query = Vendor.query();
  query.where((query1) => {
    query1.whereNull("linkedin_url");
    query1.where({ is_deleted: 1 });
  });

  var data = (await query.fetch()).toJSON();

  data = data.splice(0, 50);
  // return data;
  for (let index = 0; index < data.length; index++) {
    const element = data[index];
    const vendor = await Vendor.findOrFail(element.id);

    try {
      let authToken = await Config.findOrCreate(
        { key: KEYS.NUBELA_AUTH_TOKEN_LINKEDIN },
        { key: KEYS.NUBELA_AUTH_TOKEN_LINKEDIN, value: "demo" }
      );

      // Fetch vendor details
      let vendor_details = await fetchVendorLinkedinUrl(
        authToken,
        element.website
      );
      const result = vendor_details;
      console.log("Result", result);
      if (result.url && result.url != null) {
        vendor.linkedin_url = result.url;
        await vendor.save();
      }
      // var info = await updateVendorInfo(element.id, element.name);

      // vendor.merge(info);
      // await vendor.save();
    } catch (ex) {
      error_message.push({
        vendor_id: element.id || element.name,
        message: ex.message,
      });
    } finally {
      await new Promise((res, rej) => {
        setTimeout(() => {
          res(true);
        }, 500);
      });
    }
  }
  return error_message;
}

async function fetchAllBasicInfo() {
  let error_message = [];
  is_cron_job = true;
  const query = Vendor.query();
  query.whereNot("linkedin_url", null);
  const data = (await query.fetch()).toJSON();
  data.splice(0, 4);
  for (let index = 0; index < data.length; index++) {
    const element = data[index];

    if (is_cron_job)
      LoggerDebug.transport("cronfile").info(`Vendor ${element.name}`);

    //Data available for Employee Job Count, check if available for last quarter
    var currentdate = moment().format("yyyy-MM-DD");
    var lastquarter = getYearQuarter(currentdate);
    const queryVEJC = VendorEmployeeJobCounts.query();

    queryVEJC.where("vendor_id", element.id);

    //Query to check last quarter data is present, if yes then don't fetch data
    queryVEJC.whereRaw("year = (?) and quarter = (?)", [
      lastquarter.year,
      lastquarter.quarter,
    ]);

    const dataVEJC = (await queryVEJC.fetch()).toJSON();

    if (dataVEJC.length > 0) {
      if (is_cron_job)
        LoggerDebug.transport("cronfile").info(
          `Vendor Details Updated ${dataVEJC.length}`
        );
      continue;
    } else {
      try {
        await updateVendorBasicInfo(element.id, element.linkedin_url);
      } catch (ex) {
        error_message.push({
          vendor_id: element.id || element.name,
          message: ex.message,
        });
        if (is_cron_job)
          LoggerDebug.transport("cronfile").info(
            `Vendor Error ${JSON.stringify(error_message)}`
          );
      } finally {
        await new Promise((res, rej) => {
          setTimeout(() => {
            res(true);
          }, 1000 * 60 * 1);
        });
      }
    }
  }
  return error_message;
}

async function fetchLinkedInSalesInfo() {
  let error_message = [];
  const query = Vendor.query();
  query.whereNot("linkedin_salesurl", null);
  const data = (await query.fetch()).toJSON();
  data.splice(0, 4);
  for (let index = 0; index < data.length; index++) {
    const element = data[index];
    try {
      await updateVendorKeyPeople(element.id, element.linkedin_salesurl);
    } catch (ex) {
      error_message.push({
        vendor_id: element.id || element.name,
        message: ex.message,
      });
    }
  }
  return error_message;
}

async function updateAcquisition(acquisitions, authtoken, vendor_id) {
  let data = acquisitions
    .filter((x) => x.linkedin_profile_url)
    .map((x) => {
      return {
        ...x,
        date: new Date(
          `${x.announced_date.year}-${x.announced_date.month}-${x.announced_date.day}`
        ),
      };
    });
  data = _.orderBy(data, "date", "desc").splice(0, 30);
  let new_acquisitions = [];
  let is_price_blank = false;

  for (let index = 0; index < data.length; index++) {
    const element = data[index];
    let result = await fetchVendorLinkedinDetails(
      authtoken,
      element.linkedin_profile_url
    );

    if (result && result != null) {
      let logo_company = "";
      const imgvalid = await isImageURL(result.profile_pic_url);

      if (imgvalid) {
        if (result.profile_pic_url.indexOf("https://s3") == -1)
          logo_company = result.profile_pic_url;
      }

      if (!element.price && !is_price_blank) {
        is_price_blank = true;
        element.price = 0;
      }

      new_acquisitions.push({
        vendor_id,
        acquired_company_name: result.name,
        logo_acquried_company: logo_company,
        date_of_acquisition: element.date,
        acquired_amount: element.price,
        website: result.website,
      });
    }
  }

  if (is_cron_job)
    LoggerDebug.transport("cronfile").info(
      `Vendor Acquisition data ${new_acquisitions}`
    );
  for (let index = 0; index < new_acquisitions.length; index++) {
    var element = new_acquisitions[index];
    element.currency = 1;
    const vendorData = await VendorAcquisitionLists.query()
      .whereRaw("website = (?) and vendor_id = (?)", [
        element.website,
        vendor_id,
      ])
      .fetch();

    const data = vendorData.toJSON();
    if (data && data.length > 0) {
      // console.log(data);
    } else {
      await VendorAcquisitionLists.findOrCreate(
        {
          vendor_id,
          acquired_company_name: element.acquired_company_name,
          website: element.website,
        },
        element
      );
    }
  }
}

async function updateFunding(fundings, vendor_id) {
  let result = fundings
    .filter((x) => x.investor_list && x.investor_list.length)
    .map((x) => {
      return {
        vendor_id,
        type_of_funding: x.funding_type,
        funding_amount: x.money_raised,
        funded_by: `${x.investor_list.map((p) => p.name)}`,
        date_of_funding: new Date(
          `${x.announced_date.year}-${x.announced_date.month}-${x.announced_date.day}`
        ),
      };
    });

  if (is_cron_job)
    LoggerDebug.transport("cronfile").info(
      `Vendor Funding data ${result.length}`
    );
  for (let index = 0; index < result.length; index++) {
    var element = result[index];
    element.currency = 1;

    await VendorFundingList.findOrCreate(
      {
        vendor_id,
        type_of_funding: element.type_of_funding,
        date_of_funding: element.date_of_funding,
      },
      element
    );
  }
}

async function fetchVendorLinkedinDetails(authToken, linkedin_url) {
  let params = {
    url: linkedin_url,
    cache: "if-present",
    funding_data: "exclude",
    acquisitions: "exclude",
    categories: "exclude",
    extra: "exclude",
    exit_date: "exclude",
  };
  let response = await makeNubelaCall(
    authToken,
    `${URLS.LINKEDIN_BASIC_INFO_URL}`,
    params
  );

  if (response && response.data) {
    return response.data;
  } else {
    //throw new Error("Handler Name Invalid");
  }
}

async function fetchVendorLinkedinLogo(linkedin_url) {
  let authToken = await Config.findOrCreate(
    { key: KEYS.NUBELA_AUTH_TOKEN_LINKEDIN },
    { key: KEYS.NUBELA_AUTH_TOKEN_LINKEDIN, value: "demo" }
  );

  let params = {
    linkedin_company_profile_url: linkedin_url,
  };
  let response = await makeNubelaCall(
    authToken,
    `${URLS.LINKEDIN_LOGO_URL}`,
    params
  );

  if (response && response.data) {
    return response.data;
  } else {
    return null;
    //throw new Error("Handler Name Invalid");
  }
}

async function fetchVendorLinkedinUrl(authToken, company_domain) {
  let params = {
    company_domain,
  };
  let response = await makeNubelaCall(
    authToken,
    `${URLS.LINKEDIN_BASIC_LINKEDIN_URL}`,
    params
  );
  console.log("RES", response);
  if (response && response.data) {
    return response.data;
  } else {
    //throw new Error("Handler Name Invalid");
  }
}

async function makePhantumBusterAgentLaunch(searchurl) {
  const sessionToken = await Config.query()
    .where("key", "LinkedInSessionCookie")
    .pluck("value");

  const agentId = await Config.query().where("key", "PBAgentId").pluck("value");

  const pbkey = await Config.query()
    .where("key", "X-Phantombuster-Key-1")
    .pluck("value");

  let data = {
    id: agentId[0],
    argument: {
      numberOfProfiles: 2500,
      extractDefaultUrl: false,
      removeDuplicateProfiles: false,
      sessionCookie: sessionToken[0],
      searches: searchurl,
    },
  };

  let url = `${URLS.PHANTOM_BUSTER_AGENT_LAUNCH}`;

  let headers = {
    "X-Phantombuster-Key-1": pbkey[0],
    "Content-Type": "application/json",
  };

  return await axios.post(url, data, { headers }).catch((ex) => {
    // console.log(ex);
  });
}

async function makePhantumBusterAgentFetch() {
  const agentId = await Config.query().where("key", "PBAgentId").pluck("value");

  const pbkey = await Config.query()
    .where("key", "X-Phantombuster-Key-1")
    .pluck("value");

  let params = {
    id: agentId[0],
  };

  let url = `${URLS.PHANTOM_BUSTER_AGENT_FETCH}`;

  let headers = {
    "X-Phantombuster-Key-1": pbkey[0],
  };
  return await axios.get(url, { headers, params });
}

async function makePhantumBusterAgentOutput(containerId) {
  const agentId = await Config.query().where("key", "PBAgentId").pluck("value");

  const pbkey = await Config.query()
    .where("key", "X-Phantombuster-Key-1")
    .pluck("value");

  let params = {
    id: agentId[0],
    containerId: containerId,
    mode: "most-recent",
    fromOutputPos: 1,
    withoutResultObject: false,
  };

  let url = `${URLS.PHANTOM_BUSTER_AGENT_OUTPUT}`;

  let headers = {
    "X-Phantombuster-Key-1": pbkey[0],
    "Content-Type": "application/json",
  };

  return await axios.get(url, { headers, params });
}

async function makePhantumBusterJson(s3folder, orgs3folder) {
  const pbkey = await Config.query()
    .where("key", "X-Phantombuster-Key-1")
    .pluck("value");

  let url =
    `${URLS.PHANTOM_BUSTER_JSON}` +
    "/" +
    orgs3folder +
    "/" +
    s3folder +
    "/" +
    "result.json";

  let headers = {
    "X-Phantombuster-Key-1": pbkey[0],
  };

  return await axios.get(url, { headers });
}

async function makePhantumBusterCacheJson(s3folder, orgs3folder) {
  const pbkey = await Config.query()
    .where("key", "X-Phantombuster-Key-1")
    .pluck("value");

  let url =
    `${URLS.PHANTOM_BUSTER_AGENT_CACHE}` +
    "/" +
    orgs3folder +
    "/" +
    s3folder +
    "/" +
    "result.json";

  let headers = {
    "X-Phantombuster-Key-1": pbkey[0],
  };

  return await axios.get(url, { headers });
}

async function fetchVendorSalesLinkedinDetails(linkedin_url) {
  let response = await makePhantumBusterAgentLaunch(linkedin_url);

  if (response && response.data) {
    let containerid = response.data.containerId;

    let response2 = await makePhantumBusterAgentOutput(containerid);

    if (response2) {
      response3 = await makePhantumBusterAgentFetch();
      return response3;
    } else {
      return "SU";
    }
  } else {
    return "SU";
  }
}

async function fetchandupdatekeypeople(vendor_id, result) {
  let s3folder = result.s3Folder;
  let orgs3folder = result.orgS3Folder;
  let allKeypeoplelength = 0;

  let response = await makePhantumBusterJson(s3folder, orgs3folder);

  if (response.data.length == 0) {
    response = await makePhantumBusterCacheJson(s3folder, orgs3folder);
  }

  if (response && response.data) {
    const profiles = response.data;
    let data = [];

    let executives = await Config.query()
      .where("key", "KeyPeopleTitles")
      .pluck("value");

    let exetitles = executives[0].split(",");

    profiles.forEach((element) => {
      try {
        let is_executive = false;
        let is_bom = false;
        let index = 0;

        for (index = 0; index < exetitles.length; index++) {
          if (element.title == exetitles[index]) {
            is_executive = true;
            break;
          }
        }

        if (
          element.title.includes("Board of Member") ||
          element.title.includes("Board of Members") ||
          element.title.includes("Board")
        ) {
          is_bom = true;
        }

        if (is_executive && element.summary.length > 0) {
          let profiledata = {
            vendor_id: vendor_id,
            name: element.fullName,
            photo: element.profileImageUrl,
            designation: element.title,
            twitter_link: "",
            linkedin_link: element.linkedInProfileUrl,
            is_board_of_directors: is_bom,
            is_executive_managment: is_executive,
            is_active: false,
            start_date: "",
            end_date: "",
          };

          data.push(profiledata);
        }
      } catch (exception) {
        console.log(exception);
      }
    });

    let i = 0;
    for (i = 0; i < data.length; i++) {
      try {
        const query = await VendorKeyPeoples.findByOrFail(
          "linkedin_link",
          data[i].linkedin_link
        );
        query.vendor_id = data[i].vendor_id;
        query.photo = data[i].photo;
        query.designation = data[i].designation;
        await query.save();
      } catch (Ex) {
        console.log("Adding Data " + i);
        await VendorKeyPeoples.create(data[i]);
      }
    }

    //Delete all any profile which is not available in the result.json
    const allKeyPeoplequery = await VendorKeyPeoples.query()
      .where("vendor_id", vendor_id)
      .fetch();

    const allKeypeople = allKeyPeoplequery.toJSON();
    allKeypeoplelength = allKeypeople.length;
    //console.log(allKeypeoplelength);

    for (i = 0; i < allKeypeople.length; i++) {
      let j = 0;

      for (j = 0; j < data.length; j++) {
        if (allKeypeople[i].linkedin_link == data[j].linkedin_link) {
          break;
        }
      }

      if (j == data.length) {
        const query = await VendorKeyPeoples.findOrFail(allKeypeople[i].id);
        try {
          await query.delete();
        } catch (error) {}
      }
    }
  }

  if (allKeypeoplelength > 0) return "Data updated successfully";
  else
    return "No Key People found in PhantomBuster API, please check session token/other configuration and try again";
}

async function updateVendorKeyPeople(vendor_id, linkedin_salesurl) {
  // const vendorDetails = await Vendor.findByOrFail("id", vendor_id);

  if (!linkedin_salesurl)
    throw new Error("Linkedin Sales URL is not specified");

  let result = await fetchVendorSalesLinkedinDetails(linkedin_salesurl);

  if (result.data) {
    let finalresult = await fetchandupdatekeypeople(vendor_id, result.data);
    return finalresult;
  } else {
    if (result == "SE") {
      return "PhantomBuster Linkedin Session Expired";
    } else {
      return "PhantomBuster Server unreachable";
    }
  }
}

async function fetchWrongProductList() {
  let error_message = [];
  try {
    let lastFetchedProduct = await Config.findOrCreate(
      { key: KEYS.TOTAL_PRODUCT_FETCHED_KEY },
      { key: KEYS.TOTAL_PRODUCT_FETCHED_KEY, value: 0 }
    );

    const products = await Product.find()
      .skip(Number(lastFetchedProduct.value))
      .limit(1000)
      .sort({ name: 1 });
    // const products = await Product.find({_id:'62f0ff9414a8d11d5c7ea379'})

    let totalFetchProducts = lastFetchedProduct.value;
    let wrongProductFound = 0;
    const fetchedProduct = products.length;

    if (fetchedProduct) {
      for (let index = 0; index < fetchedProduct; index++) {
        const { link, _id, name, vendor, moduleId } = products[index];
        await axios
          .get(link)
          .then((res) => {
            // console.log(`Res: ${res.status}`);
          })
          .catch(async (err) => {
            if (err.response?.status) {
              wrongProductFound++;
              let wrongProductData = {
                product_id: _id.toString(),
                product_name: name,
                module_id: moduleId,
                product_link: link,
                vendor_name: vendor.trim(),
              };

              // update vendor details
              const isVendorExist = await WrongProduct.findBy(
                "vendor_name",
                vendor.trim()
              );
              if (isVendorExist && isVendorExist.vendor_website) {
                const { vendor_id, vendor_website } = isVendorExist;
                wrongProductData.vendor_website = vendor_website;
                wrongProductData.vendor_id = vendor_id;
              } else {
                const vendorQuery = await Vendor.findBy("name", vendor.trim());
                if (vendorQuery) {
                  const { website, id } = vendorQuery;
                  await axios
                    .get(website.trim())
                    .then((res) => {
                      // console.log('Res',res.status)
                    })
                    .catch((err) => {
                      if (err.response?.status) {
                        wrongProductData.vendor_website = website;
                        wrongProductData.vendor_id = id;
                      }
                    });
                }
              }
              await WrongProduct.create(wrongProductData);
            }
          });

        totalFetchProducts++;
        // console.log('Index: ',index)
      }

      const updateConfig = await Config.findByOrFail({
        key: KEYS.TOTAL_PRODUCT_FETCHED_KEY,
      });
      updateConfig.value = totalFetchProducts;
      await updateConfig.save();

      // return response.status(200).send(`Total ${wrongProductFound} wrong products found`);
    }
  } catch (error) {
    error_message.push(JSON.stringify(error));
  }

  return error_message;
}

async function fetchVimeoVideoThumbnail(videoId) {
  try {
    const result = await axios.get(
      `https://vimeo.com/api/v2/video/${videoId}.json`
    );
    return result.data[0].thumbnail_large;
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  updateVendorBasicInfo,
  updateVendorInfo,
  getLinkedinURLFromEmail,
  getLinkedinDetailsFromURL,
  fetchAllBasicInfo,
  fetchVendorInfo,
  updateVendorLinkedinUrl,
  fetchLinkedInSalesInfo,
  updateVendorKeyPeople,
  searchCondidateData,
  fetchAllVisitorLinkedInInfo,
  fetchDetailsFromNubelaLogs,
  getVendorLogosFromLinkedInUrl,
  fetchWrongProductList,
  fetchVimeoVideoThumbnail,
  updateConsultantLogoFromLinkedInUrl,
};
