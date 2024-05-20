'use strict'

const { QueryBuilder } = require('@adonisjs/lucid/src/Lucid/Model');

const Query = use("Query");
const Database = use("Database");

const Tag = use("App/Models/Admin/CommunityModule/Tag");
const Community = use("App/Models/Admin/CommunityModule/Community");
const CommunityVisitor = use("App/Models/Admin/CommunityModule/CommunityVisitor");
const CommunityPost = use("App/Models/Admin/CommunityModule/CommunityPost");
const CommunityPostReply = use("App/Models/Admin/CommunityModule/CommunityPostReply");
const Visitor = use("App/Models/Admin/VisitorModule/Visitor");

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
		
		const userId = (auth.user) ? auth.user.id : "";
		const orderBy = request.input("orderBy");
		const orderDirection = request.input("orderDirection");
		const search = request.input("search");
		const searchQuery = new Query(request, { order: "id" });
		
		const query = Community.query();
		
		if (search) {
			query.where(searchQuery.search(['name']));
		}
		query.select('id', 'name', 'description', 'url_slug', 'image_url')

		query.with('communityMember', (builder) => {
			builder.select('id','visitor_id','community_id','created_at').where('status', 1).where('visitor_id', userId)
		});

		query.withCount('communityPost as total_posts', (builder) => {
			builder.where('status', 1)
		})
		query.withCount('getCommunityPostReply as total_post_reply', (builder) => {
			builder.where('community_post_replies.status', 1)
			builder.where('community_post_replies.parent_id', null)
		})
		query.withCount('communityMember as total_members', (builder) => {
			builder.where('status', 1)
		})
		
		if (orderBy == 'top_rated') {
			query.orderBy('total_posts', 'DESC');
			query.orderBy('total_post_reply', 'DESC');
		} else if (orderBy && orderDirection) {
			query.orderBy(`${orderBy}`, orderDirection);
		} else {
			query.orderBy('id', 'ASC');
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
	async show ({ params, request, response, view, auth }) {

	const userId = (auth.user) ? auth.user.id : "";
    const query = Community.query();
		query.where("url_slug", params.slug);
		query.with('communityMember', (builder) => {
		builder.select('id','visitor_id','community_id','created_at').where('visitor_id', userId)
		});
		query.withCount('communityPost as total_posts', (builder) => {
			builder.where('status', 1)
		})
		query.withCount('communityMember as total_members', (builder) => {
			builder.where('status', 1)
		})
		query.withCount('getCommunityPostReply as total_post_reply', (builder) => {
			builder.where('community_post_replies.status', 1)
			builder.where('community_post_replies.parent_id', null)
		})
		
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

	async join_community ({ params, request, response, auth }) {
		
		const userId = auth.user.id;
		const trx = await Database.beginTransaction();

		try {	
			var community_id = request.input("community_id");

			const isExist = await CommunityVisitor.findBy({
				visitor_id: userId,
				community_id: community_id,
			});
			if (isExist) {
				return response.status(423).send([{ message: "You are already joined." }]);
			}	
			
			const query = await CommunityVisitor.create(
				{
					visitor_id: userId,
					community_id: community_id,
				},
				trx
			);

			await trx.commit();
			return response.status(200).json({ message: "Community joined successfully" });
		} catch (error) {
			console.log(error);
			trx.rollback();
			return response.status(423).json({ message: "Something went wrong", error });
		}
	}

  async leave_community ({ params, request, response, auth }) {
		
		const userId = auth.user.id;
		try {	
			var community_id = request.input("community_id");

			const isExist = await CommunityVisitor.findBy({
				visitor_id: userId,
				community_id: community_id,
			});
			if (isExist) {

        await isExist.delete();
				return response.status(200).json({ message: "You have been leaved from community" });
			} else {
        return response.status(423).json({ message: "Data not", error });
      }	
		} catch (error) {
			return response.status(423).json({ message: "Something went wrong", error });
		}
	}

	async community_stats({params, request, response})
	{
		let data = [];

		const visitor_query = Visitor.query();
		visitor_query.where('is_blocked', 0);
		visitor_query.whereRaw(`name != 'Guest' AND 'register_from' is not null`);
		const totalMember = await visitor_query.count('* as total');

		const community_post = CommunityPost.query();
		community_post.where('status', 1);
		const totalCommunityPost = await community_post.count('* as total');

		const community_post_reply = CommunityPostReply.query();
		community_post_reply.where('status', 1);
		community_post_reply.where('parent_id', null);
		const totalCommunityAnswer = await community_post_reply.count('* as total');

		data.push({
			'total_member' : this.formatCash(totalMember[0].total),
			'total_question' : this.formatCash(totalCommunityPost[0].total),
			'total_answer' : this.formatCash(totalCommunityAnswer[0].total)
		})

		return response.status(200).send({ data });
	}

	formatCash (n) 
	{
		if (n < 1e3) return n;
		if (n >= 1e3 && n < 1e6) return +(n / 1e3).toFixed(1) + "K";
		if (n >= 1e6 && n < 1e9) return +(n / 1e6).toFixed(1) + "M";
		if (n >= 1e9 && n < 1e12) return +(n / 1e9).toFixed(1) + "B";
		if (n >= 1e12) return +(n / 1e12).toFixed(1) + "T";
	}

}

module.exports = CommunityController
