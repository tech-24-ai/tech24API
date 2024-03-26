"use strict";
const Donations = use("App/Models/Front/ConsultantModule/Donation");
const Query = use("Query");
const searchInFields = ["donation_amount", "created_at", ["transaction_details"]];

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with donations
 */
class DonationController {
  /**
   * Show a list of all donations.
   * GET donations
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index({ request, response, view, auth }) {
    const user_id = auth.user.id;
    const query = Donations.query();
    query.where({ user_id });
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

  async adminIndex({ request, response, view }) {
    const query = Donations.query();
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });
    query.with("visitor", (builder) => {
      builder.select("id", "name");
    });

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    // if (search) {
    //   query.where(searchQuery.search(searchInFields));
    // }
    if (search) {
      query.where(function () {
        this.whereRaw("LOWER(donation_amount) LIKE ?", [`%${search.toLowerCase()}%`])
          .orWhereRaw("LOWER(created_at) LIKE ?", [`%${search.toLowerCase()}%`])
          .orWhereHas("visitor", (visitorQuery) => {
            visitorQuery.whereRaw("LOWER(name) LIKE ?", [`%${search.toLowerCase()}%`]);
          })
          .orWhereRaw("LOWER(transaction_details) LIKE ?", [`%${search.toLowerCase()}%`]);
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
              .join("visitors", "donations.user_id", "=", "visitors.id")
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

  /**
   * Render a form to be used for creating a new donation.
   * GET donations/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create({ request, response, auth }) {
    const visitor_id = auth.user.id;
    try {
      const donationsData = await Donations.create({
        user_id: visitor_id,
        donation_amount: request.input("donation_amount"),
        payment_date: request.input("payment_date"),
        transaction_details: request.input("transaction_details"),
        remark: request.input("remark"),
      });
      return response.send(donationsData);
    } catch (error) {
      console.log("donation", error);
      response.status(423).json({ message: "something went wrong !" });
    }
  }

  /**
   * Create/save a new donation.
   * POST donations
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response }) {}

  /**
   * Display a single donation.
   * GET donations/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params, request, response, view }) {}

  /**
   * Render a form to update an existing donation.
   * GET donations/:id/edit
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async edit({ params, request, response, view }) {}

  /**
   * Update donation details.
   * PUT or PATCH donations/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response }) {}

  /**
   * Delete a donation with id.
   * DELETE donations/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response }) {}
}

module.exports = DonationController;
