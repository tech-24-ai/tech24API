'use strict'

const Query = use("Query");
const Database = use("Database");

const ResearchTopic = use("App/Models/Admin/DocumentModule/ResearchTopic");
const { dateFilterExtractor } = require("../../../../Helper/globalFunctions");
const requestOnly = [
	"title"
];

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with researchtopics
 */
class ResearchTopicController {
  /**
   * Show a list of all researchtopics.
   * GET researchtopics
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index ({ request, response, view }) {

		const query = ResearchTopic.query();
		const search = request.input("search");
		const orderBy = request.input("orderBy");
		const orderDirection = request.input("orderDirection");
		const searchQuery = new Query(request, { order: "id" });

		if (orderBy && orderDirection) {
			query.orderBy(`${orderBy}`, orderDirection);
		}
		
		if (search) {
			query.where(searchQuery.search(['title']));
		}

		if (request.input("filters")) {
			const filters = JSON.parse(request.input("filters"));
			filters.forEach(async (filter) => {
				switch (filter.name) {
					case "updated_at":
				 		 query.whereRaw(
							await dateFilterExtractor({
					  			name: `research_topics.updated_at`,
					  			date: filter.value,
							})
				  		);
				 	 break;
					default:
				 		query.whereRaw(`research_topics.${filter.name} LIKE '%${filter.value}%'`);
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
   * Render a form to be used for creating a new researchtopic.
   * GET researchtopics/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create ({ request, response, view }) {
  }

  /**
   * Create/save a new researchtopic.
   * POST researchtopics
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
			const query = await ResearchTopic.create(
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
   * Display a single researchtopic.
   * GET researchtopics/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show ({ params, request, response, view }) {
    const query = ResearchTopic.query();
		query.where("id", params.id);
		const result = await query.firstOrFail();

		return response.status(200).send(result);	
  }

  /**
   * Render a form to update an existing researchtopic.
   * GET researchtopics/:id/edit
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async edit ({ params, request, response, view }) {
  }

  /**
   * Update researchtopic details.
   * PUT or PATCH researchtopics/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params, request, response, auth }) {

    const body = request.only(requestOnly);
		const userId = auth.user.id;
		
		try {
			const updateData = await ResearchTopic.findOrFail(params.id);
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
   * Delete a researchtopic with id.
   * DELETE researchtopics/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params, request, response }) {

    const query = await ResearchTopic.findOrFail(params.id);
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

module.exports = ResearchTopicController
