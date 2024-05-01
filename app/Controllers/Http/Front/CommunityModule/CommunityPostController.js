'use strict'
const Query = use("Query");
const Database = use("Database");
const Drive = use("Drive");
const moment = require("moment");

const CommunityPost = use("App/Models/Admin/CommunityModule/CommunityPost");
const Vote = use("App/Models/Admin/CommunityModule/Vote");
const CommunityPostAttachment = use("App/Models/Admin/CommunityModule/CommunityPostAttachment");
const Visitor = use("App/Models/Admin/VisitorModule/Visitor");
const { getvisitorCurrentLevel } = require("../../../../Helper/visitorCurrentLevel");
const CommunityVisitorActivity = use("App/Models/Admin/CommunityModule/CommunityVisitorActivity");

const requestOnly = [
	"community_id",
	"title",
	"description",
];
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with communityposts
 */
class CommunityPostController {
  /**
   * Show a list of all communityposts.
   * GET communityposts
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
	async index ({ params, request, response, view, auth }) {
		
		const userId = auth.user.id;	
		const query = CommunityPost.query();
		const search = request.input("search");
		const orderBy = request.input("orderBy");
		const orderDirection = request.input("orderDirection");
		const from_date = request.input("from_date");
		const to_date = request.input("to_date");
		const searchQuery = new Query(request, { order: "id" });
			
		query.whereHas('community', (builder) => {
			builder.where('url_slug', params.community_slug)
		});
		query.where('status', 1);
		
		query.with('visitor',(builder)=>{
			builder.select('id', 'name', 'profile_pic_url');
		});
		
		query.withCount('communityPostReply as total_post_replies', (builder) => {
			builder.where('community_post_replies.status', 1)
			builder.where('community_post_replies.parent_id', null)
		})

		query.withCount('communityVote as total_helpful', (builder) => {
			builder.where('vote_type', 1)
		})

		query.with('communityVote',(builder)=>{
			builder.select('id','community_post_id').where('visitor_id', userId)
		});	
		
		query.with('postTags',(builder)=>{
			builder.select('id','name')
		});	
		
		if (search) {
			query.where(searchQuery.search(['title']));
		}
		
		if (from_date && to_date) {
			query.whereRaw(`DATE(created_at) >= '${from_date}' and DATE(created_at) <= '${to_date}'`);
		} else if (from_date && !to_date) {
			query.where('created_at', '>=', from_date);
		} else if (!from_date && to_date) {
			query.where('created_at', '<=', to_date);
		}
		
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

	async tranding_question ({ params, request, response, view }) {
		
		const orderBy = request.input("orderBy");
		const orderDirection = request.input("orderDirection");
		const query = CommunityPost.query();
	
		query.where('status', 1);
		
		query.with('visitor',(builder)=>{
			builder.select('id','name','profile_pic_url')
		});
		
		query.withCount('communityVote as total_helpful', (builder) => {
		builder.where('vote_type', 1)
		})
		
		query.with('postTags',(builder)=>{
			builder.select('id','name')
		});	
		
		if (orderBy && orderDirection) {
			query.orderBy(`${orderBy}`, orderDirection);
		} else {
			query.orderBy('total_helpful', 'desc');
		}
		
		let pageSize = null;

		if (request.input("pageSize")) {
			pageSize = request.input("pageSize");
		}

		var result; var finalResult;
		if (pageSize) {
			result = (await query.limit(pageSize).fetch()).toJSON();
			finalResult = await this.response(result);
			
		} else {
			result = (await query.fetch()).toJSON();
			finalResult = await this.response(result);
		}
		
		return response.status(200).send(finalResult);
	}

  /**
   * Render a form to be used for creating a new communitypost.
   * GET communityposts/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
	async create ({ request, response, view }) {
	}

  /**
   * Create/save a new communitypost.
   * POST communityposts
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
			const query = await CommunityPost.create(
				{
					...body,
					visitor_id: userId,
				},
				trx
			);
			let url = request.input("url")
			let urlArr = [];
			if(url)
			{
				for(var i = 0; i < url.length; i++)
				{	
					let mediaurl = url[i];
					let extention = await this.getMediaType(mediaurl);

					urlArr.push({
						'community_post_id' : query.id,
						'url' : mediaurl,
						'extension' : (extention) ? extention : ""
					})
				}
				await CommunityPostAttachment.createMany(urlArr, trx);
			}

			// Insert Activity record
			const insActivity = await CommunityVisitorActivity.create(
				{
					visitor_id: userId,
					community_id: request.input("community_id"),
					community_post_id: query.id,
					activity_type: 1,
				},
				trx
			);

			await query.postTags().attach(request.input("tags"), null, trx);
			await trx.commit();
			return response.status(200).json({ message: "Question posted successfully" });
		} catch (error) {
			console.log(error);
			trx.rollback();
			return response.status(423).json({ message: "Something went wrong", error });
		}
	}

	async getMediaType(url)
	{
		const filename = url.replace(process.env.S3_BASE_URL, "");
		const file = await Drive.disk("s3").getObject(filename);
		return file.ContentType;
	}

  /**
   * Display a single communitypost.
   * GET communityposts/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
	async show ({ params, request, response, view, auth }) {
		
		const userId = auth.user.id;
		const getData = await CommunityPost.query().where("url_slug", params.slug).firstOrFail();
		let cnt = getData.views_counter;
		getData.views_counter = cnt + 1;
		await getData.save();

		const query = CommunityPost.query();
		query.with('visitor',(builder)=>{
			builder.select('id','name','profile_pic_url')
		});
		query.select("id", "community_id", "title", "visitor_id", "url_slug", "description", "views_counter", "is_discussion_open", "created_at");
		
		query.withCount('communityVote as total_helpful', (builder) => {
			builder.where('vote_type', 1)
		})
		query.withCount('communityPostReply as total_post_replies', (builder) => {
			builder.where('community_post_replies.status', 1)
			builder.where('community_post_replies.parent_id', null)
		})

		query.withCount('communityPostReply as is_answer_given',(builder)=>{
			builder.where('is_correct_answer', 1)
		});	
		
		query.with('postTags',(builder)=>{
			builder.select('id','name')
		});	
		
		query.with('attachments',(builder)=>{
			builder.select('id','community_post_id', 'name', 'url', 'extension')
		});	
		query.where("url_slug", params.slug);
		
		const result = (await query.firstOrFail()).toJSON();

		if(result) {
			const visitor_level = await getvisitorCurrentLevel(result.visitor_id); // Fetch user level separately
			result.visitor.visitor_level = visitor_level;

			let curr_date = moment().format('YYYY-MM-DD');
			const checkData = await CommunityVisitorActivity.query().where("visitor_id", userId).where("community_post_id", result.id).where("activity_type", 6).whereRaw(`DATE(created_at) = '${curr_date}'`).first();

			if(!checkData)
			{
				// Insert Activity record
				const insActivity = await CommunityVisitorActivity.create(
					{
						visitor_id: userId,
						community_id: result.community_id,
						community_post_id: result.id,
						activity_type: 6,
					},
				);
			}	
		}

		return response.status(200).send(result);	
	}
	
	async voting ({ params, request, response, auth }) {
		
		const userId = auth.user.id;	
		const trx = await Database.beginTransaction();
		
		try {	
			var community_post_id = request.input("community_post_id");

			const isExist = await Vote.findBy({
				community_post_id: community_post_id,
				visitor_id: userId,
			});
			if (isExist) {
				return response.status(422).send([{ message: "You have already voted." }]);
			}	
			
			const query = await Vote.create(
				{
					community_post_id: community_post_id,
					vote_type: request.input("vote_type"),
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
   * Render a form to update an existing communitypost.
   * GET communityposts/:id/edit
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
	async edit ({ params, request, response, view }) {
	}

  /**
   * Update communitypost details.
   * PUT or PATCH communityposts/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
	async update ({ params, request, response }) {

		const body = request.only(requestOnly);
		
		try {
			const updateData = await CommunityPost.findOrFail(params.id);
			updateData.merge(body);
			await updateData.save();

			await CommunityPostAttachment.query().where('community_post_id', params.id).delete();

			let url = JSON.parse(request.input("url"));
			let urlArr = [];
			if(url)
			{
				for(var i = 0; i < url.length; i++)
				{	
					let mediaurl = url[i];
					let extention = await this.getMediaType(mediaurl);

					urlArr.push({
						'community_post_id' : params.id,
						'url' : mediaurl,
						'extension' : (extention) ? extention : ""
					})
				}
				await CommunityPostAttachment.createMany(urlArr);
			}

			await updateData.postTags().detach();
			await updateData.postTags().attach(JSON.parse(request.input("tags")));

			return response.status(200).json({ message: "Question update successfully" });
		} catch (error) {
			console.log(error);
			return response.status(200).json({ message: "Something went wrong" });
		}
	}

  /**
   * Delete a communitypost with id.
   * DELETE communityposts/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
	async destroy ({ params, request, response }) {
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

module.exports = CommunityPostController
