'use strict'
const Query = use("Query");
const Database = use("Database");

const CommunityPostReply = use("App/Models/Admin/CommunityModule/CommunityPostReply");
const CommunityPost = use("App/Models/Admin/CommunityModule/CommunityPost");
const Vote = use("App/Models/Admin/CommunityModule/Vote");
const CommunityVisitorPoint = use("App/Models/Admin/CommunityModule/CommunityVisitorPoint");
const {	getSubmitAnswerPoints, getUpvoteAnswerPoints, getCorrectAnswerPoints } = require("../../../../Helper/visitorPoints");
const { getvisitorCurrentLevel } = require("../../../../Helper/visitorCurrentLevel");
const CommunityVisitorActivity = use("App/Models/Admin/CommunityModule/CommunityVisitorActivity");

const requestOnly = [
	"parent_id",
	"community_post_id",
	"description",
];
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with communitypostreplies
 */
class CommunityPostReplyController {
  /**
   * Show a list of all communitypostreplies.
   * GET communitypostreplies
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
	async index ({ request, response, view, auth }) {

		const userId = auth.user.id;	
		const orderBy = request.input("orderBy");
		const orderDirection = request.input("orderDirection");

		const query = CommunityPostReply.query();
		query.where('community_post_id', request.input("community_post_id"));
		query.where('status', 1);
		query.where('parent_id', null);
		
		query.with('visitor',(builder)=>{
			builder.select('id','name','profile_pic_url')
		});	
		
		query.with('comments');	
		query.with('comments.visitor',(builder)=>{
			builder.select('id','name','profile_pic_url')
		});	
		query.withCount('postReplyVote as total_helpful', (builder) => {
			builder.where('vote_type', 1)
		})
		
		query.with('postReplyVote',(builder)=>{
			builder.select('id','community_post_reply_id').where('visitor_id', userId)
		});	
		
		query.with('postReportAbuse',(builder)=>{
			builder.select('id','community_post_reply_id').where('visitor_id', userId)
		});	
		
		if (orderBy && orderDirection) {
			query.orderBy(`${orderBy}`, orderDirection);
		} else {
			query.orderBy('id', 'desc');
		}
			
		let page = null;
		let pageSize = null;

		if (request.input("page")) {
			page = request.input("page");
		}
		if (request.input("pageSize")) {
			pageSize = request.input("pageSize");
		}
		var result; var finalResult;
		if (page && pageSize) {
			result = (await query.paginate(page, pageSize)).toJSON();
			result.data = await this.response(result.data);
			finalResult = result;
			
		} else {
			result = (await query.fetch()).toJSON();
			finalResult = await this.response(result);
		}
		
		return response.status(200).send(finalResult);
	}

  /**
   * Render a form to be used for creating a new communitypostreply.
   * GET communitypostreplies/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */

  async create ({ request, response, view }) {
  }

