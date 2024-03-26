"use strict";
const Database = use("Database");
const crypto = require("crypto");
const Config = use("App/Models/Admin/ConfigModule/Config");
const Query = use("Query");
const moment = require("moment");
const Excel = require("exceljs");
const { dateFilterExtractor } = require("../../../../Helper/globalFunctions");
const { KEYS } = require("../../../../Helper/constants");
const BookingLog = use("App/Models/Admin/ConsultantModule/BookingLog");
const BookingHistory = use("App/Models/Admin/ConsultantModule/BookingHistory");
const VisitorBookingAddon = use(
  "App/Models/Admin/ConsultantModule/VisitorBookingAddon"
);
const BookingFreeAddon = use(
  "App/Models/Admin/ConsultantModule/BookingFreeAddon"
);
const VisitorCreditRedeemHistory = use(
  "App/Models/Admin/ConsultantModule/VisitorCreditRedeemHistory"
);
const BookingTransactionHistory = use(
  "App/Models/Admin/ConsultantModule/BookingTransactionHistory"
);
const VisitorCreditHistory = use(
  "App/Models/Admin/ConsultantModule/VisitorCreditHistory"
);
const Consultant = use("App/Models/Admin/ConsultantModule/Consultant");
const ZoomEventLog = use("App/Models/ZoomEventLog");

const requestOnly = ["end_time", "penalty", "refund", "meeting_transcript"];
const searchInFields = [
  "start_time",
  "end_time",
  "booking.booking_date",
  "meeting_status",
  "total_duration",
  "total_billing",
  "penalty",
  "refund",
  "created_at",
];

