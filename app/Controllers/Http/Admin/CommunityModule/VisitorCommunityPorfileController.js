'use strict'

const Query = use("Query");
const Database = use("Database");

const Badge = use("App/Models/Admin/CommunityModule/Badge");
const CommunityVisitorPoint = use("App/Models/Admin/CommunityModule/CommunityVisitorPoint");
const Visitor = use("App/Models/Admin/VisitorModule/Visitor");

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
  async index ({ request, response, view }) {

    const query = CommunityVisitorPoint.query();
    query.where('visitor_id', request.input("visitor_id"));

    query.with('communityPostReply')
    query.with('communityPostReply.visitor', (builder) => {
      builder.select('id','name')
    })

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

    const visitorQuery = Visitor.query()
    visitorQuery.select('id', 'name', 'email')
    visitorQuery.where('id', params.id)
    const result = await visitorQuery.first();

    const query = CommunityVisitorPoint.query();
    query.select('id','visitor_id')
    query.where("visitor_id", params.id);
    query.sum('points as totalPoints')
    const result1 = await query.first();
    let totalPoints = result1.totalPoints;
    result.totalPoints = (totalPoints > 0) ? totalPoints : 0;

    const badgeQuery = Badge.query()
    badgeQuery.where('min_range', '<=', totalPoints)
    badgeQuery.where('max_range', '>=', totalPoints)
    const badgeResult = await badgeQuery.first();
    let currectBadge = (badgeResult) ? badgeResult.title : '-'
    result.badge = currectBadge;

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
