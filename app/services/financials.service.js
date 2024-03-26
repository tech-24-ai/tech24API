"use strict";
const axios = use("axios");
const Vendor = use("App/Models/Admin/VendorModule/Vendor");
const VendorFinancials = use("App/Models/Admin/VendorModule/VendorFinancials");
const VendorAlphaVantage = use(
  "App/Models/Admin/VendorModule/VendorAlphaVantage"
);

const LoggerDebug = use("Logger");

const Config = use("App/Models/Admin/ConfigModule/Config");
const _mapData = require("../Helper/mapper");
const { API_TYPE, URLS, KEYS } = require("../Helper/constants");
const logger = require("../Helper/logger");
const VendorEmployeeJobCount = use("App/Models/VendorEmployeeJobCount");

const { getStatsForEmployee, getStats } = require("../Helper/stats");
const callType = {
  OVERVIEW: "OVERVIEW",
  INCOME_STATEMENT: "INCOME_STATEMENT",
  BALANCE_SHEET: "BALANCE_SHEET",
  TIME_SERIES_DAILY: "TIME_SERIES_DAILY",
  TIME_SERIES_WEEKLY: "TIME_SERIES_WEEKLY",
  TIME_SERIES_MONTHLY: "TIME_SERIES_MONTHLY",
};
const Env = use("Env");
const _ = require("lodash");
const moment = require("moment");
var is_cron_job = false;

function getYearQuarter(date) {
  let formatedDate = new Date(date);
  if (
    formatedDate >= new Date(`03-31-${formatedDate.getFullYear()}`) &&
    formatedDate <= new Date(`06-29-${formatedDate.getFullYear()}`)
  ) {
    return {
      year: new Date(date).getFullYear(),
      quarter: "Q1",
    };
  } else if (
    formatedDate >= new Date(`06-30-${formatedDate.getFullYear()}`) &&
    formatedDate <= new Date(`09-29-${formatedDate.getFullYear()}`)
  ) {
    return {
      year: new Date(date).getFullYear(),
      quarter: "Q2",
    };
  } else if (
    formatedDate >= new Date(`09-30-${formatedDate.getFullYear()}`) &&
    formatedDate <= new Date(`12-30-${formatedDate.getFullYear()}`)
  ) {
    return {
      year: new Date(date).getFullYear(),
      quarter: "Q3",
    };
  } else if (
    (formatedDate >= new Date(`12-31-${formatedDate.getFullYear() - 1}`) &&
      formatedDate <= new Date(`03-30-${formatedDate.getFullYear()}`)) ||
    (formatedDate >= new Date(`12-31-${formatedDate.getFullYear()}`) &&
      formatedDate <= new Date(`03-30-${formatedDate.getFullYear() + 1}`))
  ) {
    return {
      year: new Date(date).getFullYear() - 1,
      quarter: "Q4",
    };
  }
}


function formatQuaterlyFinancialData(data, date) {
  return data
    .filter((x) => new Date(x.fiscal_date_ending) > new Date(date))
    .map((x) => ({
      ...x,
      debt_equity_ratio: (x.debt_equity_ratio / x.total_equity).toFixed(2),
      ...getYearQuarter(x.fiscal_date_ending),
    }));
}

function formatYearlyFinancialData(data, date) {
  return data
    .filter((x) => new Date(x.fiscal_date_ending) > new Date(date))
    .map((x) => {
      let fiscalDate = moment(x.fiscal_date_ending);
      let year =
        fiscalDate < moment(`${moment(x.fiscal_date_ending).year()}-12-30`)
          ? fiscalDate.year() - 1
          : fiscalDate.year();
      return {
        ...x,
        debt_equity_ratio: (x.debt_equity_ratio / x.total_equity).toFixed(2),
        quarter: "ALL",
        year,
      };
    });
}

async function fetchFinancialInfo(type, symbol) {
  const url = URLS.FINANCIALS_BASE_URL;
  let apikey = await Config.findOrCreate(
    { key: KEYS.ALPHA_VANTAGE_API_KEY },
    { key: KEYS.ALPHA_VANTAGE_API_KEY, value: "demo" }
  );
  let params = {
    function: type,
    symbol,
    apikey: apikey.value,
  };
  const response = await axios.get(url, { params });
  return response.data;
}

