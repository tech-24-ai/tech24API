"use strict";


const Visitor = use("App/Models/Admin/VisitorModule/Visitor");
const SignalhireLog = use("App/Models/SignalhireLog.js");
const Query = use("Query");

const _helperBasicInfoScraper = require("../../../../Helper/basicInfoScraper");
const Country = use("App/Models/Admin/LocationModule/Country");
const moment = require("moment");
const Excel = require("exceljs");
const searchInFields = ["id", "name", "email", "register_from"];

class VisitorController {

  async index({ request, response, view }) {
    const query = Visitor.query();
    query.with("visitor_group");
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    if (search) {
      if (search == "WebApp") {
        query.whereRaw('register_from is null');
      } else {
        query.where(searchQuery.search(searchInFields));
      }
    }

    if (request.input("filters")) {
      const filters = JSON.parse(request.input("filters"));

      filters.forEach((filter) => {
        switch (filter.name) {
          case "register_from":
            let text = "Linkedin";
            let text2 = "WebApp";

            if (text.indexOf(filter.value) != -1) {

              query.where('register_from', text);
            } else if (text2.indexOf(filter.value) != -1) {

              query.whereRaw('register_from is null');
            } else {

              query.whereRaw(`register_from like '%${filter.value}%'`);
            }
            break;
          case "created_at":
            query.whereRaw(
              typeof filter.value == "object"
                ? `DATE(${filter.name}) between '${filter.value.startDate}' and '${filter.value.endDate}'`
                : `DATE(${filter.name}) = '${moment(filter.value).format(
                  "YYYY-MM-DD"
                )}'`
            );
            break;
          case "updated_at":
            query.whereRaw(
              typeof filter.value == "object"
                ? `DATE(${filter.name}) between '${filter.value.startDate}' and '${filter.value.endDate}'`
                : `DATE(${filter.name}) = '${moment(filter.value).format(
                  "YYYY-MM-DD"
                )}'`
            );
            break;
          default:
            query.whereRaw(`${filter.name} LIKE '%${filter.value}%'`);
            break;
        }
      });
    }

    if (request.input("visitor_id")) {
      query.where("id", request.input("visitor_id"));
    }

    //Ignore Guest Users
    query.whereRaw(`name != 'Guest' AND 'register_from' is not null`);

    //query.whereNot("name", "Guest");
    //query.whereNotNull('register_from');

    if (request.input("start_date") && request.input("end_date")) {
      query.whereRaw(`DATE(created_at) >= '${request.input("start_date")}'`);
      query.whereRaw(`DATE(created_at) <= '${request.input("end_date")}'`);
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
      result = await query.paginate(page, pageSize);
    } else {
      result = await query.fetch();
    }

    return response.status(200).send(result);
  }


  async guestusers({ request, response, view }) {
    const query = Visitor.query();
    query.with("visitor_group");
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    if (search) {
      query.where(searchQuery.search(searchInFields));
    }

    if (request.input("filters")) {
      const filters = JSON.parse(request.input("filters"));
      filters.forEach((filter) => {
        switch (filter.name) {
          case "created_at":
            query.whereRaw(
              typeof filter.value == "object"
                ? `DATE(${filter.name}) between '${filter.value.startDate}' and '${filter.value.endDate}'`
                : `DATE(${filter.name}) = '${moment(filter.value).format(
                  "YYYY-MM-DD"
                )}'`
            );
            break;
          case "updated_at":
            query.whereRaw(
              typeof filter.value == "object"
                ? `DATE(${filter.name}) between '${filter.value.startDate}' and '${filter.value.endDate}'`
                : `DATE(${filter.name}) = '${moment(filter.value).format(
                  "YYYY-MM-DD"
                )}'`
            );
            break;
          default:
            query.whereRaw(`${filter.name} LIKE '%${filter.value}%'`);
            break;
        }
      });
    }

    if (request.input("visitor_id")) {
      query.where("id", request.input("visitor_id"));
    }


    //Only Guest Users
    query.whereRaw(`name = 'Guest' AND register_from is null`);

    if (request.input("start_date") && request.input("end_date")) {
      query.whereRaw(`DATE(created_at) >= '${request.input("start_date")}'`);
      query.whereRaw(`DATE(created_at) <= '${request.input("end_date")}'`);
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
      result = await query.paginate(page, pageSize);
    } else {
      result = await query.fetch();
    }

    return response.status(200).send(result);
  }



