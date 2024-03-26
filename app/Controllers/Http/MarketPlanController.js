"use strict";

const MarketPlan = use("App/Models/MarketPlan");
const Query = use("Query");
const Config = use("App/Models/Admin/ConfigModule/Config");
const { API_TYPE, URLS, KEYS } = require("../../Helper/constants");
const axios = use("axios");
const Excel = require("exceljs");
const qs = require("qs");
const MarketProduct = use("App/Models/MarketProduct");
const moment = require("moment");

const requestOnly = [
  "plan_name",
  "plan_duration",
  "plan_price",
  "current_price_or_special_price",
  "segment_id",
  "plan_type",
  "max_market",
  "max_country",
  "max_region",
  "is_active",
  "paypal_plan_id",
];

const requestOnlyPaypal = [
  "name",
  "description",
  "type",
  "category",
  "image_url",
  "home_url",
];

const searchInFields = [
  "id",
  "plan_name",
  "plan_duration",
  "plan_price",
  "current_price_or_special_price",
  "plan_type",
];

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with marketplans
 */
class MarketPlanController {
  /**
   * Show a list of all marketplans.
   * GET marketplans
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index({ request, response, view }) {
    const query = MarketPlan.query();
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
            let queryStr = "";
            if (Array.isArray(filter.value)) {
              filter.value.forEach((x) => {
                if (queryStr != "") queryStr += " or ";
                queryStr += `${filter.name} LIKE '%${x}%'`;
              });
            } else {
              queryStr = `${filter.name} LIKE '%${filter.value}%'`;
            }
            query.whereRaw(queryStr);
            break;
        }
      });
    }

    if (request.input("start_date") && request.input("end_date")) {
      query.whereRaw(`DATE(created_at) >= '${request.input("start_date")}'`);
      query.whereRaw(`DATE(created_at) <= '${request.input("end_date")}'`);
    }

    if (request.input("segment_id")) {
      let segment_id = request.input("segment_id");

      if (segment_id != 0) {
        query.where("segment_id", segment_id);
      }
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

  /**
   * Render a form to be used for creating a new marketplan.
   * GET marketplans/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create({ request, response, view }) {
    var body = request.only(requestOnly);
    await MarketPlan.create(body);
    return response.status(200).send({ message: "Created successfully" });
  }

  /**
   * Create/save a new marketplan.
   * POST marketplans
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response }) {
    let planPayload = {};
    var body = request.only(requestOnly);
    const marketProductQuery = MarketProduct.query();
    let marketProductResult = await marketProductQuery.fetch();
    let parsedMarketProductResult = marketProductResult.toJSON();

    if (!(parsedMarketProductResult && parsedMarketProductResult.length)) {
      return response
        .status(423)
        .send({
          message: "You don't have any product, please create product first",
        });
    }

    let paypalProductId = parsedMarketProductResult[0].paypal_product_id;

    planPayload["product_id"] = paypalProductId;
    planPayload["name"] = body.plan_name;
    planPayload["description"] = body.description;
    planPayload["billing_cycles"] = [
      {
        frequency: {
          interval_unit: body.plan_duration == "Monthly" ? "MONTH" : "YEAR",
          interval_count: 1,
        },
        tenure_type: "REGULAR",
        sequence: 1,
        total_cycles: 0,
        pricing_scheme: {
          fixed_price: {
            value:
              body.current_price_or_special_price == "0"
                ? body.plan_price
                : body.current_price_or_special_price,
            currency_code: "USD",
          },
        },
      },
    ];

    planPayload["payment_preferences"] = {
      auto_bill_outstanding: true,
      setup_fee: {
        value: "0",
        currency_code: "USD",
      },
      setup_fee_failure_action: "CONTINUE",
      payment_failure_threshold: 3,
    };

    // planPayload['taxes'] = {
    //   "percentage": "10",
    //   "inclusive": false
    // }

    let planResponse = await this.createPlanInPaypal(planPayload);

    if (planResponse) {
      body["paypal_plan_id"] = planResponse.id;
    }

    const query = await MarketPlan.create(body);

    await query.modules().detach();
    await query.modules().attach(JSON.parse(request.input("modules")));

    await query.countries().detach();
    await query.countries().attach(JSON.parse(request.input("countries")));

    await query.regions().detach();
    await query.regions().attach(JSON.parse(request.input("country_groups")));

    await query.save();

    return response
      .status(200)
      .send({ message: "Created successfully", data: planResponse });
  }

  /**
   * Display a single marketplan.
   * GET marketplans/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params, request, response, view }) {
    const result = await MarketPlan.findOrFail(params.id);
    const modulesIds = await result.modules().ids();
    result.modules = modulesIds;

    const countriesIds = await result.countries().ids();
    result.countries = countriesIds;

    const regionsIds = await result.regions().ids();
    result.country_groups = regionsIds;

    return response.status(200).send(result);
  }

  /**
   * Display a single marketplan.
   * GET marketplans/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async getMarketPlan({ params, request, response, view }) {
    const query = MarketPlan.query();
    query.where("id", params.id);
    query.with("modules");
    query.with("countries");
    query.with("regions");

    const result = await query.fetch();

    return response.status(200).send(result);
  }

  /**
   * Render a form to update an existing marketplan.
   * GET marketplans/:id/edit
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async edit({ params, request, response, view }) {}

  /**
   * Update marketplan details.
   * PUT or PATCH marketplans/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response }) {
    const query = await MarketPlan.findOrFail(params.id);

    query.plan_name = request.input("plan_name");
    query.plan_duration = request.input("plan_duration");
    query.plan_price = request.input("plan_price");
    query.segment_id = request.input("segment_id");
    query.plan_type = request.input("plan_type");
    query.max_market = request.input("max_market");
    query.max_region = request.input("max_region");
    query.max_country = request.input("max_country");
    query.is_active = request.input("is_active");
    query.paypal_plan_id = request.input("paypal_plan_id");
    query.description = request.input("description");

    if (query.paypal_plan_id) {
      let body = [
        {
          op: "replace",
          path: "/payment_preferences/payment_failure_threshold",
          value: 3,
        },
      ];
      try {
        let planUpdateResponse = await this.updatePlan(
          query.paypal_plan_id,
          body
        );
      } catch (error) {}
    }

    if (
      query.current_price_or_special_price !=
      request.input("current_price_or_special_price")
    ) {
      let body = {
        pricing_schemes: [
          {
            billing_cycle_sequence: 1,
            pricing_scheme: {
              fixed_price: {
                value: request.input("current_price_or_special_price"),
                currency_code: "USD",
              },
            },
          },
        ],
      };
      try {
        let updatePlanPriceResponse = await this.updatePlanPrice(
          query.paypal_plan_id,
          body
        );
      } catch (error) {}
    }

    query.current_price_or_special_price = request.input(
      "current_price_or_special_price"
    );

    await query.modules().detach();
    await query.modules().attach(JSON.parse(request.input("modules")));

    await query.countries().detach();
    await query.countries().attach(JSON.parse(request.input("countries")));

    await query.regions().detach();
    await query.regions().attach(JSON.parse(request.input("country_groups")));

    await query.save();

    return response.status(200).send({ message: "Updated successfully" });
  }

  /**
   * Delete a marketplan with id.
   * DELETE marketplans/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response }) {
    const query = await MarketPlan.findOrFail(params.id);
    try {
      let parsedResult = query.toJSON();
      let planDeactivateResponse;

      if (parsedResult && parsedResult.paypal_plan_id) {
        try {
          planDeactivateResponse = await this.deactivatePlan(
            parsedResult.paypal_plan_id
          );
        } catch (error) {}
      }

      await query.delete();
      return response.status(200).send({ message: "Delete successfully" });
    } catch (error) {
      return response.status(423).send({
        message: "Something went wrong",
      });
    }
  }

  /**
   * Create/save a new Product.
   * POST create_product
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */

