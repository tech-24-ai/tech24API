"use strict";
const Database = use("Database");
const Query = use("Query");
const moment = require("moment");
const Excel = require("exceljs");
const { dateFilterExtractor } = require("../../../../Helper/globalFunctions");
const { getProfile } = require("../../../../Helper/consultant");
const Consultant = use("App/Models/Admin/ConsultantModule/Consultant");
const BookingLog = use("App/Models/Admin/ConsultantModule/BookingLog");
const BookingHistory = use("App/Models/Admin/ConsultantModule/BookingHistory");
const BookingTransactionHistory = use(
  "App/Models/Admin/ConsultantModule/BookingTransactionHistory"
);
const ConsultantPayment = use(
  "App/Models/Admin/ConsultantModule/ConsultantPayment"
);
const ConsultantPaymentDetail = use(
  "App/Models/Admin/ConsultantModule/ConsultantPaymentDetail"
);
const { getConsultantPercentage } = require("../../../../Helper/consultant");
const requestOnly = [
  "consultant_id",
  "total_payment",
  "payment_date",
  "transaction_details",
  "remarks",
];
const searchInFields = [
  "total_payment",
  "payment_date",
  "transaction_details",
  "remarks",
];

class ConsultantPaymentController {
  async index({ request, response, view, auth }) {
    const query = ConsultantPayment.query();
    const user = await getProfile(auth);
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });
    const consultantId = request.input("consultant_id");
    query.with("paymentDetail");
    query.with("consultant");
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

            case "consultant.first_name": {
              query
                .join(
                  "consultants",
                  "consultant_payments.consultant_id",
                  "=",
                  "consultants.id"
                )
                .where("consultants.first_name", "LIKE", `%${filter.value}%`);
              break;
            }

          default:
            query.whereRaw(`${filter.name} LIKE '%${filter.value}%'`);
            break;
        }
      });
    }

    // if consultant not logged in
    if (consultantId && user.consultant_id == undefined) {
      query.where("consultant_id", consultantId);
    }
    // if consultant logged in
    if (user.consultant_id) {
      query.where("consultant_id", user.consultant_id);
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
    const body = request.only(requestOnly);
    const trx = await Database.beginTransaction();
    try {
      const query = await ConsultantPayment.create(body, trx);
      console.log("query", query);
      const bookingIds = request.input("bookingIds");
      const consultant = await Consultant.findOrFail(body.consultant_id);
      if (bookingIds && bookingIds.length) {
        const transactionList = (
          await BookingTransactionHistory.query()
            .whereIn("booking_history_id", bookingIds)
            .select(
              "id",
              "sub_amount",
              "taxes",
              "total_amount",
              "booking_history_id"
            )
            .fetch()
        ).toJSON();
        let paymentDetailsData = [];
        for (let index = 0; index < transactionList.length; index++) {
          const { booking_history_id, total_amount } = transactionList[index];
          const [bookingLogId] = await BookingLog.query()
            .where("booking_history_id", booking_history_id)
            .pluck("id");
          let taxes = 0;
          const commissionPercentage = await getConsultantPercentage();
          let deduction = Math.round(
            (total_amount * commissionPercentage) / 100
          );
          let netAmt = total_amount - taxes - deduction;
          paymentDetailsData.push({
            consultant_payment_id: query.id,
            sub_total: total_amount,
            taxes: 0,
            deduction: deduction,
            net_payment: netAmt,
            payment_date: body.payment_date,
            deduction_reason: "commission",
            booking_id: booking_history_id,
            booking_logs_id: bookingLogId,
          });
        }
        consultant.total_payment =
          consultant.total_payment - body.total_payment;
        await consultant.save(trx);
        await ConsultantPaymentDetail.createMany(paymentDetailsData, trx);

        await trx.commit();
        return response
          .status(200)
          .json({ message: "Create successfully", data: paymentDetailsData });
      } else {
        return response.status(423).json({
          message: "Booking list not found, pls select bookings",
          error,
        });
      }
    } catch (error) {
      await trx.rollback();
      console.log(error);
      return response
        .status(423)
        .json({ message: "Something went wrong", error });
    }
  }

  async show({ params, request, response, view, auth }) {
    const user = await getProfile(auth);
    const query = ConsultantPayment.query();
    query.where("id", params.id);
    query.with("paymentDetail");
    query.with("consultant");
    // if consultant logged in
    if (user.consultant_id) {
      query.where("consultant_id", user.consultant_id);
    }
    const result = await query.firstOrFail();
    // const bookingIds = await ConsultantPaymentDetail.query()
    //   .where("consultant_payment_id", result.id)
    //   .groupBy("booking_id")
    //   .pluck("booking_id");
    // result.bookingIds = bookingIds;
    return response.status(200).send(result);
  }

  async update({ params, request, response }) {
    const body = request.only(requestOnly);
    const trx = await Database.beginTransaction();
    try {
      const query = await ConsultantPayment.findOrFail(params.id);
      query.merge(body);

      const bookingIds = request.input("bookingIds");
      const consultant = await Consultant.findOrFail(body.consultant_id);
      if (bookingIds && bookingIds.length) {
        const transactionList = (
          await BookingTransactionHistory.query()
            .whereIn("booking_history_id", bookingIds)
            .select(
              "id",
              "sub_amount",
              "taxes",
              "total_amount",
              "booking_history_id"
            )
            .fetch()
        ).toJSON();
        let paymentDetailsData = [];
        for (let index = 0; index < transactionList.length; index++) {
          const { booking_history_id, total_amount } = transactionList[index];
          const [bookingLogId] = await BookingLog.query()
            .where("booking_history_id", booking_history_id)
            .pluck("id");
          let taxes = 0;
          const commissionPercentage = await getConsultantPercentage();
          let deduction = Math.round(
            (total_amount * commissionPercentage) / 100
          );
          let netAmt = total_amount - taxes - deduction;
          paymentDetailsData.push({
            consultant_payment_id: query.id,
            sub_total: total_amount,
            taxes: 0,
            deduction: deduction,
            net_payment: netAmt,
            payment_date: body.payment_date,
            deduction_reason: "commission",
            booking_id: booking_history_id,
            booking_logs_id: bookingLogId,
          });
        }
        consultant.total_payment =
          consultant.total_payment - body.total_payment;
        await consultant.save(trx);
        await query.save(trx);
        // payment details
        await ConsultantPaymentDetail.query(trx)
          .where("consultant_payment_id", query.id)
          .delete(trx);
        // add payment details
        await ConsultantPaymentDetail.createMany(paymentDetailsData, trx);

        await trx.commit();
        return response
          .status(200)
          .json({ message: "Updated successfully", data: paymentDetailsData });
      } else {
        return response.status(423).json({
          message: "Booking list not found, pls select bookings",
          error,
        });
      }
    } catch (error) {
      await trx.rollback();
      console.log(error);
      return response
        .status(423)
        .json({ message: "Something went wrong", error });
    }
  }

  async destroy({ params, request, response }) {}

  async unpaidBooking({ params, request, response, view }) {
    const consultantId = request.input("consultant_id");
    const paymentId = request.input("payment_id");
    if (!consultantId) {
      return response
        .status(423)
        .json({ message: "Consultant id is required" });
    }
    let str = "consultant_id=?";
    let strVal = [consultantId];
    if (paymentId) {
      str += " and id!=?";
      strVal.push(paymentId);
    }
    const paymentIds = await ConsultantPayment.query()
      .whereRaw(str, strVal)
      .pluck("id");
    // console.log("paymentIds", paymentIds);
    const paidBookingId = await ConsultantPaymentDetail.query()
      .whereIn("consultant_payment_id", paymentIds)
      .groupBy("booking_logs_id")
      .pluck("booking_logs_id");

    // console.log("paidBookingId", paidBookingId);
    const query = BookingHistory.query();

    query.innerJoin(
      "booking_logs",
      "booking_histories.id",
      "booking_logs.booking_history_id"
    );
    query.innerJoin(
      "booking_transaction_histories",
      "booking_histories.id",
      "booking_transaction_histories.booking_history_id"
    );
    query.whereNotIn("booking_logs.id", paidBookingId);
    query.whereRaw("consultant_id=? and booking_logs.meeting_status=?", [
      consultantId,
      "Completed",
    ]);
    query.select(
      "booking_histories.id as booking_id",
      "consultant_id",
      "skill",
      "booking_date",
      "booking_time",
      "duration",
      "amount_per_hour",
      "meeting_status",
      "sub_amount",
      "taxes",
      "total_amount"
    );

    let result = (await query.fetch()).toJSON();
    const commissionPercentage = await getConsultantPercentage();
    result = result.map((data) => {
      let deduction = Math.round(
        (data.total_amount * commissionPercentage) / 100
      );
      let netAmount = data.total_amount - deduction;

      return {
        ...data,
        deduction,
        netAmount,
        commissionPercentage,
      };
    });

    return response.status(200).send(result);
  }

  async exportReport({ params, request, response }) {
    const query = ConsultantPayment.query();
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });
    const consultantId = request.input("consultant_id");
    query.with("paymentDetail");
    query.with("consultant");
    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    if (search) {
      query.where(searchQuery.search(searchInFields));
    }

    // if consultant not logged in
    if (consultantId) {
      query.where("consultant_id", consultantId);
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
      "consultant-payments" + moment().format("yyyy-MM-DD") + ".xlsx";
    let workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet("Consultant Payment List");
    let font = { name: "Arial", size: 12 };

    if (result) {
      result.forEach((element) => {
        const totalBooking =
          element.paymentDetail && element.paymentDetail.length;
        let consultant = element.consultant.first_name
          ? `${element.consultant.first_name} `
          : "";
        consultant += element.consultant.middle_name
          ? `${element.consultant.middle_name} `
          : "";
        consultant += element.consultant.last_name
          ? `${element.consultant.last_name}`
          : "";
        exportData.push({
          sno: index++,
          consultant: consultant,
          total_payment: element.total_payment,
          payment_date: element.payment_date,
          transaction_details: element.transaction_details,
          remarks: element.remarks,
          numberOfBooking: totalBooking,
          created_at: element.created_at,
          updated_at: element.updated_at,
        });
      });
    }

    // return response.send(exportData);

    let columns = [
      { header: "Sr No.", key: "sno", width: 10, style: { font: font } },
      {
        header: "Consultant Name",
        key: "consultant",
        width: 30,
        style: { font: font },
      },
      {
        header: "Payment Date",
        key: "payment_date",
        width: 30,
        style: { font: font },
      },
      {
        header: "Paid Amount",
        key: "total_payment",
        width: 30,
        style: { font: font },
      },
      {
        header: "Transaction Details",
        key: "transaction_details",
        width: 60,
        style: { font: font },
      },
      {
        header: "Remarks",
        key: "remarks",
        width: 60,
        style: { font: font },
      },

      {
        header: "Number of booking",
        key: "numberOfBooking",
        width: 20,
        style: { font: font },
      },
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

    worksheet.getColumn(4).alignment = { wrapText: true };
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
}

module.exports = ConsultantPaymentController;
