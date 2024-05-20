'use strict'
const Query = use("Query");
const Database = use("Database");

const ReportAbuse = use("App/Models/Admin/CommunityModule/ReportAbuse");
const { dateFilterExtractor } = require("../../../../Helper/globalFunctions");

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with reportabuses
 */
class ReportAbuseController {
  /**
   * Show a list of all reportabuses.
   * GET reportabuses
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
	async index ({ request, response, view }) {
		
		const query = ReportAbuse.query();
		const search = request.input("search");
		const orderBy = request.input("orderBy");
		const orderDirection = request.input("orderDirection");
		const from_date = request.input("from_date");
		const to_date = request.input("to_date");
		const searchQuery = new Query(request, { order: "id" });
		
		query.with('abuseType',(builder)=>{
			builder.select('id','name')
		});
		
		query.with('visitor',(builder)=>{
			builder.select('id','name')
		});
		
		query.with('community',(builder)=>{
			builder.select('id','name')
		});
		
		if (orderBy && orderDirection) {
			query.orderBy(`${orderBy}`, orderDirection);
		} else {
			query.orderBy('id', 'desc');
		}

		if (search) {
			query.where(searchQuery.search(['description']));
		}

   		if (request.input("filters")) {
			const filters = JSON.parse(request.input("filters"));
			filters.forEach(async (filter) => {
				switch (filter.name) {
					case "updated_at":
				 		query.whereRaw(
							await dateFilterExtractor({
								name: `report_abuses.updated_at`,
								date: filter.value,
							})
						);
				 	break;
					 case "abuseType.name":
						 query.whereHas('abuseType', (builder) => {
							 builder.whereRaw(`name LIKE '%${filter.value}%'`)
						 })
					 break;
					case "community.name":
						query.whereHas('community', (builder) => {
							builder.whereRaw(`name LIKE '%${filter.value}%'`)
						})
					break;
					case "visitor.name":
						query.whereHas('visitor', (builder) => {
							builder.whereRaw(`name LIKE '%${filter.value}%'`)
						})
					break;
		  			default:
				 		query.whereRaw(`report_abuses.${filter.name} LIKE '%${filter.value}%'`);
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
   * Render a form to be used for creating a new reportabuse.
   * GET reportabuses/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create ({ request, response, view }) {
  }

  /**
   * Create/save a new reportabuse.
   * POST reportabuses
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response }) {
  }

  /**
   * Display a single reportabuse.
   * GET reportabuses/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
	async show ({ params, request, response, view }) {
		
		const query = ReportAbuse.query();
		query.where("id", params.id);
		
		query.with('abuseType',(builder)=>{
			builder.select('id','name')
		});
		
		query.with('visitor',(builder)=>{
			builder.select('id','name')
		});
		
		query.with('community',(builder)=>{
			builder.select('id','name')
		});
		
		query.with('communityPost',(builder)=>{
			builder.select('id','title','description','visitor_id')
		});
		query.with('communityPost.visitor',(builder)=>{
			builder.select('id','name')
		});
		
		query.with('communityPostReply',(builder)=>{
			builder.select('id','description')
		});
		query.with('communityPostReply.visitor',(builder)=>{
			builder.select('id','name')
		});
		
		const result = await query.firstOrFail();
		return response.status(200).send(result);	
	}

  /**
   * Render a form to update an existing reportabuse.
   * GET reportabuses/:id/edit
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async edit ({ params, request, response, view }) {
  }

  /**
   * Update reportabuse details.
   * PUT or PATCH reportabuses/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params, request, response }) {
  }

  /**
   * Delete a reportabuse with id.
   * DELETE reportabuses/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
	async destroy ({ params, request, response }) {
		
		const query = await ReportAbuse.findOrFail(params.id);
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

module.exports = ReportAbuseController