  async createProduct({ request, response }) {
    try {
      let payload = {};
      var body = request.only(requestOnlyPaypal);
      let productResponse = await this.createProductInPaypal(body);

      payload["name"] = productResponse.name;
      payload["description"] = productResponse.description;
      payload["paypal_product_id"] = productResponse.id;
      payload["type"] = body.type;
      payload["category"] = body.category;
      payload["image_url"] = body.image_url;
      payload["home_url"] = body.home_url;

      await MarketProduct.create(payload);
      return response
        .status(200)
        .send({ message: "Created successfully", data: productResponse });
    } catch (error) {
      return response
        .status(423)
        .send({ message: "Something went wrong in Paypal product creation" });
    }
  }

  async listPlans({ request, response }) {
    let plansResponse = await this.getAllPlans();
    return response
      .status(200)
      .send({ message: "success", data: plansResponse });
  }

  async makePaypalCall(authToken, url, params = {}, body = {}) {
    let headers = {
      Authorization: authToken,
    };

    try {
      let response = await axios.post(url, body, { headers, params });
      return response;
    } catch (error) {
      return null;
    }
  }

  async makePaypalGetCall(authToken, url, params = {}) {
    let headers = {
      Authorization: authToken,
    };
    return await axios.get(url, { headers, params });
  }

