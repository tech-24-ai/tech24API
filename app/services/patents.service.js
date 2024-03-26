"use strict";
const axios = use("axios");
const Vendor = use("App/Models/Admin/VendorModule/Vendor");
const VendorPatentList = use("App/Models/Admin/VendorModule/VendorPatentList");
const VendorIps = use("App/Models/Admin/VendorModule/VendorIps");
const Database = use("Database");
const LoggerDebug = use("Logger");
const { getStats } = require("../Helper/stats");

const _mapData = require("../Helper/mapper");
const { API_TYPE, URLS } = require("../Helper/constants");
const logger = require("../Helper/logger");
const moment = require("moment");
const _ = require("lodash");
var is_cron_job = false;
//Formatting trends data to save in database
function formatIPSData(ips, vendorDetails) {
  let result = {};
  ips.forEach((ip) => {
    if (result[`${ip.patent_year}_Q${moment(ip.patent_date).quarter()}`]) {
      result[`${ip.patent_year}_Q${moment(ip.patent_date).quarter()}`] += 1;
    } else {
      result[`${ip.patent_year}_Q${moment(ip.patent_date).quarter()}`] = 1;
    }
  });
  let final_output = [];
  Object.keys(result).forEach((key) => {
    final_output.push({
      quarter: key.split("_")[1],
      patent_count: result[key],
      year: key.split("_")[0],
      vendor_id: vendorDetails.id,
      is_api_extracted: true,
    });
  });
  return final_output;
}
async function updatePatentList(ips, vendorDetails) {
  const api_fields = [
    "patent_number",
    "app_date",
    "patent_title",
    "patent_year",
  ];
  const table_fields = ["number", "date", "title", "year"];

  let orderIps = _.orderBy(ips, "patent_date", "desc").slice(0, 20);

  orderIps = orderIps.map((x) => ({
    ...x,
    app_date: x.applications.length ? x.applications[0].app_date : "",
  }));

  let patentLists = _mapData(orderIps, api_fields, table_fields, {
    vendor_id: vendorDetails.id,
    is_api_extracted: true,
  });


  patentLists = patentLists.filter(
    (x) => x.date != undefined || x.date != "undefined"
  );
  if (is_cron_job) LoggerDebug.transport("cronfile").info(`Vendor Patents List Length ${patentLists.length}`)
  if (patentLists.length > 0) {
    let query = VendorPatentList.query();
    await query.where({ vendor_id: vendorDetails.id }).delete();
    //query.orderBy("date", "desc");
    //query.limit(20);
    //let data = await query.where({ vendor_id: vendorDetails.id }).fetch();
    //let deleteData = data.rows.map((x) => x.number);

    //await query.whereNotIn("number", deleteData).delete();
    await VendorPatentList.createMany(patentLists);
  }

}
// fetch patents
async function fetchPatents(company_name, date = "2019-01-01", page = 1) {
  const url = URLS.IP_PATENTS_URL;
  let q = JSON.stringify({
    _and: [
      { _gte: { patent_date: date } },
      { assignee_organization: company_name },
    ],
  });
  let f = JSON.stringify([
    "patent_number",
    "patent_date",
    "app_date",
    "patent_title",
    "patent_year",
    "assignee_organization",
  ]);
  let o = JSON.stringify({
    matched_subentities_only: "true",
    page,
    per_page: 10000,
    include_subentity_total_counts: "false",
  });
  const response = await axios.get(url, { params: { q, f, o } });
  return response.data;
}

//Fetch Assigning from Vendor Name

async function fetchAssign(vendor_name) {
  const url = URLS.ASSIGNEE_DATA_URL;
  let q = JSON.stringify({
    _begins: 
      { assignee_organization: vendor_name }
    ,
  });
  let f = JSON.stringify([
    "assignee_organization"
  ]);
  let o = JSON.stringify({
    matched_subentities_only: "true",
    page: 1,
    per_page: 10000,
    include_subentity_total_counts: "false",
  });
  const response = await axios.get(url, { params: { q, f, o } });
  return response.data;
}

