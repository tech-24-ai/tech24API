'use strict'
const Query = use("Query");
const Database = use("Database");

const Technology = use("App/Models/Technology");
const { dateFilterExtractor } = require("../../../Helper/globalFunctions");
const requestOnly = [
	"name",
	"status",
];
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with technologies
 */
class TechnologyController {
  /**
   * Show a list of all technologies.
   * GET technologies
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
	async index ({ request, response, view }) {
		
		const query = Technology.query();
		const search = request.input("search");
		const orderBy = request.input("orderBy");
		const orderDirection = request.input("orderDirection");
		const searchQuery = new Query(request, { order: "id" });
		
		if (orderBy && orderDirection) {
			query.orderBy(`${orderBy}`, orderDirection);
		}
		
		if (search) {
			query.where(searchQuery.search(['name']));
		}

		if (request.input("filters")) {
			const filters = JSON.parse(request.input("filters"));
			filters.forEach(async (filter) => {
			  	switch (filter.name) {
					case "updated_at":
				 		 query.whereRaw(
							await dateFilterExtractor({
					  			name: `technologies.updated_at`,
					  			date: filter.value,
							})
				  		);
				 	 break;
					case "status":
				 		 query.whereIn("technologies.status", filter.value);
				  	break;
					default:
				 		 query.whereRaw(`technologies.${filter.name} LIKE '%${filter.value}%'`);
				 	break;
				}
			});
		}

		query.select("id", "name", "status", "updated_at");
		
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
   * Render a form to be used for creating a new technology.
   * GET technologies/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create ({ request, response, view }) {
  }

  /**
   * Create/save a new technology.
   * POST technologies
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
			const query = await Technology.create(
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
   * Display a single technology.
   * GET technologies/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
	async show ({ params, request, response, view }) {
		
		const query = Technology.query();
		query.where("id", params.id);
		const result = await query.firstOrFail();
		const st = result.status;
		result.status = st.toString();		
		return response.status(200).send(result);	
	}

  /**
   * Render a form to update an existing technology.
   * GET technologies/:id/edit
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async edit ({ params, request, response, view }) {
  }

  /**
   * Update technology details.
   * PUT or PATCH technologies/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
	async update ({ params, request, response, auth }) {
		
		const body = request.only(requestOnly);
		const userId = auth.user.id;
		
		try {
			const updateData = await Technology.findOrFail(params.id);
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
   * Delete a technology with id.
   * DELETE technologies/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
	async destroy ({ params, request, response }) {
		
		const query = await Technology.findOrFail(params.id);
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

module.exports = TechnologyController