  /**
   * Create/save a new communitypostreply.
   * POST communitypostreplies
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
			const query = await CommunityPostReply.create(
				{
					...body,
					visitor_id: userId,
				},
				trx
			);

			var community_post_id = request.input("community_post_id");
			const getData = await CommunityPost.query().where("id", community_post_id).first();

			// Insert Activity record
			if(request.input("parent_id") > 0)
			{
				const insActivity = await CommunityVisitorActivity.create(
					{
						visitor_id: userId,
						community_id: getData.community_id,
						community_post_id: community_post_id,
						community_post_reply_id: query.id,
						activity_type: 3,
					},
					trx
				);
			} else {	
				const insActivity = await CommunityVisitorActivity.create(
					{
						visitor_id: userId,
						community_id: getData.community_id,
						community_post_id: community_post_id,
						community_post_reply_id: query.id,
						activity_type: 2,
					},
					trx
				);
			}

			await trx.commit();
			return response.status(200).json({ message: "Create successfully" });
		} catch (error) {
			console.log(error);
			trx.rollback();
			return response.status(423).json({ message: "Something went wrong", error });
		}
	}
	
	async voting ({ params, request, response, auth }) {
		
		const userId = auth.user.id;	
		const trx = await Database.beginTransaction();
		
		try {	
			var community_post_reply_id = request.input("community_post_reply_id");

			const isExist = await Vote.findBy({
				community_post_reply_id: community_post_reply_id,
				visitor_id: userId,
			});
			if (isExist) {
				return response.status(422).send([{ message: "You have already voted." }]);
			}	
			
			const query = await Vote.create(
				{
					community_post_reply_id: community_post_reply_id,
					vote_type: request.input("vote_type"),
					visitor_id: userId,
				},
				trx
			);

			const upvoteAnsPoints = await getUpvoteAnswerPoints();
			const addPoints = await CommunityVisitorPoint.create(
				{
					visitor_id: userId,
					type: 1,
					points: upvoteAnsPoints,
					community_post_reply_id: community_post_reply_id,
				},
				trx
			);

			const getData = await CommunityPostReply.query().with('communityPost').where("id", community_post_reply_id).first();
			const rslt = getData.toJSON();
			let activityType = (request.input("vote_type") == 1) ? 4 : 5;

			const insActivity = await CommunityVisitorActivity.create(
				{
					visitor_id: userId,
					community_id: rslt.communityPost.community_id,
					community_post_id: getData.community_post_id,
					community_post_reply_id: community_post_reply_id,
					activity_type: activityType,
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

	async mark_correct_answer ({ params, request, response, auth }) 
	{
		const userId = auth.user.id;	
		var community_post_reply_id = request.input("community_post_reply_id");
		const trx = await Database.beginTransaction();
		try {	
      		const updateData = await CommunityPostReply.findOrFail(community_post_reply_id);

			if(userId != updateData.visitor_id)
			{
				return response.status(423).json({ message: "You have not permission to mark as correct answer." });
			}

     		const checkData = await CommunityPostReply.query().where("community_post_id", updateData.community_post_id).where("is_correct_answer", 1).first();
			if(checkData) {
      			return response.status(423).json({ message: "The correct answer has already been found." });
      		}
			
			updateData.is_correct_answer = 1;
			await updateData.save();

			const correctAnsPoints = await getCorrectAnswerPoints();
			const addPoints = await CommunityVisitorPoint.create(
				{
					visitor_id: userId,
					type: 3,
					points: correctAnsPoints,
					community_post_reply_id: community_post_reply_id,
				},
				trx
			);

			await trx.commit();
			return response.status(200).json({ message: "Data update successfully" });
		} catch (error) {
			console.log(error);
			trx.rollback();
			return response.status(423).json({ message: "Something went wrong", error });
		}	
	}

  /**
   * Display a single communitypostreply.
   * GET communitypostreplies/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show ({ params, request, response, view }) {
  }

  /**
   * Render a form to update an existing communitypostreply.
   * GET communitypostreplies/:id/edit
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async edit ({ params, request, response, view }) {
  }

  /**
   * Update communitypostreply details.
   * PUT or PATCH communitypostreplies/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params, request, response }) {
  }

  /**
   * Delete a communitypostreply with id.
   * DELETE communitypostreplies/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params, request, response }) {
  }

  	async get_reply_comments ({ request, response, view }) {
		
		const query = CommunityPostReply.query();
		const search = request.input("search");
		const orderBy = request.input("orderBy");
		const orderDirection = request.input("orderDirection");
		const searchQuery = new Query(request, { order: "id" });

		query.where('parent_id', request.input("parent_id"));
		
		query.select('id','visitor_id', 'description');
			
		query.with('visitor',(builder)=>{
			builder.select('id','name','profile_pic_url')
		});	

		query.with('comments');	
		query.with('comments.visitor',(builder)=>{
			builder.select('id','name','profile_pic_url')
		});

		query.withCount('postReplyVote as total_helpful', (builder) => {
			builder.where('vote_type', 1)
		})

		if (orderBy && orderDirection) {
			query.orderBy(`${orderBy}`, orderDirection);
		} else {
			query.orderBy("id", "DESC");
		}
		
		if (search) {
			query.where(searchQuery.search(['description']));
		}

		let page = null;
		let pageSize = null;

		if (request.input("page")) {
			page = request.input("page");
		}
		if (request.input("pageSize")) {
			pageSize = request.input("pageSize");
		}
		
		var result; var finalResult;
		if (page && pageSize) {
			result = (await query.paginate(page, pageSize)).toJSON();
			result.data = await this.response(result.data);
			finalResult = result;
			
		} else {
			result = (await query.fetch()).toJSON();
			finalResult = await this.response(result);
		}
		
		return response.status(200).send(finalResult);
	}

	async response (result)
 	{
		for(let i = 0; i < result.length; i++)
		{
			let res = result[i];
			let visitor_id = res.visitor_id;
			let comments = res.comments;
			let visitor_level = await getvisitorCurrentLevel(visitor_id);
			res.visitor.visitor_level = visitor_level;
			result[i] = res;

			if(comments && comments.length > 0)
			{
				await this.response(comments);
			}
		}
		
		return result;
  	}
}

module.exports = CommunityPostReplyController