  async store({ request, response }) {
    let emailId = request.input("email");
    let parsedCountryResult;

    try {
      const query = new Visitor();
      query.visitor_group_id = request.input("visitor_group_id");
      query.name = request.input("name");
      query.email = request.input("email");
      query.mobile = request.input("mobile");
      query.designation = request.input("designation");
      query.company = request.input("company");

      if (request.input("country_id")) {
        query.country_id = request.input("country_id");
        const countryQuery = Country.query();
        countryQuery.select("countries.*");
        countryQuery.where("id", query.country_id);
        const countryResult = await countryQuery.fetch();
        query.country_full_name = countryResult.name;

      }

      if (request.input("location")) {
        query.location = request.input("location");
      }

      if (request.input("connections")) {
        query.connections = request.input("connections");
      }

      if (request.input("profile_pic_url")) {
        query.profile_pic_url = request.input("profile_pic_url");
      }

      if (request.input("company")) {
        query.company = request.input("company");
      }

      if (request.input("designation")) {
        query.company = request.input("designation")
      }

      if (request.input("company_location")) {
        query.company_location = request.input("company_location")
      }


      if (request.input("company_logo")) {
        query.company_logo = request.input("company_logo")
      }

      if (request.input("company_size")) {
        query.company_logo = request.input("company_size")
      }

      if (request.input("company_linkedin_link")) {
        query.company_linkedin_link = request.input("company_linkedin_link")
      }


      if (request.input("linkedin_link")) {
        query.linkedin_link = request.input("linkedin_link")
      }


      /*if (emailId) {
        // fetch Linkedin URL for visitor
        let result = await _helperBasicInfoScraper.getLinkedinURLFromEmail(
          emailId
        );

        if (result && result.url) {
          let linkedinURL = result.url;
          query.linkedin_link = linkedinURL;

          let linkedinProfile = await _helperBasicInfoScraper.getLinkedinDetailsFromURL(
            linkedinURL
          );

          if (linkedinProfile) {
            if (linkedinProfile.country) {
              const countryQuery = Country.query();
              countryQuery.select("countries.*");
              countryQuery.where("sortname", linkedinProfile.country);
              const countryResult = await countryQuery.fetch();
              parsedCountryResult = countryResult.toJSON();
            }

            if (linkedinProfile.occupation) {
              query.occupation = linkedinProfile.occupation;
            }
            if (linkedinProfile.headline) {
              query.headline = linkedinProfile.headline;
            }
            if (linkedinProfile.profile_pic_url) {
              query.profile_pic_url = linkedinProfile.profile_pic_url;
            }
            if (parsedCountryResult && parsedCountryResult.length) {
              query.country_id = parsedCountryResult[0].id;
            }
            if (linkedinProfile.country_full_name) {
              query.country_full_name = linkedinProfile.country_full_name;
            }
            if (linkedinProfile.city) {
              query.city = linkedinProfile.city;
            }
            if (linkedinProfile.state) {
              query.state = linkedinProfile.state;
            }
            if (linkedinProfile.connections) {
              query.connections = linkedinProfile.connections;
            }
            if (linkedinProfile.summary) {
              query.summary = linkedinProfile.summary;
            }
          }
        }
      }*/

      await query.save();
      return response.status(200).send({ message: "Create successfully" });
    } catch (error) {
      return response
        .status(423)
        .send({ message: "Something went wrong or check the email id" });
    }
  }

  async show({ params, request, response, view }) {
    const query = Visitor.query();
    query.where("id", params.id);
    query.with("visitor_group");
    const result = await query.firstOrFail();
    return response.status(200).send(result);
  }

