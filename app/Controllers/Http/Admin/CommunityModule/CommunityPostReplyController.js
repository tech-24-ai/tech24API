'use strict'
const Query = use("Query");
const Database = use("Database");

const CommunityPostReply = use("App/Models/Admin/CommunityModule/CommunityPostReply");
const { dateFilterExtractor } = require("../../../../Helper/globalFunctions");
const CommunityVisitorPoint = use("App/Models/Admin/CommunityModule/CommunityVisitorPoint");
const {	getSubmitAnswerPoints, getCorrectAnswerPoints } = require("../../../../Helper/visitorPoints");
const Visitor = use("App/Models/Admin/VisitorModule/Visitor");
const CommunityPost = use("App/Models/Admin/CommunityModule/CommunityPost");
const Mail = use("Mail");
const Env = use("Env");
let parentIds;

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
  
	async index ({ request, response, view }) {
		
		const query = CommunityPostReply.query();
		const search = request.input("search");
		const orderBy = request.input("orderBy");
		const orderDirection = request.input("orderDirection");
		const searchQuery = new Query(request, { order: "id" });

		query.where('community_post_id', request.input("community_post_id"));
    query.where('parent_id', null);
		
		query.with('visitor',(builder)=>{
			builder.select('id','name')
		});	

    query.with('communityPost.community',(builder)=>{
			builder.select('id','name')
		});	

		query.withCount('postReplyVote as total_helpful', (builder) => {
			builder.where('vote_type', 1)
		})
    query.withCount('comments as total_comments');
    
    if (orderBy && orderDirection) {
			query.orderBy(`${orderBy}`, orderDirection);
		} else {
      query.orderBy("id", "DESC");
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
                    name: `community_post_replies.updated_at`,
                    date: filter.value,
                })
				  		);
				 	break;
           case "communityPost.community.name":
             query.whereHas('communityPost.community', (builder) => {
               builder.whereRaw(`name LIKE '%${filter.value}%'`)
             })
           break;
          case "visitor.name":
            query.whereHas('visitor', (builder) => {
              builder.whereRaw(`name LIKE '%${filter.value}%'`)
            })
          break;
          case "status":
            query.whereIn('status', filter.value);
          break;
          case "is_correct_answer":
            query.whereIn('is_correct_answer', filter.value);
          break;
					case "__meta__.total_helpful":
				 		query.has('postReplyVote', '=', filter.value);
				 	break;
					default:
				 		query.whereRaw(`community_post_replies.${filter.name} LIKE '%${filter.value}%'`);
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
  async store ({ request, response }) {
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
		
		const query = CommunityPostReply.query();

		query.with('visitor',(builder)=>{
			builder.select('id','name')
		});
		query.with('parentData')
    	query.with('communityPost',(builder)=>{
			builder.select('id','name')
		});	
		query.withCount('communityPostVote as total_post_helpful');

    	query.with('communityPost.visitor',(builder)=>{
			builder.select('id','name')
		});	
    
		query.withCount('postReplyVote as total_helpful', (builder) => {
			builder.where('vote_type', 1)
		})
		query.where("id", params.id);
		const result = await query.firstOrFail();

    const st = result.status;
		result.status = st.toString();

    const ans = result.is_correct_answer;
		result.is_correct_answer = ans.toString();
		
		// only generate back url for comment section
		if(result.parent_id > 0) {
			parentIds = [];
			parentIds = await this.getParentIds(result.parent_id);
			let urlParams = parentIds.reverse().join("/");

			result.back_url = `community-posts-reply-comments/${urlParams}`;
		} else {
			result.back_url = "";
		}	

		return response.status(200).send(result);	
	}

	async status_update ({ params, request, response, auth }) {
		
		const userId = auth.user.id;
		const trx = await Database.beginTransaction();
		
		try {	
			var reply_status = request.input("status");

			const updateData = await CommunityPostReply.findOrFail(params.id);
			let oldStatus = updateData.status;

			updateData.status = reply_status;
			await updateData.save();

			const query = CommunityVisitorPoint.query();
			const isExist = await query.where('community_post_reply_id', params.id).where('visitor_id', updateData.visitor_id).first();
			
			if (!isExist && reply_status == 1) 
			{
				const answerSubmitPoints = await getSubmitAnswerPoints();
				const addPoints = await CommunityVisitorPoint.create(
					{
						visitor_id: updateData.visitor_id,
						type: 2,
						points: answerSubmitPoints,
						community_post_reply_id: params.id,
					},
					trx
				);
			}

			if(oldStatus != reply_status && reply_status == 1)
      		{
				const query1 = CommunityPost.query();
				const postData = await query1.select('id', 'visitor_id', 'url_slug').where('id', updateData.community_post_id).first();

				const query2 = Visitor.query();
				const visitorData = await query2.select('id', 'name', 'email').where('id', postData.visitor_id).first();

				if(visitorData)
				{
					let url_slug = updateData.url_slug;
					const name = visitorData.name;
					const toEmails = visitorData.email;
					
					const FRONTEND_BASE_URL = Env.get("FRONTEND_BASE_URL");
					const subject = "Tech24 - New Answer on your Community Question";
					const details = `You have a new Answer for your question. `;
					const link = `${FRONTEND_BASE_URL}/community/question/${postData.url_slug}`;

					const emailStatus = await Mail.send(
						"answerApproveVisitorMail",
						{ name: name, title: subject, details: details, link: link },
						(message) => {
							message.subject(subject);
							message.from(Env.get("MAIL_USERNAME"));
							message.to(toEmails);
						}
					);
				}
			}

			await trx.commit();
			return response.status(200).json({ message: "Status update successfully" });
		} catch (error) {
			console.log(error);
			trx.rollback();
			return response.status(423).json({ message: "Something went wrong", error });
		}	
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

    const query = await CommunityPostReply.findOrFail(params.id);
		try {
			await query.delete();
			return response.status(200).send({ message: "Delete successfully" });
		  
		} catch (error) {
			return response.status(423).send({
				message: "Something went wrong",
			});
		}
  }

  async get_reply_comments ({ request, response, view }) {
		
		const query = CommunityPostReply.query();
		const search = request.input("search");
		const orderBy = request.input("orderBy");
		const orderDirection = request.input("orderDirection");
		const searchQuery = new Query(request, { order: "id" });

		query.where('parent_id', request.input("parent_id"));
		
		query.with('visitor',(builder)=>{
			builder.select('id','name')
		});	
		query.withCount('comments as total_comments');
    query.with('communityPost.community',(builder)=>{
			builder.select('id','name')
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
		var result;
		if (page && pageSize) {
			result = (await query.paginate(page, pageSize)).toJSON();
		} else {
			result = (await query.fetch()).toJSON();
		}
		
		return response.status(200).send(result);
	}

	async mark_correct_answer ({ params, request, response }) 
	{
		var community_post_reply_id = request.input("id");
		const trx = await Database.beginTransaction();
		try {	
      		const updateData = await CommunityPostReply.findOrFail(community_post_reply_id);

     		const checkData = await CommunityPostReply.query().where("community_post_id", updateData.community_post_id).where("is_correct_answer", 1).first();
			if(checkData) 
			{
				checkData.is_correct_answer = 0;
				await checkData.save();

				const removeEarnPoints = await CommunityVisitorPoint.query().where("community_post_reply_id", checkData.id).where("visitor_id", checkData.visitor_id).where('type', 3).first();
				if(removeEarnPoints) 
				{
					await removeEarnPoints.delete();
				}	
      		}
			
			updateData.is_correct_answer = 1;
			await updateData.save();

			const correctAnsPoints = await getCorrectAnswerPoints();
			const addPoints = await CommunityVisitorPoint.create(
				{
					visitor_id: updateData.visitor_id,
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

	async comment_status_update ({ params, request, response, auth }) {
		
		const userId = auth.user.id;
		
		try {	
			var reply_status = request.input("status");

			const updateData = await CommunityPostReply.findOrFail(params.id);
			let oldStatus = updateData.status;

			updateData.status = reply_status;
			await updateData.save();

			if(oldStatus != reply_status && reply_status == 1)
      		{
				const query1 = CommunityPost.query();
				const postData = await query1.select('id', 'visitor_id').where('id', updateData.community_post_id).first();

				const query2 = Visitor.query();
				const visitorData = await query2.select('id', 'name', 'email').where('id', postData.visitor_id).first();

				if(visitorData)
				{
					let url_slug = updateData.url_slug;
					const name = visitorData.name;
					const toEmails = visitorData.email;
					
					const subject = "Tech24 - New Comment on your Community Question";
					const details = `You have a new Comment for your question. `;
					const link = '';

					const emailStatus = await Mail.send(
						"commentApproveVisitorMail",
						{ name: name, title: subject, details: details, link: link },
						(message) => {
							message.subject(subject);
							message.from(Env.get("MAIL_USERNAME"));
							message.to(toEmails);
						}
					);
				}
			}

			return response.status(200).json({ message: "Status update successfully" });
		} catch (error) {
			console.log(error);
			trx.rollback();
			return response.status(423).json({ message: "Something went wrong", error });
		}	
	}

	async getParentIds(parent_id)
	{
		parentIds.push(parent_id)
		const getData = await CommunityPostReply.findOrFail(parent_id);

		if(getData)
		{
			if(getData.parent_id > 0) {
				await this.getParentIds(getData.parent_id);
			}	
		}

		return parentIds;
	}
}

module.exports = CommunityPostReplyController
