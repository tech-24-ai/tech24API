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
const UserCommunity = use("App/Models/Admin/CommunityModule/UserCommunity");
const Mail = use("Mail");
const Env = use("Env");

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

		const userId = (auth.user) ? auth.user.id : "";
		const orderBy = request.input("orderBy");
		const orderDirection = request.input("orderDirection");

		const query = CommunityPostReply.query();
		query.where('community_post_id', request.input("community_post_id"));
		query.where('status', 1);
		query.where('parent_id', null);
		
		query.with('visitor',(builder)=>{
			builder.select('id','name','profile_pic_url')
		});	
		
		query.with('comments',(builder)=>{
			builder.with('communityPost',(builder)=>{
				builder.with('community',(builder)=>{
					builder.withCount('communityPost as total_posts', (builder) => {
						builder.where('status', 1)
					})
					builder.withCount('communityMember as total_members', (builder) => {
						builder.where('status', 1)
					})
					builder.withCount('getCommunityPostReply as total_post_reply', (builder) => {
						builder.where('community_post_replies.status', 1)
						builder.where('community_post_replies.parent_id', null)
					})
				})
			})
				
			builder.where('status', 1)
			builder.with('visitor',(builder)=>{
				builder.select('id','name','profile_pic_url')
			})

			builder.with('comments',(builder)=>{
				builder.with('visitor',(builder)=>{
					builder.select('id','name','profile_pic_url')
				})	
			})	
		});	

		// query.with('comments.visitor',(builder)=>{
		// 	builder.select('id','name','profile_pic_url')
		// });	

		query.withCount('postReplyVote as total_helpful', (builder) => {
			builder.where('vote_type', 1)
		})
		
		query.with('postReplyVote',(builder)=>{
			builder.select('id','community_post_reply_id').where('visitor_id', userId)
		});	
		
		query.with('postReportAbuse',(builder)=>{
			builder.select('id','community_post_reply_id').where('visitor_id', userId)
		});	
		
		query.orderBy('is_correct_answer', 'desc');

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
			result.data = await this.response(result.data, userId);
			finalResult = result;
			
		} else {
			result = (await query.fetch()).toJSON();
			finalResult = await this.response(result, userId);
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

			try {
				const getModerator = UserCommunity.query();
				getModerator.with('users', (builder) => {
					builder.select('id', 'email')
				});
				getModerator.where('community_id', getData.community_id);
				let moderatorLists = (await getModerator.fetch()).toJSON();

				let subject, details, ins_community_post_reply_id, link;
				if(request.input("parent_id") > 0)
				{
					subject = 'Tech24 - New Comment posted on Community Answer';
					details = `You have a new comment to review. Please review and approve/reject it.`;
					ins_community_post_reply_id = query.id;
					link = `${Env.get("ADMIN_BASE_URL")}/community-posts-reply-comments-form/${ins_community_post_reply_id}`;
				} 
				else
				{
					subject = 'Tech24 - New Answer posted on Community Question';
					details = `You have a new answer to review. Please review and approve/reject it.`;
					ins_community_post_reply_id = query.id;
					link = `${Env.get("ADMIN_BASE_URL")}/community-posts-reply-form/${ins_community_post_reply_id}`;
				}

				if(moderatorLists)
				{
					let toEmails = [];

					moderatorLists.forEach((val, index) => {
						toEmails.push(val.users.email)
					});	
					toEmails = toEmails.join(",");
					
					if(toEmails)
					{
						const name = 'Moderator';
						
						const emailStatus = await Mail.send(
							"newCommunityContentModeratorMail",
							{ name: name, title: subject, details: details, link: link },
							(message) => {
								message.subject(subject);
								message.from(Env.get("MAIL_USERNAME"));
								message.to(toEmails);
							}
						);
					}	

					let admin_mail = Env.get("TO_MAIL_USERNAME")
					if(admin_mail) 
					{
						const name = 'Admin';

						const emailStatus = await Mail.send(
							"newCommunityContentModeratorMail",
							{ name: name, title: subject, details: details, link: link },
							(message) => {
								message.subject(subject);
								message.from(Env.get("MAIL_USERNAME"));
								message.to(admin_mail);
							}
						);
					}
				}
			} catch (error) {
				console.log(error);
			}

			return response.status(200).json({ message: "Answer posted successfully" });
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

			const getData = await CommunityPostReply.query().with('communityPost').where("id", community_post_reply_id).first();
			const rslt = getData.toJSON();

			if(getData.visitor_id == userId)
			{
				return response.status(422).send([{ message: "You can not vote on your own answer." }]);
			}

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

		const body = request.only(requestOnly);
		
		try {
			const updateData = await CommunityPostReply.findOrFail(params.id);
			updateData.description = request.input("description");
			updateData.status = 0;
			await updateData.save();

			try {
				var community_post_id = request.input("community_post_id");
				const getData = await CommunityPost.query().where("id", community_post_id).first();

				const getModerator = UserCommunity.query();
				getModerator.with('users', (builder) => {
					builder.select('id', 'email')
				});
				getModerator.where('community_id', getData.community_id);
				let moderatorLists = (await getModerator.fetch()).toJSON();

				let subject, details, ins_community_post_reply_id, link;
				if(request.input("parent_id") > 0)
				{
					subject = 'Tech24 - New Comment posted on Community Answer';
					details = `You have a new comment to review. Please review and approve/reject it.`;
					ins_community_post_reply_id = params.id;
					link = `${Env.get("ADMIN_BASE_URL")}/community-posts-reply-comments-form/${ins_community_post_reply_id}`;
				} 
				else
				{
					subject = 'Tech24 - New Answer posted on Community Question';
					details = `You have a new answer to review. Please review and approve/reject it.`;
					ins_community_post_reply_id = params.id;
					link = `${Env.get("ADMIN_BASE_URL")}/community-posts-reply-form/${ins_community_post_reply_id}`;
				}

				if(moderatorLists)
				{
					let toEmails = [];

					moderatorLists.forEach((val, index) => {
						toEmails.push(val.users.email)
					});	
					toEmails = toEmails.join(",");
					
					if(toEmails)
					{
						const name = 'Moderator';
						
						const emailStatus = await Mail.send(
							"newCommunityContentModeratorMail",
							{ name: name, title: subject, details: details, link: link },
							(message) => {
								message.subject(subject);
								message.from(Env.get("MAIL_USERNAME"));
								message.to(toEmails);
							}
						);
					}	

					let admin_mail = Env.get("TO_MAIL_USERNAME")
					if(admin_mail) 
					{
						const name = 'Admin';

						const emailStatus = await Mail.send(
							"newCommunityContentModeratorMail",
							{ name: name, title: subject, details: details, link: link },
							(message) => {
								message.subject(subject);
								message.from(Env.get("MAIL_USERNAME"));
								message.to(admin_mail);
							}
						);
					}
				}
			} catch (error) {
				console.log(error);
			}
			
			if(request.input("parent_id") > 0)
			{
				return response.status(200).json({ message: "Comment updated successfully" });
			} else {
				return response.status(200).json({ message: "Answer updated successfully" });
			}	
		
			} catch (error) {
			console.log(error);
			return response.status(423).json({ message: "Something went wrong" });
		}
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

  	async get_reply_comments ({ request, response, view, auth }) {
		
		const userId = (auth.user) ? auth.user.id : "";
		const query = CommunityPostReply.query();
		const search = request.input("search");
		const orderBy = request.input("orderBy");
		const orderDirection = request.input("orderDirection");
		const searchQuery = new Query(request, { order: "id" });

		query.where('status', 1);
		query.where('parent_id', request.input("parent_id"));
		
		query.select('id','visitor_id', 'description');
			
		query.with('visitor',(builder)=>{
			builder.select('id','name','profile_pic_url')
		});	

		query.with('comments',(builder)=>{
			builder.with('communityPost',(builder)=>{
				builder.with('community',(builder)=>{
					builder.withCount('communityPost as total_posts', (builder) => {
						builder.where('status', 1)
					})
					builder.withCount('communityMember as total_members', (builder) => {
						builder.where('status', 1)
					})
					builder.withCount('getCommunityPostReply as total_post_reply', (builder) => {
						builder.where('community_post_replies.status', 1)
						builder.where('community_post_replies.parent_id', null)
					})
				})
			})
				
			builder.where('status', 1)
			builder.with('visitor',(builder)=>{
				builder.select('id','name','profile_pic_url')
			})

			builder.with('comments',(builder)=>{
				builder.with('visitor',(builder)=>{
					builder.select('id','name','profile_pic_url')
				})	
			})	
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
			result.data = await this.response(result.data, userId);
			finalResult = result;
			
		} else {
			result = (await query.fetch()).toJSON();
			finalResult = await this.response(result, userId);
		}
		
		return response.status(200).send(finalResult);
	}

	async response (result, userId = 0)
 	{
		for(let i = 0; i < result.length; i++)
		{
			let res = result[i];
			let visitor_id = res.visitor_id;

			if(userId == visitor_id) {
				res.isEditable = 1
			} else {
				res.isEditable = 0
			}

			let comments = res.comments;
			let visitor_level = await getvisitorCurrentLevel(visitor_id);
			res.visitor.visitor_level = visitor_level;
			result[i] = res;

			if(comments && comments.length > 0)
			{
				await this.response(comments, userId);
			}
		}
		
		return result;
  	}
}

module.exports = CommunityPostReplyController
