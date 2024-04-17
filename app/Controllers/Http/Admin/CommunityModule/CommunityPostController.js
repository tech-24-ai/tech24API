'use strict'
const Query = use("Query");
const Database = use("Database");

const CommunityPost = use("App/Models/Admin/CommunityModule/CommunityPost");
const { dateFilterExtractor } = require("../../../../Helper/globalFunctions");
const Role = use("App/Models/Admin/UserModule/Role");
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
	async index ({ request, response, view, auth }) {
		
    const role_id = auth.user.role_id;
		const community_id = request.input("community_id");
		const query = CommunityPost.query();
		const search = request.input("search");
		const orderBy = request.input("orderBy");
		const orderDirection = request.input("orderDirection");
		const searchQuery = new Query(request, { order: "id" });
		const role = await Role.findOrFail(role_id);
    let role_name = role.name;
    
		if (orderBy && orderDirection) {
			query.orderBy(`${orderBy}`, orderDirection);
		} else {
      query.orderBy("id", "DESC");
    }
		
		if (search) {
			query.where(searchQuery.search(['name']));
		}

    if(role && role_name.toLowerCase().includes('moderator')) {
      query.whereHas('userCommunities', (builder) => {
        builder.where('user_id', auth.user.id)
      })
    }

    if (community_id) {
      query.where("community_id", community_id);
    }
    
    query.with('community',(builder)=>{
			builder.select('id','name')
		});
    
    query.with('visitor',(builder)=>{
			builder.select('id','name')
		});
		query.withCount('communityVote as total_helpful', (builder) => {
			builder.where('vote_type', 1)
		})
    query.withCount('communityPostReply as total_reply', (builder) => {
      builder.where('parent_id', null)
    });

    if (request.input("filters")) {
			const filters = JSON.parse(request.input("filters"));
			filters.forEach(async (filter) => {
				switch (filter.name) {
					case "updated_at":
				 		  query.whereRaw(
                await dateFilterExtractor({
                    name: `community_posts.updated_at`,
                    date: filter.value,
                })
				  		);
				 	break;
          case "visitor.name":
            query.whereHas('visitor', (builder) => {
              builder.whereRaw(`name LIKE '%${filter.value}%'`)
            })
          break;
          case "status":
            query.whereIn('status', filter.value);
          break;
					case "__meta__.total_helpful":
				 		query.has('communityVote', '=', filter.value);
				 	break;
           case "__meta__.total_reply":
              query.has('communityPostReply', '=', filter.value);
            break;
					default:
				 		query.whereRaw(`community_posts.${filter.name} LIKE '%${filter.value}%'`);
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
  async store ({ request, response }) {
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
	async show ({ params, request, response, view }) {
		
		const query = CommunityPost.query();
		query.select("id", "community_id", "title", "visitor_id", "url_slug", "description", "is_discussion_open", "status", "created_at");
		query.withCount('communityVote as total_helpful', (builder) => {
			builder.where('vote_type', 1)
		})
		query.with('visitor',(builder)=>{
			builder.select('id','name')
		});

    query.with('attachments',(builder)=>{
			builder.select('id','community_post_id', 'name', 'url', 'extension')
		});	
    
		query.where("id", params.id);
		const result = await query.firstOrFail();

    const st = result.status;
		result.status = st.toString();

    const discussionStatus = result.is_discussion_open;
		result.is_discussion_open = discussionStatus.toString();

		return response.status(200).send(result);	
	}

	async status_update ({ params, request, response }) {
		
		const trx = await Database.beginTransaction();
		
		try {	
			var post_status = request.input("status");
			var is_discussion_open = request.input("is_discussion_open");

			const updateData = await CommunityPost.findOrFail(params.id);
			updateData.is_discussion_open = is_discussion_open;
			updateData.status = post_status;
			await updateData.save();
			
			await trx.commit();
			return response.status(200).json({ message: "Status update successfully" });
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

    const query = await CommunityPost.findOrFail(params.id);
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

module.exports = CommunityPostController
