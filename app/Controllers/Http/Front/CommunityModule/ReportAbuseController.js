'use strict'
const Query = use("Query");
const Database = use("Database");

const ReportAbuseType = use("App/Models/Admin/CommunityModule/ReportAbuseType");
const ReportAbuse = use("App/Models/Admin/CommunityModule/ReportAbuse");

const requestOnly = [
	"report_abuse_type_id",
	"community_id",
	"community_post_id",
	"community_post_reply_id",
	"reason",
];
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
	}

	async getTypes ({ request, response, view }) {
		
		var result;
		const query = ReportAbuseType.query();
		query.select('id', 'name');
		query.where('status', 1);
		result = (await query.fetch()).toJSON();
		
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
	async store ({ request, response, auth }) {
		
		const userId = auth.user.id;	
		const trx = await Database.beginTransaction();
		const body = request.only(requestOnly);
		
		try {	
			var community_id = request.input("community_id");
			var community_post_id = request.input("community_post_id");
			var community_post_reply_id = request.input("community_post_reply_id");

			const isExist = await ReportAbuse.findBy({
				community_id: community_id,
				community_post_id: community_post_id,
				community_post_reply_id: community_post_reply_id,
				visitor_id: userId,
			});
			if (isExist) {
				return response.status(422).send([{ message: "You have already reported." }]);
			}	
			
			const query = await ReportAbuse.create(
				{
					...body,
					visitor_id: userId,
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
   * Display a single reportabuse.
   * GET reportabuses/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show ({ params, request, response, view }) {
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
  }
}

module.exports = ReportAbuseController
