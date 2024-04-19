'use strict'

const Query = use("Query");
const Database = use("Database");

const ResearchTag = use("App/Models/Admin/DocumentModule/ResearchTag");
const { dateFilterExtractor } = require("../../../../Helper/globalFunctions");
const requestOnly = [
	"name"
];

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with researchtags
 */
class ResearchTagController {
  /**
   * Show a list of all researchtags.
   * GET researchtags
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index ({ request, response, view }) {

		const query = ResearchTag.query();
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
					  			name: `research_tags.updated_at`,
					  			date: filter.value,
							})
				  		);
				 	 break;
					default:
				 		query.whereRaw(`research_tags.${filter.name} LIKE '%${filter.value}%'`);
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
   * Render a form to be used for creating a new researchtag.
   * GET researchtags/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create ({ request, response, view }) {
  }

  /**
   * Create/save a new researchtag.
   * POST researchtags
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

      var tagName = request.input("name");
			tagName = tagName.replace(/[^a-z0-9A-Z' ]/g, "");
			
			const isExist = await ResearchTag.findBy({
				name: tagName,
			});
			if (isExist) {
				return response.status(422).send({ message: "Duplicate tag found" });
			}	

			const query = await ResearchTag.create(
				{
					name: tagName,
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
   * Display a single researchtag.
   * GET researchtags/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show ({ params, request, response, view }) {

    const query = ResearchTag.query();
		query.where("id", params.id);
		const result = await query.firstOrFail();

		return response.status(200).send(result);
  }

  /**
   * Render a form to update an existing researchtag.
   * GET researchtags/:id/edit
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async edit ({ params, request, response, view }) {
  }

  /**
   * Update researchtag details.
   * PUT or PATCH researchtags/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params, request, response, auth }) {

    const body = request.only(requestOnly);
		const userId = auth.user.id;
		
		try {

      var tagName = request.input("name");
			tagName = tagName.replace(/[^a-z0-9A-Z' ]/g, "");
			
			const query = ResearchTag.query();
			const isExist = await query.where('name', tagName).whereNot('id', params.id).first();
			
			if (isExist) {
				return response.status(422).send({ message: "Duplicate tag found" });
			}	

			const updateData = await ResearchTag.findOrFail(params.id);

      updateData.name = tagName;
			updateData.updated_by = userId;
			await updateData.save();
			return response.status(200).json({ message: "Update successfully" });
		} catch (error) {
			console.log(error);
			return response.status(200).json({ message: "Something went wrong" });
		}
  }

  /**
   * Delete a researchtag with id.
   * DELETE researchtags/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params, request, response }) {

    const query = await ResearchTag.findOrFail(params.id);
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

module.exports = ResearchTagController
