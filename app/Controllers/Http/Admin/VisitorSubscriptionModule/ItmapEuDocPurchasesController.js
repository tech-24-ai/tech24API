"use strict";

const Purchase = use(
  "App/Models/Admin/VisitorSubscriptionModule/ItmapEuDocPurchase"
);
const axios = use("axios");
const Mail = use("Mail");
const Env = use("Env");
const Visitor = use("App/Models/Admin/VisitorModule/Visitor");
const Document = use("App/Models/Admin/DocumentModule/Document");
const { generatePdf } = require("../../../../Helper/pdfGenerator");
const { sendMail } = require("../../../../Helper/pdfGenerator");
const { getInvoiceBuffer } = require("../../../../Helper/pdfGenerator");
const { getSerialCode } = require("../../../../Helper/serialNo");
const { EU_SERIAL_CODE } = require("../../../../Helper/constants");
const Invoice = use("App/Models/Admin/VisitorSubscriptionModule/Euinvoice");
const { dateFilterExtractor } = require("../../../../Helper/globalFunctions");

const Query = use("Query");
const moment = require("moment");
const Excel = require("exceljs");

const transactionHistory = use(
  "App/Models/Admin/VisitorSubscriptionModule/ItmapEuTransactionHistory"
);

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with purchases
 */

const requestOnly = [
  "user_id",
  "purchase_date",
  "document_id",
  "payment_transaction_id",
];

// const searchInFields = [
//   "itmap_eu_doc_purchases.id",
//   "user_id",
//   "document_id",
// ];
const searchInFields = [
  "users.name",
  "documents.name",
  "transactions.transaction_code",
  "document_price",
];

