"use strict";

const { getSerialCode } = require("../../Helper/serialNo");
const { SERIAL_CODE } = require("../../Helper/constants");

const Investor = use("App/Models/Investor");
const Subcription = use("App/Models/Subcription");
const MarketPlan = use("App/Models/MarketPlan");
const ModuleSubcription = use("App/Models/ModuleSubscription");
const { getInvoiceBuffer } = require("../../Helper/pdfGenerator");
const { generatePdf } = require("../../Helper/pdfGenerator");
const RegionSubscription = use(
  "App/Models/Admin/PartnerModule/RegionsSubscription"
);
const CountrySubscription = use(
  "App/Models/Admin/PartnerModule/CountriesSubscription"
);
const Query = use("Query");
const moment = require("moment");
const Excel = require("exceljs");
const Mail = use("Mail");
const { sendMail } = require("../../Helper/pdfGenerator");
const subscriptionService = require("../../services/subscription.service");
const TransactionHistory = use("App/Models/TransactionHistory");
const Invoice = use("App/Models/Invoice");
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with subcriptions
 */

const requestOnly = [
  "user_id",
  "plan_id",
  "is_auto_renewal",
  "subscription_start_date",
  "subscription_end_date",
  "is_active",
  "transaction_id",
];

const searchInFields = ["id", "user_id", "plan_id", "is_auto_renewal"];

class SubcriptionController {
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
    query.with("invoices", (builder) => {
      builder.select("id", "subscription_id");
    });
    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    if (search) {
      query.where(searchQuery.search(searchInFields));
    }

    var investorfiltername = "";
    var planfiltername = "";
    var planfilterduration = "";

