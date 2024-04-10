'use strict'
const Query = use("Query");
const Database = use("Database");

const CommunityPost = use("App/Models/Admin/CommunityModule/CommunityPost");
const CommunityPostReply = use("App/Models/Admin/CommunityModule/CommunityPostReply");
const Vote = use("App/Models/Admin/CommunityModule/Vote");
const Badge = use("App/Models/Admin/CommunityModule/Badge");
const CommunityVisitorPoint = use("App/Models/Admin/CommunityModule/CommunityVisitorPoint");
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
	async index ({ request, response, view, auth }) {
		
		const userId = auth.user.id;
		let data = [];
		
		const totalAnswerQuery = CommunityPostReply.query();
		totalAnswerQuery.where('visitor_id', userId);
		
		const totalVoteQuery = Vote.query();
		totalVoteQuery.where('visitor_id', userId);

    const query = CommunityVisitorPoint.query();
    query.select('id','visitor_id')
    query.where("visitor_id", userId);
    query.sum('points as totalPoints')
    const result1 = await query.first();
    let totalPoints = result1.totalPoints;
    totalPoints = (totalPoints > 0) ? totalPoints : 0;

    const badgeQuery = Badge.query()
    badgeQuery.where('min_range', '<=', totalPoints)
    badgeQuery.where('max_range', '>=', totalPoints)
    const badgeResult = await badgeQuery.first();
    let currectBadge = (badgeResult) ? badgeResult.title : '-'

    let levelup_point = ""; let upcoming_badge_point = 0; let req_point = 0;
    if(badgeResult)
    {
      const nextBadgeQuery = Badge.query()
      nextBadgeQuery.where('id', '>', badgeResult.id)
      const nextBadgeResult = await nextBadgeQuery.first();

      if(nextBadgeResult) {
        upcoming_badge_point = nextBadgeResult.min_range;
        req_point = upcoming_badge_point - totalPoints;
        levelup_point = `${req_point} points to level up`;
      } else {
        levelup_point = "You are already at maximum level.";
      }    
    } else {
      const nextBadgeQuery = Badge.query()
      nextBadgeQuery.orderBy('id', 'ASC')
      const nextBadgeResult = await nextBadgeQuery.first();
      upcoming_badge_point = (nextBadgeResult) ? nextBadgeResult.min_range : 0;

      if(upcoming_badge_point > 0) {
        req_point = upcoming_badge_point - totalPoints;
        levelup_point = `${req_point} points to level up`;
      } else {
        req_point = totalPoints;
        levelup_point = `${req_point} points`;
      }    
    }

    let total_answer_given = await totalAnswerQuery.getCount();
    let total_upvotes = await totalVoteQuery.getCount();

    const visitor = await auth.authenticator("visitorAuth").getUser();

		data.push({
			'contributions' : total_answer_given + total_upvotes,
			'total_points_earned' : totalPoints,
			'current_badge' : currectBadge,
			'level_up_points' : levelup_point,
			'joined_at' : moment(visitor.created_at).format("MMM, DD YYYY"),
		})
		
		return response.status(200).send({ data });
	}

	async queries_history ({ request, response, view, auth }) {
		
		const userId = auth.user.id;
		const orderBy = request.input("orderBy");
		const orderDirection = request.input("orderDirection");
		
		const query = CommunityPost.query();
		query.where("visitor_id", userId);

    query.withCount('communityVote as total_helpful');
		
		if (orderBy && orderDirection) {
			query.orderBy(`${orderBy}`, orderDirection);
		} else {
			query.orderBy('id', 'desc');
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

	async visitor_answer_history ({ request, response, view, auth }) {
		
		const userId = auth.user.id;
		const orderBy = request.input("orderBy");
		const orderDirection = request.input("orderDirection");
		
		const query = CommunityPostReply.query();
		query.where("visitor_id", userId);

    query.with('communityPost',(builder)=>{
			builder.select('id','title')
		});

    query.withCount('postReplyVote as total_helpful');
		
		if (orderBy && orderDirection) {
			query.orderBy(`${orderBy}`, orderDirection);
		} else {
			query.orderBy('id', 'desc');
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

	async visitor_points_history ({ request, response, view, auth }) {
		
    const userId = auth.user.id;
    const orderBy = request.input("orderBy");
		const orderDirection = request.input("orderDirection");

		const query = CommunityVisitorPoint.query();
    query.where("visitor_id", userId);

    query.with('communityPostReply')
    query.with('communityPostReply.visitor', (builder) => {
      builder.select('id','name')
    })

    if (orderBy && orderDirection) {
			query.orderBy(`${orderBy}`, orderDirection);
		} else {
			query.orderBy('id', 'desc');
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
  async create ({ request, response, view }) {
  }

  /**
   * Create/save a new visitorcommunityporfile.
   * POST visitorcommunityporfiles
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response }) {
  }

  /**
   * Display a single visitorcommunityporfile.
   * GET visitorcommunityporfiles/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
	async show ({ params, request, response, view }) {
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
  async edit ({ params, request, response, view }) {
  }

  /**
   * Update visitorcommunityporfile details.
   * PUT or PATCH visitorcommunityporfiles/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params, request, response }) {
  }

  /**
   * Delete a visitorcommunityporfile with id.
   * DELETE visitorcommunityporfiles/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params, request, response }) {
  }
}

module.exports = VisitorCommunityPorfileController
