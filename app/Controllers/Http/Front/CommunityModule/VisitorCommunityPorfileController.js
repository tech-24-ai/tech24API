"use strict";
const Query = use("Query");
const Database = use("Database");

const Community = use("App/Models/Admin/CommunityModule/Community");
const CommunityPost = use("App/Models/Admin/CommunityModule/CommunityPost");
const CommunityPostReply = use(
  "App/Models/Admin/CommunityModule/CommunityPostReply"
);
const Vote = use("App/Models/Admin/CommunityModule/Vote");
const Badge = use("App/Models/Admin/CommunityModule/Badge");
const CommunityVisitorPoint = use(
  "App/Models/Admin/CommunityModule/CommunityVisitorPoint"
);
const Visitor = use("App/Models/Admin/VisitorModule/Visitor");
const {
  getSubmitAnswerPoints,
  getUpvoteAnswerPoints,
  getCorrectAnswerPoints,
} = require("../../../../Helper/visitorPoints");
const {
  getvisitorCurrentLevel,
} = require("../../../../Helper/visitorCurrentLevel");
const CommunityVisitorActivity = use(
  "App/Models/Admin/CommunityModule/CommunityVisitorActivity"
);
const CommunityVisitorLibrary = use(
  "App/Models/Admin/CommunityModule/CommunityVisitorLibrary"
);

const moment = require("moment");

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with visitorcommunityporfiles
 */