  async update({ params, request, response }) {
    const query = await Visitor.findOrFail(params.id);
    query.visitor_group_id = request.input("visitor_group_id");
    query.name = request.input("name");
    query.email = request.input("email");
    query.mobile = request.input("mobile");
    query.designation = request.input("designation");
    query.company = request.input("company");

    if (request.input("country_id")) {
      query.country_id = request.input("country_id");
      const countryQuery = Country.query();
      countryQuery.select("countries.*");
      countryQuery.where("id", query.country_id);
      const countryResult = await countryQuery.fetch();
      query.country_full_name = countryResult.name;

    }

    if (request.input("location")) {
      query.location = request.input("location");
    }

    if (request.input("connections")) {
      query.connections = request.input("connections");
    }

    if (request.input("profile_pic_url")) {
      query.profile_pic_url = request.input("profile_pic_url");
    }

    if (request.input("company")) {
      query.company = request.input("company");
    }

    if (request.input("designation")) {
      query.company = request.input("designation")
    }

    if (request.input("company_location")) {
      query.company_location = request.input("company_location")
    }


    if (request.input("company_logo")) {
      query.company_logo = request.input("company_logo")
    }

    if (request.input("company_linkedin_link")) {
      query.company_linkedin_link = request.input("company_linkedin_link")
    }


    if (request.input("linkedin_link")) {
      query.linkedin_link = request.input("linkedin_link")
    }

    await query.save();
    return response.status(200).send({ message: "Updated successfully" });
  }

  async updateBlockStatus({ params, request, response }) {
    const query = await Visitor.findOrFail(params.id);
    query.is_blocked = request.input("is_blocked");
    await query.save();
    return response.status(200).send({ message: "Update successfully" });
  }
  async destroy({ params, request, response }) {
    const query = await Visitor.findOrFail(params.id);
    try {
      await query.delete();
      return response.status(200).send({ message: "Deleted successfully" });
    } catch (error) {
      return response.status(423).send({
        message: "Something went wrong",
      });
    }
  }

  async changePassword({ params, request, response }) {
    let query = await Visitor.findOrFail(params.id);
    query.password = request.input("password");
    await query.save();
    return response
      .status(200)
      .send({ message: "Password updated successfully" });
  }

  async incompleteProfile({ response }) {
    const query = Visitor.query();

    query.whereRaw("register_from = (?) AND (linkedin_link is null OR updated_at < (?))", ["linkedin" ,moment().subtract(3, 'M').toISOString()]);
 
     //query.orWhere("profile_pic_url", null);
    //query.orWhere("occupation", null);
    //query.orWhere("headline", null);
    
    query.select("id as visitor_id");
    query.select("name");
    query.select("email");

    let data = await query.fetch();
    return response.status(200).send(data);
  }

  async updateProfiles({ params, request, response }) {
    const data = request.input("data");

    let promisesArr = [];

    data.forEach((x) => {
      promisesArr.push(this.updateVisitor(x));


    });

    let a = await Promise.all(promisesArr);
    let message = a.filter((x) => !!x);

    if(message.length>0){

    } else {
      message = "Save successfully"
    }

    return response
      .status(200)
      .send({ message: message});


  }


  async updateProfile({ params, request, response }) {
  
    const data = request.input("data");

    let promisesArr = [];
    
    promisesArr.push(this.updateVisitor(data));
    let a = await Promise.all(promisesArr);
    let message = a.filter((x) => !!x);
    
    if(message.length>0){

    } else {
      message = "Save successfully"
    }

    return response
      .status(200)
      .send({ message: message});


  }

