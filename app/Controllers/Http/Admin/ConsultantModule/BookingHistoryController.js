"use strict";
const BookingHistory = use("App/Models/Admin/ConsultantModule/BookingHistory");
const Consultant = use("App/Models/Admin/ConsultantModule/Consultant");
const Visitor = use("App/Models/Admin/VisitorModule/Visitor");
const VisitorCreditHistory = use(
  "App/Models/Admin/ConsultantModule/VisitorCreditHistory"
);
const VisitorCreditRedeemHistory = use(
  "App/Models/Admin/ConsultantModule/VisitorCreditRedeemHistory"
);
const BookingTransactionHistory = use(
  "App/Models/Admin/ConsultantModule/BookingTransactionHistory"
);
const ConsultantChatHistory = use(
  "App/Models/Admin/ConsultantModule/ConsultantChatHistory"
);
const Invoice = use("App/Models/Admin/VisitorSubscriptionModule/Euinvoice");
const {
  getProfile,
  convertDateTime,
  getConsultantTimeZone,
  convertUTCTime,
  sendBookingCreationMail,
} = require("../../../../Helper/consultant");

const Database = use("Database");
const Query = use("Query");
const Excel = require("exceljs");
const moment = require("moment");
const { dateFilterExtractor } = require("../../../../Helper/globalFunctions");
const {
  createZoomMeeting,
  getZoomMeetingReport,
} = require("../../../../services/zoom.service");
const { EU_SERIAL_CODE } = require("../../../../Helper/constants");
const { getSerialCode } = require("../../../../Helper/serialNo");

const bookingRequestOnly = [
  "consultant_id",
  "visitor_id",
  "amount_per_hour",
  "booking_date",
  "booking_time",
  "booking_utc_time",
  "visitor_time_zone_id",
  "duration",
  "skill",
  "remarks",
  "is_credit",
];
const bookingTransactionRequestOnly = [
  "type",
  "sub_amount",
  "taxes",
  "total_amount",
  "paypal_transaction_id",
  "transaction_details",
  "transaction_date",
];

const consultantFields = [
  "id",
  "first_name",
  "middle_name",
  "last_name",
  "avg_rating",
  "image",
];

