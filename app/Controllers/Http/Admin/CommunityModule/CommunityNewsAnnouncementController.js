"use strict";
const Query = use("Query");
const Database = use("Database");

const CommunityNewsAnnouncement = use(
  "App/Models/Admin/CommunityModule/CommunityNewsAnnouncement"
);
const { dateFilterExtractor } = require("../../../../Helper/globalFunctions");

const requestOnly = [
  "community_id",
  "title",
  "short_description",
  "description",
  "status",
];

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with communitynewsannouncements
 */
class CommunityNewsAnnouncementController {
  /**
   * Show a list of all communitynewsannouncements.
   * GET communitynewsannouncements
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index({ request, response, view }) {
    const query = CommunityNewsAnnouncement.query();
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });

    query.with("community", (builder) => {
      builder.select("id", "name");
    });

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    if (search) {
      query.where(searchQuery.search(["title"]));
    }

    if (request.input("filters")) {
      const filters = JSON.parse(request.input("filters"));
      filters.forEach(async (filter) => {
        switch (filter.name) {
          case "updated_at":
            query.whereRaw(
              await dateFilterExtractor({
                name: `community_news_announcements.updated_at`,
                date: filter.value,
              })
            );
            break;
          case "community.name":
            query.whereHas("community", (builder) => {
              builder.whereRaw(`name LIKE '%${filter.value}%'`);
            });
            break;
            break;
          case "status":
            query.whereIn("status", filter.value);
            break;
          default:
            query.whereRaw(
              `community_news_announcements.${filter.name} LIKE '%${filter.value}%'`
            );
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
    } else {
      result = (await query.fetch()).toJSON();
    }

    return response.status(200).send(result);
  }

  /**
   * Render a form to be used for creating a new communitynewsannouncement.
   * GET communitynewsannouncements/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create({ request, response, view }) {}

  /**
   * Create/save a new communitynewsannouncement.
   * POST communitynewsannouncements
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response, auth }) {
    const userId = auth.user.id;
    const trx = await Database.beginTransaction();
    const body = request.only(requestOnly);

    try {
      const query = await CommunityNewsAnnouncement.create(
        {
          ...body,
          created_by: userId,
          updated_by: userId,
        },
        trx
      );

      await trx.commit();
      return response.status(200).json({ message: "Create successfully" });
    } catch (error) {
      console.log(error);
      trx.rollback();
      return response
        .status(423)
        .json({ message: "Something went wrong", error });
    }
  }

  /**
   * Display a single communitynewsannouncement.
   * GET communitynewsannouncements/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params, request, response, view }) {
    const query = CommunityNewsAnnouncement.query();
    query.where("id", params.id);
    const result = await query.firstOrFail();

    const st = result.status;
    result.status = st.toString();

    return response.status(200).send(result);
  }

  /**
   * Render a form to update an existing communitynewsannouncement.
   * GET communitynewsannouncements/:id/edit
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async edit({ params, request, response, view }) {}

  /**
   * Update communitynewsannouncement details.
   * PUT or PATCH communitynewsannouncements/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response, auth }) {
    const body = request.only(requestOnly);
    const userId = auth.user.id;

    try {
      const updateData = await CommunityNewsAnnouncement.findOrFail(params.id);
      updateData.merge(body);
      updateData.updated_by = userId;
      await updateData.save();
      return response.status(200).json({ message: "Update successfully" });
    } catch (error) {
      console.log(error);
      return response.status(200).json({ message: "Something went wrong" });
    }
  }

  /**
   * Delete a communitynewsannouncement with id.
   * DELETE communitynewsannouncements/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response }) {
    const query = await CommunityNewsAnnouncement.findOrFail(params.id);
    try {
      await query.delete();
      return response.status(200).send({ message: "Delete successfully" });
    } catch (error) {
      return response.status(423).send({
        message: "Something went wrong",
      });
    }
  }
}

module.exports = CommunityNewsAnnouncementController;
