"use strict";

const Subcription = use(
  "App/Models/Admin/VisitorSubscriptionModule/ItmapEuSubcription"
);
const MarketPlan = use(
  "App/Models/Admin/VisitorSubscriptionModule/ItmapEuMarketPlan"
);
const { getSerialCode } = require("../../../../Helper/serialNo");
const { generatePdf } = require("../../../../Helper/pdfGenerator");
const Visitor = use("App/Models/Admin/VisitorModule/Visitor");
const { sendMail } = require("../../../../Helper/pdfGenerator");
const Invoice = use("App/Models/Admin/VisitorSubscriptionModule/Euinvoice");
const moment = require("moment");
const Excel = require("exceljs");
const { EU_SERIAL_CODE } = require("../../../../Helper/constants");

const Query = use("Query");
const transactionHistory = use(
  "App/Models/Admin/VisitorSubscriptionModule/ItmapEuTransactionHistory"
);

const VisitorController = use(
  "App/Controllers/Http/Front/VisitorModule/VisitorController"
);

const EuMarketPlanController = use("./ItmapEuMarketPlanController");

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with subcriptions
 */

const requestOnly = [
  "user_id",
  "plan_id",
  "subscription_start_date",
  "subscription_end_date",
  "is_active",
  "payment_transaction_id",
];

const searchInFields = ["id", "user_id", "plan_id"];