  async updateVisitor(data) {
    try {
      let query = await Visitor.findOrFail(data.visitor_id);

      if (data.linkedin_link && data.linkedin_link.length > 0) {
        query.name = data.name;
        
        if (data.location) {
          query.location = data.location;
          const countryQuery = Country.query();
          countryQuery.select("countries.*");
          countryQuery.whereNot("sortname", null);
          const countryResult = await countryQuery.fetch();
          let parsedCountryResult = countryResult.toJSON();

          if (parsedCountryResult && parsedCountryResult.length) {
            const locationstr = data.location;
            parsedCountryResult.forEach((countryResult) => {

              if (locationstr.indexOf(countryResult.name) !== -1) {
                query.country_id = countryResult.id;
                query.country_full_name = countryResult.name;
               
              } else {

              }
            });

          }
        }
        if (data.connections) {
          query.connections = data.connections;
        }
        if (data.profile_pic_url) {
          query.profile_pic_url = data.profile_pic_url;
        }
        if (data.company) {
          query.company = data.company;
        }
        if (data.designation) {
          query.designation = data.designation;
        }
        if (data.company_location) {
          query.company_location = data.company_location;
        }
        if (data.company_logo) {
          query.company_logo = data.company_logo;
        }
        if (data.comapny_size) {
          query.company_size = data.comapny_size;
        }

        if (data.mobile) {
          query.mobile=data.mobile
        }
        var arr = [];

        arr = data.linkedin_link.split("?");
        query.linkedin_link = arr[0];
        if (data.company_linkedin_link) {
          query.company_linkedin_link = data.company_linkedin_link;
        }


        await query.save();
        return "Visitor Details Updated Successfully";
      } else {
        return "Visitor LinkedIn Link not available";
      }
    } catch (ex) {
      return 'Error ' + ex.message;
    }
  }