class BookingLogController {
  async index({ request, response, view }) {
    const query = BookingLog.query();
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });
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
        builder.whereRaw("LOWER(start_time) LIKE ?", [`%${search.toLowerCase()}%`])
          .orWhereRaw("LOWER(end_time) LIKE ?", [`%${search.toLowerCase()}%`])
          .orWhereHas("booking", (bookingQuery) => {
            bookingQuery.whereRaw("LOWER(booking_date) LIKE ?", [`%${search.toLowerCase()}%`]);
          })
          .orWhereRaw("LOWER(meeting_status) LIKE ?", [`%${search.toLowerCase()}%`])
          .orWhereRaw("LOWER(total_duration) LIKE ?", [`%${search.toLowerCase()}%`])
          .orWhereRaw("LOWER(total_billing) LIKE ?", [`%${search.toLowerCase()}%`])
          .orWhereRaw("LOWER(penalty) LIKE ?", [`%${search.toLowerCase()}%`])
          .orWhereRaw("LOWER(refund) LIKE ?", [`%${search.toLowerCase()}%`])
          .orWhereRaw("LOWER(created_at) LIKE ?", [`%${search.toLowerCase()}%`])
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

          case "booking.visitor.name": {
            query
              .join("visitors", "booking_logs.id", "=", "visitors.id")
              .where("visitors.name", "LIKE", `%${filter.value}%`);
            break;
          }

          case "booking.consultant.first_name": {
            query
              .join(
                "booking_histories",
                "booking_logs.booking_history_id",
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

  async store({ request, response, auth }) {
    const trx = await Database.beginTransaction();
    try {
      let bookingData = await BookingHistory.findOrFail(
        request.body.booking_history_id,
        trx
      );
      const query = await BookingLog.create(
        {
          start_time: request.body.start_time,
          booking_history_id: bookingData.id,
          is_credit: bookingData.is_credit,
        },
        trx
      );
      await trx.commit();
      return response
        .status(200)
        .json({ message: "Create successfully", data: query });
    } catch (error) {
      return response
        .status(423)
        .json({ message: "Not able to find booking details", error });
    }
  }

  async create({ request, response, auth }) {
    const trx = await Database.beginTransaction();
    const body = request.only(requestOnly);
    console.log("start_time", request.body.start_time);
    console.log("booking_history_id", request.body.booking_history_id);

    try {
      const data = request.body;
      let bookingData = await BookingHistory.findOrFail(
        request.body.booking_history_id,
        trx
      );

      const start_time = moment(data.start_time, "HH:mm:ss");
      const end_time = moment(data.end_time, "HH:mm:ss");
      let total_duration = Math.round(
        end_time.diff(start_time, "minutes", true)
      );
      const amountPerMin = bookingData.amount_per_hour / 60;
      const total_billing = (total_duration * amountPerMin).toFixed();
      console.log({
        total_billing,
        start_time,
        end_time,
        total_duration,
      });
      return response.send(bookingData);
      const query = await BookingLog.create(
        {
          ...body,
          meeting_status: "Completed",
          is_credit: bookingData.is_credit,
          total_duration,
          total_billing,
        },
        trx
      );

      if (bookingData.is_credit) {
        let visitorCredits = await VisitorCreditHistory.findBy(
          "visitor_id",
          bookingData.visitor_id
        );
        let visitorRedeem = await VisitorCreditRedeemHistory.findBy(
          "booking_id",
          request.input("booking_history_id")
        );
        const transactionHistory = await BookingTransactionHistory.findBy(
          "booking_history_id",
          request.input("booking_history_id")
        );
        const credit_used = Math.round(
          total_billing + transactionHistory.taxes
        );
        const credit_returned = Math.round(
          visitorRedeem.credit_used - credit_used
        );
        const current_credit_balance = Math.round(
          visitorRedeem.current_credit_balance + credit_returned
        );
        console.log(
          `Duration: ${total_duration}\nReturned:${credit_returned}\nBalance:${current_credit_balance}`
        );
        visitorRedeem.merge({
          booking_log_id: query.id,
          credit_used,
          credit_returned,
          current_credit_balance,
        });
        await visitorRedeem.save(trx);
        const totalCreditBalance = visitorCredits.credit + credit_returned;
        await VisitorCreditRedeemHistory.create({
          booking_id: bookingData.id,
          visitor_id: bookingData.visitor_id,
          booking_log_id: query.id,
          credit_returned,
          initial_credit_balance: visitorCredits.credit,
          current_credit_balance: totalCreditBalance,
          type: "Credit",
        });
      }

      await trx.commit();
      return response.status(200).json({ message: "Create successfully" });
    } catch (error) {
      console.log(error);
      return response
        .status(423)
        .json({ message: "Not able to find booking details", error });
    }
  }

  async show({ params, request, response, view }) { }

  async update({ params, request, response, auth }) {
    const trx = await Database.beginTransaction();
    try {
      const data = request.body;
      let bookingLog = await BookingLog.findOrFail(params.id, trx);
      let bookingData = await BookingHistory.findOrFail(
        bookingLog.booking_history_id,
        trx
      );
      const transactionHistory = await BookingTransactionHistory.findBy(
        "booking_history_id",
        bookingLog.booking_history_id
      );

      const start_time = moment(bookingLog.start_time, "HH:mm:ss");
      const end_time = moment(data.end_time, "HH:mm:ss");
      let total_duration = Math.round(
        end_time.diff(start_time, "minutes", true)
      );

      const amountPerMin = bookingData.amount_per_hour / 60;
      const total_billing = (total_duration * amountPerMin).toFixed(2);

      await bookingLog.merge(
        {
          end_time: data.end_time ? data.end_time : null,
          penalty: data.penalty ? data.penalty : null,
          refund: data.refund ? data.refund : null,
          meeting_transcript: data.meeting_transcript
            ? data.meeting_transcript
            : null,
          meeting_status: "Completed",
          total_duration,
          total_billing,
        },
        trx
      );
      await bookingLog.save(trx);
      const consultant = await Consultant.findOrFail(
        bookingData.consultant_id,
        trx
      );
      consultant.total_payment = transactionHistory.total_amount;
      await consultant.save(trx);
      if (bookingData.is_credit) {
        let visitorCredits = await VisitorCreditHistory.findBy(
          "visitor_id",
          bookingData.visitor_id
        );
        let visitorRedeem = await VisitorCreditRedeemHistory.findBy(
          "booking_id",
          bookingLog.booking_history_id
        );

        const credit_used = Math.round(
          total_billing + transactionHistory.taxes
        );
        const credit_returned = Math.round(
          visitorRedeem.credit_booked - credit_used
        );
        const current_credit_balance = Math.round(
          visitorRedeem.current_credit_balance + credit_returned
        );

        visitorRedeem.merge({
          booking_log_id: params.id,
          credit_used,
          credit_returned,
          current_credit_balance,
        });
        await visitorRedeem.save(trx);
        const totalCreditBalance = visitorCredits.credit + credit_returned;
        await VisitorCreditRedeemHistory.create({
          booking_id: bookingData.id,
          visitor_id: bookingData.visitor_id,
          booking_log_id: bookingLog.id,
          credit_returned,
          initial_credit_balance: visitorCredits.credit,
          current_credit_balance: totalCreditBalance,
          type: "Credit",
        });
        visitorCredits.credit = totalCreditBalance;
        await visitorCredits.save(trx);
      }

      const freeAddonIds = await BookingFreeAddon.query(trx)
        .whereRaw(`duration <=?`, [total_duration])
        .pluck("id");
      if (freeAddonIds && freeAddonIds.length) {
        const visitorAddons = freeAddonIds.map((data) => ({
          addon_id: data,
          booking_id: bookingData.id,
          visitor_id: bookingData.visitor_id,
          booking_logs_id: bookingLog.id,
        }));
        await VisitorBookingAddon.createMany(visitorAddons, trx);
      }

      bookingData.booking_status = "Scheduled";
      await bookingData.save(trx);
      await trx.commit();
      return response.status(200).json({ message: "Update successfully" });
    } catch (error) {
      console.log(error);
      return response
        .status(423)
        .json({ message: "Something went wrong", error });
    }
  }

  async destroy({ params, request, response }) { }

  async zoomMeetingEvent({ params, request, response }) {
    // console.log("requestServer", request.body);

    try {
      let validationToken = await Config.findOrCreate(
        { key: KEYS.ZOOM_GET_VALIDATION_TOKEN },
        { key: KEYS.ZOOM_GET_VALIDATION_TOKEN, value: "WU7FOyfzRoerz1tA8-r_uQ" }
      );

      await ZoomEventLog.create({
        date: moment().format("YYYY-MM-DD"),
        event: request.input("event"),
        payload: JSON.stringify(request.input("payload")),
      });

      // validation
      if (request.body.event === "endpoint.url_validation") {
        const hashForValidate = crypto
          .createHmac("sha256", validationToken.value)
          .update(request.body.payload.plainToken)
          .digest("hex");

        response.status(200);
        return response.json({
          plainToken: request.body.payload.plainToken,
          encryptedToken: hashForValidate,
        });
      }
      if (request.body.event === "meeting.started") {
        const { start_time, id, timezone } = request.body.payload.object;
        const BookingHistoryData = await BookingHistory.findBy({
          zoom_meeting_id: id,
        });
        request.body.start_time = moment(start_time)
          .tz(timezone)
          .format("HH:mm:ss");
        request.body.booking_history_id = BookingHistoryData.id;
        await this.store({ request, response });
        return false;
      }
      if (request.body.event === "meeting.ended") {
        const { start_time, end_time, id, timezone } =
          request.body.payload.object;
        const bookingHistoryData = await BookingHistory.findBy({
          zoom_meeting_id: id,
        });
        const bookingLog = await BookingLog.findBy({
          booking_history_id: bookingHistoryData.id,
        });
        request.body.start_time = moment(start_time)
          .tz(timezone)
          .format("HH:mm:ss");
        request.body.end_time = moment(end_time)
          .tz(timezone)
          .format("HH:mm:ss");
        params.id = bookingLog.id;
        await this.update({ params, request, response });
        return false;
      }
    } catch (error) {
      console.log(error);
    }
  }
  async zoomMeetingEventAuth({ params, request, response }) {
    // console.log("requestAuth", request.body);

    // validation
    if (request.body.event === "endpoint.url_validation") {
      let validationToken = await Config.findOrCreate(
        { key: KEYS.ZOOM_GET_VALIDATION_TOKEN },
        { key: KEYS.ZOOM_GET_VALIDATION_TOKEN, value: "0w-cwxFFT5CCyNJwrrY1wg" }
      );
      const hashForValidate = crypto
        .createHmac("sha256", "tGDp4m0lTXqNpLojRIjhtw")
        .update(request.body.payload.plainToken)
        .digest("hex");

      response.status(200);
      response.json({
        plainToken: request.body.payload.plainToken,
        encryptedToken: hashForValidate,
      });
    }

    if (request.body.event === "meeting.started") {
      const { start_time, id, timezone } = request.body.payload.object;
      const BookingHistoryData = await BookingHistory.findBy({
        zoom_meeting_id: id,
      });
      request.body.start_time = moment(start_time)
        .tz(timezone)
        .format("HH:mm:ss");
      request.body.booking_history_id = BookingHistoryData.id;
      await this.store({ request, response });
      return false;
    }
    if (request.body.event === "meeting.ended") {
      const { start_time, end_time, id, timezone } =
        request.body.payload.object;
      const bookingHistoryData = await BookingHistory.findBy({
        zoom_meeting_id: id,
      });
      const bookingLog = await BookingLog.findBy({
        booking_history_id: bookingHistoryData.id,
      });
      request.body.start_time = moment(start_time)
        .tz(timezone)
        .format("HH:mm:ss");
      request.body.end_time = moment(end_time).tz(timezone).format("HH:mm:ss");
      params.id = bookingLog.id;
      await this.update({ params, request, response });
      return false;
    }
  }
  async zoomMeetingEventWebhook({ params, request, response }) {
    console.log("requestWebhook", request.body);

    // validation
    if (request.body.event === "endpoint.url_validation") {
      let validationToken = await Config.findOrCreate(
        { key: KEYS.ZOOM_GET_VALIDATION_TOKEN },
        { key: KEYS.ZOOM_GET_VALIDATION_TOKEN, value: "0w-cwxFFT5CCyNJwrrY1wg" }
      );
      const hashForValidate = crypto
        .createHmac("sha256", "uIL6xW7UQTOdeYYOEe3-aw")
        .update(request.body.payload.plainToken)
        .digest("hex");

      response.status(200);
      response.json({
        plainToken: request.body.payload.plainToken,
        encryptedToken: hashForValidate,
      });
    }

    const message = `v0:${request.headers["x-zm-request-timestamp"]
      }:${JSON.stringify(request.body)}`;

    const hashForVerify = crypto
      .createHmac("sha256", "uIL6xW7UQTOdeYYOEe3-aw")
      .update(message)
      .digest("hex");

    const signature = `v0=${hashForVerify}`;

    if (request.headers["x-zm-signature"] === signature) {
      // Webhook request came from Zoom
      console.log("WebhookMessageCall");
      return response.status(200).json({ received: true });
    } else {
      // Webhook request did not come from Zoom
      console.log("WebhookMessageNotCall");
      return response.status(204).json({ received: false });
    }
  }
}

module.exports = BookingLogController;
