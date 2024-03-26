"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class VendorsSchema extends Schema {
  up() {
    this.create("vendors", (table) => {
      table.increments();
      table.string("name");
      table.string("email", 254).notNullable();
      table.string("mobile");
      table.string("password");
      table.string("designation");
      table.string("company");
      table.string("website");
      table.string("domain_expertise").nullable();
      table.string("revenue_range");
      table.integer("number_employees");
      table.text("notes", "text").nullable();
      table.text("image", "text").nullable();
      table.string("ticker").nullable();
      table.string("twitter_handle").nullable();
      table.boolean("is_login").defaultTo(false);
      table.date("expiry_date").nullable();
      table.string("founded").nullable();
      table.enu("company_type", ["public", "private"]);
      table.integer("region_id").nullable();
      table.string("main_country").nullable();
      table.boolean("is_deleted").defaultTo(false);
      table.integer("vendor_cateogry_id");
      table.text("linkedin_url").nullable();
      table.text("tagline").nullable();
      table.string("number_employees").nullable();
      table.text("linkedin_salesurl").nullable();
      table.timestamps();
    });

    this.create("industry_vendors", (table) => {
      table
        .integer("vendor_id")
        .unsigned()
        .references("id")
        .inTable("vendors")
        .onDelete("cascade")
        .onUpdate("cascade");
      table
        .integer("industry_id")
        .unsigned()
        .references("id")
        .inTable("industries")
        .onDelete("cascade")
        .onUpdate("cascade");
    });

    this.create("module_vendors", (table) => {
      table
        .integer("vendor_id")
        .unsigned()
        .references("id")
        .inTable("vendors")
        .onDelete("cascade")
        .onUpdate("cascade");
      table
        .integer("module_id")
        .unsigned()
        .references("id")
        .inTable("modules")
        .onDelete("cascade")
        .onUpdate("cascade");
    });

    this.create("vendor_locations", (table) => {
      table.increments();
      table
        .integer("vendor_id")
        .unsigned()
        .references("id")
        .inTable("vendors")
        .onDelete("cascade")
        .onUpdate("cascade");
      table
        .integer("country_id")
        .unsigned()
        .references("id")
        .inTable("countries")
        .onDelete("cascade")
        .onUpdate("cascade");
      table.text("office_location", "text");
      table.string("latitude");
      table.string("longitude");
      table.boolean("is_active").defaultTo(true);
      table.boolean("is_headoffice").defaultTo(false);
      table.timestamps();
    });

    this.create("vendor_key_peoples", (table) => {
      table.increments();
      table
        .integer("vendor_id")
        .unsigned()
        .references("id")
        .inTable("vendors")
        .onDelete("cascade")
        .onUpdate("cascade");
      table.string("name");
      table.text("photo");
      table.text("designation");
      table.text("twitter_link");
      table.text("linkedin_link");
      table.text("instagram_link");
      table.boolean("is_board_of_directors").defaultTo(false);
      table.boolean("is_executive_managment").defaultTo(false);
      table.boolean("is_active").defaultTo(true);
      table.date("start_date");
      table.date("end_date");
      table.timestamps();
    });

    this.create("vendor_employee_job_counts", (table) => {
      table.increments();
      table
        .integer("vendor_id")
        .unsigned()
        .references("id")
        .inTable("vendors")
        .onDelete("cascade")
        .onUpdate("cascade");
      table.integer("total_employee");
      table.integer("total_jobs");
      table.string("year");
      table.string("quarter");
      table.timestamps();
    });

    this.create("vendor_financials", (table) => {
      table.increments();
      table
        .integer("vendor_id")
        .unsigned()
        .references("id")
        .inTable("vendors")
        .onDelete("cascade")
        .onUpdate("cascade");
      table.text("net_income");
      table.bigInteger("total_assets");
      table.bigInteger("total_liabilities");
      table.bigInteger("total_equity");
      table.string("financial_leverage");
      table.string("debt_equity_ratio");
      table.string("reported_eps");
      table.string("gross_profit");
      table.string("rd_investment");
      table.string("current_debt");
      table.string("total_shares");
      table.string("revenue");
      table.string("p_e_ratio");
      table.string("revenue_range");
      table.string("year");
      table.string("quarter");
      table.string("source");
      table.string("fiscal_date_ending");
      table.timestamps();
    });

    this.create("vendor_alpha_vantages", (table) => {
      table.increments();
      table
        .integer("vendor_id")
        .unsigned()
        .references("id")
        .inTable("vendors")
        .onDelete("cascade")
        .onUpdate("cascade");
      table.string("symbol");
      table.string("asset_type");
      table.string("name");
      table.string("description");
      table.string("cik");
      table.string("exchange");
      table.string("currency");
      table.string("country");
      table.string("sector");
      table.string("industry");
      table.string("address");
      table.string("full_time_employees");
      table.string("fiscal_year_end");
      table.string("latest_quarter");
      table.string("market_capitalization");
      table.string("ebitda");
      table.string("pe_ratio");
      table.string("peg_ratio");
      table.string("book_value");
      table.string("dividend_per_share");
      table.string("dividend_yield");
      table.string("eps");
      table.string("revenue_per_share_ttm");
      table.string("profit_margin");
      table.string("operating_margin_ttm");
      table.string("return_on_assets_ttm");
      table.string("return_on_equity_ttm");
      table.string("revenue_ttm");
      table.string("gross_profit_ttm");
      table.string("diluted_eps_ttm");
      table.string("quarterly_earnings_growth_yoy");
      table.string("quarterly_revenue_growth_yoy");
      table.string("snalyst_target_price");
      table.string("trailing_pe");
      table.string("forward_pe");
      table.string("price_to_sales_ratio_ttm");
      table.string("price_to_book_ratio");
      table.string("evto_revenue");
      table.string("evto_ebitda");
      table.string("beta");
      table.string("week_52_high");
      table.string("week_52_low");
      table.string("day_50_moving_average");
      table.string("day_200_moving_average");
      table.string("shares_outstanding");
      table.string("shares_float");
      table.string("shares_short");
      table.string("shares_short_prior_month");
      table.string("short_ratio");
      table.string("short_percent_outstanding");
      table.string("short_percent_float");
      table.string("percent_insiders");
      table.string("percent_institutions");
      table.string("forward_annual_dividend_rate");
      table.string("forward_annual_dividend_yield");
      table.string("payout_ratio");
      table.string("dividend_date");
      table.string("ex_dividend_date");
      table.string("last_split_factor");
      table.string("last_split_date");
      table.string("year");
      table.string("month");
      table.timestamps();
    });

    this.create("vendor_funding_lists", (table) => {
      table.increments();
      table
        .integer("vendor_id")
        .unsigned()
        .references("id")
        .inTable("vendors")
        .onDelete("cascade")
        .onUpdate("cascade");
      table.string("type_of_funding");
      table.string("funded_by");
      table.string("date_of_funding");
      table.string("currency");
      table.string("funding_amount");
      table.timestamps();
    });

    this.create("vendor_acquisition_lists", (table) => {
      table.increments();
      table
        .integer("vendor_id")
        .unsigned()
        .references("id")
        .inTable("vendors")
        .onDelete("cascade")
        .onUpdate("cascade");
      table.string("logo_acquried_company");
      table.string("acquired_company_name");
      table.string("date_of_acquisition");
      table.string("currency");
      table.string("website");
      table.string("acquired_amount");
      table.timestamps();
    });

    this.create("vendor_ips", (table) => {
      table.increments();
      table
        .integer("vendor_id")
        .unsigned()
        .references("id")
        .inTable("vendors")
        .onDelete("cascade")
        .onUpdate("cascade");
      table.integer("patent_count");
      table.integer("year");
      table.string("quarter");
      table.boolean("is_api_extracted").defaultTo(false);
      table.timestamps();
    });

    this.create("vendor_itmap_scores", (table) => {
      table.increments();
      table
        .integer("vendor_id")
        .unsigned()
        .references("id")
        .inTable("vendors")
        .onDelete("cascade")
        .onUpdate("cascade");
      table.integer("overall_score");
      table.integer("vendor_visiblity_score");
      table.string("vendor_visiblity_score_system");
      table.string("short_term_technology_score");
      table.string("long_term_technology_score");
      table.string("innovation_value_score");
      table.string("year");
      table.timestamps();
    });

    this.create("vendor_web_traffics", (table) => {
      table.increments();
      table
        .integer("vendor_id")
        .unsigned()
        .references("id")
        .inTable("vendors")
        .onDelete("cascade")
        .onUpdate("cascade");
      table.integer("web_ranking");
      table.integer("page_view_per_user");
      table.integer("page_view_per_million");
      table.integer("reach_per_million");
      table.boolean("is_api_extracted").defaultTo(false);
      table.string("month");
      table.string("year");
      table.timestamps();
    });

    this.create("vendor_google_trends", (table) => {
      table.increments();
      table
        .integer("vendor_id")
        .unsigned()
        .references("id")
        .inTable("vendors")
        .onDelete("cascade")
        .onUpdate("cascade");
      table.integer("trends_score");
      table.string("date");
      table.string("year");
      table.boolean("is_api_extracted").defaultTo(false);
      table.timestamps();
    });

    this.create("vendor_twitter_data", (table) => {
      table.increments();
      table
        .integer("vendor_id")
        .unsigned()
        .references("id")
        .inTable("vendors")
        .onDelete("cascade")
        .onUpdate("cascade");
      table.integer("tweet_count");
      table.integer("retweet_count");
      table.integer("quote_count");
      table.integer("like_count");
      table.integer("reply_count");
      table.integer("month");
      table.string("year");
      table.string("number_followers");
      table.string("mentions");
      table.string("sentiment");
      table.integer("month_id");
      table.boolean("is_api_extracted").defaultTo(false);
      table.timestamps();
    });

    this.create("vendor_competitive_dynamics", (table) => {
      table.increments();
      table
        .integer("vendor_id")
        .unsigned()
        .references("id")
        .inTable("vendors")
        .onDelete("cascade")
        .onUpdate("cascade");
      table.string("bubble_name");
      table.integer("bubble_size");
      table.integer("bubble_x");
      table.string("bubble_y");
      table.string("bubble_color");
      table.string("year");
      table.string("revenue");
      table.string("quarter");
      table.integer("market");
      table.timestamps();
    });

    this.create("vendor_news_lists", (table) => {
      table.increments();
      table
        .integer("vendor_id")
        .unsigned()
        .references("id")
        .inTable("vendors")
        .onDelete("cascade")
        .onUpdate("cascade");
      table.string("news_title");
      table.string("news_link");
      table.string("news_thumbnail");
      table.string("news_description");
      table.string("is_news_active");
      table.string("news_date");
      table.string("news_source");
      table.boolean("is_api_extracted").defaultTo(false);
      table.timestamps();
    });

    this.create("vendor_documents", (table) => {
      table.increments();
      table
        .integer("vendor_id")
        .unsigned()
        .references("id")
        .inTable("vendors")
        .onDelete("cascade")
        .onUpdate("cascade");
      table.string("document_type");
      table.string("document_title");
      table.string("document_file_name");
      table.timestamps();
    });
  }

  down() {
    this.drop("vendors");
    this.drop("industry_vendors");
    this.drop("module_vendors");
    this.drop("vendor_locations");
    this.drop("vendor_key_peoples");
    this.drop("vendor_employee_job_counts");
    this.drop("vendor_financials");
    this.drop("vendor_alpha_vantages");
    this.drop("vendor_funding_list");
    this.drop("vendor_acquisition_lists");
    this.drop("vendor_ips");
    this.drop("vendor_itmap_scores");
    this.drop("vendor_web_traffics");
    this.drop("vendor_google_trends");
    this.drop("vendor_twitter_data");
    this.drop("vendor_competitive_dynamics");
    this.drop("vendor_news_lists");
    this.drop("vendor_documents");
  }
}

module.exports = VendorsSchema;