  async createProductInPaypal(body) {
    let tockenResponse = await this.getPaypalAuthToken();
    let authToken = "Bearer " + tockenResponse.data.access_token;

    let params = {};
    let response = await this.makePaypalCall(
      authToken,
      `${URLS.PAYPAL_PRODUCT_MANAGEMENT_URL}`,
      params,
      body
    );

    if (response && response.data) {
      return response.data;
    } else {
      throw new Error("Invalid Paypal Request");
    }
  }

  async getPaypalAuthToken() {
    try {
      let userName = await Config.findOrCreate(
        { key: KEYS.PAYPAL_GET_AUTH_TOKEN_USERNAME },
        { key: KEYS.PAYPAL_GET_AUTH_TOKEN_USERNAME, value: "test" }
      );
      let password = await Config.findOrCreate(
        { key: KEYS.PAYPAL_GET_AUTH_TOKEN_PASSWORD },
        { key: KEYS.PAYPAL_GET_AUTH_TOKEN_PASSWORD, value: "test" }
      );

      const token = `${userName.value}:${password.value}`;
      const encodedToken = Buffer.from(token).toString("base64");
      const headers = {
        Authorization: "Basic " + encodedToken,
        "content-type": "application/x-www-form-urlencoded",
      };

      return await axios.post(
        `${URLS.PAYPAL_GET_TOKEN_URL}`,
        qs.stringify({ grant_type: "client_credentials" }),
        { headers }
      );
    } catch (error) {}
  }

  async createPlanInPaypal(body) {
    let tockenResponse = await this.getPaypalAuthToken();
    let authToken = "Bearer " + tockenResponse.data.access_token;

    let params = {};
    let response = await this.makePaypalCall(
      authToken,
      `${URLS.PAYPAL_PLAN_MANAGEMENT_URL}`,
      params,
      body
    );

    if (response && response.data) {
      return response.data;
    } else {
      throw new Error("Invalid Paypal Request");
    }
  }

  async getAllPlans() {
    let tockenResponse = await this.getPaypalAuthToken();
    let authToken = "Bearer " + tockenResponse.data.access_token;

    let params = {
      total_required: true,
    };
    let response = await this.makePaypalGetCall(
      authToken,
      `${URLS.PAYPAL_PLAN_MANAGEMENT_URL}`,
      params
    );

    if (response && response.data) {
      return response.data;
    } else {
      throw new Error("Invalid Paypal Request");
    }
  }

  async deactivatePlan(planId) {
    let tockenResponse = await this.getPaypalAuthToken();
    let authToken = "Bearer " + tockenResponse.data.access_token;
    let url = `${URLS.PAYPAL_PLAN_MANAGEMENT_URL}/${planId}/deactivate`;
    let params = {};
    let body = {};
    let headers = { Authorization: authToken };
    let response = await axios.post(url, body, { headers, params });

    if (response) {
      return response;
    } else {
      throw new Error("Invalid Paypal Request");
    }
  }

  async updatePlan(planId, body) {
    let tockenResponse = await this.getPaypalAuthToken();
    let authToken = "Bearer " + tockenResponse.data.access_token;
    let url = `${URLS.PAYPAL_PLAN_MANAGEMENT_URL}/${planId}`;
    let params = {};
    let headers = { Authorization: authToken };
    let response = await axios.patch(url, body, { headers, params });

    if (response) {
      return response;
    } else {
      throw new Error("Invalid Paypal Request");
    }
  }

  async updatePlanPrice(planId, body) {
    let tockenResponse = await this.getPaypalAuthToken();
    let authToken = "Bearer " + tockenResponse.data.access_token;
    let url = `${URLS.PAYPAL_PLAN_MANAGEMENT_URL}/${planId}/update-pricing-schemes`;
    let params = {};
    let headers = { Authorization: authToken };
    let response = await axios.post(url, body, { headers, params });

    if (response) {
      return response;
    } else {
      throw new Error("Invalid Paypal Request");
    }
  }