// Update patent list
async function updateIPSList(vendorDetails) {
  const query = VendorPatentList.query();
  const response = { date: new Date("2019-01-01"), list: [] };
  const result = await query
    .where({ vendor_id: vendorDetails.id })
    .orderBy("date", "desc")
    .limit(1)
    .fetch();
  let results = [];
  if (result.rows.length) {
    let startD = new Date(result.rows[0].date);
    startD.setDate(startD.getDate() + 1);
    response.date = startD;
  }
  let keepFetching = true;
  let page = 1;

  while (keepFetching) {
    let resp = await fetchPatents(vendorDetails.company, response.date, page);
    if (resp.patents) results.push(...resp.patents);
    if (results.length == resp.total_patent_count) keepFetching = false;
    page += 1;
  }

  if (is_cron_job) LoggerDebug.transport("cronfile").info(`Vendor Patents Data ${results.length}`);

  if (results) {
    let final_data = formatIPSData(results, vendorDetails);
    // Inserting ALL data
    let yearly = _.groupBy(final_data, "year");
    
    Object.keys(yearly).forEach((x) => {
      final_data.push({
        quarter: "ALL",
        year: x,
        patent_count: _.sumBy(yearly[x], "patent_count"),
        vendor_id: vendorDetails.id,
        is_api_extracted: true,
      });
    });

    final_data.forEach(async (data) => {

      let db_result = await VendorIps.findOrCreate(
        { year: data.year, quarter: data.quarter, vendor_id: vendorDetails.id },
        data
      );

      if (db_result.patent_count != data.patent_count) {
        db_result.patent_count = data.patent_count;
        await db_result.save();
      }
    });

    if(is_cron_job) LoggerDebug.transport("cronfile").info(`Vendor Patents Final Data ${final_data.length}`)

    await updatePatentList(results, vendorDetails);
  }
}

// Update Vendor Patent counts
async function updateVendorPatents(vendor_id, auth) {
  const vendorDetails = await Vendor.findByOrFail("id", vendor_id);

  if (!vendorDetails.company) throw new Error("Company name not specified");
  //logging
  logger.logApi(API_TYPE.IP_PATENTS, vendor_id, auth.user.id);
  await updateIPSList(vendorDetails);
}

async function getIPSstats(vendor_id, key) {
  const vendorDetails = await Vendor.findByOrFail("id", vendor_id);
  const query = VendorIps.query();
  const result = await query.where({ vendor_id: vendorDetails.id }).andWhere("year", ">=", moment().subtract(3,'years').format('yyyy')).fetch();
  return getStats(result, key);
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


async function updateAllVendorPatents() {
  let error_message = [];
  const query = Vendor.query();
  is_cron_job = true;
  query.whereNot("company", "");
  query.whereNot("company", null);
  var curyear = moment().format('YYYY');
  var lastyear = moment().subtract(1, "year").format('YYYY');
  var currentdate = moment().format('yyyy-MM-DD');
  var lastquarter = getYearQuarter(currentdate);

  //Query to check last quarter data is present, if yes then don't fetch data

  query.with("patentips", (builder) => {
    builder.whereRaw('year = (?) and quarter = (?)', [lastquarter.year, lastquarter.quarter]);
  });

  const data = (await query.fetch()).toJSON();

  for (let index = 0; index < data.length; index++) {

    const element = data[index];

    if(is_cron_job) LoggerDebug.transport("cronfile").info(`Vendor data ${element.name}`);

    if (element.patentips && element.patentips.length > 0) {
      if (is_cron_job) LoggerDebug.transport("cronfile").info(`Patents data upto date`);
      continue;
    } else {
      try {
        await updateVendorPatents(element.id, {
          user: {
            id: null,
          },
        });
      } catch (ex) {
        error_message.push({
          vendor_id: element.id,
          message: ex.message,
        });
        if (is_cron_job) LoggerDebug.transport("cronfile").info(`Vendor Error ${JSON.stringify(error_message)}`);
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
module.exports = { updateAllVendorPatents, updateVendorPatents, getIPSstats,fetchAssign };
