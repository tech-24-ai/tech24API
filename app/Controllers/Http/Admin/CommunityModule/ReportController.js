'use strict'

const Query = use("Query");
const Database = use("Database");
const Badge = use("App/Models/Admin/CommunityModule/Badge");

const Visitor = use("App/Models/Admin/VisitorModule/Visitor");
const { getvisitorPointsBadge } = require("../../../../Helper/visitorCurrentLevel");
const Community = use("App/Models/Admin/CommunityModule/Community");
const CommunityPost = use("App/Models/Admin/CommunityModule/CommunityPost");
const User = use("App/Models/Admin/UserModule/User");
const CommunityPostReply = use("App/Models/Admin/CommunityModule/CommunityPostReply");
const CommunityVisitorPoint = use("App/Models/Admin/CommunityModule/CommunityVisitorPoint");

const Excel = require("exceljs");
const moment = require("moment");

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with reports
 */
class ReportController {
  /**
   * Show a list of all reports.
   * GET reports
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */

  async get_visitor_lists ({ request, response, view }) 
  {
    const query = Visitor.query();
    query.select("id", "name")

    query.where(function () {
      this.whereHas("communityPost", (builder) => {
        builder.where("status", 1);
      });

      this.orWhereHas("communityPostReply", (builder) => {
        builder.where("status", 1);
      });
    });

    var result;
    result = (await query.fetch()).toJSON();
    return response.status(200).send(result)
  }  