const searchInFields = [
  "booking.booking_date",
  "booking_status",
  "booking_time",
  "duration",
  "transaction.total_amount",
  "consultant.first_name",
  "visitor.name",
  "consultants.first_name",
  "transaction_date",
  "created_at"
];
class BookingHistoryController {
  async index({ request, response, view, auth }) {
    const query = BookingHistory.query();
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const bookingType = request.input("bookingType");
    const consultantId = request.input("consultant_id");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });
    const user = await getProfile(auth);
    query.with("transaction");
    query.with("visitor", (builder) => {
      builder.select("id", "name", "email", "designation", "company");
    });
    query.with("consultant", (builder) => {
      builder.select(consultantFields);
    });

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    // if (search) {
    //   query.where(searchQuery.search(searchInFields));
    // }
    if (search) {
      query.where((builder) => {
        builder.whereRaw("LOWER(booking_date) LIKE ?", [`%${search.toLowerCase()}%`])
          .orWhereRaw("LOWER(booking_status) LIKE ?", [`%${search.toLowerCase()}%`])
          .orWhereRaw("LOWER(booking_time) LIKE ?", [`%${search.toLowerCase()}%`])
          .orWhereRaw("LOWER(duration) LIKE ?", [`%${search.toLowerCase()}%`])
          .orWhereHas("transaction", (transactionQuery) => {
            transactionQuery.whereRaw("LOWER(total_amount) LIKE ?", [`%${search.toLowerCase()}%`]);
          })
          .orWhereHas("visitor", (visitorQuery) => {
            visitorQuery.whereRaw("LOWER(name) LIKE ?", [`%${search.toLowerCase()}%`]);
          })
          .orWhereHas("consultant", (consultantQuery) => {
            consultantQuery.whereRaw("LOWER(first_name) LIKE ?", [`%${search.toLowerCase()}%`]);
          });
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
    if (bookingType === "upcoming") {
      query.whereRaw("booking_date >= ?", [moment().format("YYYY-MM-DD")]);
    }
    if (bookingType === "past") {
      query.whereRaw("booking_date < ?", [moment().format("YYYY-MM-DD")]);
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
          case "booking_date":
            query.whereRaw(
              await dateFilterExtractor({
                name: "booking_date",
                date: filter.value,
              })
            );
            break;

          case "consultant.first_name": {
            query
              .join(
                "consultants",
                "booking_histories.consultant_id",
                "=",
                "consultants.id"
              )
              .where("consultants.first_name", "LIKE", `%${filter.value}%`);
            break;
          }

          case "visitor.name": {
            query
              .join(
                "visitors",
                "booking_histories.visitor_id",
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

    return response.status(200).json(result);
  }

  async store({ request, response, auth }) {
    const bookingBody = request.only(bookingRequestOnly);
    const transactionBody = request.only(bookingTransactionRequestOnly);
    const trx = await Database.beginTransaction();
    const user = await getProfile(auth);

    // if (Number(bookingBody.is_credit)) {
    //   console.log("True");
    // }
    // console.log("Credit", Number(bookingBody.is_credit));
    // return response.send(bookingBody);

    try {
      const timeZone = await getConsultantTimeZone(bookingBody.consultant_id);

      const meetingStartTimeInUtc = await convertUTCTime(
        bookingBody.booking_date,
        bookingBody.booking_time,
        timeZone.offset
      );

      const zoomStartTime = meetingStartTimeInUtc
        .clone()
        .format("YYYY-MM-DDTHH:mm:ss");
      const booking_utc_time = meetingStartTimeInUtc.clone().format();

      const visitorData = await Visitor.findOrFail(bookingBody.visitor_id);

      // console.log("zoomMeetingDetails", zoomMeetingDetails.data);

      let visitorCredits = await VisitorCreditHistory.findBy(
        "visitor_id",
        request.input("visitor_id")
      );

      if (
        Number(bookingBody.is_credit) &&
        visitorCredits &&
        visitorCredits.credit < transactionBody.total_amount
      ) {
        return response
          .status(423)
          .json({ message: "No enough credits to book schedule!" });
      }

      const zoomMeetingDetails = await createZoomMeeting({
        topic: `Discussion on the topic ${bookingBody.skill}`,
        start_time: zoomStartTime,
        duration: bookingBody.duration,
        timezone: timeZone.zone, // "Asia/Kolkata"
        agenda: `${bookingBody.skill}`,
      });

      const query = await BookingHistory.create(
        {
          ...bookingBody,
          booking_utc_time,
          zoom_meeting_id: zoomMeetingDetails.data.id,
          meeting_link: zoomMeetingDetails.data.join_url,
        },
        trx
      );
      const transactionQuery = await BookingTransactionHistory.create(
        {
          ...transactionBody,
          booking_history_id: query.id,
        },
        trx
      );

      if (bookingBody.is_credit) {
        const currentCredits =
          visitorCredits.credit - transactionBody.total_amount;
        await VisitorCreditRedeemHistory.create(
          {
            booking_id: query.id,
            visitor_id: query.visitor_id,
            credit_used: transactionBody.total_amount,
            credit_booked: transactionBody.total_amount,
            initial_credit_balance: visitorCredits.credit,
            current_credit_balance: currentCredits,
            type: "Debit",
          },
          trx
        );
        visitorCredits.credit = currentCredits;
        await visitorCredits.save(trx);
      }
      // create chat config
      await ConsultantChatHistory.create(
        {
          booking_id: query.id,
          consultant_id: query.consultant_id,
          visitor_id: query.visitor_id,
          allow_consultant_message: true,
          allow_visitor_message: true,
          chat_active_deadline: moment(query.booking_date).add(1, "months"),
        },
        trx
      );

      // EU invoice
      const invoiceQuery = await Invoice.create(
        {
          booking_history_id: query.id,
          invoice_no: await getSerialCode(EU_SERIAL_CODE.INVOICE),
          invoice_date: new Date(),
          invoice_amount: transactionBody.total_amount,
          type: 3,
          created_by: 0,
          created_at: new Date(),
        },
        trx
      );

      const mailData = {
        ...bookingBody,
        visitorId: userId,
        zoom_meeting_id: zoomMeetingDetails.data.id,
        meeting_link: zoomMeetingDetails.data.join_url,
        topic,
        visitorName: visitorData.name,
        visitorEmail: visitorData.email,
        consultantName: user.name,
        consultantEmail: user.email,
        total_amount: transactionBody.total_amount,
        paypal_transaction_id: transactionBody.paypal_transaction_id,
      };
      // send mail
      await sendBookingCreationMail(mailData);

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

  async show({ params, request, response, view, auth }) {
    const user = await getProfile(auth);
    const query = BookingHistory.query();
    query.where("id", params.id);
    // if consultant logged in
    if (user.consultant_id) {
      query.where("consultant_id", user.consultant_id);
    }
    query.with("transaction");
    query.with("visitor", (builder) => {
      builder.select("id", "name", "email", "designation", "company");
    });
    query.with("consultant", (builder) => {
      builder.select(consultantFields);
    });
    const result = await query.firstOrFail();
    return response.status(200).json(result);
  }

  async update({ params, request, response }) {
    const bookingBody = request.only(bookingRequestOnly);
    const transactionBody = request.only(bookingTransactionRequestOnly);
    const trx = await Database.beginTransaction();
    try {
      let visitorCredits = await VisitorCreditHistory.findBy(
        "visitor_id",
        request.input("visitor_id")
      );
      let visitorRedeem = await VisitorCreditRedeemHistory.findBy(
        "booking_id",
        params.id
      );
      visitorCredits.credit += visitorRedeem.credit_used;
      if (bookingBody.is_credit) {
        if (
          visitorCredits &&
          visitorCredits.credit >= transactionBody.total_amount
        ) {
          const query = await BookingHistory.findOrFail(params.id);
          query.merge(bookingBody);
          await query.save(trx);

          await BookingTransactionHistory.query(trx)
            .where("booking_history_id", query.id)
            .delete(trx);
          await BookingTransactionHistory.create(
            {
              ...transactionBody,
              booking_history_id: query.id,
            },
            trx
          );
          const currentCredits =
            visitorCredits.credit - transactionBody.total_amount;

          (visitorRedeem.credit_used = transactionBody.total_amount),
            (visitorRedeem.credit_booked = transactionBody.total_amount),
            (visitorRedeem.initial_credit_balance = visitorCredits.credit),
            (visitorRedeem.current_credit_balance = currentCredits),
            (visitorRedeem.type = "Debit"),
            (visitorCredits.credit = currentCredits);
          await visitorCredits.save(trx);
          await visitorRedeem.save(trx);
          await trx.commit();
          return response.status(200).json({ message: "Update successfully" });
        } else {
          return response
            .status(200)
            .json({ message: "No enough credits to book schedule!" });
        }
      } else {
        const query = await BookingHistory.findOrFail(params.id);
        query.merge(bookingBody);
        await query.save(trx);

        await BookingTransactionHistory.query(trx)
          .where("booking_history_id", query.id)
          .delete(trx);
        await BookingTransactionHistory.create(
          {
            ...transactionBody,
            booking_history_id: query.id,
          },
          trx
        );
        await trx.commit();
        return response.status(200).json({ message: "Update successfully" });
      }
    } catch (error) {
      await trx.rollback();
      return response
        .status(423)
        .json({ message: "Something went wrong", error });
    }
  }

  async destroy({ params, request, response }) {
    const Database = use("Database");
    const trx = await Database.beginTransaction();
    try {
      const query = await BookingHistory.findOrFail(params.id, trx);
      await query.delete(trx);
      await BookingTransactionHistory.query(trx)
        .where("booking_history_id", params.id)
        .delete(trx);
      await VisitorCreditRedeemHistory.query(trx)
        .where("booking_id", params.id)
        .delete(trx);

      await trx.commit();
      return response.status(200).send({ message: "Delete successfully" });
    } catch (error) {
      await trx.rollback();
      return response.status(423).send({
        message: "Something went wrong",
      });
    }
  }

  async exportReport({ params, request, response, auth }) {
    const query = BookingHistory.query();
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const bookingType = request.input("bookingType");
    const consultantId = request.input("consultant_id");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });
    // const user = await getProfile(auth);
    query.with("transaction");
    // query.with("visitor", (builder) => {
    //   builder.select("id", "name");
    // });
    query.with("visitor", (builder) => {
      builder.select("id", "name", "email", "designation", "company");
    });
    query.with("consultant", (builder) => {
      builder.select("id", "first_name", "middle_name", "last_name");
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
          case "booking_date":
            query.whereRaw(
              await dateFilterExtractor({
                name: "booking_date",
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

    if (consultantId) {
      query.where("consultant_id", consultantId);
    }
    // if (user.consultant_id) {
    //   query.where("consultant_id", user.consultant_id);
    // }
    if (bookingType === "upcoming") {
      query.whereRaw("booking_date >= ?", [moment().format("YYYY-MM-DD")]);
    }
    if (bookingType === "past") {
      query.whereRaw("booking_date < ?", [moment().format("YYYY-MM-DD")]);
    }

    const result = (await query.fetch()).toJSON();
    let exportData = [];
    let index = 1;

    const fileName = "bookings-" + moment().format("yyyy-MM-DD") + ".xlsx";
    let workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet("Booking List");
    let font = { name: "Arial", size: 12 };

    if (result) {
      result.forEach((element) => {
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
          booking_date: element.booking_date,
          booking_time: moment(element.booking_time, "HH:mm:ss").format("LT"),
          duration: element.duration,
          skill: element.skille,
          meeting_link: element.meeting_link,
          zoom_meeting_id: element.zoom_meeting_id,
          remarks: element.remarks,
          is_credit: element.is_credit ? "Yes" : "No",
          status: element.booking_status,
          type: element.transaction.type,
          sub_amount: element.transaction.sub_amount,
          taxes: element.transaction.taxes,
          total_amount: element.transaction.total_amount,
          transaction_id: element.transaction.transaction_id,
          transaction_date: moment(element.transaction.transaction_date).format(
            "DD-MM-YYYY"
          ),
          transaction_details: element.transaction.transaction_details,
          consultant: consultant,
          visitor: element.visitor.name,
          amount_per_hour: element.amount_per_hour,
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
        header: "Amount per hour",
        key: "amount_per_hour",
        width: 20,
        style: { font: font },
      },
      {
        header: "Booking Date",
        key: "booking_date",
        width: 20,
        style: { font: font },
      },
      {
        header: "Booking Time",
        key: "booking_time",
        width: 20,
        style: { font: font },
      },
      {
        header: "Duration",
        key: "duration",
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
        header: "Meeting Link",
        key: "meeting_link",
        width: 30,
        style: { font: font },
      },
      {
        header: "Zoom meeting id",
        key: "zoom_meeting_id",
        width: 20,
        style: { font: font },
      },
      {
        header: "Remarks",
        key: "remarks",
        width: 30,
        style: { font: font },
      },
      { header: "Status", key: "status", width: 20, style: { font: font } },

      {
        header: "Type",
        key: "type",
        width: 15,
        style: { font: font },
      },
      {
        header: "Sub Amount",
        key: "sub_amount",
        width: 20,
        style: { font: font },
      },
      {
        header: "Taxes",
        key: "taxes",
        width: 20,
        style: { font: font },
      },
      {
        header: "Total Amount",
        key: "total_amount",
        width: 20,
        style: { font: font },
      },
      {
        header: "Transaction Id",
        key: "transaction_id",
        width: 20,
        style: { font: font },
      },
      {
        header: "Transaction Date",
        key: "transaction_date",
        width: 20,
        style: { font: font },
      },
      {
        header: "Transaction Details",
        key: "transaction_details",
        width: 30,
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

  async transaction({ request, response, view, auth }) {
    const query = BookingTransactionHistory.query();
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const consultantId = request.input("consultant_id");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });
    const user = await getProfile(auth);
    query.with("booking", (builder) => {
      builder.with("consultant");
      builder.with("visitor");
    });

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    // if (search) {
    //   query.where(searchQuery.search(searchInFields));
    // }
    if (search) {
      query.where((builder) => {
        builder.whereRaw("LOWER(booking_date) LIKE ?", [`%${search.toLowerCase()}%`])
          .orWhereRaw("LOWER(total_amount) LIKE ?", [`%${search.toLowerCase()}%`])
          .orWhereHas("booking.visitor", (visitorQuery) => {
            visitorQuery.whereRaw("LOWER(name) LIKE ?", [`%${search.toLowerCase()}%`]);
          })
          .orWhereHas("booking.consultant", (consultantQuery) => {
            consultantQuery.whereRaw("LOWER(first_name) LIKE ?", [`%${search.toLowerCase()}%`]);
          });
      });
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
          case "booking_date":
            query.whereRaw(
              await dateFilterExtractor({
                name: "booking_date",
                date: filter.value,
              })
            );
            break;

          case "booking.visitor.name": {
            query
              .join(
                "visitors",
                "booking_transaction_histories.booking_history_id",
                "=",
                "visitors.id"
              )
              .where("visitors.name", "LIKE", `%${filter.value}%`);
            break;
          }

          case "booking.consultant.first_name": {
            query
              .join(
                "booking_histories",
                "booking_transaction_histories.booking_history_id",
                "=",
                "booking_histories.id"
              )
              .join(
                "consultants",
                "booking_histories.consultant_id",
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
    return response.status(200).json(result);
  }

  async exportTransactionReport({ params, request, response, auth }) {
    const query = BookingTransactionHistory.query();
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const consultantId = request.input("consultant_id");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });
    const user = await getProfile(auth);
    query.with("booking", (builder) => {
      builder.with("visitor", (builder) => {
        builder.select("id", "name");
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
          case "booking_date":
            query.whereRaw(
              await dateFilterExtractor({
                name: "booking_date",
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
      query.where("consultant_id", consultantId);
    }
    // if consultant logged in
    if (user.consultant_id) {
      query.where("consultant_id", user.consultant_id);
    }

    const result = (await query.fetch()).toJSON();

    let exportData = [];
    let index = 1;

    const fileName = "transactions-" + moment().format("yyyy-MM-DD") + ".xlsx";
    let workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet("Booking Transaction List");
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
          booking_date: element.booking.booking_date,
          booking_time: moment(element.booking.booking_time, "HH:mm:ss").format(
            "LT"
          ),
          duration: element.booking.duration,
          skill: element.booking.skille,
          meeting_link: element.booking.meeting_link,
          zoom_meeting_id: element.booking.zoom_meeting_id,
          remarks: element.booking.remarks,
          is_credit: element.booking.is_credit ? "Yes" : "No",
          status: element.booking.booking_status,
          type: element.type,
          sub_amount: element.sub_amount,
          taxes: element.taxes,
          total_amount: element.total_amount,
          transaction_id: element.transaction_id,
          transaction_date: moment(element.transaction_date).format(
            "DD-MM-YYYY"
          ),
          transaction_details: element.transaction_details,
          consultant: consultant,
          visitor: element.booking.visitor.name,
          amount_per_hour: element.booking.amount_per_hour,
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
        header: "Amount per hour",
        key: "amount_per_hour",
        width: 20,
        style: { font: font },
      },
      {
        header: "Booking Date",
        key: "booking_date",
        width: 20,
        style: { font: font },
      },
      {
        header: "Booking Time",
        key: "booking_time",
        width: 20,
        style: { font: font },
      },
      {
        header: "Duration",
        key: "duration",
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
        header: "Meeting Link",
        key: "meeting_link",
        width: 30,
        style: { font: font },
      },
      {
        header: "Zoom meeting id",
        key: "zoom_meeting_id",
        width: 20,
        style: { font: font },
      },
      {
        header: "Remarks",
        key: "remarks",
        width: 30,
        style: { font: font },
      },
      { header: "Status", key: "status", width: 20, style: { font: font } },

      {
        header: "Type",
        key: "type",
        width: 15,
        style: { font: font },
      },
      {
        header: "Sub Amount",
        key: "sub_amount",
        width: 20,
        style: { font: font },
      },
      {
        header: "Taxes",
        key: "taxes",
        width: 20,
        style: { font: font },
      },
      {
        header: "Total Amount",
        key: "total_amount",
        width: 20,
        style: { font: font },
      },
      {
        header: "Transaction Id",
        key: "transaction_id",
        width: 20,
        style: { font: font },
      },
      {
        header: "Transaction Date",
        key: "transaction_date",
        width: 20,
        style: { font: font },
      },
      {
        header: "Transaction Details",
        key: "transaction_details",
        width: 30,
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

  async getZoomMeetingReport({ params, request, response, auth }) {
    try {
      const meetingId = request.input("meetingId");
      const data = await getZoomMeetingReport(meetingId);
      console.log("Report", data);
      return response.send(data);
    } catch (error) {
      console.log(error);
      return response
        .status(423)
        .json({ message: "Something went wrong", error });
    }
  }
}

module.exports = BookingHistoryController;
