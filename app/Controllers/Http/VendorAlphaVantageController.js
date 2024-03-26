"use strict";

const VendorAlphaVantage = use("App/Models/VendorAlphaVantage");

const Query = use("Query");
const moment = require("moment");

const searchInFields = [
  "symbol",
  "asset_type",
  "name",
  "description",
  "cik",
  "exchange",
  "currency",
  "country",
  "sector",
  "industry",
  "address",
  "full_time_employees",
  "fiscal_year_end",
  "latest_quarter",
  "market_capitalization",
  "ebitda",
  "pe_ratio",
  "peg_ratio",
  "book_value",
  "dividend_per_share",
  "dividend_yield",
  "eps",
  "revenue_per_share_ttm",
  "profit_margin",
  "operating_margin_ttm",
  "return_on_assets_ttm",
  "return_on_equity_ttm",
  "revenue_ttm",
  "gross_profit_ttm",
  "diluted_eps_ttm",
  "quarterly_earnings_growth_yoy",
  "quarterly_revenue_growth_yoy",
  "snalyst_target_price",
  "trailing_pe",
  "forward_pe",
  "price_to_sales_ratio_ttm",
  "price_to_book_ratio",
  "evto_revenue",
  "evto_ebitda",
  "beta",
  "52_week_high",
  "52_week_low",
  "50_day_moving_average",
  "200_day_moving_average",
  "shares_outstanding",
  "shares_float",
  "shares_short",
  "shares_short_prior_month",
  "short_ratio",
  "short_percent_outstanding",
  "short_percent_float",
  "percent_insiders",
  "percent_institutions",
  "forward_annual_dividend_rate",
  "forward_annual_dividend_yield",
  "payout_ratio",
  "dividend_date",
  "ex_dividend_date",
  "last_split_factor",
  "last_split_date",
  "year",
  "month",
];

class VendorAlphaVantageController {
  async index({ request, response }) {
    const query = VendorAlphaVantage.query();
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    if (search) {
      query.where(searchQuery.search(searchInFields));
    }

    if (request.input("vendor_id")) {
      query.where("vendor_id", request.input("vendor_id"));
    }

    if (request.input("filters")) {
      const filters = JSON.parse(request.input("filters"));
      filters.forEach((filter) => {
        switch (filter.name) {
          case "created_at":
            query.whereRaw(
              typeof filter.value == "object"
                ? `DATE(${filter.name}) between '${filter.value.startDate}' and '${filter.value.endDate}'`
                : `DATE(${filter.name}) = '${moment(filter.value).format(
                    "YYYY-MM-DD"
                  )}'`
            );
            break;
          case "updated_at":
            query.whereRaw(
              typeof filter.value == "object"
                ? `DATE(${filter.name}) between '${filter.value.startDate}' and '${filter.value.endDate}'`
                : `DATE(${filter.name}) = '${moment(filter.value).format(
                    "YYYY-MM-DD"
                  )}'`
            );
            break;
          default:
            query.whereRaw(`${filter.name} LIKE '%${filter.value}%'`);
            break;
        }
      });
    }

    if (request.input("start_date") && request.input("end_date")) {
      query.whereRaw(`DATE(created_at) >= '${request.input("start_date")}'`);
      query.whereRaw(`DATE(created_at) <= '${request.input("end_date")}'`);
    }

    let page = null;
    let pageSize = null;

    if (request.input("page")) {
      page = request.input("page");
    }
    if (request.input("pageSize")) {
      pageSize = request.input("pageSize");
    }

    var result;
    if (page && pageSize) {
      result = await query.paginate(page, pageSize);
    } else {
      result = await query.fetch();
    }

    return response.status(200).send(result);
  }