async function saveAlpaVantageData(details, vendor_id) {
  let final_result = {
    vendor_id,
    symbol: details["Symbol"],
    asset_type: details["AssetType"],
    name: details["Name"],
    description: details["Description"],
    cik: details["CIK"],
    exchange: details["Exchange"],
    currency: details["Currency"],
    country: details["Country"],
    sector: details["Sector"],
    industry: details["Industry"],
    address: details["Address"],
    fiscal_year_end: details["FiscalYearEnd"],
    latest_quarter: details["LatestQuarter"],
    market_capitalization: details["MarketCapitalization"],
    ebitda: details["EBITDA"],
    pe_ratio: details["PERatio"],
    peg_ratio: details["PEGRatio"],
    book_value: details["BookValue"],
    dividend_per_share: details["DividendPerShare"],
    dividend_yield: details["DividendYield"],
    eps: details["DividendYield"],
    revenue_per_share_ttm: details["RevenuePerShareTTM"],
    profit_margin: details["ProfitMargin"],
    operating_margin_ttm: details["OperatingMarginTTM"],
    return_on_assets_ttm: details["ReturnOnAssetsTTM"],
    return_on_equity_ttm: details["ReturnOnEquityTTM"],
    revenue_ttm: details["RevenueTTM"],
    gross_profit_ttm: details["GrossProfitTTM"],
    diluted_eps_ttm: details["DilutedEPSTTM"],
    quarterly_earnings_growth_yoy: details["QuarterlyEarningsGrowthYOY"],
    quarterly_revenue_growth_yoy: details["QuarterlyRevenueGrowthYOY"],
    snalyst_target_price: details["AnalystTargetPrice"],
    trailing_pe: details["TrailingPE"],
    forward_pe: details["ForwardPE"],
    price_to_sales_ratio_ttm: details["PriceToSalesRatioTTM"],
    price_to_book_ratio: details["PriceToBookRatio"],
    evto_revenue: details["EVToRevenue"],
    evto_ebitda: details["EVToEBITDA"],
    beta: details["Beta"],
    week_52_high: details["'52WeekHigh'"],
    week_52_low: details["'52WeekLow'"],
    day_50_moving_average: details["'50DayMovingAverage'"],
    day_200_moving_average: details["'200DayMovingAverage'"],
    shares_outstanding: details["SharesOutstanding"],
    shares_float: details["SharesFloat"],
    shares_short: details["SharesShort"],
    shares_short_prior_month: details["SharesShortPriorMonth"],
    short_ratio: details["ShortRatio"],
    short_percent_outstanding: details["ShortPercentOutstanding"],
    short_percent_float: details["ShortPercentFloat"],
    percent_insiders: details["PercentInsiders"],
    percent_institutions: details["PercentInstitutions"],
    forward_annual_dividend_rate: details["ForwardAnnualDividendRate"],
    forward_annual_dividend_yield: details["ForwardAnnualDividendYield"],
    payout_ratio: details["PayoutRatio"],
    dividend_date: details["DividendDate"],
    ex_dividend_date: details["ExDividendDate"],
    last_split_factor: details["LastSplitFactor"],
    last_split_date: details["LastSplitDate"],
  };
  await VendorAlphaVantage.findOrCreate(
    { vendor_id: vendor_id, latest_quarter: final_result.latest_quarter },
    final_result
  );
}