class VisitorCommunityPorfileController {
  /**
   * Show a list of all visitorcommunityporfiles.
   * GET visitorcommunityporfiles
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index({ request, response, view, auth }) {
    const userId = auth.user.id;
    let data = [];

    const totalAnswerQuery = CommunityPostReply.query();
    totalAnswerQuery.where("visitor_id", userId);

    const totalVoteQuery = Vote.query();
    totalVoteQuery.where("visitor_id", userId);

    const query = CommunityVisitorPoint.query();
    query.select("id", "visitor_id");
    query.where("visitor_id", userId);
    query.sum("points as totalPoints");
    const result1 = await query.first();
    let totalPoints = result1.totalPoints;
    totalPoints = totalPoints > 0 ? totalPoints : 0;

    const badgeQuery = Badge.query();
    badgeQuery.where("min_range", "<=", totalPoints);
    badgeQuery.where("max_range", ">=", totalPoints);
    const badgeResult = await badgeQuery.first();
    let currectBadge = badgeResult ? badgeResult.title : "";

    const badgeListsQuery = Badge.query();
    badgeListsQuery.select("id", "title", "min_range", "max_range");
    badgeListsQuery.orderBy("min_range", "ASC");
    let badgeListResult = (await badgeListsQuery.fetch()).toJSON();

    let current_level = "";
    if (totalPoints > 0 && badgeListResult) {
      badgeListResult.forEach((val, index) => {
        if (val.min_range <= totalPoints && val.max_range >= totalPoints) {
          current_level = index + 1;
        }
      });
    }

    let levelup_point = "";
    let levelup_tx = "";
    let upcoming_badge_point = 0;
    let req_point = 0;
    if (badgeResult) {
      const nextBadgeQuery = Badge.query();
      nextBadgeQuery.where("id", ">", badgeResult.id);
      const nextBadgeResult = await nextBadgeQuery.first();

      if (nextBadgeResult) {
        upcoming_badge_point = nextBadgeResult.min_range;
        req_point = upcoming_badge_point - totalPoints;
        levelup_point = req_point;
        levelup_tx = "points to level up";
      } else {
        levelup_tx = "You are already at maximum level.";
      }
    } else {
      const nextBadgeQuery = Badge.query();
      nextBadgeQuery.orderBy("id", "ASC");
      const nextBadgeResult = await nextBadgeQuery.first();
      upcoming_badge_point = nextBadgeResult ? nextBadgeResult.min_range : 0;

      if (upcoming_badge_point > 0) {
        req_point = upcoming_badge_point - totalPoints;
        levelup_point = req_point;
        levelup_tx = "points to level up";
      } else {
        req_point = totalPoints;
        levelup_point = req_point;
        levelup_tx = "points";
      }
    }

    let total_answer_given = await totalAnswerQuery.getCount();
    let total_upvotes = await totalVoteQuery.getCount();

    const visitor = await auth.authenticator("visitorAuth").getUser();

    data.push({
      profile_pic_url: visitor.profile_pic_url,
      contributions: total_answer_given + total_upvotes,
      total_points_earned: totalPoints,
      current_level: current_level > 0 ? current_level : 0,
      current_badge: currectBadge,
      level_up_points: levelup_point,
      level_up_text: levelup_tx,
      joined_at: moment(visitor.created_at).format("MMM DD, YYYY"),
    });

    return response.status(200).send({ data });
  }

  async visitor_community({ request, response, view, auth }) {
    const userId = auth.user.id;
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });

    const query = Community.query();

    if (search) {
      query.where(searchQuery.search(["name"]));
    }
    query.select("id", "name", "description", "url_slug", "image_url");

    query.whereHas("communityMember", (builder) => {
      builder.where("visitor_id", userId);
    });

    query.withCount("communityPost as total_posts");
    query.withCount("getCommunityPostReply as total_post_reply");
    query.withCount("communityMember as total_members");

    if (orderBy == "top_rated") {
      query.orderBy("total_posts", "DESC");
      query.orderBy("total_post_reply", "DESC");
    } else if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    } else {
      query.orderBy("id", "DESC");
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

  async queries_history({ request, response, view, auth }) {
    const userId = auth.user.id;
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });

    const query = CommunityPost.query();
    query.where("visitor_id", userId);
    query.where("status", 1);

    if (search) {
      query.where(searchQuery.search(["title"]));
    }

    query.with("community", (builder) => {
      builder.select("id", "name");
    });

    query.with("postTags", (builder) => {
      builder.select("id", "name");
    });

    query.with("visitor", (builder) => {
      builder.select("id", "name", "profile_pic_url");
    });

    query.withCount("communityPostReply as total_post_replies");
    query.withCount("communityVote as total_helpful", (builder) => {
      builder.where("vote_type", 1);
    });

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    } else {
      query.orderBy("id", "desc");
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
    var finalResult;
    if (page && pageSize) {
      result = (await query.paginate(page, pageSize)).toJSON();
      result.data = await this.response(result.data);
      finalResult = result;
    } else {
      result = (await query.fetch()).toJSON();
      finalResult = await this.response(result);
    }

    return response.status(200).send(finalResult);
  }

  async visitor_answer_history({ request, response, view, auth }) {
    const userId = auth.user.id;
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");

    const query = CommunityPostReply.query();
    query.where("visitor_id", userId);
    query.where("status", 1);

    query.with("communityPost", (builder) => {
      builder.select("id", "title");
    });

    query.with("visitor", (builder) => {
      builder.select("id", "name", "profile_pic_url");
    });

    query.withCount("postReplyVote as total_helpful", (builder) => {
      builder.where("vote_type", 1);
    });

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    } else {
      query.orderBy("id", "desc");
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
    var finalResult;
    if (page && pageSize) {
      result = (await query.paginate(page, pageSize)).toJSON();
      result.data = await this.response(result.data);
      finalResult = result;
    } else {
      result = (await query.fetch()).toJSON();
      finalResult = await this.response(result);
    }

    return response.status(200).send(finalResult);
  }

  async visitor_profile_levels({ request, response, view, auth }) {
    const userId = auth.user.id;
    let data = [];

    const visitor = await auth.authenticator("visitorAuth").getUser();

    const badgeQuery = Badge.query();
    badgeQuery.select("id", "title", "min_range", "max_range");
    badgeQuery.orderBy("min_range", "ASC");
    let badgeResult = (await badgeQuery.fetch()).toJSON();

    let cnt = 1;
    badgeResult.forEach((val) => {
      val.level = `Level ${cnt}`;
      cnt++;
    });

    const query = CommunityVisitorPoint.query();
    query.select("id", "visitor_id");
    query.where("visitor_id", userId);
    query.sum("points as totalPoints");
    const result = await query.first();
    let totalPoints = result.totalPoints;
    totalPoints = totalPoints > 0 ? totalPoints : 0;

    const correctAnsPoints = await getCorrectAnswerPoints();
    const subQuePoints = await getSubmitQuestionPoints();
    const ansPoints = await getSubmitAnswerPoints();
    const upvotePoints = await getUpvoteAnswerPoints();

    data.push({
      joined_at: moment(visitor.created_at).format("MMM YYYY"),
      total_points_earned: totalPoints,
      correct_answer_point_info: correctAnsPoints,
      answer_point_info: ansPoints,
      upvote_point_info: upvotePoints,
      submit_que_point_info: subQuePoints,
      leavels: badgeResult,
    });

    return response.status(200).send(data);
  }

  async visitor_activity_counter({ request, response, view, auth }) {
    const userId = auth.user.id;
    let data = [];

    const result = await CommunityVisitorActivity.query()
      .select("activity_type")
      .whereHas("communityPost", (builder) => {
        builder.where("status", 1);
      })
      .where(function () {
        this.whereHas("communityPostReply", (builder) => {
          builder.where("status", 1);
        }).orDoesntHave("communityPostReply");
      })
      .where("visitor_id", userId)
      .groupBy("activity_type")
      .count("id as total");

    const total_question_posted = result.filter(
      (item) => item.activity_type == 1
    );
    const total_answer_posted = result.filter(
      (item) => item.activity_type == 2
    );
    const total_comment_posted = result.filter(
      (item) => item.activity_type == 3
    );
    const total_upvotes = result.filter((item) => item.activity_type == 4);
    const total_downvotes = result.filter((item) => item.activity_type == 5);
    const total_question_views = result.filter(
      (item) => item.activity_type == 6
    );

    data.push({
      total_question_posted:
        total_question_posted.length > 0 ? total_question_posted[0]?.total : 0,
      total_answer_posted:
        total_answer_posted.length > 0 ? total_answer_posted[0]?.total : 0,
      total_comment_posted:
        total_comment_posted.length > 0 ? total_comment_posted[0]?.total : 0,
      total_upvotes: total_upvotes.length > 0 ? total_upvotes[0]?.total : 0,
      total_downvotes:
        total_downvotes.length > 0 ? total_downvotes[0]?.total : 0,
      total_question_views:
        total_question_views.length > 0 ? total_question_views[0]?.total : 0,
    });

    return response.status(200).send({ data });
  }

  async visitor_activities({ request, response, view, auth }) {
    const userId = auth.user.id;
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");

    const query = CommunityVisitorActivity.query();
    query.where("visitor_id", userId);

    query.with("communityPost", (builder) => {
      //builder.select("id", "title", "url_slug", "description");
      builder.with('visitor',(builder)=>{
        builder.select('id','name','profile_pic_url')
      })  
    });
    query.with("communityPostReply", (builder) => {
      // builder.select('id', 'title', 'url_slug')
      builder.with('visitor',(builder)=>{
        builder.select('id','name','profile_pic_url')
      })  
    });
    query.with("community", (builder) => {
      builder.select("id", "name", "url_slug", "description", "image_url");
    });

    query.whereHas("communityPost", (builder) => {
      builder.where("status", 1);
    });

    query.where(function () {
      this.whereHas("communityPostReply", (builder) => {
        builder.where("status", 1);
      }).orDoesntHave("communityPostReply");
    });

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    } else {
      query.orderBy("id", "desc");
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
   * Render a form to be used for creating a new visitorcommunityporfile.
   * GET visitorcommunityporfiles/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create({ request, response, view }) {}

  /**
   * Create/save a new visitorcommunityporfile.
   * POST visitorcommunityporfiles
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response }) {}

  /**
   * Display a single visitorcommunityporfile.
   * GET visitorcommunityporfiles/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params, request, response, view, auth }) {
    const userId = auth.user.id;

    const query = Visitor.query();
    query.with("country", (builder) => {
      builder.select("id", "name");
    });
    query.where("id", userId);
    const result = await query.firstOrFail();

    return response.status(200).send(result);
  }

  /**
   * Render a form to update an existing visitorcommunityporfile.
   * GET visitorcommunityporfiles/:id/edit
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async edit({ params, request, response, view }) {}

  /**
   * Update visitorcommunityporfile details.
   * PUT or PATCH visitorcommunityporfiles/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response }) {
    const query = await Visitor.findOrFail(params.id);

    let first_name = request.input("first_name");
    let last_name = request.input("last_name");
    let name;

    if (first_name && last_name) {
      name = first_name + " " + last_name;
    } else {
      name = first_name;
    }

    query.name = name;
    query.country_id = request.input("country");
    query.visitor_ip_city = request.input("city_district");
    query.designation = request.input("job_title");
    query.company = request.input("company");
    query.alternate_email = request.input("alternate_email");
    query.country_code = request.input("country_code");
    query.mobile = request.input("mobile");
    query.profile_pic_url = request.input("profile_pic_url");

    await query.save();
    return response.status(200).send({ message: "Updated successfully" });
  }

  /**
   * Delete a visitorcommunityporfile with id.
   * DELETE visitorcommunityporfiles/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response }) {}

  async response(result) {
    for (let i = 0; i < result.length; i++) {
      let res = result[i];
      let visitor_id = res.visitor_id;
      let comments = res.comments;
      let visitor_level = await getvisitorCurrentLevel(visitor_id);
      res.visitor.visitor_level = visitor_level;
      result[i] = res;

      if (comments && comments.length > 0) {
        await this.response(comments);
      }
    }
    return result;
  }

  async visitor_library({ request, response, view, auth }) {
    const userId = auth.user.id;
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const search = request.input("search");
    const searchQuery = new Query(request, { order: "id" });

    const query = CommunityVisitorLibrary.query();
    query.where("visitor_id", userId);

    query.with("visitor", (builder) => {
      builder.select("id", "name", "profile_pic_url");
    });

    query.with("blog", (builder) => {
      builder.select("id", "name", "slug", "image");
      builder.where("status", 1);
    });

    query.with("market_research", (builder) => {
      builder.select("id", "name", "seo_url_slug", "image");
    });

    if (search) {
      query.where(function () {
        this.whereHas("blog", (builder) => {
          builder.where("status", 1);
          builder.where(searchQuery.search(["name"]));
        }).orWhereHas("market_research", (builder) => {
          builder.where("status", 1);
          builder.where(searchQuery.search(["name"]));
        });
      });
    }

    query.where(function () {
      this.whereHas("blog", (builder) => {
        builder.where("status", 1);
      }).orWhereHas("market_research", (builder) => {
        builder.where("status", 1);
      });
    });

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    } else {
      query.orderBy("id", "desc");
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

  async delete_visitor_library({ params, request, response }) {
    const query = await CommunityVisitorLibrary.findOrFail(params.id);
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

module.exports = VisitorCommunityPorfileController;
