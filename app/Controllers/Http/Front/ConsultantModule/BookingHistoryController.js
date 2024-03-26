"use strict";
const BookingHistory = use("App/Models/Admin/ConsultantModule/BookingHistory");
const Consultant = use("App/Models/Admin/ConsultantModule/Consultant");
const VisitorCreditHistory = use(
  "App/Models/Admin/ConsultantModule/VisitorCreditHistory"
);
const VisitorCreditRedeemHistory = use(
  "App/Models/Admin/ConsultantModule/VisitorCreditRedeemHistory"
);
const BookingTransactionHistory = use(
  "App/Models/Admin/ConsultantModule/BookingTransactionHistory"
);
const BookingRefundRequest = use(
  "App/Models/Admin/ConsultantModule/BookingRefundRequest"
);
const ConsultantChatHistory = use(
  "App/Models/Admin/ConsultantModule/ConsultantChatHistory"
);
const Invoice = use("App/Models/Admin/VisitorSubscriptionModule/Euinvoice");
const axios = use("axios");
const Database = use("Database");
const Query = use("Query");
const Excel = require("exceljs");
const moment = require("moment");
const { dateFilterExtractor } = require("../../../../Helper/globalFunctions");
const {
  getZoomAuthToken,
  createZoomMeeting,
  deleteZoomMeeting,
} = require("../../../../services/zoom.service");

const {
  convertDateTime,
  getCancellationPercentage,
  getConsultantTimeZone,
  getProfile,
  sendBookingCreationMail,
} = require("../../../../Helper/consultant");
const { getSerialCode } = require("../../../../Helper/serialNo");
const { EU_SERIAL_CODE } = require("../../../../Helper/constants");

const bookingRequestOnly = [
  "consultant_id",
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
  "country_id",
  "image",
  "tags",
  "profile_summary",
  "details",
  "linkedin_url",
  "avg_rating",
];

const searchInFields = [
  "first_name",
  "middle_name",
  "last_name",
  "profile_summary",
  "details",
];