async function saveEmployeeJobCount(details, vendor_id) {
  let final_result = {
    vendor_id,
    total_employee: 0,
    total_jobs: 0,
    quarter: getQuarter(details.date),
    year: new Date(details.date).getFullYear(),
  };

  await VendorEmployeeJobCount.findOrCreate(final_result, final_result);
}
async function fetchFinancials(vendorDetails) {
  let api_name = [
    "fiscalDateEnding",
    "netIncome",
    "totalAssets",
    "totalLiabilities",
    "totalShareholderEquity",
    "currentDebt",
    "totalRevenue",
    "grossProfit",
    "researchAndDevelopment",
    "currentDebt",
    "commonStockSharesOutstanding",
  ];
  let db_name = [
    "fiscal_date_ending",
    "net_income",
    "total_assets",
    "total_liabilities",
    "total_equity",
    "debt_equity_ratio",
    "revenue",
    "gross_profit",
    "rd_investment",
    "current_debt",
    "total_shares",
  ];
  const query = VendorFinancials.query();

  const result = await query
    .where({ vendor_id: vendorDetails.id })
    .orderBy("fiscal_date_ending", "desc")
    .limit(1)
    .fetch();

  let startDate = new Date("2018-12-01");

  let financialInfo = await Promise.all([
    fetchFinancialInfo(callType.OVERVIEW, vendorDetails.ticker),
    fetchFinancialInfo(callType.INCOME_STATEMENT, vendorDetails.ticker),
    fetchFinancialInfo(callType.BALANCE_SHEET, vendorDetails.ticker),
  ]);

  if (financialInfo[0].Information)
    throw new Error("Alpha Vantage API Key Invalid");

  if (financialInfo[0].Note || financialInfo[1].Note || financialInfo[1].Note)
    throw new Error(
      "Alpha Vantage max calls per minute reached. Please wait for one minute and retry"
    );

  if (Object.keys(financialInfo[0]).length === 0)
    throw new Error(
      `No data found for ${vendorDetails.name} with ticker as ${vendorDetails.ticker}`
    );

  let quaterlyUnionObject = _.map(
    financialInfo[1].quarterlyReports,
    function (item) {
      return _.merge(
        item,
        _.find(financialInfo[2].quarterlyReports, {
          fiscalDateEnding: item.fiscalDateEnding,
        })
      );
    }
  );

  let annualUnionObject = _.map(
    financialInfo[1].annualReports,
    function (item) {
      return _.merge(
        item,
        _.find(financialInfo[2].annualReports, {
          fiscalDateEnding: item.fiscalDateEnding,
        })
      );
    }
  );
  let annualFinancials = _mapData(annualUnionObject, api_name, db_name, {
    vendor_id: vendorDetails.id,
    is_api_extracted: true,
    p_e_ratio: financialInfo[0].PERatio,
    reported_eps: financialInfo[0].EPS,
  });

  let quaterlyFinancials = _mapData(quaterlyUnionObject, api_name, db_name, {
    vendor_id: vendorDetails.id,
    is_api_extracted: true,
    p_e_ratio: financialInfo[0].PERatio,
    reported_eps: financialInfo[0].EPS,
  });

  if(is_cron_job) LoggerDebug.transport("cronfile").info(`Financial info ${financialInfo.length}`);

  await saveAlpaVantageData(financialInfo[0], vendorDetails.id);
  // await saveEmployeeJobCount(financialInfo[0], vendorDetails.id);

  if (result.rows.length) {
    startDate = new Date(result.rows[0].fiscal_date_ending);
  }

  if(is_cron_job) LoggerDebug.transport("cronfile").info(`Financial Start Date ${startDate}`);

  quaterlyFinancials = formatQuaterlyFinancialData(
    quaterlyFinancials,
    startDate
  );

  if(is_cron_job) LoggerDebug.transport("cronfile").info(`Financial Quaterly Data ${quaterlyFinancials.length}`);
  annualFinancials = formatYearlyFinancialData(annualFinancials, startDate);

  if(is_cron_job) LoggerDebug.transport("cronfile").info(`Financial Annual Data ${annualFinancials.length}`);
  return [...quaterlyFinancials, ...annualFinancials];
}
// Update Vendor Patent counts
async function updateVendorFinancials(vendor_id, auth) {
  const vendorDetails = await Vendor.findByOrFail("id", vendor_id);

  if (!vendorDetails.ticker) throw new Error("Ticker name not specified");

  //logging
  logger.logApi(API_TYPE.FINANCIALS, vendor_id, auth.user.id);

  // updating financial table
  let financials = await fetchFinancials(vendorDetails);

  if (financials.length) {
    await VendorFinancials.createMany(financials);
  }
}

async function getFinancialStats(vendor_id) {
  const vendorDetails = await Vendor.findByOrFail("id", vendor_id);
  const query = VendorFinancials.query();
  const result = await query.where({ vendor_id: vendorDetails.id }).fetch();
  return getStats(result, "revenue");
}

async function getEmployeeJobStats(vendor_id, key) {
  const vendorDetails = await Vendor.findByOrFail("id", vendor_id);
  const query = VendorEmployeeJobCount.query();
  const result = await query.where({ vendor_id: vendorDetails.id }).fetch();
  return getStatsForEmployee(result, key);
}

