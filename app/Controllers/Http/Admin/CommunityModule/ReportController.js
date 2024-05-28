'use strict'

const Query = use("Query");
const Database = use("Database");
const Badge = use("App/Models/Admin/CommunityModule/Badge");

const Visitor = use("App/Models/Admin/VisitorModule/Visitor");
const { getvisitorPointsBadge } = require("../../../../Helper/visitorCurrentLevel");
const Community = use("App/Models/Admin/CommunityModule/Community");
const CommunityPost = use("App/Models/Admin/CommunityModule/CommunityPost");
const CommunityPostReply = use("App/Models/Admin/CommunityModule/CommunityPostReply");
const User = use("App/Models/Admin/UserModule/User");
const CommunityVisitorPoint = use("App/Models/Admin/CommunityModule/CommunityVisitorPoint");

const Excel = require("exceljs");
const moment = require("moment");

const tech24_logo = " data:image/png;base64,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"

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
    let worksheet = workbook.addWorksheet("Sheet 1");
    
    let font = { name: "Calibari", size: 12 };
    let headerFont = { name: "Arial", size: 18 };

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
        width: 25,
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
        width: 25,
        style: { font: font },
      },
      {
        header: "Total Questions",
        key: "total_question",
        width: 20,
        style: { font: font },
      },
      {
        header: "Total Answers",
        key: "total_answers",
        width: 20,
        style: { font: font },
      },
      {
        header: "Total Comments",
        key: "total_comments",
        width: 20,
        style: { font: font },
        fill: { fgColor:{argb:'F08080'} }
      },
      {
        header: "Current Points",
        key: "total_points",
        width: 20,
        style: { font: font },
      },
      {
        header: "Badge",
        key: "current_badge",
        width: 25,
        style: { font: font },
      },
    ];

    worksheet.columns = columns;
    worksheet.addRows(exportData);

    worksheet.duplicateRow(1, 5, true);
    worksheet.getRow(1).values = []
    worksheet.getRow(2).values = []
    worksheet.getRow(3).values = []
    worksheet.getRow(4).values = []
    worksheet.getRow(5).values = []


    var imageId1 = workbook.addImage({
      base64: tech24_logo,
      extension: 'png',
    });

    worksheet.mergeCells('A2', 'C2');
    worksheet.addImage(imageId1, 'B2:B2');

    worksheet.mergeCells('D2', 'I2');
    worksheet.getCell('D2').value = 'Visitor Report'
    worksheet.getCell('D2').style = { font: headerFont }

    worksheet.getCell('D3').value = `Generated On : ${moment().format("DD-MM-YYYY")}`
    worksheet.getCell('D3').style = { font: font }

    worksheet.getRow(6).font = {
      bold: true,
      name: "Calibari", 
      size: 12,
      // color: { argb: 'ffffffff' }
    };

    // worksheet.getRow(6).fill = {
      
    //     type: 'pattern',
    //     pattern: 'gray125',
    //     bgColor: {
    //         argb: 'ff0074d9'
    //     }
      
    // }

    response.header(
      `Content-Type`,
      `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
    );
    response.header(`Content-Disposition`, `attachment; filename="${fileName}`);
    return workbook.xlsx.writeBuffer(response);
  }

  async dicsussion_group_summary_report({ request, response, view })
  {
    const community_id = request.input("community_id");
    const from_date = request.input("from_date");
    const to_date = request.input("to_date");

    const communityQuery = Community.query();
    communityQuery.select("id", "name", "created_at");

    // communityQuery.withCount("communityPost as total_questions", (builder) => {
    //   if(from_date && to_date) {
    //     builder.whereRaw(`DATE(community_posts.created_at) between '${from_date}' and '${to_date}'`)
    //   } 
    //   else if (from_date && !to_date) {
    //     builder.whereRaw(`DATE(community_posts.created_at) >= '${from_date}'`)
    //   }
    //   else if (!from_date && to_date) {
    //     builder.whereRaw(`DATE(community_posts.created_at) <= '${to_date}'`)
    //   }
    // });

    communityQuery.withCount("getCommunityPostReply as total_answers", (builder) => {
      builder.where('community_post_replies.parent_id', null)
			builder.where('community_post_replies.status', 1)

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
      builder.where('community_post_replies.parent_id', '>' ,0)
			builder.where('community_post_replies.status', 1)

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
			builder.where('community_posts.status', 1)

      if(from_date && to_date) {
        builder.whereRaw(`DATE(community_posts.created_at) between '${from_date}' and '${to_date}'`)
      } 
      else if (from_date && !to_date) {
        builder.whereRaw(`DATE(community_posts.created_at) >= '${from_date}'`)
      }
      else if (!from_date && to_date) {
        builder.whereRaw(`DATE(community_posts.created_at) <= '${to_date}'`)
      }

      builder.withCount('postViews as total_question_views', (builder) => {
        builder.where('community_visitor_view_logs.type', 1)
  
        if(from_date && to_date) {
          builder.whereRaw(`DATE(community_visitor_view_logs.created_at) between '${from_date}' and '${to_date}'`)
        } 
        else if (from_date && !to_date) {
          builder.whereRaw(`DATE(community_visitor_view_logs.created_at) >= '${from_date}'`)
        }
        else if (!from_date && to_date) {
          builder.whereRaw(`DATE(community_visitor_view_logs.created_at) <= '${to_date}'`)
        }
      });
    });

    if(community_id > 0) {
      communityQuery.where("id", community_id);
    }
    
    communityQuery.orderBy("id", "DESC")
    var communityResult = (await communityQuery.fetch()).toJSON();

    // Get all questions lists
    const communityPostQuery = CommunityPost.query();
    communityPostQuery.select("id", "community_id", "title", "url_slug", "description", "views_counter", "created_at");
    
		communityPostQuery.where('status', 1)
    communityPostQuery.with('community',(builder)=>{
			builder.select('id','name')
		});

    communityPostQuery.withCount('communityPostReply as total_answers', (builder) => {
      builder.where('parent_id', null)
			builder.where('status', 1)
    });

    communityPostQuery.withCount('communityPostReply as total_comments', (builder) => {
      builder.where('parent_id', '>', 0)
			builder.where('status', 1)
    });

    communityPostQuery.withCount('postViews as total_question_views', (builder) => {
      builder.where('type', 1)

      if(from_date && to_date) {
        builder.whereRaw(`DATE(community_visitor_view_logs.created_at) between '${from_date}' and '${to_date}'`)
      } 
      else if (from_date && !to_date) {
        builder.whereRaw(`DATE(community_visitor_view_logs.created_at) >= '${from_date}'`)
      }
      else if (!from_date && to_date) {
        builder.whereRaw(`DATE(community_visitor_view_logs.created_at) <= '${to_date}'`)
      }
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

    // return response.status(200).send(communityResult)

    let exportData = [];
    let index = 1;

    const fileName = "discussion_group_report_with_summary-" + moment().format("DD-MM-yyyy") + ".xlsx";
    let workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet("Summary");
    let detailsWorksheet = workbook.addWorksheet("Details");
    let font = { name: "Calibari", size: 12 };
    let headerFont = { name: "Arial", size: 18 };

    if (communityResult) 
    {
      communityResult.forEach((element) => {

        var communityPost = element.communityPost;
        var totalQuestionViews = [];
        var questions = [];

        if(communityPost.length > 0) 
        {
          questions = communityPost.map(x => x.name);
          let metaData = communityPost.map(x => x.__meta__);
          totalQuestionViews = metaData.map(x => x.total_question_views);
        }

        let totalQuestion = communityPost.length;
        let totalAnswers = element.__meta__.total_answers;
        let totalComments = element.__meta__.total_comments;
        let totalViews = totalQuestionViews.reduce((partialSum, a) => partialSum + a, 0);

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
        width: 25,
        style: { font: font },
      },
      {
        header: "Total Questions",
        key: "total_question",
        width: 25,
        style: { font: font },
      },
      {
        header: "Total Answers",
        key: "total_answers",
        width: 25,
        style: { font: font },
      },
      {
        header: "Total Comments",
        key: "total_comments",
        width: 25,
        style: { font: font },
      },
      {
        header: "Total Views",
        key: "total_views",
        width: 25,
        style: { font: font },
      },
      {
        header: "Final overall total",
        key: "final_total",
        width: 25,
        style: { font: font },
      },
    ];

    worksheet.columns = columns;
    worksheet.addRows(exportData);

    worksheet.duplicateRow(1, 5, true);
    worksheet.getRow(1).values = []
    worksheet.getRow(2).values = []
    worksheet.getRow(3).values = []
    worksheet.getRow(4).values = []
    worksheet.getRow(5).values = []

    var imageId1 = workbook.addImage({
      base64: tech24_logo,
      extension: 'png',
    });

    worksheet.mergeCells('A2', 'C2');
    worksheet.addImage(imageId1, 'B2:B2');

    worksheet.mergeCells('D2', 'I2');
    worksheet.getCell('D2').value = `Discussion Group with Summary Report ${moment(from_date).format("DD/MM/YYYY")} to ${moment(to_date).format("DD/MM/YYYY")}`
    worksheet.getCell('D2').style = { font: headerFont }

    worksheet.getCell('D3').value = `Generated On : ${moment().format("DD-MM-YYYY")}`
    worksheet.getCell('D3').style = { font: font }

    worksheet.getRow(6).font = {
      bold: true,
      name: "Calibari", 
      size: 12
    };

    // Generate details tab

    let exportDetailsData = [];
    let cnt = 1;
    if (communityPostResult) 
    {
      communityPostResult.forEach((element) => {

        let totalAnswers = element.__meta__.total_answers;
        let totalComments = element.__meta__.total_comments;
        let totalViews = element.__meta__.total_question_views;

        exportDetailsData.push({
          sno: cnt++,
          discussion_group: element.community.name,
          title: element.title,
          total_answers: totalAnswers,
          total_comments: totalComments,
          total_views: totalViews,
        });
      });
    }
    
    let detailsColumns = [
      { header: "Sr No.", key: "sno", width: 10, style: { font: font } },
      {
        header: "Discussion Group",
        key: "discussion_group",
        width: 25,
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

    detailsWorksheet.duplicateRow(1, 5, true);
    detailsWorksheet.getRow(1).values = []
    detailsWorksheet.getRow(2).values = []
    detailsWorksheet.getRow(3).values = []
    detailsWorksheet.getRow(4).values = []
    detailsWorksheet.getRow(5).values = []

    var imageId1 = workbook.addImage({
      base64: tech24_logo,
      extension: 'png',
    });

    detailsWorksheet.mergeCells('A2', 'C2');
    detailsWorksheet.addImage(imageId1, 'B2:B2');

    detailsWorksheet.mergeCells('D2', 'I2');
    detailsWorksheet.getCell('D2').value = `Question Summary ${moment(from_date).format("DD/MM/YYYY")} to ${moment(to_date).format("DD/MM/YYYY")}`
    detailsWorksheet.getCell('D2').style = { font: headerFont }

    detailsWorksheet.getCell('D3').value = `Generated On : ${moment().format("DD-MM-YYYY")}`
    detailsWorksheet.getCell('D3').style = { font: font }

    detailsWorksheet.getRow(6).font = {
      bold: true,
      name: "Calibari", 
      size: 12
    };

    detailsWorksheet.getRow(1).font = {
      bold: true,
      name: "Calibari", 
      size: 12
    };

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

      builder.withCount('getCommunityPostReply as total_pending_answers', (builder2) => {
        builder2.where('community_post_replies.status', 0)
        builder2.where('community_post_replies.parent_id', null)
      })

      builder.withCount('getCommunityPostReply as total_pending_replies', (builder2) => {
        builder2.where('community_post_replies.status', 0)
        builder2.where('community_post_replies.parent_id', '>', 0)
      })
    })

    query.withCount('communityPost as total_question_moderated')
    
    query.withCount('communityPostReplyData as total_answer_moderated', (builder) => {
      builder.where('community_post_replies.parent_id', null)
    })

    query.withCount('communityPostReplyData as total_replies_moderated', (builder) => {
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
    return response.status(200).send(result)

    let exportData = [];
    let index = 1;

    const fileName = "Moderator_report-" + moment().format("DD-MM-YYYY") + ".xlsx";
    let workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet("Moderator Report");
    let font = { name: "Calibara", size: 12 };
    let headerFont = { name: "Arial", size: 18 };

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
        width: 25,
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
        width: 40,
        style: { font: font },
      },
      {
        header: "Total Question moderated",
        key: "total_moderated_questions",
        width: 25,
        style: { font: font },
      },
      {
        header: "Total Pending Questions",
        key: "total_pending_questions",
        width: 25,
        style: { font: font },
      },
      {
        header: "Total Answers moderated",
        key: "total_moderated_answers",
        width: 25,
        style: { font: font },
      },
      {
        header: "Total Pending Answers",
        key: "total_pending_answers",
        width: 25,
        style: { font: font },
      },
      {
        header: "Total Comments moderated",
        key: "total_moderated_replies",
        width: 25,
        style: { font: font },
      },
      {
        header: "Total Pending Replies",
        key: "total_pending_replies",
        width: 25,
        style: { font: font },
      },
    ];

    worksheet.columns = columns;
    worksheet.addRows(exportData);

    worksheet.duplicateRow(1, 5, true);
    worksheet.getRow(1).values = []
    worksheet.getRow(2).values = []
    worksheet.getRow(3).values = []
    worksheet.getRow(4).values = []
    worksheet.getRow(5).values = []

    var imageId1 = workbook.addImage({
      base64: tech24_logo,
      extension: 'png',
    });

    worksheet.mergeCells('A2', 'C2');
    worksheet.addImage(imageId1, 'B2:B2');

    worksheet.mergeCells('D2', 'I2');
    worksheet.getCell('D2').value = 'Moderator Report'
    worksheet.getCell('D2').style = { font: headerFont }

    worksheet.getCell('D3').value = `Generated On : ${moment().format("DD-MM-YYYY")}`
    worksheet.getCell('D3').style = { font: font }

    worksheet.getRow(6).font = {
      bold: true,
      name: "Calibari", 
      size: 12
    };

    response.header(
      `Content-Type`,
      `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
    );
    response.header(`Content-Disposition`, `attachment; filename="${fileName}`);
    return workbook.xlsx.writeBuffer(response);

  } 

  async community_dashboard({ request, response, view }) 
  {
    let data = [];

    data.push({
      name: "Total Community",
      icon: "view_module",
      color: "success",
      value: await Community.query().getCount(),
    });

    data.push({
      name: "Total Questions",
      icon: "quiz",
      color: "warning",
      value: await CommunityPost.query().getCount(),
    });

    data.push({
      name: "Total Answers",
      icon: "message",
      color: "primary",
      value: await CommunityPostReply.query().getCount(),
    });

    let totalViews = await CommunityPost.query().getSum('views_counter')
    data.push({
      name: "Total Views",
      icon: "visibility",
      color: "success",
      value: totalViews,
    });

    const query = Visitor.query();
    query.where(function () {
      this.whereHas("communityPost");
      this.orWhereHas("communityPostReply");
    });
    let totalVisitors = await query.getCount()

    data.push({
      name: "Total Visitors",
      icon: "groups",
      color: "warning",
      value: totalVisitors,
    });

    return response.status(200).send({ data });
  }  

  async top_communities({ request, response, view }) 
  {
    
    // Get total Query views based on Communities
    const communityQuery = Community.query();
    communityQuery.select("communities.id", "communities.name", Database.raw('SUM(community_posts.views_counter) as total_query_views'), Database.raw('COUNT(community_posts.id) as total_questions'))
    communityQuery.leftJoin('community_posts', 'communities.id', 'community_posts.community_id')

    communityQuery.withCount('getCommunityPostReply as total_post_answers', (builder) => {
			builder.where('parent_id', null)
			builder.where('community_post_replies.status', 1)
		})

    communityQuery.having('total_query_views', '>', 0)
    communityQuery.groupBy("communities.id")
    communityQuery.orderBy('total_query_views', 'DESC')
    let communityResult = (await communityQuery.limit(10).fetch()).toJSON();
		return response.status(200).send(communityResult);

  }  

  async top_visitors({ request, response, view }) 
  {

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
		return response.status(200).send(visitorFinalResult);

  }  

  async top_queries({ request, response, view }) 
  { 
    // Top Queries based on view count
    const questionQuery = CommunityPost.query();
    // questionQuery.select('id', 'title', 'views_counter', 'community_id', 'visitor_id')

    questionQuery.with('community', (builder) => {
      builder.select('id', 'name')
    })

    questionQuery.with('visitor', (builder) => {
      builder.select('id', 'name')
    })
    
    questionQuery.withCount('communityVote as total_helpful', (builder) => {
      builder.where('vote_type', 1)
    })

    questionQuery.withCount('communityPostReply as total_answers', (builder) => {
      builder.where('community_post_replies.parent_id', null)
      builder.where('community_post_replies.status', 1)
    })

    questionQuery.orderBy('views_counter', 'DESC')
    let questionResult = (await questionQuery.limit(10).fetch()).toJSON();
		return response.status(200).send(questionResult);
  }  

  async response (result)
 	{
		for(let i = 0; i < result.length; i++)
		{
			let res = result[i];
			let visitor_id = res.id;
			let { total_points, current_badge } = await getvisitorPointsBadge(visitor_id);

			res.total_points = total_points;
			res.current_badge = (current_badge) ? current_badge : "-";
			result[i] = res;
		}
    
		return result;
  }

}

module.exports = ReportController