class BookingHistoryController {
  async index({ request, response, view, auth }) {
    const query = BookingHistory.query();
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const bookingId = request.input("booking_id");
    const consultantId = request.input("consultant_id");

    const bookingType = request.input("bookingType");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });
    query.with("transaction");
    query.with("invoices", (builder) => {
      builder.select(
        "id",
        "invoice_amount",
        "invoice_date",
        "invoice_no",
        "booking_history_id",
        "type"
      );
    });
    query.with("timezone", (builder) => {
      builder.select("id", "name", "sort_name", "zone", "offset");
    });
    query.with("chat_history", (builder) => {
      builder.select(
        "id as chat_id",
        "booking_id",
        "allow_visitor_message",
        "chat_active_deadline"
      );
    });
    query.with("consultant", (builder) => {
      builder.select(consultantFields);
      builder.with("country", (builder) => {
        builder.select(
          "id",
          "group_id",
          "sortname",
          "name",
          "phonecode",
          "latitude",
          "longitude"
        );
      });
      builder.with("rates", (builder) => {
        builder.innerJoin(
          "skills",
          "consultant_rate_cards.skill_id",
          "skills.id"
        );
        builder.select(
          "consultant_rate_cards.id",
          "consultant_id",
          "amount_per_hour",
          "skill_id",
          "skills.name as skill"
        );
      });
    });

    query.orderBy("booking_date", "desc");
    query.orderBy("booking_time", "asc");

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
    if (bookingId) {
      query.where("id", bookingId);
    }
    if (consultantId) {
      query.where("consultant_id", consultantId);
    }

    query.where("visitor_id", auth.user.id);

    if (bookingType === "upcoming") {
      query.whereRaw("booking_date >= ?", [moment().format("YYYY-MM-DD")]);
    }
    if (bookingType === "past") {
      query.whereRaw("booking_date < ?", [moment().format("YYYY-MM-DD")]);
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
    if (page && pageSize && !bookingId) {
      result = await query.paginate(page, pageSize);
    } else {
      result = await query.fetch();
    }

    return response.status(200).json(result);
  }

  async store({ request, response, auth }) {
    const bookingBody = request.only(bookingRequestOnly);
    const userId = auth.user.id;
    const transactionBody = request.only(bookingTransactionRequestOnly);
    const trx = await Database.beginTransaction();
    const user = await getProfile(auth);

    try {
      const timeZone = await getConsultantTimeZone(bookingBody.consultant_id);

      // const meetingTime = await convertDateTime(
      //   bookingBody.booking_date,
      //   bookingBody.booking_time,
      //   timeZone.zone
      // );

      const consultantData = await Consultant.findOrFail(
        bookingBody.consultant_id
      );

      const meetingTime = moment
        .parseZone(bookingBody.booking_utc_time)
        .utc(true)
        .format("YYYY-MM-DDTHH:mm:ss");
      let visitorCredits = await VisitorCreditHistory.findBy(
        "visitor_id",
        userId
      );

      if (
        bookingBody.is_credit == true &&
        visitorCredits &&
        visitorCredits.credit < transactionBody.total_amount
      ) {
        return response
          .status(423)
          .json({ message: "No enough credits to book schedule!" });
      }
      const topic = `Discussion on the topic ${bookingBody.skill}`;
      const zoomMeetingDetails = await createZoomMeeting({
        topic: topic,
        start_time: meetingTime,
        duration: bookingBody.duration,
        timezone: timeZone.zone, // "Asia/Kolkata"
        agenda: `${bookingBody.skill}`,
      });

      // console.log("zoomMeetingDetails", zoomMeetingDetails.data);

      const query = await BookingHistory.create(
        {
          ...bookingBody,
          visitor_id: userId,
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

      if (bookingBody.is_credit == true) {
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
        visitorName: user.name,
        visitorEmail: user.email,
        consultantName: consultantData.first_name,
        consultantEmail: consultantData.email,
        total_amount: transactionBody.total_amount,
        paypal_transaction_id: transactionBody.paypal_transaction_id,
      };

      // send mail
      await sendBookingCreationMail(mailData);
      await trx.commit();
      return response
        .status(200)
        .json({ message: "Create successfully", data: query });
    } catch (error) {
      await trx.rollback();
      console.log(error);
      return response
        .status(423)
        .json({ message: "Something went wrong", error });
    }
  }

  async show({ params, request, response, view }) {}

  async edit({ params, request, response, view }) {}

  async update({ params, request, response }) {}

  async destroy({ params, request, response }) {}

  async cancel({ request, response }) {
    const trx = await Database.beginTransaction();
    try {
      const query = await BookingHistory.query(trx)
        .whereRaw("id=? and booking_status=? and booking_date >= ?", [
          request.input("booking_id"),
          "Confirmed",
          moment().format("YYYY-MM-DD"),
        ])
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
      query.booking_status = "Cancelled";
      await query.save(trx);

      // delete zoom meeting
      await deleteZoomMeeting(result.zoom_meeting_id);
      const cancellationPercentage = await getCancellationPercentage();
      const cancellationCharges = Math.round(
        (result.transaction.total_amount * cancellationPercentage) / 100
      );
      await BookingRefundRequest.create(
        {
          booking_id: request.input("booking_id"),
          reason: request.input("reason"),
          refund_by: "Visitor",
          paypal_transaction_id: result.transaction.paypal_transaction_id,
          refund_amount: result.transaction.total_amount - cancellationCharges,
        },
        trx
      );

      await trx.commit();
      return response
        .status(200)
        .json({ message: "Booking cancel succefully" });
    } catch (error) {
      console.log("ERROR:", error);
      await trx.rollback();
      return response
        .status(423)
        .json({ message: "Somthing went wrong", error });
    }
  }

  async bookedConsultant({ request, response, view, auth }) {
    const consultantQuery = Consultant.query();
    consultantQuery.with("skills", (builder) => {
      builder.innerJoin(
        "skills",
        "consultant_rate_cards.skill_id",
        "skills.id"
      );
      builder.select("skills.id", "consultant_id", "skills.name");
    });

    consultantQuery.with("country", (builder) => {
      builder.select("id", "sortname", "name", "phonecode");
    });

    consultantQuery.withCount("booking as total_booking", (builder) => {
      builder.whereIn("booking_status", ["Confirmed", "Scheduled"]);
    });
    const consultantIds = await BookingHistory.query()
      .where("visitor_id", auth.user.id)
      .groupBy("consultant_id")
      .pluck("consultant_id");
    consultantQuery.whereIn("id", consultantIds);

    consultantQuery.select(consultantFields);

    const result = (await consultantQuery.fetch()).toJSON();

    return response.status(200).json(result);
  }

  async consultantBooking({ request, response, view, auth }) {
    if (request.input("consultant_id")) {
      const query = BookingHistory.query();
      query.where("visitor_id", auth.user.id);
      query.where("consultant_id", request.input("consultant_id"));
      query.with("consultant", (builder) => {
        builder.select(consultantFields);
      });

      const result = (await query.fetch()).toJSON();

      return response.status(200).json(result);
    } else {
      return response
        .status(423)
        .json({ message: "consultant Id is required!" });
    }
  }
  async test({ params, request, response, view }) {
    try {
      // const res = await createZoomMeeting({
      //   topic: "Discussion about today's changes",
      //   start_time: "2023-03-16T15:00:00",
      //   duration: 60,
      //   timezone: "India",
      //   agenda: "We will discuss about Today's project process",
      // });
      const date = request.input("booking_date");
      const time = request.input("booking_time");
      const data = moment
        .tz(`${date} ${time}`, "America/Los_Angeles")
        .format("YYYY-MM-DD HH:mm:ssZ");

      // console.log("Date1", moment.tz(data, "America/Los_Angeles").format("LT"));
      // console.log("Date2", moment.tz(data, "Asia/Kolkata").format("LT"));
      return response.send(data);
    } catch (error) {
      return response.send(error);
    }
  }
}

module.exports = BookingHistoryController;