  async visitor_report ({ request, response, view }) {

    const visitorId = request.input("visitor_id");
    const badgeId = request.input("badgeId");
    const country_id = request.input("country_id");

    const query = Visitor.query();
    query.select("visitors.id", "visitors.name", "visitors.email", "visitors.country_id", Database.raw('SUM(community_visitor_points.points) as total_current_points'))
    query.leftJoin('community_visitor_points', 'visitors.id', 'community_visitor_points.visitor_id')

    query.with("country", (builder) => {
      builder.select("id", "name");
    });

    query.withCount("communityPost as total_questions", (builder) => {
      builder.where("status", 1);
    });

    query.withCount("communityPost as total_questions", (builder) => {
      builder.where("status", 1);
    });

    query.withCount("communityPostReply as total_answers", (builder) => {
      builder.where("status", 1);
      builder.where('community_post_replies.parent_id', null)
    });

    query.withCount("communityPostReply as total_comments", (builder) => {
      builder.where("status", 1);
      builder.where('community_post_replies.parent_id', '>' ,0)
    });

    query.where(function () {
      this.whereHas("communityPost", (builder) => {
        builder.where("status", 1);
      });

      this.orWhereHas("communityPostReply", (builder) => {
        builder.where("status", 1);
      });
    });

    if(visitorId > 0) {
      query.where("visitors.id", visitorId);
    }
    
    if(country_id > 0) {
      query.where("visitors.country_id", country_id);
    }

    if(badgeId > 0) {

      const badgeQuery = Badge.query()
      badgeQuery.where('id', badgeId)
      const badgeResult = await badgeQuery.first();

      if(badgeResult)
      {  
        let minRange = badgeResult.min_range; 
        let maxRange = badgeResult.max_range;

        query.havingRaw(`total_current_points BETWEEN ${minRange} AND ${maxRange}`)
      }  
    }
    
    query.groupBy("visitors.id")

    var result; var finalResult;

    result = (await query.fetch()).toJSON();
    finalResult = await this.response(result);
  
    // return response.status(200).send(finalResult)

    let exportData = [];
    let index = 1;

    const fileName = "visitor_report-" + moment().format("DD-MM-YYYY") + ".xlsx";
    let workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet("Visitor Report");
    let font = { name: "Arial", size: 12 };

    if (finalResult) 
    {
      finalResult.forEach((element) => {
        
        exportData.push({
          sno: index++,
          name: element.name,
          email: element.email,
          country: element.country?.name,
          total_question: element.__meta__.total_questions,
          total_answers: element.__meta__.total_answers,
          total_comments: element.__meta__.total_comments,
          total_points: element.total_current_points,
          current_badge: (element.current_badge) ? element.current_badge : "-",
        });
      });
    }

    let columns = [
      { header: "Sr No.", key: "sno", width: 10, style: { font: font } },
      {
        header: "Name",
        key: "name",
        width: 30,
        style: { font: font },
      },
      {
        header: "Email",
        key: "email",
        width: 40,
        style: { font: font },
      },
      {
        header: "Country",
        key: "country",
        width: 30,
        style: { font: font },
      },
      {
        header: "Total Questions",
        key: "total_question",
        width: 30,
        style: { font: font },
      },
      {
        header: "Total Answers",
        key: "total_answers",
        width: 30,
        style: { font: font },
      },
      {
        header: "Total Comments",
        key: "total_comments",
        width: 30,
        style: { font: font },
      },
      {
        header: "Current Points",
        key: "total_points",
        width: 30,
        style: { font: font },
      },
      {
        header: "Badge",
        key: "current_badge",
        width: 60,
        style: { font: font },
      },
    ];

    worksheet.columns = columns;
    worksheet.addRows(exportData);

    response.header(
      `Content-Type`,
      `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
    );
    response.header(`Content-Disposition`, `attachment; filename="${fileName}`);
    return workbook.xlsx.writeBuffer(response);
  }

  async response (result)
 	{
		for(let i = 0; i < result.length; i++)
		{
			let res = result[i];
			let visitor_id = res.id;
			let { total_points, current_badge } = await getvisitorPointsBadge(visitor_id);

			res.total_points = total_points;
			res.current_badge = current_badge;
			result[i] = res;
		}
    
		return result;
  }

  async dicsussion_group_summary_report({ request, response, view })
  {
    const community_id = request.input("community_id");
    const from_date = request.input("from_date");
    const to_date = request.input("to_date");

    const communityQuery = Community.query();
    communityQuery.select("id", "name", "created_at");

    communityQuery.withCount("communityPost as total_questions", (builder) => {
      if(from_date && to_date) {
        builder.whereRaw(`DATE(community_posts.created_at) between '${from_date}' and '${to_date}'`)
      } 
      else if (from_date && !to_date) {
        builder.whereRaw(`DATE(community_posts.created_at) >= '${from_date}'`)
      }
      else if (!from_date && to_date) {
        builder.whereRaw(`DATE(community_posts.created_at) <= '${to_date}'`)
      }
    });

    communityQuery.withCount("getCommunityPostReply as total_answers", (builder) => {
      builder.where('parent_id', null)

      if(from_date && to_date) {
        builder.whereRaw(`DATE(community_post_replies.created_at) between '${from_date}' and '${to_date}'`)
      } 
      else if (from_date && !to_date) {
        builder.whereRaw(`DATE(community_post_replies.created_at) >= '${from_date}'`)
      }
      else if (!from_date && to_date) {
        builder.whereRaw(`DATE(community_post_replies.created_at) <= '${to_date}'`)
      }
    });

    communityQuery.withCount("getCommunityPostReply as total_comments", (builder) => {
      builder.where('parent_id', '>' ,0)

      if(from_date && to_date) {
        builder.whereRaw(`DATE(community_post_replies.created_at) between '${from_date}' and '${to_date}'`)
      } 
      else if (from_date && !to_date) {
        builder.whereRaw(`DATE(community_post_replies.created_at) >= '${from_date}'`)
      }
      else if (!from_date && to_date) {
        builder.whereRaw(`DATE(community_post_replies.created_at) <= '${to_date}'`)
      }
    });

    communityQuery.with("communityPost", function(builder) {
      builder.select('community_id', Database.raw('SUM(views_counter) as total_views_counter'))

      if(from_date && to_date) {
        builder.whereRaw(`DATE(community_posts.created_at) between '${from_date}' and '${to_date}'`)
      } 
      else if (from_date && !to_date) {
        builder.whereRaw(`DATE(community_posts.created_at) >= '${from_date}'`)
      }
      else if (!from_date && to_date) {
        builder.whereRaw(`DATE(community_posts.created_at) <= '${to_date}'`)
      }
      builder.groupBy("community_id")
    });

    if(community_id > 0) {
      communityQuery.where("id", community_id);
    }
    
    communityQuery.orderBy("id", "DESC")
    var communityResult = (await communityQuery.fetch()).toJSON();

    // Get all questions lists
    const communityPostQuery = CommunityPost.query();
    communityPostQuery.select("id", "community_id", "title", "description", "views_counter", "created_at");

    communityPostQuery.with('community',(builder)=>{
			builder.select('id','name')
		});

    communityPostQuery.withCount('communityPostReply as total_answers', (builder) => {
      builder.where('parent_id', null)
    });

    communityPostQuery.withCount('communityPostReply as total_comments', (builder) => {
      builder.where('parent_id', '>', 0)
    });

    if(community_id > 0) {
      communityPostQuery.where("community_id", community_id);
    }

    if(from_date && to_date) {
      communityPostQuery.whereRaw(`DATE(community_posts.created_at) between '${from_date}' and '${to_date}'`)
    } 
    else if (from_date && !to_date) {
      communityPostQuery.whereRaw(`DATE(community_posts.created_at) >= '${from_date}'`)
    }
    else if (!from_date && to_date) {
      communityPostQuery.whereRaw(`DATE(community_posts.created_at) <= '${to_date}'`)
    }

    communityPostQuery.orderBy("id", "DESC");
    var communityPostResult = (await communityPostQuery.fetch()).toJSON();

    // return response.status(200).send(communityPostResult)

    let exportData = [];
    let index = 1;

    const fileName = "discussion_group_report_with_summary-" + moment().format("DD-MM-yyyy") + ".xlsx";
    let workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet("Summary");
    let detailsWorksheet = workbook.addWorksheet("Details");
    let font = { name: "Arial", size: 12 };

    if (communityResult) 
    {
      communityResult.forEach((element) => {

        let totalQuestion = element.__meta__.total_questions;
        let totalAnswers = element.__meta__.total_answers;
        let totalComments = element.__meta__.total_comments;
        let totalViews = (element.communityPost[0]) ? element.communityPost[0]?.total_views_counter : 0;

        let finalTotal = totalQuestion + totalAnswers + totalComments + totalViews;

        exportData.push({
          sno: index++,
          name: element.name,
          total_question: totalQuestion,
          total_answers: totalAnswers,
          total_comments: totalComments,
          total_views: totalViews,
          final_total: finalTotal,
        });
      });
    }

    let columns = [
      { header: "Sr No.", key: "sno", width: 10, style: { font: font } },
      {
        header: "Name",
        key: "name",
        width: 30,
        style: { font: font },
      },
      {
        header: "Total Questions",
        key: "total_question",
        width: 30,
        style: { font: font },
      },
      {
        header: "Total Answers",
        key: "total_answers",
        width: 30,
        style: { font: font },
      },
      {
        header: "Total Comments",
        key: "total_comments",
        width: 30,
        style: { font: font },
      },
      {
        header: "Total Views",
        key: "total_views",
        width: 30,
        style: { font: font },
      },
      {
        header: "Final overall total",
        key: "final_total",
        width: 30,
        style: { font: font },
      },
    ];

    worksheet.columns = columns;
    worksheet.addRows(exportData);

    // Generate details tab

    let exportDetailsData = [];
    let cnt = 1;
    if (communityPostResult) 
    {
      communityPostResult.forEach((element) => {

        let totalAnswers = element.__meta__.total_answers;
        let totalComments = element.__meta__.total_comments;

        exportDetailsData.push({
          sno: cnt++,
          discussion_group: element.community.name,
          title: element.title,
          total_answers: totalAnswers,
          total_comments: totalComments,
          total_views: element.views_counter,
        });
      });
    }
    
    let detailsColumns = [
      { header: "Sr No.", key: "sno", width: 10, style: { font: font } },
      {
        header: "Discussion Group",
        key: "discussion_group",
        width: 30,
        style: { font: font },
      },
      {
        header: "Title",
        key: "title",
        width: 30,
        style: { font: font },
      },
      {
        header: "Total Answers",
        key: "total_answers",
        width: 30,
        style: { font: font },
      },
      {
        header: "Total Comments",
        key: "total_comments",
        width: 30,
        style: { font: font },
      },
      {
        header: "Total Views",
        key: "total_views",
        width: 30,
        style: { font: font },
      },
    ];

    detailsWorksheet.columns = detailsColumns;
    detailsWorksheet.addRows(exportDetailsData);

    response.header(
      `Content-Type`,
      `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
    );
    response.header(`Content-Disposition`, `attachment; filename="${fileName}`);
    return workbook.xlsx.writeBuffer(response);
  }

  async get_moderator_lists ({ request, response, view }) 
  {
    const query = User.query();
    query.select("id", "name")

    query.whereHas('userCommunities')

    query.whereHas('role', (builder) => {
      builder.whereRaw("name LIKE '%moderator%'")
    })

    var result = (await query.fetch()).toJSON();
    return response.status(200).send(result)
  } 

  async moderator_report({ request, response, view }) 
  {
    const moderatorId = request.input("moderator_id");
    const communityId = request.input("community_id");
    
    const query = User.query();
    query.select("users.id", "users.name", "users.email", "users.role_id")

    query.with('userCommunities', (builder) => {
      builder.select("id", "name")
        
      if(communityId > 0) {
        builder.where("user_communities.community_id", communityId)
      }

      builder.withCount('communityPost as total_pending_questions', (builder1) => {
        builder1.where('status', 0)
      })

      builder.withCount('communityPostReply as total_pending_answers', (builder2) => {
        builder2.where('status', 0)
        builder2.where('parent_id', null)
      })

      builder.withCount('communityPostReply as total_pending_replies', (builder2) => {
        builder2.where('status', 0)
        builder2.where('parent_id', '>', 0)
      })
    })

    query.withCount('communityPost as total_question_moderated')
    
    query.withCount('communityPostReply as total_answer_moderated', (builder) => {
      builder.where('community_post_replies.parent_id', null)
    })

    query.withCount('communityPostReply as total_replies_moderated', (builder) => {
      builder.where('community_post_replies.parent_id', '>', 0)
    })

    query.whereHas('userCommunities')

    query.whereHas('role', (builder) => {
      builder.whereRaw("name LIKE '%moderator%'")
    })

    if(moderatorId > 0) {
      query.where('id', moderatorId)
    }
    
    var result = (await query.fetch()).toJSON();
    // return response.status(200).send(result)

    let exportData = [];
    let index = 1;

    const fileName = "Moderator_report-" + moment().format("DD-MM-YYYY") + ".xlsx";
    let workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet("Visitor Report");
    let font = { name: "Arial", size: 12 };
    
    if (result) 
    {
      result.forEach((element) => {

        var userCommunities = element.userCommunities;
        var communities = [];
        var totalPendingQuestions = [];
        var totalPendingAnswers = [];
        var totalPendingReplies = [];

        if(userCommunities.length > 0) 
        {
          communities = userCommunities.map(x => x.name);
          let metaData = userCommunities.map(x => x.__meta__);
          totalPendingQuestions = metaData.map(x => x.total_pending_questions);
          totalPendingAnswers = metaData.map(x => x.total_pending_answers);
          totalPendingReplies = metaData.map(x => x.total_pending_replies);
        }

        exportData.push({
          sno: index++,
          moderator_name: element.name,
          moderator_email: element.email,
          discussion_group: communities.join(", "),
          total_moderated_questions: element.__meta__?.total_question_moderated,
          total_pending_questions: totalPendingQuestions.reduce((partialSum, a) => partialSum + a, 0),
          total_moderated_answers: element.__meta__?.total_answer_moderated,
          total_pending_answers: totalPendingAnswers.reduce((partialSum, a) => partialSum + a, 0),
          total_moderated_replies: element.__meta__?.total_replies_moderated,
          total_pending_replies: totalPendingReplies.reduce((partialSum, a) => partialSum + a, 0),
        });
      });
    }

    // return exportData;

    let columns = [
      { header: "Sr No.", key: "sno", width: 10, style: { font: font } },
      {
        header: "Moderator Name",
        key: "moderator_name",
        width: 30,
        style: { font: font },
      },
      {
        header: "Moderator Email",
        key: "moderator_email",
        width: 40,
        style: { font: font },
      },
      {
        header: "DIscussion Groups",
        key: "discussion_group",
        width: 30,
        style: { font: font },
      },
      {
        header: "Total Question moderated",
        key: "total_moderated_questions",
        width: 30,
        style: { font: font },
      },
      {
        header: "Total Pending Questions",
        key: "total_pending_questions",
        width: 30,
        style: { font: font },
      },
      {
        header: "Total Answers moderated",
        key: "total_moderated_answers",
        width: 30,
        style: { font: font },
      },
      {
        header: "Total Pending Answers",
        key: "total_pending_answers",
        width: 30,
        style: { font: font },
      },
      {
        header: "Total Comments moderated",
        key: "total_moderated_replies",
        width: 30,
        style: { font: font },
      },
      {
        header: "Total Pending Replies",
        key: "total_pending_replies",
        width: 30,
        style: { font: font },
      },
    ];

    worksheet.columns = columns;
    worksheet.addRows(exportData);

    response.header(
      `Content-Type`,
      `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
    );
    response.header(`Content-Disposition`, `attachment; filename="${fileName}`);
    return workbook.xlsx.writeBuffer(response);

  } 

  async community_dashboard({ request, response, view }) 
  {
    let counters = [];

    counters.push({
      name: "Total Discussion Group",
      icon: "GroupWorkIcon",
      color: "success",
      value: await Community.query().getCount(),
    });

    counters.push({
      name: "Total Questions",
      icon: "QuestionMarkIcon",
      color: "warning",
      value: await CommunityPost.query().getCount(),
    });

    counters.push({
      name: "Total Answers",
      icon: "QuestionAnswerIcon",
      color: "primary",
      value: await CommunityPostReply.query().getCount(),
    });

    let totalViews = await CommunityPost.query().getSum('views_counter')
    counters.push({
      name: "Total Views",
      icon: "ViewModuleIcon",
      color: "success",
      value: totalViews,
    });

    const query = Visitor.query();
    query.where(function () {
      this.whereHas("communityPost", (builder) => {
        builder.where("status", 1);
      });

      this.orWhereHas("communityPostReply", (builder) => {
        builder.where("status", 1);
      });
    });
    let totalVisitors = await query.getCount()

    counters.push({
      name: "Total Visitors",
      icon: "Diversity3Icon",
      color: "warning",
      value: totalVisitors,
    });


    // Get total Query views based on Communities
    const communityQuery = Community.query();
    communityQuery.select("communities.id", "communities.name", Database.raw('SUM(community_posts.views_counter) as total_query_views'), Database.raw('COUNT(community_posts.id) as total_questions'))
    communityQuery.leftJoin('community_posts', 'communities.id', 'community_posts.community_id')

    communityQuery.withCount('getCommunityPostReply as total_post_answers', (builder) => {
			builder.where('parent_id', null)
		})

    communityQuery.having('total_query_views', '>', 0)
    communityQuery.groupBy("communities.id")
    communityQuery.orderBy('total_query_views', 'DESC')
    let communityResult = (await communityQuery.limit(10).fetch()).toJSON();


    // Get Top visitors based on points and badges
    const visitorQuery = CommunityVisitorPoint.query();
    visitorQuery.select("community_visitor_points.visitor_id as id", "community_visitor_points.visitor_id", Database.raw('SUM(community_visitor_points.points) as total_points'))
    
    visitorQuery.with("visitor", (builder) => {
      builder.select("id", "name", "email")
    })

    visitorQuery.groupBy("visitor_id")
    visitorQuery.orderBy('total_points', 'DESC')
    let visitorResult = (await visitorQuery.limit(10).fetch()).toJSON();
    let visitorFinalResult = await this.response(visitorResult);


    // Top Queries based on view count
    const questionQuery = CommunityPost.query();
    questionQuery.select('id', 'title', 'views_counter', 'community_id', 'visitor_id')

    questionQuery.with('community', (builder) => {
      builder.select('id', 'name')
    })

    questionQuery.with('visitor', (builder) => {
      builder.select('id', 'name')
    })
    
    questionQuery.withCount('communityVote as total_helpful', (builder) => {
      builder.where('vote_type', 1)
    })

    questionQuery.orderBy('views_counter', 'DESC')
    let questionResult = (await questionQuery.limit(10).fetch()).toJSON();


    // Generate Response
    let responseData = []; 
    responseData.push({
      counters : counters,
      community_listings : communityResult,
      visitor_listings : visitorFinalResult,
      queries_listings : questionResult,
    })
    return response.status(200).send({ responseData });
  }  

}

module.exports = ReportController