  /**
   * Show Active Subscribed Plans
   *
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async getSubscribedPlans({ request, response, view, auth }) {
    const query = MarketPlan.query();

    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    if (search) {
      query.where(searchQuery.search(searchInFields));
    }

    query.select(
      "market_plans.id",
      "market_plans.plan_name",
      "market_plans.plan_duration",
      "market_plans.max_market",
      "market_plans.max_region",
      "market_plans.max_country"
    );

    query.leftJoin("mi_segments", "mi_segments.id", "market_plans.segment_id");
    query.select("mi_segments.name as misegment");

    query.where("market_plans.is_active", 1);

    query.leftJoin("subcriptions", "subcriptions.plan_id", "market_plans.id");
    query.count("subcriptions.id as subscriptioncount");
    query.groupBy("market_plans.id");

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

  /**
   * Show a list of all marketplans.
   * GET marketplans
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async getmiplans({ request, response, view }) {
    const query = MarketPlan.query();
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
            let queryStr = "";
            if (Array.isArray(filter.value)) {
              filter.value.forEach((x) => {
                if (queryStr != "") queryStr += " or ";
                queryStr += `${filter.name} LIKE '%${x}%'`;
              });
            } else {
              queryStr = `${filter.name} LIKE '%${filter.value}%'`;
            }
            query.whereRaw(queryStr);
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

  async exportReport({ request, response, view }) {
    const query = MarketPlan.query();
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });

    query.leftJoin("mi_segments", "mi_segments.id", "market_plans.segment_id");
    query.select("mi_segments.name as misegment");

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    if (search) {
      query.where(searchQuery.search(searchInFields));
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
            let queryStr = "";
            if (Array.isArray(filter.value)) {
              filter.value.forEach((x) => {
                if (queryStr != "") queryStr += " or ";
                queryStr += `${filter.name} LIKE '%${x}%'`;
              });
            } else {
              queryStr = `${filter.name} LIKE '%${filter.value}%'`;
            }
            query.whereRaw(queryStr);
            break;
        }
      });
    }

    if (request.input("start_date") && request.input("end_date")) {
      query.whereRaw(`DATE(created_at) >= '${request.input("start_date")}'`);
      query.whereRaw(`DATE(created_at) <= '${request.input("end_date")}'`);
    }

    var result = await query.fetch();

    const fileName = "market-plan-" + moment().format("yyyy-MM-DD") + ".xlsx";
    let workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet("Market Plan List");
    let font = { name: "Arial", size: 12 };

    const data = await result.toJSON();
    let exportData = [];
    let index = 1;

    if (data) {
      data.forEach((element) => {
        exportData.push({
          sno: index++,
          planname: element.plan_name,
          plan_duration: element.plan_duration,
          plan_price: element.plan_price,
          special_price: element.special_price,
          misegment: element.misegment,
          subscription_start_date: element.subscription_start_date,
          subscription_end_date: element.subscription_end_date,
          max_market: element.max_market,
          max_country: element.max_country,
          max_region: element.max_region,
          plan_type: element.plan_type,
          isactive: element.is_active,
          created: element.created_at,
          updated: element.updated_at,
        });
      });
    }

    let columns = [
      { header: "S. No.", key: "sno", width: 10, style: { font: font } },
      {
        header: "Plan Name",
        key: "planname",
        width: 30,
        style: { font: font },
      },
      {
        header: "Plan Duration",
        key: "plan_duration",
        width: 40,
        style: { font: font },
      },
      {
        header: "Plan Pricein USD",
        key: "plan_price",
        width: 30,
        style: { font: font },
      },
      {
        header: "Plan Special Price in USD",
        key: "special_price",
        width: 30,
        style: { font: font },
      },
      {
        header: "Market Segment",
        key: "misegment",
        width: 30,
        style: { font: font },
      },
      {
        header: "Subscription Start Date",
        key: "subscription_start_date",
        width: 30,
        style: { font: font },
      },
      {
        header: "Subscription End Date",
        key: "subscription_end_date",
        width: 30,
        style: { font: font },
      },
      {
        header: "Max Allowed Markets",
        key: "max_market",
        width: 30,
        style: { font: font },
      },
      {
        header: "Max Allowed Countries",
        key: "max_country",
        width: 30,
        style: { font: font },
      },
      {
        header: "Max Allowed Regions",
        key: "max_region",
        width: 30,
        style: { font: font },
      },
      {
        header: "Plan Type",
        key: "plan_type",
        width: 30,
        style: { font: font },
      },
      { header: "Status", key: "isactive", width: 20, style: { font: font } },
      {
        header: "Created",
        key: "created_at",
        width: 30,
        style: { font: font },
      },
      {
        header: "Updated",
        key: "updated_at",
        width: 30,
        style: { font: font },
      },
    ];

    worksheet.columns = columns;
    worksheet.addRows(exportData);

    worksheet.getCell("B1", "C1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "cccccc" },
    };

    response.header(
      `Content-Type`,
      `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
    );
    response.header(`Content-Disposition`, `attachment; filename="${fileName}`);
    return workbook.xlsx.writeBuffer(response);
  }
}

module.exports = MarketPlanController;
