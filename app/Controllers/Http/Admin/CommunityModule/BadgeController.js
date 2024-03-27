'use strict'

const Query = use("Query");
const Database = use("Database");
const Badge = use("App/Models/Admin/CommunityModule/Badge");
const { dateFilterExtractor } = require("../../../../Helper/globalFunctions");
const requestOnly = [
	"title",
	"min_range",
	"max_range"
];

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with badges
 */
class BadgeController {
  /**
   * Show a list of all badges.
   * GET badges
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index ({ request, response, view }) {

    const query = Badge.query();
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
                name: `badges.updated_at`,
                date: filter.value,
							})
				  		);
				 	break;
					default:
				 		query.whereRaw(`badges.${filter.name} LIKE '%${filter.value}%'`);
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
   * Render a form to be used for creating a new badge.
   * GET badges/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create ({ request, response, view }) {
  }

  /**
   * Create/save a new badge.
   * POST badges
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response, auth }) {

    const userId = auth.user.id;	
    const body = request.only(requestOnly);

    var min_range = request.input("min_range");
    var max_range = request.input("max_range");

    const query = Badge.query();
    query.where(function () {
      this.where('min_range', '>=', min_range)
        .where('min_range', '<=', max_range)
    })
    query.orWhere(function () {
      this.where('max_range', '>=', min_range)
        .where('max_range', '<=', max_range)
    })
    var result = await query.first();

    if(result) {
      return response.status(422).send({ message: "Badge range already found!" });
    }

		const trx = await Database.beginTransaction();
		
		try {	
			const query = await Badge.create(
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
   * Display a single badge.
   * GET badges/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show ({ params, request, response, view }) {
    const query = Badge.query();
		query.where("id", params.id);
		const result = await query.firstOrFail();
		return response.status(200).send(result);	
  }

  /**
   * Render a form to update an existing badge.
   * GET badges/:id/edit
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async edit ({ params, request, response, view }) {
  }

  /**
   * Update badge details.
   * PUT or PATCH badges/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params, request, response, auth }) {

    const body = request.only(requestOnly);
		const userId = auth.user.id;
		
		try {
      var min_range = request.input("min_range");
      var max_range = request.input("max_range");

      const query = Badge.query();
      query.whereNot('id', params.id)
      query.where(function () {
        this.query.where(function () {
          this.where('min_range', '>=', min_range)
            .where('min_range', '<=', max_range)
        })
        this.query.orWhere(function () {
          this.where('max_range', '>=', min_range)
            .where('max_range', '<=', max_range)
        })
      })  
      var result = await query.first();

      if(result) {
        return response.status(422).send({ message: "Badge range already found!" });
      }

			const updateData = await Badge.findOrFail(params.id);
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
   * Delete a badge with id.
   * DELETE badges/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params, request, response }) {
    const query = await Badge.findOrFail(params.id);
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

module.exports = BadgeController
