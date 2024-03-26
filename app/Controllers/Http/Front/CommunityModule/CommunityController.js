'use strict'
const Query = use("Query");
const Database = use("Database");

const Tag = use("App/Models/Admin/CommunityModule/Tag");
const Community = use("App/Models/Admin/CommunityModule/Community");

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with communities
 */
class CommunityController {
  /**
   * Show a list of all communities.
   * GET communities
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
	async index ({ request, response, view }) {
		
		const search = request.input("search");
		const searchQuery = new Query(request, { order: "id" });
		
		const query = Community.query();
		
		if (search) {
			query.where(searchQuery.search(['name']));
		}
		query.select('id', 'name', 'description', 'url_slug', 'image_url')

		query.withCount('communityPost as total_posts');
		query.withCount('getCommunityPostReply as total_post_reply');
		
		var result = (await query.fetch()).toJSON();
		return response.status(200).send(result);
	}

  /**
   * Render a form to be used for creating a new community.
   * GET communities/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
	async create ({ request, response, view }) {
	}

  /**
   * Create/save a new community.
   * POST communities
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
	async store ({ request, response }) {
	}

  /**
   * Display a single community.
   * GET communities/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
	async show ({ params, request, response, view }) {

    const query = Community.query();
		query.where("url_slug", params.slug);
		query.withCount('communityPost as total_posts');
		
		const result = await query.firstOrFail();
		return response.status(200).send(result);
	}

  /**
   * Render a form to update an existing community.
   * GET communities/:id/edit
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
	async edit ({ params, request, response, view }) {
	}

  /**
   * Update community details.
   * PUT or PATCH communities/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
	async update ({ params, request, response }) {
	}

  /**
   * Delete a community with id.
   * DELETE communities/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
	async destroy ({ params, request, response }) {
	}
}

module.exports = CommunityController