    if (request.input("filters")) {
      const filters = JSON.parse(request.input("filters"));
      filters.forEach((filter) => {
        switch (filter.name) {
          case "users.name":
            investorfiltername = filter.value;
            break;
          case "plans.plan_name":
            planfiltername = filter.value;
            break;
          case "plans.plan_duration":
            planfilterduration = filter.value;
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

    if (investorfiltername.length > 0) {
      const investorids = await Investor.query()
        .whereRaw(`name LIKE '%${investorfiltername}%'`)
        .pluck("id");
      if (investorids.length > 0)
        query.whereRaw("user_id in (?)", [investorids]);
    }

    if (planfiltername.length > 0) {
      const planids = await MarketPlan.query()
        .whereRaw(`plan_name LIKE '%${planfiltername}%'`)
        .pluck("id");
      if (planids.length > 0) query.whereRaw("plan_id in (?)", [planids]);
    }
    if (planfilterduration.length > 0) {
      const planids = await MarketPlan.query()
        .whereRaw(`plan_duration LIKE '%${planfilterduration}%'`)
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
  async create({ request, response, view }) {
    try {
      var body = request.only(requestOnly);
      const query = await Subcription.create({
        ...body,
        subcription_code: await getSerialCode(SERIAL_CODE.SUBSCRIPTION),
        created_type: 1,
      });
      const transactionHistoryQuery = new TransactionHistory();
      let transaction_status = "COMPLETED";

      const investor = await Investor.findOrFail(body.user_id);

      if (request.input("transaction")) {
        let transaction = JSON.parse(request.input("transaction"));
        let transcation_details = JSON.parse(transaction.transcation_details);

        if (transaction.payment_transcation_id != transcation_details.id)
          query.paypal_subscription_id = transcation_details.id;

        transactionHistoryQuery.payment_transaction_id =
          transaction.payment_transcation_id;
        transactionHistoryQuery.transaction_status = transaction_status;
        transaction_status = transaction.transcation_status;
        transactionHistoryQuery.transaction_amount =
          transaction.transcation_amount;
        transactionHistoryQuery.transaction_details =
          transaction.transcation_details;
        transactionHistoryQuery.transaction_date = transaction.transcation_date;
        transactionHistoryQuery.user_id = investor.id;
        transactionHistoryQuery.transaction_code = await getSerialCode(
          SERIAL_CODE.TRANSACTION
        );
        await transactionHistoryQuery.save();
        query.transaction_id = transactionHistoryQuery.id;
      }
      if (transaction_status == "COMPLETED") {
        await query.modules().detach();
        await query.modules().attach(JSON.parse(request.input("modules")));

        await query.countries().detach();
        await query.countries().attach(JSON.parse(request.input("countries")));

        await query.regions().detach();
        await query
          .regions()
          .attach(JSON.parse(request.input("country_groups")));

        await query.save();
        if (investor)
          await this.sendInvoice(query, transactionHistoryQuery, investor);
        return response
          .status(200)
          .send({ message: "Create successfully", result: query });
      } else {
        return response
          .status(200)
          .send({ message: "PayPal Transaction failed" });
      }
    } catch (error) {
      console.log(error);
      return response.status(423).send({
        message: "Something went wrong",
      });
    }
  }

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
      const query = await Subcription.create({
        ...body,
        subcription_code: await getSerialCode(SERIAL_CODE.SUBSCRIPTION),
        is_active: true,
        created_type: request.input("is_admin") ? 1 : 2,
      });
      const transactionHistoryQuery = new TransactionHistory();
      let transaction_status = "COMPLETED";
      let visitor = null;
      let is_admin = request.input("is_admin") == 1;
      if (is_admin) {
        visitor = await Investor.findOrFail(request.input("user_id"));
      } else {
        visitor = await auth.authenticator("investorAuth").getUser();
      }

      if (request.input("transaction")) {
        let transaction = JSON.parse(request.input("transaction"));
        let transcation_details = is_admin
          ? transaction
          : JSON.parse(transaction.transcation_details);

        if (transaction.payment_transcation_id != transcation_details.id)
          query.paypal_subscription_id = transcation_details.id;

        transactionHistoryQuery.payment_transaction_id =
          transaction.payment_transcation_id;
        transactionHistoryQuery.transaction_status =
          transaction.transcation_status;
        transaction_status = transaction.transcation_status;
        transactionHistoryQuery.transaction_amount =
          transaction.transcation_amount;
        transactionHistoryQuery.transaction_details =
          transaction.transcation_details;
        transactionHistoryQuery.transaction_date = transaction.transcation_date;
        transactionHistoryQuery.user_id = visitor.id;
        transactionHistoryQuery.transaction_code = await getSerialCode(
          SERIAL_CODE.TRANSACTION
        );
        await transactionHistoryQuery.save();
        query.transaction_id = transactionHistoryQuery.id;
      }
      if (transaction_status == "COMPLETED" || is_admin) {
        await query.modules().detach();
        await query.modules().attach(JSON.parse(request.input("modules")));

        await query.countries().detach();
        await query.countries().attach(JSON.parse(request.input("countries")));

        await query.regions().detach();
        await query
          .regions()
          .attach(JSON.parse(request.input("country_groups")));

        await query.save();
        let invoice = {};
        if (visitor)
          invoice = await this.sendInvoice(
            query,
            transactionHistoryQuery,
            visitor
          );

        let attachment = await getInvoiceBuffer(
          { type: "INVOICE", id: invoice.id },
          visitor
        );
        this.sendAdminSubscriptionMail(
          visitor,
          transactionHistoryQuery,
          query,
          attachment
        );

        return response
          .status(200)
          .send({ message: "Create successfully", result: query, invoice });
      } else {
        return response
          .status(200)
          .send({ message: "PayPal Transaction failed" });
      }
    } catch (error) {
      console.log(error);
      return response.status(423).send({
        message: "Something went wrong",
      });
    }
  }

  async sendAdminSubscriptionMail(
    visitor,
    transaction,
    subscription,
    attachment
  ) {
    const subject = "New Investor/Company User Subscription";
    const details =
      "Below Investor/Company User has subscribed for MI Portal :";
    const fileName = "Invoice Receipt";
    const plan_name = await MarketPlan.query()
      .where("id", subscription.plan_id)
      .pluck("plan_name");

    let txn = transaction.toJSON();
    let sub = subscription.toJSON();
    let transaction_amount = "0.0";

    let transaction_status = "Complete";

    if (txn) {
      transaction_amount = txn.transaction_amount;
      transaction_status = txn.transaction_status;
    }

    await Mail.send(
      "miSubscriptionAdminMail",
      {
        title: subject,
        details: details,
        planname: plan_name,
        subscription: sub,
        visitor: visitor,
        transaction_amount: transaction_amount,
        transaction_status: transaction_status,
      },
      (message) => {
        message.subject(subject);
        message.from(Env.get("MAIL_USERNAME"));
        message.attachData(new Buffer(attachment), `${fileName}.pdf`);
        message.to(Env.get("TO_MAIL_USERNAME"));
      }
    );
  }

  async getAdminInvoice({ request, response }) {
    // console.log(auth.user.id)

    const query = await Subcription.findOrFail(
      request.input("subscription_id")
    );
    const user = await Investor.findOrFail(query.user_id);
    var body = request.only(["type", "id", "data"]);
    let data = await generatePdf(body, user);
    return response.send(data);
  }

  async sendInvoice(subscription, transaction, user) {
    const query = await Invoice.create({
      subscription_id: subscription.id,
      transaction_id: transaction.id,
      invoice_no: await getSerialCode(SERIAL_CODE.INVOICE),
      invoice_date: new Date(),
      invoice_amount: transaction.transaction_amount,
      created_by: user.id,
      created_at: new Date(),
    });

    sendMail({ type: "INVOICE", id: query.id, purchase: false }, user);
    return query;
  }

  async store_transaction({ request, response, auth }) {
    const visitor = await auth.authenticator("investorAuth").getUser();
    const transactionHistoryQuery = new TransactionHistory();
    transactionHistoryQuery.payment_transaction_id = request.input(
      "payment_transaction_id"
    );
    transactionHistoryQuery.transaction_status = request.input("status");
    transactionHistoryQuery.transaction_amount =
      request.input("transaction_amount");
    transactionHistoryQuery.transaction_date = new Date();
    transactionHistoryQuery.user_id = visitor.id;
    transactionHistoryQuery.transaction_code = await getSerialCode(
      SERIAL_CODE.TRANSACTION
    );
    await transactionHistoryQuery.save();

    return response.status(200).send({ message: "Create successfully" });
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
    query.with("modules");
    query.with("countries");
    query.with("regions");

    var result = await query.fetch();
    return response.status(200).send(result);
    /*
    const modulesIds = await result.modules().ids();
    result.modules = modulesIds;

    const countriesIds = await result.countries().ids();
    result.countries = countriesIds;

    const regionsIds = await result.regions().ids();
    result.country_groups = regionsIds;

    return response.status(200).send(result);*/
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

  /**
   * Update subcription details.
   * PUT or PATCH subcriptions/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response }) {
    const query = await Subcription.findOrFail(params.id);

    query.plan_id = request.input("plan_id");
    // query.is_auto_renewal = request.input('is_auto_renewal')
    query.subscription_start_date = request.input("subscription_start_date");
    query.subscription_end_date = request.input("subscription_end_date");
    // query.is_active = request.input('is_active')
    query.user_id = request.input("user_id");
    query.udated_type = request.input("is_admin") ? 1 : 2;
    await query.modules().detach();
    await query.modules().attach(JSON.parse(request.input("modules")));

    await query.countries().detach();
    await query.countries().attach(JSON.parse(request.input("countries")));

    await query.regions().detach();
    await query.regions().attach(JSON.parse(request.input("country_groups")));

    await query.save();

    return response.status(200).send({ message: "Update successfully" });
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

    var investorfiltername = "";
    var planfiltername = "";

    if (request.input("filters")) {
      const filters = JSON.parse(request.input("filters"));
      filters.forEach((filter) => {
        switch (filter.name) {
          case "users.name":
            investorfiltername = filter.value;
            break;
          case "plans.plan_name":
            planfiltername = filter.value;
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

    if (investorfiltername.length > 0) {
      const investorids = await Investor.query()
        .whereRaw(`name LIKE '%${investorfiltername}%'`)
        .pluck("id");
      if (investorids.length > 0)
        query.whereRaw("user_id in (?)", [investorids]);
    }

    if (planfiltername.length > 0) {
      const planids = await MarketPlan.query()
        .whereRaw(`plan_name LIKE '%${planfiltername}%'`)
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
  async isExistMISubscription({ request, response, view, auth }) {
    var isExist = false;
    var resl;
    var res = "No Existing Subscription";
    const segmentID = request.input("segmentid");
    const planID = request.input("planid");
    const query = Subcription.query();

    query.with("plans");
    query.where("user_id", auth.user.id);
    query.where("plan_id", planID);
    query.where("is_active", 1);

    const subids = await query.pluck("id");

    const marketPlanquery = MarketPlan.query();

    marketPlanquery.where("segment_id", segmentID);

    const planIds = await marketPlanquery.pluck("id");

    if (planIds && planIds.length) {
      planIds.forEach((mplanid) => {
        if (planID == mplanid) {
          isExist = true;
        }
      });
    }

    if (isExist) {
      //if segment is Buyer Insight, check markets
      if (
        segmentID == 2 ||
        segmentID == 3 ||
        segmentID == 4 ||
        segmentID == 5
      ) {
        if (request.input("modules")) {
          const moduleids = request.input("modules"); //JSON.parse(request.input("modules"));

          const modulequery = ModuleSubcription.query();

          modulequery.whereRaw(`subcription_id in (?) AND module_id in (?)`, [
            subids,
            moduleids,
          ]);
          const modulesexist = await modulequery.fetch();

          if (modulesexist.toJSON().length > 0) {
            isExist = true;
          } else {
            isExist = false;
          }
        }

        if (request.input("countries") && isExist) {
          const countryids = request.input("countries");
          const countryquery = CountrySubscription.query();

          countryquery.whereRaw(`subcription_id in (?) AND country_id in (?)`, [
            subids,
            countryids,
          ]);
          const countryexist = await countryquery.fetch();
          if (countryexist.toJSON().length > 0) {
            isExist = true;
          } else {
            isExist = false;
          }
        }

        if (request.input("country_groups") && isExist) {
          const countrygroupids = request.input("country_groups");
          const regionquery = RegionSubscription.query();

          regionquery.whereRaw(
            `subcription_id in (?) AND country_group_id in (?)`,
            [subids, countrygroupids]
          );
          const regionexist = await regionquery.fetch();
          if (regionexist.toJSON().length > 0) {
            isExist = true;
          } else {
            isExist = false;
          }
        }
      } else {
        isValid = false;
      }
    }

    if (isExist) {
      res = "Existing Subscriptions";
    } else {
      res = "No Existing Subscription";
    }

    return response
      .status(200)
      .send({ message: res, data: { result: isExist } });
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

    var investorfiltername = "";
    var planfiltername = "";

    if (request.input("filters")) {
      const filters = JSON.parse(request.input("filters"));
      filters.forEach((filter) => {
        switch (filter.name) {
          case "users.name":
            investorfiltername = filter.value;
            break;
          case "plans.plan_name":
            planfiltername = filter.value;
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

    if (investorfiltername.length > 0) {
      const investorids = await Investor.query()
        .whereRaw(`name LIKE '%${investorfiltername}%'`)
        .pluck("id");
      if (investorids.length > 0)
        query.whereRaw("user_id in (?)", [investorids]);
    }

    if (planfiltername.length > 0) {
      const planids = await MarketPlan.query()
        .whereRaw(`plan_name LIKE '%${planfiltername}%'`)
        .pluck("id");
      if (planids.length > 0) query.whereRaw("plan_id in (?)", [planids]);
    }

    if (request.input("start_date") && request.input("end_date")) {
      query.whereRaw(`DATE(created_at) >= '${request.input("start_date")}'`);
      query.whereRaw(`DATE(created_at) <= '${request.input("end_date")}'`);
    }

    var result = await query.fetch();

    const fileName =
      "investor-subscription-" + moment().format("yyyy-MM-DD") + ".xlsx";
    let workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet("Investor Subscription List");
    let font = { name: "Arial", size: 12 };

    const data = await result.toJSON();
    let exportData = [];
    let index = 1;

    if (data) {
      data.forEach((element) => {
        let txn_id = "NA";

        let txn_amount = "0.0";
        if (element.transactions) {
          if (element.transactions.payment_transaction_id) {
            txn_id = element.transactions.payment_transaction_id;
          }

          if (element.transactions.transaction_amount) {
            txn_amount = element.transactions.transaction_amount;
          }
        }

        exportData.push({
          sno: index++,
          invoice: element.subscription_code,
          planname: element.plans.plan_name,
          subscribed_by: element.users.name,
          transaction_id: txn_id,
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
        header: "Subscription Code",
        key: "invoice",
        width: 30,
        style: { font: font },
      },
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

  async cancel({ request, response, auth }) {
    const visitor = await auth.authenticator("investorAuth").getUser();
    let body = request.only(["id", "reason"]);
    let data = await subscriptionService.cancelSubscription(body, visitor);
    return response.status(200).send(data);
  }
}

module.exports = SubcriptionController;