  async store({ request, response }) {
    const query = new VendorAlphaVantage();

    query.vendor_id = request.input("vendor_id");
    query.symbol = request.input("symbol");
    query.asset_type = request.input("asset_type");
    query.name = request.input("name");
    query.description = request.input("description");
    query.cik = request.input("cik");
    query.exchange = request.input("exchange");
    query.currency = request.input("currency");
    query.country = request.input("country");
    query.sector = request.input("sector");
    query.industry = request.input("industry");
    query.address = request.input("address");
    query.full_time_employees = request.input("full_time_employees");
    query.fiscal_year_end = request.input("fiscal_year_end");
    query.latest_quarter = request.input("latest_quarter");
    query.market_capitalization = request.input("market_capitalization");
    query.ebitda = request.input("ebitda");
    query.pe_ratio = request.input("pe_ratio");
    query.peg_ratio = request.input("peg_ratio");
    query.book_value = request.input("book_value");
    query.dividend_per_share = request.input("dividend_per_share");
    query.dividend_yield = request.input("dividend_yield");
    query.eps = request.input("eps");
    query.revenue_per_share_ttm = request.input("revenue_per_share_ttm");
    query.profit_margin = request.input("profit_margin");
    query.operating_margin_ttm = request.input("operating_margin_ttm");
    query.return_on_assets_ttm = request.input("return_on_assets_ttm");
    query.return_on_equity_ttm = request.input("return_on_equity_ttm");
    query.revenue_ttm = request.input("revenue_ttm");
    query.gross_profit_ttm = request.input("gross_profit_ttm");
    query.diluted_eps_ttm = request.input("diluted_eps_ttm");
    query.quarterly_earnings_growth_yoy = request.input(
      "quarterly_earnings_growth_yoy"
    );
    query.quarterly_revenue_growth_yoy = request.input(
      "quarterly_revenue_growth_yoy"
    );
    query.snalyst_target_price = request.input("snalyst_target_price");
    query.trailing_pe = request.input("trailing_pe");
    query.forward_pe = request.input("forward_pe");
    query.price_to_sales_ratio_ttm = request.input("price_to_sales_ratio_ttm");
    query.price_to_book_ratio = request.input("price_to_book_ratio");
    query.evto_revenue = request.input("evto_revenue");
    query.evto_ebitda = request.input("evto_ebitda");
    query.beta = request.input("beta");
    query.week_52_high = request.input("week_52_high");
    query.week_52_low = request.input("week_52_low");
    query.day_50_moving_average = request.input("day_50_moving_average");
    query.day_200_moving_average = request.input("day_200_moving_average");
    query.shares_outstanding = request.input("shares_outstanding");
    query.shares_float = request.input("shares_float");
    query.shares_short = request.input("shares_short");
    query.shares_short_prior_month = request.input("shares_short_prior_month");
    query.short_ratio = request.input("short_ratio");
    query.short_percent_outstanding = request.input(
      "short_percent_outstanding"
    );
    query.short_percent_float = request.input("short_percent_float");
    query.percent_insiders = request.input("percent_insiders");
    query.percent_institutions = request.input("percent_institutions");
    query.forward_annual_dividend_rate = request.input(
      "forward_annual_dividend_rate"
    );
    query.forward_annual_dividend_yield = request.input(
      "forward_annual_dividend_yield"
    );
    query.payout_ratio = request.input("payout_ratio");
    query.dividend_date = request.input("dividend_date");
    query.ex_dividend_date = request.input("ex_dividend_date");
    query.last_split_factor = request.input("last_split_factor");
    query.last_split_date = request.input("last_split_date");
    query.year = request.input("year");
    query.month = request.input("month");

    await query.save();
    return response.status(200).send({ message: "Create successfully" });
  }

  async show({ params, response }) {
    const query = VendorAlphaVantage.query();
    query.where("id", params.id);
    const result = await query.firstOrFail();
    return response.status(200).send(result);
  }

