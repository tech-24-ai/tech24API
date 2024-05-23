'use strict'
const Query = use("Query");
const Database = use("Database");

const CommunityPost = use("App/Models/Admin/CommunityModule/CommunityPost");
const { dateFilterExtractor } = require("../../../../Helper/globalFunctions");
const Role = use("App/Models/Admin/UserModule/Role");
const CommunityVisitorPoint = use("App/Models/Admin/CommunityModule/CommunityVisitorPoint");
const {	getSubmitQuestionPoints } = require("../../../../Helper/visitorPoints");
const Visitor = use("App/Models/Admin/VisitorModule/Visitor");
const Mail = use("Mail");
const Env = use("Env");
const moment = require("moment");

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
    
		if (search) {
      query.where(function () {
				this.where(searchQuery.search(['title']))
				this.orWhereHas("community", (builder) => {
				  builder.where(searchQuery.search(["name"]));
				})
				this.orWhereHas("visitor", (builder) => {
				  builder.where(searchQuery.search(["name"]));
				})
			});
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
    query.withCount('communityPostReply as total_pending_answer', (builder) => {
      builder.where('parent_id', null)
      builder.where('status', 0)
    });
    query.withCount('communityPostReply as total_pending_comment', (builder) => {
      builder.where('parent_id', '>', 0)
      builder.where('status', 0)
    });

    if (request.input("filters")) {
			const filters = JSON.parse(request.input("filters"));
			filters.forEach(async (filter) => {
				switch (filter.name) {
					case "created_at":
				 		  query.whereRaw(
                await dateFilterExtractor({
                    name: `community_posts.created_at`,
                    date: filter.value,
                })
				  		);
				 	break;
          case "community.name":
            query.whereHas('community', (builder) => {
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
    
		if (orderBy == "__meta__.total_reply" && orderDirection) {
			query.orderBy('total_reply', orderDirection);
    } 
    else if (orderBy == "__meta__.total_pending_answer" && orderDirection) {
			query.orderBy('total_pending_answer', orderDirection);
		} 
    else if (orderBy == "__meta__.total_pending_comment" && orderDirection) {
			query.orderBy('total_pending_comment', orderDirection);
		} 
    else if (orderBy == "visitor.name" && orderDirection) {
			query.orderBy('visitor.name', orderDirection);
		} 
    else if (orderBy && orderDirection) {
			query.orderBy(`${orderBy}`, orderDirection);
		} 
    else {
      query.orderBy("id", "DESC");
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
      let createdDate = new Date(res.created_at);
      let updatedDate = new Date(res.updated_at);

      res.created_at = moment(createdDate).format('DD-MM-YYYY hh:m A')
      res.updated_at = moment(updatedDate).format('DD-MM-YYYY hh:m A')
      result[i] = res;
		}
		
		return result;
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
		query.select("*");
		query.withCount('communityVote as total_helpful', (builder) => {
			builder.where('vote_type', 1)
		})
		query.with('visitor',(builder)=>{
			builder.select('id','name')
		});

    query.with('attachments',(builder)=>{
			builder.select('id','community_post_id', 'name', 'url', 'extension')
		});	

    query.with('postTags',(builder)=>{
			builder.select('id','name')
		});	
    
		query.where("id", params.id);
		const result = await query.firstOrFail();

    const st = result.status;
		result.status = st.toString();

    const discussionStatus = result.is_discussion_open;
		result.is_discussion_open = discussionStatus.toString();

		return response.status(200).send(result);	
	}

	async status_update ({ params, request, response, auth }) {
		
    const user_id = auth.user.id;
		const trx = await Database.beginTransaction();
		
		try {	
			var title = request.input("title");
			var description = request.input("description");
			var post_status = request.input("status");
			var reject_reason = request.input("reject_reason");
			var is_discussion_open = request.input("is_discussion_open");

			const updateData = await CommunityPost.findOrFail(params.id);
      let oldStatus = updateData.status;

			updateData.title = title;
			updateData.description = description;
			updateData.is_discussion_open = is_discussion_open;
			updateData.status = post_status;
			updateData.reject_reason = reject_reason;

      if(oldStatus != post_status)
      {
        updateData.moderator_id = user_id;
        updateData.moderated_at = moment().format('YYYY-MM-DD HH:mm:ss');
      }

      await updateData.save();

      const query = CommunityVisitorPoint.query();
			const isExist = await query.where('community_post_reply_id', params.id).where('visitor_id', updateData.visitor_id).first();
			
			if (!isExist && post_status == 1) 
			{
				const answerSubmitPoints = await getSubmitQuestionPoints();
				const addPoints = await CommunityVisitorPoint.create(
					{
						visitor_id: updateData.visitor_id,
						type: 4,
						points: answerSubmitPoints,
						community_post_id: params.id,
					},
					trx
				);
			}

      await trx.commit();
			
      if(oldStatus != post_status && post_status != 0)
      {
        const query1 = Visitor.query();
        const visitorData = await query1.select('id', 'name', 'email').where('id', updateData.visitor_id).first();

        if(visitorData)
        {
          try {
            let postTitle = updateData.title;
            let url_slug = updateData.url_slug;
            const name = visitorData.name;
            const toEmails = visitorData.email;
            let subject, details, link;

            if(post_status == 1) 
            {
              subject = "Tech24 - Question approved on Community";
              details = `Your question for Discussion Group "${postTitle}" is approved by the Admin/Moderator and it is live in the portal at `;
              link = `${Env.get("FRONTEND_BASE_URL")}/community/question/${url_slug}`;

              const emailStatus = await Mail.send(
                "questionApproveVisitorMail",
                { name: name, title: subject, details: details, link: link },
                (message) => {
                  message.subject(subject);
                  message.from(Env.get("MAIL_USERNAME"));
                  message.to(toEmails);
                }
              );
            } 
            else 
            {
              subject = "Tech24 - Question rejected on Community";
              details = `Your question for Discussion Group "${postTitle}" is rejected by the Admin/Moderator due to "${reject_reason}"`;
              
              const emailStatus = await Mail.send(
                "questionRejectVisitorMail",
                { name: name, title: subject, details: details },
                (message) => {
                  message.subject(subject);
                  message.from(Env.get("MAIL_USERNAME"));
                  message.to(toEmails);
                }
              );
            }
          } catch (error) {
            console.log(error);
          }  
        }
      }

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