  async exportReport({ request, response, auth }) {

    const query = Visitor.query();


    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    if (search) {
      if (search == "WebApp") {
        query.whereRaw('register_from is null');
      } else {
        query.where(searchQuery.search(searchInFields));
      }
    }

    if (request.input("filters")) {
      const filters = JSON.parse(request.input("filters"));

      filters.forEach((filter) => {
        switch (filter.name) {
          case "register_from":
            let text = "Linkedin";
            let text2 = "WebApp";

            if (text.indexOf(filter.value) != -1) {

              query.where('register_from', text);
            } else if (text2.indexOf(filter.value) != -1) {

              query.whereRaw('register_from is null');
            } else {

              query.whereRaw(`register_from like '%${filter.value}%'`);
            }
            break;
          case "created_at":
            query.whereRaw(
              typeof filter.value == "object"
                ? `DATE(${filter.name}) between '${filter.value.startDate}' and '${filter.value.endDate}'`
                : `DATE(${filter.name}) = '${moment(filter.value).format(
                  "YYYY-MM-DD"
                )}'`
            );
            break;
          case "updated_at":
            query.whereRaw(
              typeof filter.value == "object"
                ? `DATE(${filter.name}) between '${filter.value.startDate}' and '${filter.value.endDate}'`
                : `DATE(${filter.name}) = '${moment(filter.value).format(
                  "YYYY-MM-DD"
                )}'`
            );
            break;
          default:
            query.whereRaw(`${filter.name} LIKE '%${filter.value}%'`);
            break;
        }
      });
    }

    if (request.input("visitor_id")) {
      query.where("id", request.input("visitor_id"));
    }

    //Ignore Guest Users
    query.whereRaw(`name != 'Guest' AND 'register_from' is not null`);

    //query.whereNot("name", "Guest");
    //query.whereNotNull('register_from');

    if (request.input("start_date") && request.input("end_date")) {
      query.whereRaw(`DATE(created_at) >= '${request.input("start_date")}'`);
      query.whereRaw(`DATE(created_at) <= '${request.input("end_date")}'`);
    }

    var result = await query.fetch()

    const fileName = "visitors-" + moment().format('yyyy-MM-DD') + ".xlsx";
    let workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet("Visitor List");
    let font = { name: "Arial", size: 12 };

    const data = await result.toJSON();
    let exportData = [];
    let index = 1;

    if (data) {
      data.forEach((element) => {

        let register_from = "Admin Registered";

        if (element.register_from && element.register_from == "LinkedIn") {
          register_from = "LinkedIn";
        }

        exportData.push({
          sno: index++,
          name: element.name,
          email: element.email,
          mobile: element.mobile,
          designation: element.designation,
          company: element.company,
          register_from: register_from,
          linkedin_link: element.linkedin_link,
          country: element.country_full_name,
          connections: element.connections,
          location: element.location,
          company_location: element.company_location,
          company_linkedin_link: element.company_linkedin_link,
          isblocked: element.is_blocked,
          created: element.created_at,
          updated: element.updated_at,
        });
      });


    }


    let columns = [
      { header: "S. No.", key: "sno", width: 10, style: { font: font } },
      { header: "Visitor Name", key: "name", width: 30, style: { font: font } },
      { header: "Email", key: "email", width: 30, style: { font: font } },
      { header: "Mobile", key: "mobile", width: 30, style: { font: font } },
      { header: "Designation", key: "designation", width: 30, style: { font: font } },
      { header: "Company Name", key: "company", width: 30, style: { font: font } },
      { header: "Register From", key: "register_from", width: 30, style: { font: font } },
      { header: "LinkedIn URL", key: "linkedin_link", width: 60, style: { font: font } },
      { header: "Country", key: "country", width: 30, style: { font: font } },
      { header: "LinkedIn Connections", key: "connections", width: 30, style: { font: font } },
      { header: "Visitor Location", key: "location", width: 30, style: { font: font } },
      { header: "Company Location", key: "company_location", width: 30, style: { font: font } },
      { header: "Company LinkedIn URL", key: "company_linkedin_link", width: 60, style: { font: font } },
      { header: "Is Blocked", key: "is_blocked", width: 20, style: { font: font } },
      { header: "Created", key: "created_at", width: 30, style: { font: font } },
      { header: "Updated", key: "updated_at", width: 30, style: { font: font } },
    ];


    worksheet.columns = columns;
    worksheet.addRows(exportData);

    worksheet.getCell("B1", "C1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "cccccc" },
    };


    response.header(
      `Content-Type`,
      `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
    );
    response.header(`Content-Disposition`, `attachment; filename="${fileName}`);
    return workbook.xlsx.writeBuffer(response);
  }

  async fetchCondidateData({ request, auth, response, params }) {
    try {
      const items = request.input("items")
      //  fetch user info using signalhire api
      // callbackUrl:"https://3cc4-121-241-97-196.in.ngrok.io/fetchCondidateCallback"
      const body={
        items:items,
        callbackUrl:`${process.env.BASE_URL}/fetchCondidateCallback`
      }
      let result = await _helperBasicInfoScraper.searchCondidateData(body);
      // console.log('result',result)
      let message = `Request is accepted with request_Id ${result.data.requestId}, and server starts to collect data`;
      
      return response.status(200).send({ message: message});
    } catch (ex) {
      return response.status(423).send({
        message: `Error fetching Data : ${ex}`,
      });
    }
  }

  async fetchCondidateCallback({ request, response }) {
    try {
      const candidateData = Object.values(request._body).filter(data=>data.status==='success')
      
      candidateData && candidateData.map(async (data)=>{
      const {candidate,item,status} = data
      const visitorDetail = await Visitor.findBy('email',item)
      if (status==="success") {
      const [currentJob] = candidate.experience.filter(job=>job.current===true)
      const [contact] = candidate.contacts.filter(c=>c.type==='phone')
      const [location] = candidate.locations.map(e=>e.name)
      const visitorData = {
            visitor_id:visitorDetail.id,
            linkedin_link:candidate.social[0].link,
            name:candidate.fullName,
            mobile:contact.value,
            location:location,
            profile_pic_url:candidate.photo.url,
            company:currentJob.company,
            designation:currentJob.position,
            company_location:currentJob.location,
            connections:null,
            company_logo:null,
            comapny_size:null,
            company_linkedin_link:null

      }
      
      await SignalhireLog.create({
        type:"SIGNALHIRE_DATA_FETCH",
        json_data: JSON.stringify(candidate),
        visitor_id: visitorDetail.id
      });
      
      const isUpdated =await this.updateVisitor(visitorData)
      // console.log('isDataUpdated',isUpdated)
      }
    })
    } catch (ex) {
      console.log(ex)
    }
  }

}

module.exports = VisitorController;