  async update({ params, request, response }) {
    const query = await VendorAlphaVantage.findOrFail(params.id);
    query.vendor_id = request.input("vendor_id");
    query.symbol = request.input("symbol");
    query.asset_type = request.input("asset_type");
    query.name = request.input("name");
    query.description = request.input("description");
    query.cik = request.input("cik");
    query.exchange = request.input("exchange");
    query.currency = request.input("currency");
    query.country = request.input("country");
    query.sector = request.input("sector");
    query.industry = request.input("industry");
    query.address = request.input("address");
    query.full_time_employees = request.input("full_time_employees");
    query.fiscal_year_end = request.input("fiscal_year_end");
    query.latest_quarter = request.input("latest_quarter");
    query.market_capitalization = request.input("market_capitalization");
    query.ebitda = request.input("ebitda");
    query.pe_ratio = request.input("pe_ratio");
    query.peg_ratio = request.input("peg_ratio");
    query.book_value = request.input("book_value");
    query.dividend_per_share = request.input("dividend_per_share");
    query.dividend_yield = request.input("dividend_yield");
    query.eps = request.input("eps");
    query.revenue_per_share_ttm = request.input("revenue_per_share_ttm");
    query.profit_margin = request.input("profit_margin");
    query.operating_margin_ttm = request.input("operating_margin_ttm");
    query.return_on_assets_ttm = request.input("return_on_assets_ttm");
    query.return_on_equity_ttm = request.input("return_on_equity_ttm");
    query.revenue_ttm = request.input("revenue_ttm");
    query.gross_profit_ttm = request.input("gross_profit_ttm");
    query.diluted_eps_ttm = request.input("diluted_eps_ttm");
    query.quarterly_earnings_growth_yoy = request.input(
      "quarterly_earnings_growth_yoy"
    );
    query.quarterly_revenue_growth_yoy = request.input(
      "quarterly_revenue_growth_yoy"
    );
    query.snalyst_target_price = request.input("snalyst_target_price");
    query.trailing_pe = request.input("trailing_pe");
    query.forward_pe = request.input("forward_pe");
    query.price_to_sales_ratio_ttm = request.input("price_to_sales_ratio_ttm");
    query.price_to_book_ratio = request.input("price_to_book_ratio");
    query.evto_revenue = request.input("evto_revenue");
    query.evto_ebitda = request.input("evto_ebitda");
    query.beta = request.input("beta");
    query.week_52_high = request.input("week_52_high");
    query.week_52_low = request.input("week_52_low");
    query.day_50_moving_average = request.input("day_50_moving_average");
    query.day_200_moving_average = request.input("day_200_moving_average");
    query.shares_outstanding = request.input("shares_outstanding");
    query.shares_float = request.input("shares_float");
    query.shares_short = request.input("shares_short");
    query.shares_short_prior_month = request.input("shares_short_prior_month");
    query.short_ratio = request.input("short_ratio");
    query.short_percent_outstanding = request.input(
      "short_percent_outstanding"
    );
    query.short_percent_float = request.input("short_percent_float");
    query.percent_insiders = request.input("percent_insiders");
    query.percent_institutions = request.input("percent_institutions");
    query.forward_annual_dividend_rate = request.input(
      "forward_annual_dividend_rate"
    );
    query.forward_annual_dividend_yield = request.input(
      "forward_annual_dividend_yield"
    );
    query.payout_ratio = request.input("payout_ratio");
    query.dividend_date = request.input("dividend_date");
    query.ex_dividend_date = request.input("ex_dividend_date");
    query.last_split_factor = request.input("last_split_factor");
    query.last_split_date = request.input("last_split_date");
    query.year = request.input("year");
    query.month = request.input("month");
    await query.save();
    return response.status(200).send({ message: "Update successfully" });
  }

  async destroy({ params, response }) {
    const query = await VendorAlphaVantage.findOrFail(params.id);
    try {
      await query.delete();
      return response.status(200).send({ message: "Delete successfully" });
    } catch (error) {
      return response
        .status(423)
        .send({
          message: "Something went wrong",
        });
    }
  }
}

module.exports = VendorAlphaVantageController;