class ItmapEuDocPurchasesController {
  /**
   * Show a list of all purchases.
   * GET purchases
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index({ request, response, view }) {
    const query = Purchase.query();
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });

    query.with("transactions");
    query.with("users", (builder) => {
      builder.select("id", "name", "register_from"); //  select columns / pass array of columns
    });
    query.with("documents", (builder) => {
      builder.select("id", "name", "subscription_category"); //  select columns / pass array of columns
    });
    query.with("invoices", (builder) => {
      builder.select("id", "subscription_purchase_id", "type").where("type", 2);
    });

    query.leftJoin(
      "documents",
      "itmap_eu_doc_purchases.document_id",
      "documents.id"
    );
    query.leftJoin(
      "itmap_eu_transaction_histories as transactions",
      "itmap_eu_doc_purchases.payment_transaction_id",
      "transactions.id"
    );
    query.leftJoin(
      "visitors as users",
      "itmap_eu_doc_purchases.user_id",
      "users.id"
    );

    query.select("itmap_eu_doc_purchases.*");

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    if (search) {
      query.where(searchQuery.search(searchInFields));
    }

    var visitornamefilter = "";

    if (request.input("filters")) {
      const filters = JSON.parse(request.input("filters"));
      filters.forEach(async (filter) => {
        switch (filter.name) {
          // case "users.name":
          //   visitornamefilter = filter.value;
          //   break;
          case "created_at":
            query.whereRaw(
              await dateFilterExtractor({
                name: `itmap_eu_doc_purchases.created_at`,
                date: filter.value,
              })
            );
            // query.whereRaw(
            //   typeof filter.value == "object"
            //     ? `DATE(${filter.name}) between '${filter.value.startDate}' and '${filter.value.endDate}'`
            //     : `DATE(${filter.name}) = '${moment(filter.value).format(
            //         "YYYY-MM-DD"
            //       )}'`
            // );
            break;
          case "updated_at":
            query.whereRaw(
              await dateFilterExtractor({
                name: `itmap_eu_doc_purchases.created_at`,
                date: filter.value,
              })
            );
            // query.whereRaw(
            //   typeof filter.value == "object"
            //     ? `DATE(${filter.name}) between '${filter.value.startDate}' and '${filter.value.endDate}'`
            //     : `DATE(${filter.name}) = '${moment(filter.value).format(
            //         "YYYY-MM-DD"
            //       )}'`
            // );
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
   * Render a form to be used for creating a new purchase.
   * GET purchases/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create({ request, response, view }) {
    var body = request.only(requestOnly);
    const query = await Purchase.create(body);

    await query.save();

    return response.status(200).send({ message: "Created successfully" });
  }

  /**
   * Create/save a new purchase.
   * POST purchases
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response, auth }) {
    try {
      var body = request.only(requestOnly);

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
          transaction.transaction_details;
        transactionHistoryQuery.transaction_date = transaction.transaction_date;
        transactionHistoryQuery.payment_type = transaction.type;
        transactionHistoryQuery.created_by = auth.user.id;
        transactionHistoryQuery.user_id = body.user_id;

        //console.log(transactionHistoryQuery);
        await transactionHistoryQuery.save();
        body.document_price = transaction.transaction_amount;
        body.payment_transaction_id = transactionHistoryQuery.id;
      }

      body.created_by = auth.user.id;

      const query = await Purchase.create(body);

      await query.save();
      const visitor = await Visitor.findOrFail(body.user_id);
      let invoiceid = await this.sendInvoice(
        query.id,
        transactionHistoryQuery,
        visitor,
        2,
        0
      );

      let attachment = getInvoiceBuffer(
        { type: "EUINVOICE", id: invoiceid },
        visitor
      );
      this.sendAdminPurchaseMail(
        visitor,
        transactionHistoryQuery,
        query,
        attachment
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
   * Display a single purchase.
   * GET purchases/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params, request, response, view }) {
    const result = await Purchase.query()
      .where("id", params.id)
      .with("transactions")
      .with("users", (builder) => {
        builder.select("id", "name", "register_from"); //  select columns / pass array of columns
      })
      .with("documents", (builder) => {
        builder.select(
          "id",
          "name",
          "subscription_category",
          "document_category"
        ); //  select columns / pass array of columns
      })
      .fetch();

    if (result) {
      return response.status(200).send(result);
    } else {
      return response.status(423).send("Data not found");
    }
  }

  /**
   * Render a form to update an existing Purchase.
   * GET Purchase/:id/edit
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async edit({ params, request, response, view }) {}

  async getInvoice({ request, response }) {
    // console.log(auth.user.id)

    const query = await Purchase.findOrFail(request.input("purchase_id"));
    const user = await Visitor.findOrFail(query.user_id);
    var body = request.only(["type", "id", "data"]);
    let data = await generatePdf(body, user);
    return response.send(data);
  }

  /**
   * Update purchase details.
   * PUT or PATCH purchases/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response, auth }) {}

  /**
   * Delete a purchase with id.
   * DELETE purchases/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response }) {
    const query = await Purchase.findOrFail(params.id);
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
   * Show a list of all purchases history.
   * GET purchase history
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async history({ request, response, view, auth }) {
    const query = Purchase.query();
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });

    query.with("transactions", (builder) => {
      builder.select(
        "id",
        "transaction_code",
        "transaction_status",
        "payment_transaction_id"
      );
    });
    query.with("invoices", (builder) => {
      builder.select("id", "subscription_purchase_id", "type").where("type", 2);
    });
    query.with("documents", (builder) => {
      builder.select(
        "id",
        "name",
        "subscription_category",
        "document_type_id",
        "document_category"
      );
    });

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    if (search) {
      query.where(searchQuery.search(searchInFields));
    }

    //console.log(auth.user);

    query.where("user_id", auth.user.id);

    var visitornamefilter = "";

    if (request.input("filters")) {
      const filters = JSON.parse(request.input("filters"));
      filters.forEach((filter) => {
        switch (filter.name) {
          case "users.name":
            visitornamefilter = filter.value;
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

  async exportReport({ request, response, view }) {
    const query = Purchase.query();
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });

    query.with("transactions");
    query.with("users", (builder) => {
      builder.select("id", "name", "register_from"); //  select columns / pass array of columns
    });
    query.with("documents", (builder) => {
      builder.select("id", "name", "subscription_category"); //  select columns / pass array of columns
    });

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    if (search) {
      query.where(searchQuery.search(searchInFields));
    }

    var visitornamefilter = "";

    if (request.input("filters")) {
      const filters = JSON.parse(request.input("filters"));
      filters.forEach((filter) => {
        switch (filter.name) {
          case "users.name":
            visitornamefilter = filter.value;
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

    if (request.input("start_date") && request.input("end_date")) {
      query.whereRaw(`DATE(created_at) >= '${request.input("start_date")}'`);
      query.whereRaw(`DATE(created_at) <= '${request.input("end_date")}'`);
    }

    var result = await query.fetch();

    const fileName =
      "purchased-documents-" + moment().format("yyyy-MM-DD") + ".xlsx";
    let workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet("Purchased Document List");
    let font = { name: "Arial", size: 12 };

    const data = await result.toJSON();
    let exportData = [];
    let index = 1;

    if (data) {
      data.forEach((element) => {
        let subscategory = "Basic";

        if (element.documents.name == 2) {
          subscategory = "Advance";
        } else if (element.status == 3) {
          subscategory = "Premium";
        }

        exportData.push({
          sno: index++,
          docname: element.documents.name,
          subscategory: subscategory,
          purchased_by: element.users.name,
          transaction_id: element.transactions.payment_transaction_id,
          purchased_date: element.purchase_date,
          purchased_price: element.document_price,
          created: element.created_at,
          updated: element.updated_at,
        });
      });
    }

    let columns = [
      { header: "S. No.", key: "sno", width: 10, style: { font: font } },
      {
        header: "Document Name",
        key: "docname",
        width: 30,
        style: { font: font },
      },
      {
        header: "Subscription Category",
        key: "subscategory",
        width: 30,
        style: { font: font },
      },
      {
        header: "Purchased By",
        key: "purchased_by",
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
        header: "Purchased Date",
        key: "purchased_date",
        width: 30,
        style: { font: font },
      },
      {
        header: "Purchased Price in USD",
        key: "purchased_price",
        width: 30,
        style: { font: font },
      },
      { header: "Status", key: "status", width: 20, style: { font: font } },
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

module.exports = ItmapEuDocPurchasesController;
