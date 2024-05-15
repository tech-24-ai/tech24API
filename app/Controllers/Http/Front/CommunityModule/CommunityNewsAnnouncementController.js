"use strict";
const Query = use("Query");
const Database = use("Database");

const CommunityNewsAnnouncement = use(
  "App/Models/Admin/CommunityModule/CommunityNewsAnnouncement"
);
const { dateFilterExtractor } = require("../../../../Helper/globalFunctions");

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
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");

    query.select(
      "id",
      "community_id",
      "title",
      "url_slug",
      "short_description",
      "description",
      "created_at"
    );

    query.with("community", (builder) => {
      builder.select("id", "name");
    });
    query.where("community_id", request.input("community_id"));
    query.where("status", 1);

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
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
  async store({ request, response }) {}

  /**
   * Display a single communitynewsannouncement.
   * GET communitynewsannouncements/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params, request, response, view, auth }) {
    const userId = auth.user.id;

    const query = CommunityNewsAnnouncement.query();
    query.select(
      "id",
      "community_id",
      "title",
      "url_slug",
      "short_description",
      "description",
      "created_at",
      "updated_at"
    );
    query.with("community", (builder) => {
      builder.with("communityMember", (builder) => {
        builder
          .select("id", "visitor_id", "community_id", "created_at")
          .where("visitor_id", userId);
      });
      builder.withCount("communityPost as total_posts", (builder) => {
        builder.where("status", 1);
      });
      builder.withCount("communityMember as total_members", (builder) => {
        builder.where("status", 1);
      });
      builder.withCount(
        "getCommunityPostReply as total_post_reply",
        (builder) => {
          builder.where("community_post_replies.status", 1);
          builder.where("community_post_replies.parent_id", null);
        }
      );
    });
    query.where("id", params.id);
    query.where("status", 1);
    const result = await query.firstOrFail();
    return response.status(200).send(result);
  }

  async showBySlug({ params, request, response, view, auth }) {
    const userId = auth.user.id;

    const query = CommunityNewsAnnouncement.query();
    query.select(
      "id",
      "community_id",
      "title",
      "url_slug",
      "short_description",
      "description",
      "created_at",
      "updated_at"
    );
    query.with("community", (builder) => {
      builder.with("communityMember", (builder) => {
        builder
          .select("id", "visitor_id", "community_id", "created_at")
          .where("visitor_id", userId);
      });
      builder.withCount("communityPost as total_posts", (builder) => {
        builder.where("status", 1);
      });
      builder.withCount("communityMember as total_members", (builder) => {
        builder.where("status", 1);
      });
      builder.withCount(
        "getCommunityPostReply as total_post_reply",
        (builder) => {
          builder.where("community_post_replies.status", 1);
          builder.where("community_post_replies.parent_id", null);
        }
      );
    });
    query.where("url_slug", params.slug);
    query.where("status", 1);
    const result = await query.firstOrFail();
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
  async update({ params, request, response }) {}

  /**
   * Delete a communitynewsannouncement with id.
   * DELETE communitynewsannouncements/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response }) {}
}

module.exports = CommunityNewsAnnouncementController;
