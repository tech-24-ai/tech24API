"use strict";
const CreditPurchaseDetail = use(
  "App/Models/Admin/ConsultantModule/CreditPurchaseDetail"
);
const VisitorCreditHistory = use(
  "App/Models/Admin/ConsultantModule/VisitorCreditHistory"
);
const VisitorCreditRedeemHistory = use(
  "App/Models/Admin/ConsultantModule/VisitorCreditRedeemHistory"
);
const Database = use("Database");
const Query = use("Query");
const moment = require("moment");
const Excel = require("exceljs");
const { dateFilterExtractor } = require("../../../../Helper/globalFunctions");
const { getSerialCode } = require("../../../../Helper/serialNo");
const { EU_SERIAL_CODE } = require("../../../../Helper/constants");
const Invoice = use("App/Models/Admin/VisitorSubscriptionModule/Euinvoice");
const requestOnly = [
  "visitor_id",
  "amount_paid",
  "purchased_credit",
  "paypal_transcation_id",
  "purchase_date",
  "transaction_details",
  "type",
];


const searchInFields = ["purchased_credit", "type", "visitor.name", "amount_paid","created_at"];

class VisitorCreditController {
  async index({ request, response, view }) {
    const query = CreditPurchaseDetail.query();
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });
    query.with("visitor", (builder) => {
      builder.select("id", "name", "email", "profile_pic_url");
    });
    query.with("visitor", (builder) => {
      builder.select("id", "name");
    });

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    // if (search) {
    //   query.where(searchQuery.search(searchInFields));
    // }
  
    // if (search) {
    //   query.where(function () {
    //     this.whereRaw("LOWER(purchased_credit) LIKE ?", [`%${search.toLowerCase()}%`])
    //       .orWhereRaw("LOWER(type) LIKE ?", [`%${search.toLowerCase()}%`])
    //       .orWhereHas("visitor", (visitorQuery) => {
    //         visitorQuery.whereRaw("LOWER(name) LIKE ?", [`%${search.toLowerCase()}%`]);
    //       })
    //       .orWhereRaw("LOWER(amount_paid) LIKE ?", [`%${search.toLowerCase()}%`])
    //       .orWhereRaw("DATE_FORMAT(created_at, '%Y-%m-%d') LIKE ?", [`%${search.toLowerCase()}%`]);
    //   });
    // }
    if (search) {
      query.where((builder) =>
        builder
          .whereRaw("LOWER(purchased_credit) LIKE ?", [`%${search.toLowerCase()}%`])
          .orWhereRaw("LOWER(type) LIKE ?", [`%${search.toLowerCase()}%`])
          .orWhereHas("visitor", (visitorQuery) =>
            visitorQuery.whereRaw("LOWER(name) LIKE ?", [`%${search.toLowerCase()}%`])
          )
          .orWhereRaw("LOWER(amount_paid) LIKE ?", [`%${search.toLowerCase()}%`])
          .orWhereRaw("DATE_FORMAT(created_at, '%Y-%m-%d') LIKE ?", [`%${search.toLowerCase()}%`])
      );
    }
    if (request.input("filters")) {
      const filters = JSON.parse(request.input("filters"));
      filters.forEach(async (filter) => {
        switch (filter.name) {
          case "created_at":
            query.whereRaw(
              await dateFilterExtractor({
                name: "created_at",
                date: filter.value,
              })
            );
            break;
          case "updated_at":
            query.whereRaw(
              await dateFilterExtractor({
                name: "created_at",
                date: filter.value,
              })
            );
            break;
            case "visitor.name": {
              query
                .join(
                  "visitors",
                  "credit_purchase_details.visitor_id",
                  "=",
                  "visitors.id"
                )
                .where("visitors.name", "LIKE", `%${filter.value}%`);
              break;
            }

          default:
            query.whereRaw(`${filter.name} LIKE '%${filter.value}%'`);
            break;
        }
      });
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
    const trx = await Database.beginTransaction();
    const body = request.only(requestOnly);

    try {
      const query = await CreditPurchaseDetail.create(body, trx);
      const creditRedeem = await VisitorCreditRedeemHistory.create(
        {
          visitor_id: body.visitor_id,
          credit_booked: body.purchased_credit,
          type: "Credit",
        },
        trx
      );
      let visitorCredits = await VisitorCreditHistory.findBy(
        "visitor_id",
        body.visitor_id
      );

      if (visitorCredits) {
        creditRedeem.initial_credit_balance = visitorCredits.credit;
        visitorCredits.credit += Number(body.purchased_credit);
        creditRedeem.current_credit_balance = visitorCredits.credit;
        await visitorCredits.save(trx);
        await creditRedeem.save(trx);
      } else {
        visitorCredits = await VisitorCreditHistory.create(
          {
            visitor_id: body.visitor_id,
            credit: Number(body.purchased_credit),
          },
          trx
        );
        creditRedeem.initial_credit_balance = 0;
        creditRedeem.current_credit_balance = body.purchased_credit;
        await creditRedeem.save(trx);
      }

      // EU invoice
      const invoiceQuery = await Invoice.create(
        {
          credit_purchase_detail_id: query.id,
          invoice_no: await getSerialCode(EU_SERIAL_CODE.INVOICE),
          invoice_date: new Date(),
          invoice_amount: body.amount_paid,
          type: 4,
          created_by: 0,
          created_at: new Date(),
        },
        trx
      );

      console.log("invoiceQuery", invoiceQuery);

      await trx.commit();
      return response.status(200).json({ message: "Create successfully" });
    } catch (error) {
      await trx.rollback();
      return response
        .status(423)
        .json({ message: "Something went wrong", error });
    }
  }

  async show({ params, request, response, view }) {
    const query = CreditPurchaseDetail.query();
    query.where({ id: params.id });
    query.with("visitor", (builder) => {
      builder.select("id", "name", "email", "profile_pic_url");
    });
    const result = await query.firstOrFail();
    return response.json(result);
  }

  async edit({ params, request, response, view }) {}

  async destroy({ params, request, response }) {}

  async bindCreditData(data) {
    const creditPurchaseData = await CreditPurchaseDetail.query()
      .select("visitor_id")
      .groupBy("visitor_id")
      .sum("purchased_credit as purchased");

    const creditRedeemData = await VisitorCreditRedeemHistory.query()
      .select("visitor_id")
      .where("type", "Debit")
      .groupBy("visitor_id")
      .sum("credit_used as used");

    data &&
      data.map((d) => {
        const { visitor_id } = d;
        d.purchase = 0;
        d.used = 0;

        creditPurchaseData.map((credit) => {
          if (credit.visitor_id === visitor_id) {
            d.purchase = credit.purchased;
          }
        });
        creditRedeemData.map((credit) => {
          if (credit.visitor_id == visitor_id) {
            d.used = credit.used;
          }
        });
        return d;
      });
    // return data;
  }

  async creditHistory({ params, request, response }) {
    const query = VisitorCreditHistory.query();
    query.leftJoin("visitors", "visitors.id", "visitor_id");
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });

    query.select(
      "visitor_credit_histories.id",
      "visitor_id",
      "credit",
      "name",
      "email",
      "profile_pic_url"
    );
    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    if (search) {
      query.where(searchQuery.search(searchInFields));
    }

    if (request.input("filters")) {
      const filters = JSON.parse(request.input("filters"));
      filters.forEach(async (filter) => {
        switch (filter.name) {
          case "created_at":
            query.whereRaw(
              await dateFilterExtractor({
                name: "created_at",
                date: filter.value,
              })
            );
            break;
          case "updated_at":
            query.whereRaw(
              await dateFilterExtractor({
                name: "created_at",
                date: filter.value,
              })
            );
            break;
          default:
            query.whereRaw(`${filter.name} LIKE '%${filter.value}%'`);
            break;
        }
      });
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
      result = (await query.paginate(page, pageSize)).toJSON();

      await this.bindCreditData(result.data);
    } else {
      result = (await query.fetch()).toJSON();
      await this.bindCreditData(result);
    }

    return response.status(200).send(result);
  }

  async credit({ params, request, response, auth }) {
    const query = VisitorCreditHistory.query();
    query.where("visitor_id", auth.user.id);
    query.select("credit", "valid_till");
    const result = await query.fetch();
    return response.status(200).json(result);
  }
  async purchaseHistory({ params, request, response, auth }) {
    const query = CreditPurchaseDetail.query();
    query.where("visitor_id", auth.user.id);
    query.with("visitor", (builder) => {
      builder.select("id", "name", "email", "profile_pic_url");
    });
    query.with("invoices", (builder) => {
      builder.select(
        "id",
        "invoice_amount",
        "invoice_date",
        "invoice_no",
        "credit_purchase_detail_id",
        "type"
      );
    });
    query.orderBy("created_at", "desc");

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

    return response.json(result);
  }
  async redeemHistory({ params, request, response, auth }) {
    const query = VisitorCreditRedeemHistory.query();
    const type = request.input("type");
    query.where("visitor_id", auth.user.id);
    query.with("visitor", (builder) => {
      builder.select("id", "name", "email", "profile_pic_url");
    });
    query.with("booking_log", (builder) => {
      builder.select(
        "id",
        "start_time",
        "end_time",
        "total_duration",
        "total_billing",
        "meeting_transcript",
        "meeting_status"
      );
    });
    query.with("booking", (builder) => {
      builder.select(
        "id",
        "booking_date",
        "booking_utc_time",
        "duration",
        "amount_per_hour",
        "skill",
        "is_credit",
        "booking_status"
      );
    });
    query.orderBy("created_at", "desc");

    if (type) {
      query.where({ type });
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

    return response.json(result);
  }

  async visitorCreditPurchase({ request, response, auth }) {
    const trx = await Database.beginTransaction();
    const body = request.only([
      "amount_paid",
      "purchased_credit",
      "paypal_transcation_id",
      "purchase_date",
      "transaction_details",
      "type",
    ]);

    const userId = auth.user.id;

    try {
      const query = await CreditPurchaseDetail.create(
        { ...body, visitor_id: userId },
        trx
      );
      const creditRedeem = await VisitorCreditRedeemHistory.create(
        {
          visitor_id: userId,
          credit_booked: body.purchased_credit,
          type: "Credit",
        },
        trx
      );
      let visitorCredits = await VisitorCreditHistory.findBy(
        "visitor_id",
        userId
      );

      if (visitorCredits) {
        creditRedeem.initial_credit_balance = visitorCredits.credit;
        visitorCredits.credit += Number(body.purchased_credit);
        creditRedeem.current_credit_balance = visitorCredits.credit;
        await visitorCredits.save(trx);
        await creditRedeem.save(trx);
      } else {
        visitorCredits = await VisitorCreditHistory.create(
          {
            visitor_id: userId,
            credit: Number(body.purchased_credit),
          },
          trx
        );
        creditRedeem.initial_credit_balance = 0;
        creditRedeem.current_credit_balance = body.purchased_credit;
        await creditRedeem.save(trx);
      }

      // EU invoice
      const invoiceQuery = await Invoice.create(
        {
          credit_purchase_detail_id: query.id,
          invoice_no: await getSerialCode(EU_SERIAL_CODE.INVOICE),
          invoice_date: new Date(),
          invoice_amount: body.amount_paid,
          type: 4,
          created_by: 0,
          created_at: new Date(),
        },
        trx
      );

      console.log("invoiceQuery", invoiceQuery);

      await trx.commit();
      return response.status(200).json({ message: "Create successfully" });
    } catch (error) {
      await trx.rollback();
      console.log(error);
      return response
        .status(423)
        .json({ message: "Something went wrong", error });
    }
  }

  async exportReport({ params, request, response }) {
    const query = CreditPurchaseDetail.query();
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });
    query.with("visitor", (builder) => {
      builder.select("id", "name", "email", "profile_pic_url");
    });

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    if (search) {
      query.where(searchQuery.search(searchInFields));
    }

    if (request.input("filters")) {
      const filters = JSON.parse(request.input("filters"));
      filters.forEach(async (filter) => {
        switch (filter.name) {
          case "created_at":
            query.whereRaw(
              await dateFilterExtractor({
                name: "created_at",
                date: filter.value,
              })
            );
            break;
          case "updated_at":
            query.whereRaw(
              await dateFilterExtractor({
                name: "created_at",
                date: filter.value,
              })
            );
            break;
          default:
            query.whereRaw(`${filter.name} LIKE '%${filter.value}%'`);
            break;
        }
      });
    }

    const result = (await query.fetch()).toJSON();
    let exportData = [];
    let index = 1;

    const fileName =
      "credit purchase-" + moment().format("yyyy-MM-DD") + ".xlsx";
    let workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet("Credit Purchase List");
    let font = { name: "Arial", size: 12 };

    if (result) {
      result.forEach((element) => {
        exportData.push({
          sno: index++,
          name: element.visitor.name,
          amount_paid: element.amount_paid,
          purchased_credit: element.purchased_credit,
          paypal_transcation_id: element.paypal_transcation_id,
          purchase_date: element.purchase_date,
          transaction_details: element.transaction_details,
          type: element.type,
          created_at: element.created_at,
          updated_at: element.updated_at,
        });
      });
    }

    let columns = [
      { header: "Sr No.", key: "sno", width: 10, style: { font: font } },
      {
        header: "Visitor Name",
        key: "name",
        width: 30,
        style: { font: font },
      },

      {
        header: "Paid Amount",
        key: "amount_paid",
        width: 30,
        style: { font: font },
      },
      {
        header: "Purchased Credit",
        key: "purchased_credit",
        width: 30,
        style: { font: font },
      },
      {
        header: "Transaction Id",
        key: "paypal_transcation_id",
        width: 60,
        style: { font: font },
      },
      {
        header: "Purchased Date",
        key: "purchase_date",
        width: 30,
        style: { font: font },
      },

      {
        header: "Details",
        key: "transaction_details",
        width: 40,
        style: { font: font },
      },
      { header: "Type", key: "type", width: 20, style: { font: font } },
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

    worksheet.getColumn(7).alignment = { wrapText: true };
    worksheet.columns = columns;
    worksheet.addRows(exportData);

    // worksheet.getCell("B1", "C1").fill = {
    //   type: "pattern",
    //   pattern: "solid",
    //   fgColor: { argb: "cccccc" },
    // };

    response.header(
      `Content-Type`,
      `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
    );
    response.header(`Content-Disposition`, `attachment; filename="${fileName}`);
    return workbook.xlsx.writeBuffer(response);
  }
  async exportSummaryReport({ params, request, response }) {
    const query = VisitorCreditHistory.query();
    query.leftJoin("visitors", "visitors.id", "visitor_id");
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });

    query.select(
      "visitor_credit_histories.id",
      "visitor_id",
      "credit",
      "name",
      "email",
      "profile_pic_url"
    );
    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    if (search) {
      query.where(searchQuery.search(searchInFields));
    }

    if (request.input("filters")) {
      const filters = JSON.parse(request.input("filters"));
      filters.forEach(async (filter) => {
        switch (filter.name) {
          case "created_at":
            query.whereRaw(
              await dateFilterExtractor({
                name: "created_at",
                date: filter.value,
              })
            );
            break;
          case "updated_at":
            query.whereRaw(
              await dateFilterExtractor({
                name: "created_at",
                date: filter.value,
              })
            );
            break;
          default:
            query.whereRaw(`${filter.name} LIKE '%${filter.value}%'`);
            break;
        }
      });
    }

    const result = (await query.fetch()).toJSON();
    await this.bindCreditData(result);
    console.log("result", result);
    let exportData = [];
    let index = 1;

    const fileName =
      "visitor credit summary-" + moment().format("yyyy-MM-DD") + ".xlsx";
    let workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet("Credit Summary List");
    let font = { name: "Arial", size: 12 };

    if (result) {
      result.forEach((element) => {
        exportData.push({
          sno: index++,
          name: element.name,
          purchased_credit: element.purchase,
          used_credit: element.used,
          available_credits: element.credit,
        });
      });
    }
    // return response.send(exportData);
    let columns = [
      { header: "Sr No.", key: "sno", width: 10, style: { font: font } },
      {
        header: "Visitor Name",
        key: "name",
        width: 30,
        style: { font: font },
      },

      {
        header: "Purchased Credits",
        key: "purchased_credit",
        width: 30,
        style: { font: font },
      },

      {
        header: "Used Credits",
        key: "used_credit",
        width: 30,
        style: { font: font },
      },

      {
        header: "Available Credits",
        key: "available_credits",
        width: 30,
        style: { font: font },
      },
    ];

    worksheet.getColumn(1).alignment = { wrapText: true };
    worksheet.columns = columns;
    worksheet.addRows(exportData);

    // worksheet.getCell("B1", "C1").fill = {
    //   type: "pattern",
    //   pattern: "solid",
    //   fgColor: { argb: "cccccc" },
    // };

    response.header(
      `Content-Type`,
      `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
    );
    response.header(`Content-Disposition`, `attachment; filename="${fileName}`);
    return workbook.xlsx.writeBuffer(response);
  }
}

module.exports = VisitorCreditController;