function getFormatStockResponse(result, count = 30) {
  let response = {};
  let first = result[Object.keys(result)[0]];
  if (first) {
    response.current_price = first["4. close"];
    response.last_price_difference = (
      first["4. close"] - first["1. open"]
    ).toFixed(2);
    response.last_price_difference_percentage = (
      (response.last_price_difference * 100) /
      first["1. open"]
    ).toFixed(2);
    response.latest_high = first["2. high"];
    response.latest_low = first["3. low"];
    let a = 0;
    response.stock_time_series = Object.keys(result).reduce((acc, curr, i) => {
      if (i < count) {
        a += 1;
        return [...acc, { ...result[curr], date: curr }];
      } else {
        return acc;
      }
    }, []);
  }

  return response;
}
async function getStockGraph(vendor_id, frequency) {
  const vendorDetails = await Vendor.findByOrFail("id", vendor_id);
  let response = {};
  if (!vendorDetails.ticker) throw new Error("Ticker name not specified");
  if (frequency == "m") {
    let data = await fetchFinancialInfo(
      callType.TIME_SERIES_DAILY,
      vendorDetails.ticker
    );
    if (data.Note) {
      throw new Error("Max call excceded for Alphavantage");
    }
    response = getFormatStockResponse(data["Time Series (Daily)"], 30);
  } else if (frequency == "3m") {
    let data = await fetchFinancialInfo(
      callType.TIME_SERIES_WEEKLY,
      vendorDetails.ticker
    );
    if (data.Note) {
      throw new Error("Max call excceded for Alphavantage");
    }
    response = getFormatStockResponse(data["Weekly Time Series"], 13);
  } else if (frequency == "y") {
    let data = await fetchFinancialInfo(
      callType.TIME_SERIES_WEEKLY,
      vendorDetails.ticker
    );
    if (data.Note) {
      throw new Error("Max call excceded for Alphavantage");
    }
    response = getFormatStockResponse(data["Weekly Time Series"], 52);
  } else if (frequency == "5y") {
    let data = await fetchFinancialInfo(
      callType.TIME_SERIES_MONTHLY,
      vendorDetails.ticker
    );
    if (data.Note) {
      throw new Error("Max call excceded for Alphavantage");
    }
    response = getFormatStockResponse(data["Monthly Time Series"], 60);
  } else {
    let data = await fetchFinancialInfo(
      callType.TIME_SERIES_MONTHLY,
      vendorDetails.ticker
    );
    if (data.Note) {
      throw new Error("Max call excceded for Alphavantage");
    }
    response = getFormatStockResponse(data["Monthly Time Series"], 1000);
  }
  let overview = await fetchFinancialInfo(
    callType.OVERVIEW,
    vendorDetails.ticker
  );
  if (overview.Note) {
    throw new Error("Max call excceded for Alphavantage");
  }
  if (overview) {
    response["52_week_high"] = overview["52WeekHigh"];
    response["52_week_low"] = overview["52WeekLow"];
  }
  return response;
}

async function fetchAllFinancials() {
  let error_message = [];
  is_cron_job = true;
  const query = Vendor.query();
  query.whereNot("ticker", "");
  query.whereNot("ticker", null);
  //Public Condition for Vendor
  query.where("company_type", "public");
  //Only US based Companies
  query.where("main_country", 231);
  var curyear = moment().format('YYYY');
  var lastyear = moment().subtract(1, "year").format('YYYY');
  var currentdate = moment().format('yyyy-MM-DD');
  var lastquarter = getYearQuarter(currentdate);

  //Query to check last quarter data is present, if yes then don't fetch data

  query.with("financials", (builder) => {
    builder.whereRaw('year = (?) and quarter = (?)', [lastyear.year, lastquarter.quarter]);
  });

  const data = (await query.fetch()).toJSON();


  for (let index = 0; index < data.length; index++) {
    const element = data[index];
    if(is_cron_job) LoggerDebug.transport("cronfile").info(`Vendor ${element.name}`);

    if (element.financials && element.financials.length > 0) {
      if(is_cron_job) LoggerDebug.transport("cronfile").info(`Vendor Financial Details Updated ${element.financials.length}`);

      continue;
    } else {
      try {
        await updateVendorFinancials(element.id, {
          user: {
            id: null,
          },
        });
      } catch (ex) {
        error_message.push({
          vendor_id: element.id,
          message: ex.message,
        });
        if(is_cron_job) LoggerDebug.transport("cronfile").info(`Vendor Error ${JSON.stringify(error_message)}`);
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
module.exports = {
  getFinancialStats,
  updateVendorFinancials,
  getEmployeeJobStats,
  getStockGraph,
  fetchAllFinancials,
};
