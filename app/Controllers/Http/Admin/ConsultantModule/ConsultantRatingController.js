"use strict";
const Query = use("Query");
const moment = require("moment");
const Excel = require("exceljs");
const { dateFilterExtractor } = require("../../../../Helper/globalFunctions");

const ConsultantRating = use(
  "App/Models/Admin/ConsultantModule/ConsultantRating"
);
const Consultant = use("App/Models/Admin/ConsultantModule/Consultant");

const requestOnly = ["consultant_id", "rating", "review", "booking_id"];
const searchInFields = ["review", "rating", "status", "bookings.booking_date", "consultant.first_name", "visitor.name"];
class ConsultantRatingController {
  async index({ request, response, view }) {
    const query = ConsultantRating.query();
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const consultantId = request.input("consultant_id");
    const bookingId = request.input("booking_id");
    const visitorId = request.input("visitor_id");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });
    query.with("visitor", (builder) => {
      builder.select("id", "name", "email", "profile_pic_url");
    });
    query.with("consultant", (builder) => {
      builder.select("id", "first_name", "middle_name", "last_name", "image");
    });

    query.with("bookings", (builder) => {
      builder.select(
        "id",
        "booking_date",
        "duration",
        "amount_per_hour",
        "skill",
        "booking_status",
        "booking_time"
      );
    });
   
    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    // if (search) {
    //   query.where(searchQuery.search(searchInFields));
    // }

    if (search) {
      query.where(function () {
        this.whereRaw("LOWER(review) LIKE ?", [`%${search.toLowerCase()}%`])
          .orWhereRaw("LOWER(rating) LIKE ?", [`%${search.toLowerCase()}%`])
          .orWhereRaw("LOWER(status) LIKE ?", [`%${search.toLowerCase()}%`])
          .orWhereHas("bookings", (bookingQuery) => {
            bookingQuery.whereRaw("LOWER(booking_date) LIKE ?", [
              `%${search.toLowerCase()}%`,
            ]);
          })
          .orWhereHas("consultant", (consultantQuery) => {
            consultantQuery.whereRaw("LOWER(first_name) LIKE ?", [
              `%${search.toLowerCase()}%`,
            ]);
          })
          .orWhereHas("visitor", (visitorQuery) => {
            visitorQuery.whereRaw("LOWER(name) LIKE ?", [
              `%${search.toLowerCase()}%`,
            ]);
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
          case "visitor.name": {
            query
              .join(
                "visitors",
                "consultant_ratings.visitor_id",
                "=",
                "visitors.id"
              )
              .where("visitors.name", "LIKE", `%${filter.value}%`);
            break;
          }

          case "consultant.first_name": {
            query
              .join(
                "consultants",
                "consultant_ratings.consultant_id",
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

    if (consultantId) {
      query.where("consultant_id", consultantId);
    }

    if (bookingId) {
      query.where("booking_id", bookingId);
    }

    if (visitorId) {
      query.where("visitor_id", visitorId);
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
    const body = request.only(requestOnly);
    const userId = auth.user.id;
    const query = await ConsultantRating.create({
      ...body,
      visitor_id: userId,
    });

    return response.status(200).json({ message: "Create successfully" });
  }

  async show({ params, request, response, view }) {
    const query = ConsultantRating.query();
    query.where("id", params.id);
    query.with("visitor", (builder) => {
      builder.select("id", "name", "email", "profile_pic_url");
    });
    query.with("consultant", (builder) => {
      builder.select("id", "first_name", "middle_name", "last_name", "image");
    });
    const result = await query.firstOrFail();
    return response.status(200).json(result);
  }

  async update({ params, request, response }) {
    const status = request.input("status");
    const query = await ConsultantRating.findOrFail(params.id);
    query.status = status;
    await query.save();
    if (status == "Approved") {
      await this.updateRating(query.consultant_id);
    }
    return response.status(200).send({ message: `Review ${status}` });
  }

  async destroy({ params, request, response }) {}

  async updateRating(consultantId) {
    const [result] = await ConsultantRating.query()
      .where("consultant_id", consultantId)
      .avg("rating as avg_rating");

    const query = await Consultant.findOrFail(consultantId);
    query.avg_rating = result.avg_rating;
    await query.save();
  }
}

module.exports = ConsultantRatingController;
