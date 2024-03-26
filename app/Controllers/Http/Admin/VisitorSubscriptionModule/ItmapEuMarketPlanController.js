"use strict";

const MarketPlan = use(
  "App/Models/Admin/VisitorSubscriptionModule/ItmapEuMarketPlan"
);
const Query = use("Query");
const Config = use("App/Models/Admin/ConfigModule/Config");
const MarketProduct = use("App/Models/MarketProduct");
const { API_TYPE, URLS, KEYS } = require("../../../../Helper/constants");
const axios = use("axios");
const qs = require("qs");
const {
  getPaypalAuthToken,
} = require("../../../../services/subscription.service");
const requestOnly = [
  "plan_name",
  "plan_duration",
  "plan_price",
  "current_price_or_special_price",
  "is_active",
  "paypal_plan_id",
  "plan_category",
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
];

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with marketplans
 */
class ItmapEuMarketPlanController {
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
  async create({ request, response, view }) {}

  /**
   * Create/save a new marketplan.
   * POST marketplans
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response, auth }) {
    let planPayload = {};
    let planResponse = null;
    var body = request.only(requestOnly);

    if (body.current_price_or_special_price > 0 || body.plan_price > 0) {
      const marketProductQuery = MarketProduct.query();

      let marketProductResult = await marketProductQuery.fetch();
      let parsedMarketProductResult = marketProductResult.toJSON();

      if (!(parsedMarketProductResult && parsedMarketProductResult.length)) {
        return response.status(423).send({
          message: "You don't have any product, please create product first",
        });
      }

      let paypalProductId = parsedMarketProductResult[0].paypal_product_id;

      planPayload["product_id"] = paypalProductId;
      planPayload["name"] = body.plan_name;
      planPayload["description"] = body.plan_name;
      planPayload["billing_cycles"] = [
        {
          frequency: {
            interval_unit: body.plan_duration == "Monthly" ? "MONTH" : "YEAR",
            interval_count: 1,
          },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: body.plan_duration == "Monthly" ? 12 : 0,
          pricing_scheme: {
            fixed_price: {
              value:
                body.current_price_or_special_price > 0
                  ? body.current_price_or_special_price
                  : body.plan_price,
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

      console.log("Payload", planPayload);
      try {
        planResponse = await this.createPlanInPaypal(planPayload);

        console.log("Res", planResponse);
      } catch (error) {
        console.log("Error", error);
      }
    }

    if (planResponse) {
      body["paypal_plan_id"] = planResponse.id;
    } else {
      body["paypal_plan_id"] = 0;
      planResponse = "Basic Plan created with no paypal ID";
    }

    body["plan_duration"] = body.plan_duration;
    body["description1"] = request.input("description1");
    body["description2"] = request.input("description2");
    body["description3"] = request.input("description3");
    body["description4"] = request.input("description4");
    body["plan_category"] = body.plan_category;
    body["is_active"] = true;
    body["created_by"] = auth.user.id;
    body["updated_by"] = auth.user.id;
    const query = await MarketPlan.create(body);

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
  async update({ params, request, response, auth }) {
    const query = await MarketPlan.findOrFail(params.id);

    query.plan_name = request.input("plan_name");
    query.plan_duration = request.input("plan_duration");
    query.description1 = request.input("description1");
    query.description2 = request.input("description2");
    query.description3 = request.input("description3");
    query.description4 = request.input("description4");

    query.is_active = true;
    query.paypal_plan_id = request.input("paypal_plan_id");
    query.updated_by = auth.user.id;

    if (query.paypal_plan_id && query.paypal_plan_id != 0) {
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
      } catch (error) {
        console.log(error);
      }

      if (
        query.current_price_or_special_price !=
          request.input("current_price_or_special_price") ||
        query.plan_price != request.input("plan_price")
      ) {
        let body = {
          pricing_schemes: [
            {
              billing_cycle_sequence: 1,
              pricing_scheme: {
                fixed_price: {
                  value:
                    request.input("current_price_or_special_price") > 0
                      ? request.input("current_price_or_special_price")
                      : request.input("plan_price"),
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
        } catch (error) {
          return error;
        }
      }
    }
    query.plan_price = request.input("plan_price");
    query.current_price_or_special_price = request.input(
      "current_price_or_special_price"
    );

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

    return await axios.post(url, body, { headers, params });
  }

  async makePaypalGetCall(authToken, url, params = {}) {
    let headers = {
      Authorization: authToken,
    };
    return await axios.get(url, { headers, params });
  }

  async createProductInPaypal(body) {
    let tockenResponse = await getPaypalAuthToken();
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

  async createPlanInPaypal(body) {
    let tockenResponse = await getPaypalAuthToken();
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

  async cancelSubscriptionInPaypal(planId, body) {
    let tockenResponse = await getPaypalAuthToken();
    let authToken = "Bearer " + tockenResponse.data.access_token;

    let params = {};
    try {
      let response = await this.makePaypalCall(
        authToken,
        `${URLS.PAYPAL_CANCEL_SUBSCRIPTION_URL}/${planId}/cancel`,
        params,
        body
      );
      if (response) {
        return response.status;
      } else {
        throw new Error("Invalid Paypal Request");
      }
    } catch (error) {
      console.log(error);
    }
  }

  async getAllPlans() {
    let tockenResponse = await getPaypalAuthToken();
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
    let tockenResponse = await getPaypalAuthToken();
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
    let tockenResponse = await getPaypalAuthToken();
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
    let tockenResponse = await getPaypalAuthToken();
    let authToken = "Bearer " + tockenResponse.data.access_token;
    console.log("Auth", authToken);
    let url = `${URLS.PAYPAL_PLAN_MANAGEMENT_URL}/${planId}/update-pricing-schemes`;
    let params = {};
    let headers = { Authorization: authToken };
    let response = await axios.post(url, body, { headers, params });
    console.log("Auth", response);
    if (response) {
      return response;
    } else {
      throw new Error("Invalid Paypal Request");
    }
  }

  async euplans({ request, response, view }) {
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
}

module.exports = ItmapEuMarketPlanController;
