'use strict'
const Query = use("Query");
const Database = use("Database");

const CommunityPostReply = use("App/Models/Admin/CommunityModule/CommunityPostReply");
const { dateFilterExtractor } = require("../../../../Helper/globalFunctions");
const CommunityVisitorPoint = use("App/Models/Admin/CommunityModule/CommunityVisitorPoint");
const {	getSubmitAnswerPoints } = require("../../../../Helper/visitorPoints");

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

		query.withCount('postReplyVote as total_helpful');
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
    
		query.withCount('postReplyVote as total_helpful');
		query.where("id", params.id);
		const result = await query.firstOrFail();

    const st = result.status;
		result.status = st.toString();

    const ans = result.is_correct_answer;
		result.is_correct_answer = ans.toString();

		return response.status(200).send(result);	
	}

	async status_update ({ params, request, response, auth }) {
		
		const userId = auth.user.id;
		const trx = await Database.beginTransaction();
		
		try {	
			var reply_status = request.input("status");

			const updateData = await CommunityPostReply.findOrFail(params.id);
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

		query.withCount('postReplyVote as total_helpful');
		
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
}

module.exports = CommunityPostReplyController