class ItmapEuSubcriptionController {
  /**
   * Show a list of all subcriptions.
   * GET subcriptions
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index({ request, response, view }) {
    const query = Subcription.query();
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });

    query.with("users");
    query.with("plans");
    query.with("transactions");
    query.leftJoin(
      "itmap_eu_market_plans as plans",
      "itmap_eu_subcriptions.plan_id",
      "plans.id"
    );
    query.leftJoin(
      "visitors as users",
      "itmap_eu_subcriptions.user_id",
      "users.id"
    );

    query.select("itmap_eu_subcriptions.*");

    // query.with("invoices", (builder) => {
    //   builder.select("id", "subscription_purchase_id");
    // });
    query.with("invoices", (builder) => {
      builder.select("id", "subscription_purchase_id", "type").where("type", 1);
    });
    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    if (search) {
      query.where(searchQuery.search(searchInFields));
    }

    var visitornamefilter = "";
    var plannamefilter = "";

    if (request.input("filters")) {
      const filters = JSON.parse(request.input("filters"));

      filters.forEach((filter) => {
        switch (filter.name) {
          case "users.name":
            visitornamefilter = filter.value;
            break;
          case "plans.plan_name":
            plannamefilter = filter.value;
            break;
          case "is_active":
            query.whereIn("itmap_eu_subcriptions.is_active", filter.value);
            break;
          case "plans.plan_category":
            query.whereIn("plan_category", filter.value);
            break;
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

    if (visitornamefilter.length > 0) {
      const visitorids = await Visitor.query()
        .whereRaw(`name LIKE '%${visitornamefilter}%'`)
        .pluck("id");
      if (visitorids.length > 0) query.whereRaw("user_id in (?)", [visitorids]);
    }

    if (plannamefilter.length > 0) {
      const planids = await MarketPlan.query()
        .whereRaw(`plan_name LIKE '%${plannamefilter}%'`)
        .pluck("id");
      if (planids.length > 0) query.whereRaw("plan_id in (?)", [planids]);
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
   * Render a form to be used for creating a new subcription.
   * GET subcriptions/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create({ request, response, view }) {}

  /**
   * Create/save a new subcription.
   * POST subcriptions
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response, auth }) {
    try {
      var body = request.only(requestOnly);

      var is_active = 1;
      let cursubsid = 1;
      //const query = await Subcription.create();

      //Make existing subscription inactive first
      const subquery = Subcription.query();

      subquery.whereRaw(`user_id = (?) AND is_active = (1)`, [body.user_id]);

      const result = await subquery.first();

      if (result && result.id > 0) {
        var sub_end_date = moment(result.subscription_end_date);
        cursubsid = result.plan_id;
        var cur_date = moment();

        if (cur_date > sub_end_date) {
          //subscription ended

          result.is_active = 0;

          result.subscription_end_date =
            moment().subtract(1, "days").format("yyyy-MM-DD") + " 23:59:59.000";
          await result.save();

          body.subscription_start_date = moment().format("yyyy-MM-DD");
          body.subscription_end_date =
            moment().add(365, "days").format("yyyy-MM-DD") + " 23:59:59.000";
        } else {
          const subquery = Subcription.query();

          subquery.whereRaw(`user_id = (?) AND is_active = (?)`, [
            auth.user.id,
            2,
          ]);

          const subfutureresult = await subquery.first();

          if (subfutureresult && subfutureresult.id > 0) {
            return response.status(423).send({
              message:
                "You already have future subscription, can't apply for any more future subscrition",
            });
          } else {
            if (result.plan_id == request.input("plan_id")) {
              is_active = 2;

              body.subscription_start_date =
                moment(result.subscription_end_date)
                  .add(1, "days")
                  .format("yyyy-MM-DD") + " 23:59:59.000";

              body.subscription_end_date =
                moment(result.subscription_end_date)
                  .add(365, "days")
                  .format("yyyy-MM-DD") + " 23:59:59.000";
            } else {
              is_active = 1;
              result.is_active = 0;

              result.subscription_end_date =
                moment().subtract(1, "days").format("yyyy-MM-DD") +
                " 23:59:59.000";
              await result.save();

              body.subscription_start_date = moment().format("yyyy-MM-DD");
              body.subscription_end_date =
                moment().add(365, "days").format("yyyy-MM-DD") +
                " 23:59:59.000";
            }
          }
        }
      } else {
        body.subscription_start_date = moment().format("yyyy-MM-DD");
        body.subscription_end_date =
          moment().add(365, "days").format("yyyy-MM-DD") + " 23:59:59.000";
      }

      const transactionHistoryQuery = new transactionHistory();
      //Add transaction details
      if (request.input("transaction")) {
        let transaction = JSON.parse(request.input("transaction"));

        transactionHistoryQuery.payment_transaction_id =
          transaction.payment_transaction_id;
        transactionHistoryQuery.transaction_status = "COMPLETED";

        transactionHistoryQuery.transaction_code = await getSerialCode(
          EU_SERIAL_CODE.TRANSACTION
        );
        transactionHistoryQuery.transaction_amount =
          transaction.transaction_amount;
        transactionHistoryQuery.transaction_details =
          transaction.transaction_details == null
            ? ""
            : transaction.transaction_details;
        transactionHistoryQuery.transaction_date = transaction.transaction_date;
        transactionHistoryQuery.payment_type = transaction.type;
        transactionHistoryQuery.created_by = auth.user.id;
        transactionHistoryQuery.user_id = body.user_id;

        //console.log(transactionHistoryQuery);
        await transactionHistoryQuery.save();
        //body.document_price = transaction.transaction_amount;
        body.payment_transaction_id = transactionHistoryQuery.id;
      }

      body.created_by = auth.user.id;
      body.is_active = is_active;
      body.subcription_code = await getSerialCode(EU_SERIAL_CODE.SUBSCRIPTION);

      const query = await Subcription.create(body);

      await query.save();
      const visitor = await Visitor.findOrFail(body.user_id);
      let invoiceid = 0;
      if (cursubsid != query.plan_id)
        invoiceid = await this.sendInvoice(
          query.id,
          transactionHistoryQuery,
          visitor,
          1,
          0
        );
      else
        invoiceid = await this.sendInvoice(
          query.id,
          transactionHistoryQuery,
          visitor,
          1,
          1
        );

      return response
        .status(200)
        .send({ message: "Created successfully", result: query });
    } catch (error) {
      console.log(error);
      return response.status(423).send({
        message: "Something went wrong",
      });
    }
  }

  /**
   * Display a single subcription.
   * GET subcriptions/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params, request, response, view }) {
    const query = Subcription.query();
    query.where("id", params.id);
    query.with("users");
    query.with("plans");
    query.with("transactions");

    var result = await query.fetch();

    return response.status(200).send(result);
  }

  /**
   * Render a form to update an existing subcription.
   * GET subcriptions/:id/edit
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async edit({ params, request, response, view }) {}

  async getInvoice({ request, response }) {
    // console.log(auth.user.id)

    const query = await Subcription.findOrFail(
      request.input("subscription_id")
    );
    const user = await Visitor.findOrFail(query.user_id);
    var body = request.only(["type", "id", "data"]);
    let data = await generatePdf(body, user);
    return response.send(data);
  }

  async sendInvoice(id, transaction, user, type, basicplan) {
    let transaction_id = "";
    let transaction_amount = 0.0;
    if (transaction && transaction.id) {
      transaction_id = transaction.id;
      transaction_amount = transaction.transaction_amount;
    }
    const query = await Invoice.create({
      subscription_purchase_id: id,
      transaction_id: transaction_id,
      invoice_no: await getSerialCode(EU_SERIAL_CODE.INVOICE),
      invoice_date: new Date(),
      invoice_amount: transaction_amount,
      type: type,
      created_by: 0,
      created_at: new Date(),
    });

    let ispurchase = type == 1 ? 1 : 0;

    if (basicplan != 1)
      sendMail({ type: "EUINVOICE", id: query.id, purchase: ispurchase }, user);

    return id;
  }

  /**
   * Update subcription details.
   * PUT or PATCH subcriptions/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response, auth }) {
    const query = await Subcription.findOrFail(params.id);

    query.plan_id = request.input("plan_id");
    query.subscription_start_date = request.input("subscription_start_date");
    query.subscription_end_date = request.input("subscription_end_date");
    query.is_active = request.input("is_active");
    query.payment_transaction_id = request.input("payment_transaction_id");
    //query.user_id = request.input('user_id')
    query.updated_by = auth.user.id;

    await query.save();

    return response.status(200).send({ message: "Updated successfully" });
  }

  /**
   * Delete a subcription with id.
   * DELETE subcriptions/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response }) {
    const query = await Subcription.findOrFail(params.id);
    try {
      await query.delete();
      return response.status(200).send({ message: "Delete successfully" });
    } catch (error) {
      return response.status(423).send({
        message: "Something went wrong",
      });
    }
  }

  /**
   * Show a list of all subcriptions history.
   * GET subcription history
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async history({ request, response, view, auth }) {
    const query = Subcription.query();
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });

    query.with("plans", (builder) => {
      builder.select(
        "id",
        "plan_name",
        "plan_duration",
        "is_active",
        "plan_category"
      );
    });
    query.with("transactions", (builder) => {
      builder.select(
        "id",
        "transaction_code",
        "transaction_status",
        "payment_transaction_id"
      );
    });
    query.with("invoices", (builder) => {
      builder.select("id", "subscription_purchase_id", "type").where("type", 1);
    });

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    if (search) {
      query.where(searchQuery.search(searchInFields));
    }

    query.where("user_id", auth.user.id);

    var visitornamefilter = "";
    var plannamefilter = "";

    if (request.input("filters")) {
      const filters = JSON.parse(request.input("filters"));

      filters.forEach((filter) => {
        switch (filter.name) {
          case "users.name":
            visitornamefilter = filter.value;
            break;
          case "plans.plan_name":
            plannamefilter = filter.value;
            break;
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

    if (visitornamefilter.length > 0) {
      const visitorids = await Visitor.query()
        .whereRaw(`name LIKE '%${visitornamefilter}%'`)
        .pluck("id");
      if (visitorids.length > 0) query.whereRaw("user_id in (?)", [visitorids]);
    }

    if (plannamefilter.length > 0) {
      const planids = await MarketPlan.query()
        .whereRaw(`plan_name LIKE '%${plannamefilter}%'`)
        .pluck("id");
      if (planids.length > 0) query.whereRaw("plan_id in (?)", [planids]);
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
   * Show a list of all subcriptions history.
   * GET subcription history
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async getActiveSubscription({ request, response, view, auth }) {
    const query = Subcription.query();
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });

    query.with("users");
    query.with("plans");
    query.with("transactions");

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    if (search) {
      query.where(searchQuery.search(searchInFields));
    }

    query.where("user_id", auth.user.id);
    query.where("is_active", true);

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
    const query = Subcription.query();
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });

    query.with("users");
    query.with("plans");
    query.with("transactions");
    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    if (search) {
      query.where(searchQuery.search(searchInFields));
    }

    var visitornamefilter = "";
    var plannamefilter = "";

    if (request.input("filters")) {
      const filters = JSON.parse(request.input("filters"));

      filters.forEach((filter) => {
        switch (filter.name) {
          case "users.name":
            visitornamefilter = filter.value;
            break;
          case "plans.plan_name":
            plannamefilter = filter.value;
            break;
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

    if (visitornamefilter.length > 0) {
      const visitorids = await Visitor.query()
        .whereRaw(`name LIKE '%${visitornamefilter}%'`)
        .pluck("id");
      if (visitorids.length > 0) query.whereRaw("user_id in (?)", [visitorids]);
    }

    if (plannamefilter.length > 0) {
      const planids = await MarketPlan.query()
        .whereRaw(`plan_name LIKE '%${plannamefilter}%'`)
        .pluck("id");
      if (planids.length > 0) query.whereRaw("plan_id in (?)", [planids]);
    }

    if (request.input("start_date") && request.input("end_date")) {
      query.whereRaw(`DATE(created_at) >= '${request.input("start_date")}'`);
      query.whereRaw(`DATE(created_at) <= '${request.input("end_date")}'`);
    }

    var result = await query.fetch();

    const fileName =
      "visitor-subscription-" + moment().format("yyyy-MM-DD") + ".xlsx";
    let workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet("Visitor Subscription List");
    let font = { name: "Arial", size: 12 };

    const data = await result.toJSON();
    let exportData = [];
    let index = 1;

    if (data) {
      data.forEach((element) => {
        let txn_id = "NA";
        if (
          element.transactions &&
          element.transactions.payment_transaction_id
        ) {
          txn_id = element.transactions.payment_transaction_id;
        }

        let sub_code = "NA";
        if (element.subcription_code) {
          sub_code = element.subcription_code;
        }

        let txn_amount = "0.0";
        if (element.transactions && element.transactions.transaction_amount) {
          txn_amount = element.transactions.transaction_amount;
        }

        exportData.push({
          sno: index++,
          planname: element.plans.plan_name,
          subscribed_by: element.users.name,
          transaction_id: txn_id,
          subcription_code: sub_code,
          subscription_start_date: element.subscription_start_date,
          subscription_end_date: element.subscription_end_date,
          subscribed_price: txn_amount,
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
        header: "Subscribed By",
        key: "subscribed_by",
        width: 40,
        style: { font: font },
      },
      {
        header: "Transaction ID",
        key: "transaction_id",
        width: 30,
        style: { font: font },
      },
      {
        header: "Subscription Code",
        key: "subscribed_code",
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
        header: "Subscription Amount in USD",
        key: "subscribed_price",
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

  async approveSubscription({ params, request, response, auth }) {
    try {
      const vController = new VisitorController();
      const query = await Subcription.findOrFail(params.id);

      //Make existing subscription inactive first
      const subquery = Subcription.query();
      subquery.whereRaw(`user_id = (?) AND is_active=(?)`, [query.user_id, 1]);
      const result = await subquery.first();

      if (result && result.id > 0) {
        var old_sub_end_date = moment(result.subscription_end_date);
        var cur_sub_end_date = moment(query.subscription_end_date);
        if (cur_sub_end_date > old_sub_end_date) {
          result.subscription_end_date =
            moment(query.subscription_end_date)
              .subtract(1, "days")
              .format("yyyy-MM-DD") + " 23:59:59.000";
        }

        result.is_active = 0;
        await result.save();

        query.status = "Approved";
        query.remarks = "Subscription Approved";
        query.is_active = 1;
        query.updated_by = auth.user.id;
        await query.save();

        vController.sendClientSubscriptionMail(
          query.user_id,
          "Subscription Approved",
          "Your Subscription has been Approved"
        );

        return response.status(200).send({ message: "Updated successfully" });
      } else {
        return response.status(423).send({
          message: "Active subscription not found!",
        });
      }
    } catch (error) {
      console.log(error);
      return response.status(423).send({
        message: "Something went wrong",
      });
    }
  }

  async rejectSubscription({ params, request, response, auth }) {
    try {
      const vController = new VisitorController();
      const EuMarketPlanControllerFun = new EuMarketPlanController();
      let planPayload = {};
      let reason = request.body.reason;
      const query = await Subcription.findOrFail(params.id);

      planPayload["reason"] = reason;
      const planStatus =
        await EuMarketPlanControllerFun.cancelSubscriptionInPaypal(
          query.paypal_subscription_id,
          planPayload
        );

      if (planStatus == 204) {
        query.status = "Rejected";
        query.remarks = reason;
        query.is_active = false;
        query.updated_by = auth.user.id;
        await query.save();
        vController.sendClientSubscriptionMail(
          request.body.user_id,
          "Subscription Rejected",
          "Your Subscription has been rejected"
        );
      }

      return response.status(200).send({ message: "Updated successfully" });
    } catch (error) {
      return response.status(423).send({ message: "Something went wrong" });
    }
  }

  async pendingSubscriptions({ request, response, view }) {
    try {
      const query = Subcription.query();
      const search = request.input("search");
      const orderBy = request.input("orderBy");
      const orderDirection = request.input("orderDirection");
      const searchQuery = new Query(request, { order: "id" });

      query.with("users");
      query.with("plans");
      query.with("transactions");
      query.with("invoices", (builder) => {
        builder.select("id", "subscription_purchase_id");
      });

      query.leftJoin(
        "itmap_eu_market_plans as plans",
        "itmap_eu_subcriptions.plan_id",
        "plans.id"
      );
      query.leftJoin(
        "visitors as users",
        "itmap_eu_subcriptions.user_id",
        "users.id"
      );

      query.select("itmap_eu_subcriptions.*");

      if (orderBy && orderDirection) {
        query.orderBy(`${orderBy}`, orderDirection);
      }

      if (search) {
        query.where(searchQuery.search(searchInFields));
      }

      var visitornamefilter = "";
      var plannamefilter = "";

      if (request.input("filters")) {
        const filters = JSON.parse(request.input("filters"));

        filters.forEach((filter) => {
          switch (filter.name) {
            // case "users.name":
            //   visitornamefilter = filter.value;
            //   break;
            case "plans.plan_name":
              plannamefilter = filter.value;
              break;
            case "plans.plan_category":
              query.whereIn("plan_category", filter.value);
              break;
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

      if (visitornamefilter.length > 0) {
        const visitorids = await Visitor.query()
          .whereRaw(`name LIKE '%${visitornamefilter}%'`)
          .pluck("id");
        if (visitorids.length > 0)
          query.whereRaw("user_id in (?)", [visitorids]);
      }

      if (plannamefilter.length > 0) {
        const planids = await MarketPlan.query()
          .whereRaw(`plan_name LIKE '%${plannamefilter}%'`)
          .pluck("id");
        if (planids.length > 0) query.whereRaw("plan_id in (?)", [planids]);
      }

      if (request.input("start_date") && request.input("end_date")) {
        query.whereRaw(`DATE(created_at) >= '${request.input("start_date")}'`);
        query.whereRaw(`DATE(created_at) <= '${request.input("end_date")}'`);
      }

      query.whereRaw(`status = 'Pending' AND plan_id > 1`);

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
    } catch (error) {
      return response.status(423).send({ message: "Something went wrong" });
    }
  }
}

module.exports = ItmapEuSubcriptionController;
