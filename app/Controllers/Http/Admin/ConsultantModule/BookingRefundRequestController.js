"use strict";
const BookingHistory = use("App/Models/Admin/ConsultantModule/BookingHistory");
const BookingRefundRequest = use(
  "App/Models/Admin/ConsultantModule/BookingRefundRequest"
);
const Database = use("Database");
const Query = use("Query");
const Excel = require("exceljs");
const moment = require("moment");
const {
  getCancellationPercentage,
  sendBookingCancellationMail,
} = require("../../../../Helper/consultant");
const { dateFilterExtractor } = require("../../../../Helper/globalFunctions");
const { showPayment } = require("../../../../services/subscription.service");
const {
  getZoomMeeting,
  deleteZoomMeeting,
} = require("../../../../services/zoom.service");
const { getProfile } = require("../../../../Helper/consultant");
const requestOnly = ["booking_id", "reason"];
const searchInFields = ["reason", "refund_amount", "refund_by", "refund_status", "approved_amount", "booking_date"];

class BookingRefundRequestController {
  async index({ request, response, view, auth }) {
    const query = BookingRefundRequest.query();
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const consultantId = request.input("consultant_id");
    const searchQuery = new Query(request, { order: "id" });
    const user = await getProfile(auth);
    query.leftJoin(
      "booking_histories",
      "booking_histories.id",
      "booking_refund_requests.booking_id"
    );
    query.with("booking");
    query.select("booking_refund_requests.*");

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

    // if consultant not logged in
    if (consultantId && user.consultant_id == undefined) {
      query.where("booking_histories.consultant_id", consultantId);
    }

    // if consultant logged in
    if (user.consultant_id) {
      query.where("booking_histories.consultant_id", user.consultant_id);
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

    return response.status(200).json(result);
  }

  async store({ request, response }) {
    const trx = await Database.beginTransaction();
    const body = request.only(requestOnly);

    try {
      const query = await BookingHistory.query(trx)
        .whereRaw("id=? and booking_status=? and booking_date >= ?", [
          body.booking_id,
          "Confirmed",
          moment().format("YYYY-MM-DD"),
        ])
        .with("visitor", (builder) => {
          builder.select("id", "name", "email", "designation", "company");
        })
        .with("consultant", (builder) => {
          builder.select(
            "id",
            "first_name",
            "middle_name",
            "last_name",
            "email"
          );
        })
        .with("transaction", (builder) => {
          builder.select(
            "booking_history_id",
            "sub_amount",
            "total_amount",
            "paypal_transaction_id"
          );
        })
        .firstOrFail();
      const result = (await query).toJSON();

      const mailData = {
        consultantName: result.consultant.first_name,
        consultantMail: result.consultant.email,
        visitorName: result.visitor.name,
        visitorMail: result.visitor.email,
        meetingId: result.zoom_meeting_id,
        skill: result.skill,
        reason: body.reason,
        date: moment(result.booking_date).format("LL"),
        time: moment(result.booking_time, "HH:mm").format("LT"),
      };

      // Send notification on mail
      await sendBookingCancellationMail(mailData);

      // delete zoom meeting
      const meetingData = await deleteZoomMeeting(result.zoom_meeting_id);

      query.booking_status = "Cancelled";
      await query.save(trx);

      // const cancellationPercentage = await getCancellationPercentage();
      // const cancellationCharges = Math.round(
      //   (result.transaction.total_amount * cancellationPercentage) / 100
      // );
      //! cancellation charges will not be apply if consultant cancel booking
      await BookingRefundRequest.create(
        {
          ...body,
          refund_by: "Consultant",
          paypal_transaction_id: result.transaction.paypal_transaction_id,
          refund_amount: result.transaction.total_amount,
        },
        trx
      );

      await trx.commit();
      return response.status(200).json({
        message: "Booking cancelled succefully",
      });
    } catch (error) {
      console.log("ERROR:", error);
      await trx.rollback();
      return response
        .status(423)
        .json({ message: "Somthing went wrong", error });
    }
  }

  async show({ params, request, response, view }) {
    const query = BookingRefundRequest.query();
    query.where("id", params.id);
    query.with("booking");
    const result = await query.firstOrFail();
    return response.status(200).send(result);
  }

  async approve({ params, request, response, auth }) {
    const userId = auth.user.id;
    try {
      const query = await BookingRefundRequest.findOrFail(params.id);

      //TODO: paypal payment refund
      query.refund_status = "Refunded";
      query.refund_date = moment().format("YYYY-MM-DD");
      query.admin_remarks = request.input("admin_remarks");
      query.approved_amount = request.input("approved_amount");
      await query.save();
      return response.status(200).json({ message: "Update successfully" });
    } catch (error) {
      console.log("ERROR:", error);
      return response
        .status(423)
        .json({ message: "Somthing went wrong", error });
    }
  }

  async update({ params, request, response }) { }

  async destroy({ params, request, response }) { }

  async exportReport({ params, request, response }) {
    const query = BookingRefundRequest.query();
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });
    query.with("booking", (builder) => {
      builder.with("visitor", (builder) => {
        builder.select("id", "name", "email", "designation", "company");
      });
      builder.with("consultant", (builder) => {
        builder.select("id", "first_name", "middle_name", "last_name");
      });
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
      "booking refunds-" + moment().format("yyyy-MM-DD") + ".xlsx";
    let workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet("Booking Refund List");
    let font = { name: "Arial", size: 12 };

    if (result) {
      result.forEach((element) => {
        let consultant = element.booking.consultant.first_name
          ? `${element.booking.consultant.first_name} `
          : "";
        consultant += element.booking.consultant.middle_name
          ? `${element.booking.consultant.middle_name} `
          : "";
        consultant += element.booking.consultant.last_name
          ? `${element.booking.consultant.last_name}`
          : "";

        exportData.push({
          sno: index++,
          consultant: consultant,
          visitor: element.booking.visitor.name,
          booking_date: element.booking.booking_date,
          booking_duration: element.booking.duration,
          skill: element.booking.skill,
          paypal_transaction_id: element.paypal_transaction_id,
          refund_amount: element.refund_amount,
          approved_amount: element.approved_amount,
          reason: element.reason,
          refund_status: element.refund_status,
          admin_remarks: element.admin_remarks,
          refund_transaction_id: element.refund_transaction_id,
          refund_by: element.refund_by,
          refund_date: element.refund_date
            ? moment(element.refund_date).format("LT")
            : "",
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
        header: "Visitor Name",
        key: "visitor",
        width: 30,
        style: { font: font },
      },
      {
        header: "Booking Date",
        key: "booking_date",
        width: 20,
        style: { font: font },
      },
      {
        header: "Duration",
        key: "booking_duration",
        width: 15,
        style: { font: font },
      },
      {
        header: "Skill",
        key: "skill",
        width: 30,
        style: { font: font },
      },

      {
        header: "Refund Amount",
        key: "refund_amount",
        width: 30,
        style: { font: font },
      },
      {
        header: "Approved Amount",
        key: "approved_amount",
        width: 20,
        style: { font: font },
      },

      {
        header: "Refund By",
        key: "refund_by",
        width: 15,
        style: { font: font },
      },
      {
        header: "Refund Date",
        key: "refund_date",
        width: 20,
        style: { font: font },
      },
      {
        header: "Paypal transaction Id",
        key: "paypal_transaction_id",
        width: 20,
        style: { font: font },
      },
      {
        header: "Refund transaction Id",
        key: "refund_transaction_id",
        width: 20,
        style: { font: font },
      },
      {
        header: "Reason",
        key: "reason",
        width: 50,
        style: { font: font },
      },
      {
        header: "Admin Remarks",
        key: "admin_remarks",
        width: 50,
        style: { font: font },
      },
      {
        header: "Status",
        key: "refund_status",
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

module.exports = BookingRefundRequestController;
