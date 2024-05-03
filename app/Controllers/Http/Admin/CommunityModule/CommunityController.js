'use strict'
const Query = use("Query");
const Database = use("Database");

const Community = use("App/Models/Admin/CommunityModule/Community");
const CommunityVisitor = use("App/Models/Admin/CommunityModule/CommunityVisitor");
const { dateFilterExtractor } = require("../../../../Helper/globalFunctions");
const Role = use("App/Models/Admin/UserModule/Role");
const requestOnly = [
	"name",
	"description",
	"image_url"
];

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
	async index ({ request, response, view, auth }) {
	  
		const role_id = auth.user.role_id;
		const query = Community.query();
		const search = request.input("search");
		const orderBy = request.input("orderBy");
		const orderDirection = request.input("orderDirection");
		const searchQuery = new Query(request, { order: "id" });
		const role = await Role.findOrFail(role_id);
		let role_name = role.name;

		if (orderBy && orderDirection) {
			query.orderBy(`${orderBy}`, orderDirection);
		}
		
		if (search) {
			query.where(searchQuery.search(['name']));
		}

		if(role && role_name.toLowerCase().includes('moderator')) {
			query.whereHas('userCommunities', (builder) => {
				builder.where('user_id', auth.user.id)
			})
		}

		query.select('id', 'name', 'description', 'url_slug', 'updated_at')
		query.withCount('communityPost as total_posts');
		query.withCount('getCommunityPostReply as total_post_reply', (builder) => {
			builder.where('parent_id', null)
		});
		query.withCount('communityMember as total_members');
		
		if (request.input("filters")) {
			const filters = JSON.parse(request.input("filters"));
			filters.forEach(async (filter) => {
				switch (filter.name) {
					case "updated_at":
				 		 query.whereRaw(
							await dateFilterExtractor({
					  			name: `communities.updated_at`,
					  			date: filter.value,
							})
				  		);
				 	 break;
					case "__meta__.total_posts":
						query.has('communityPost', '=', filter.value);
					break;
					case "__meta__.total_post_reply":
				 		query.has('getCommunityPostReply', '=', filter.value);
				 	break;
					 case "__meta__.total_members":
						  query.has('communityMember', '=', filter.value);
					  break;
					default:
				 		query.whereRaw(`communities.${filter.name} LIKE '%${filter.value}%'`);
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
		console.log("query", query.toSQL())
		var result;
		if (page && pageSize) {
			result = (await query.paginate(page, pageSize)).toJSON();
		} else {
			result = (await query.fetch()).toJSON();
		}

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
	async store ({ request, response, auth }) {
		const userId = auth.user.id;	
		const trx = await Database.beginTransaction();
		const body = request.only(requestOnly);
		
		try {	
			const query = await Community.create(
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
			return response.status(423).json({ message: "Something went wrong", error });
		}
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
		query.where("id", params.id);
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
	async update ({ params, request, response, auth }) {
		
		const body = request.only(requestOnly);
		const userId = auth.user.id;
		
		try {
			const updateData = await Community.findOrFail(params.id);
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
   * Delete a community with id.
   * DELETE communities/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
	async destroy ({ params, request, response }) {
		const query = await Community.findOrFail(params.id);
		try {
			await query.delete();
			return response.status(200).send({ message: "Delete successfully" });
		  
		} catch (error) {
			return response.status(423).send({
				message: "Something went wrong",
			});
		}
	}
	
	async community_members ({ request, response, view }) {
	  
		const query = CommunityVisitor.query();
		const community_id = request.input("community_id");
		const search = request.input("search");
		const orderBy = request.input("orderBy");
		const orderDirection = request.input("orderDirection");
		const searchQuery = new Query(request, { order: "id" });

		if (orderBy && orderDirection) {
			query.orderBy(`${orderBy}`, orderDirection);
		} else {
			query.orderBy('id', 'DESC');
		}
		
		if (search) {
			query.whereHas('visitor', (builder) => {
				builder.whereRaw(`name LIKE '%${search}%'`)
			})
		}

		query.where('community_id', community_id)
		query.select('id','visitor_id', 'created_at')

		query.with('visitor', (builder) => {
			builder.select('id','name')
		})

		if (request.input("filters")) {
			const filters = JSON.parse(request.input("filters"));
			filters.forEach(async (filter) => {
				switch (filter.name) {
					case "created_at":
				 		 query.whereRaw(
							await dateFilterExtractor({
					  			name: `community_visitors.created_at`,
					  			date: filter.value,
							})
				  		);
				 	break;
					case "visitor.name":
						query.whereHas('visitor', (builder) => {
							builder.whereRaw(`name LIKE '%${filter.value}%'`)
						})
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

	async remove_community_member ({ params, request, response }) {

		const query = await CommunityVisitor.findOrFail(params.id);
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

module.exports = CommunityController
