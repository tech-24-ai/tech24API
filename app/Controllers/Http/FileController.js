"use strict";
const Helpers = use("Helpers");
const Drive = use("Drive");
const MarketPlan = use("App/Models/MarketPlan");
const Document = use("App/Models/Admin/DocumentModule/Document");
const DocumentVisitorLog = use(
  "App/Models/Admin/DocumentModule/DocumentVisitorLog"
);
const DocumentInvestorLog = use(
  "App/Models/Admin/DocumentModule/DocumentInvestorLog"
);
const ModuleSubcription = use("App/Models/ModuleSubscription");
const Config = use("App/Models/Admin/ConfigModule/Config");
const Subcription = use(
  "App/Models/Admin/VisitorSubscriptionModule/ItmapEuSubcription"
);
const Purchase = use(
  "App/Models/Admin/VisitorSubscriptionModule/ItmapEuDocPurchase"
);
const InvestorSubcription = use("App/Models/Subcription");

const aws = require("aws-sdk");

const s3 = new aws.S3();
const createRandomName = require("../../Helper/randomString");
const axios = require('axios')
const {	checkAccessToken } = require("../../Helper/googleDrive");
const CommunityPostAttachment = use("App/Models/Admin/CommunityModule/CommunityPostAttachment");

class FileController {
  async document({ request, response }) {
    const validationOptions = {
      types: [
        "pdf",
        "doc",
        "docx",
        "ppt",
        "pptx",
        "zip",
        "xls",
        "xlsx",
        "vnd.openxmlformats-officedocument.wordprocessingml.document",
        "vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "x-zip-compressed",
        "x-gzip",
        "vnd.openxmlformats-officedocument.presentationml.presentation",
        "vnd.ms-powerpoint",
      ],
      size: "200mb",
    };

    request.multipart.file("file", validationOptions, async (file) => {
      // set file size from stream byteCount, so adonis can validate file size
      file.size = file.stream.byteCount;

      // run validation rules
      await file.runValidations();

      // catches validation errors, if any and then throw exception
      const error = file.error();
      if (error.message) {
        throw new Error(error.message);
      }
      var timestamp = new Date().getTime().toString().substring(7, 13); // 6 digit number

      var name = file.clientName.substring(0, file.clientName.lastIndexOf("."));
      name = name.replace(/[^a-zA-Z0-9._]/g, "");
      name = `${name}${timestamp}.${file.extname}`;

      const result = await Drive.disk("s3").put(name, file.stream, {
        ContentType: file.headers["content-type"],
        //ACL: 'public-read',
      });

      if (result) {
        return response
          .status(200)
          .send({ message: "File upload successfully", result: result });
      } else {
        return response.status(500).send({ message: "File uploading failed" });
      }
    });

    await request.multipart.process();
  }

  
  async researchDocument({ request, response }) {
    const validationOptions = {
      types: [
        "pdf",
        "ppt",
        "pptx",
        "xls",
        "xlsx",
        "vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "vnd.openxmlformats-officedocument.presentationml.presentation",
        "vnd.ms-powerpoint",
      ],
      size: "200mb",
    };

    request.multipart.file("file", validationOptions, async (file) => {
      // set file size from stream byteCount, so adonis can validate file size
      file.size = file.stream.byteCount;

      // run validation rules
      await file.runValidations();

      // catches validation errors, if any and then throw exception
      const error = file.error();
      if (error.message) {
        throw new Error(error.message);
      }
      var timestamp = new Date().getTime().toString().substring(7, 13); // 6 digit number

      var name = file.clientName.substring(0, file.clientName.lastIndexOf("."));
      name = name.replace(/[^a-zA-Z0-9._]/g, "");
      name = `${name}${timestamp}.${file.extname}`;

      const result = await Drive.disk("s3").put(name, file.stream, {
        ContentType: file.headers["content-type"],
        //ACL: 'public-read',
      });

      if (result) {
        return response
          .status(200)
          .send({ message: "File upload successfully", result: result });
      } else {
        return response.status(500).send({ message: "File uploading failed" });
      }
    });

    await request.multipart.process();
  }

  async getDocument({ request, response }) {
    const url = request.input("url");

    const filename = url.replace(process.env.S3_BASE_URL, "");
    const file = await Drive.disk("s3").getObject(filename);

    console.log(file.ContentType);
    // attachment for download file
    // inline for read in browser
    response.header("Content-disposition", "inline");
    response.header("content-type", file.ContentType);
    response.send(file.Body);
  }

  async checkVisitorTemplateToolkitLimit({ request, response, auth }) {
    let user_id = auth.user.id;
    let resp = "Document Access allowed";

    const logdocquery = DocumentVisitorLog.query();
    logdocquery.whereRaw(
      `user_id = (?) AND document_id = (?) AND (timediff(now(), created_at) < CAST('24:00:00' AS time))`,
      [user_id, request.input("document_id")]
    );
    const logresults = (await logdocquery.fetch()).toJSON();

    const templatetoolkitlimit = await Config.query()
      .where("key", "TemplateToolkitDownloadLimit")
      .pluck("value");

    if (logresults && logresults.length > templatetoolkitlimit) {
      resp =
        "You have crossed your daily limits of Product Comparisons & Templates downloads, visit again after 24 hours of downloading the last document";
      return response.status(423).send([resp]);
    } else {
      return response.status(200).send([resp]);
    }
  }

  async getVisitorDocument({ request, response, auth }) {
    let user_id = auth.user.id;
    let doclink = "#";
    let resp = "No Valid Documents";
    const docquery = Document.query();
    docquery.where("id", request.input("document_id"));
    docquery.select(
      "url",
      "subscription_category",
      "document_category",
      "extension"
    );
    let [result] = (await docquery.fetch()).toJSON();
    //Check if Document is template toolkits and last access 24 hours ago

    // if (result.document_category > 2) {
    //   const logdocquery = DocumentVisitorLog.query();
    //   logdocquery.whereRaw(
    //     `user_id = (?) AND document_id !=(?) AND  (timediff(now(), created_at) < CAST('24:00:00' AS time))`,
    //     [user_id,request.input("document_id")]
    //   );
    //   logdocquery.groupBy('document_id')
    //   const logresults = (await logdocquery.fetch()).toJSON();

    //   const templatetoolkitlimit = await Config.query()
    //     .where("key", "TemplateToolkitDownloadLimit")
    //     .pluck("value");

    //   if (logresults && logresults.length >= templatetoolkitlimit) {
    //     resp =
    //       "You have crossed your daily limits of Product Comparisons & Templates downloads, visit again after 24 hours of downloading the last document";
    //     return response.status(423).send(resp);
    //   }
    // }

    // const subquery = Subcription.query();
    // subquery.whereRaw(`user_id = (?) AND is_active = (?)`, [user_id, true]);
    // const [subresult] = (await subquery.fetch()).toJSON();
    // if (result) {
    //   if (subresult && result.subscription_category <= subresult.plan_id) {
    //     resp = "Valid Subscribed Document";

    //     doclink = result.url;
    //   } else {
    //     //Check if Visitor has purchased the document
    //     const purquery = Purchase.query();
    //     purquery.whereRaw(`user_id = (?) AND document_id = (?)`, [
    //       user_id,
    //       request.input("document_id"),
    //     ]);
    //     const [purresult] = (await purquery.fetch()).toJSON();
    //     if (purresult) {
    //       resp = "Valid Purchased Document";

    //       doclink = result.url;
    //     } else {
    //       resp = "You are not authorized to download this document";
    //     }
    //   }
    // }

    doclink = result.url; // temporery added
    if (doclink == "#" || !doclink) {
      return response.status(423).send(resp);
    } else {
      //Update Visitor Logs Table
      const logquery = await DocumentVisitorLog.create();
      logquery.document_id = request.input("document_id");
      logquery.user_id = user_id;
      await logquery.save();
      const url = doclink;
      const filename = url.replace(process.env.S3_BASE_URL, "");
      if (result.extension == "mp4") {
        // aws.config.update({
        //   region: process.env.S3_REGION,
        //   accessKeyId: process.env.S3_KEY,
        //   secretAccessKey: process.env.S3_SECRET,
        // });
        // const s3v = new aws.S3();

        // const file = await s3v.getSignedUrlPromise("getObject", {
        //   Bucket: process.env.S3_BUCKET,
        //   Key: filename,
        //   Expires: 60,
        // });
        // console.log("File", file);
        return response.send(url);
      } else {
        const file = await Drive.disk("s3").getObject(filename);
        // attachment for download file
        // inline for read in browser

        response.header("Content-disposition", "inline");
        response.header("content-type", file.ContentType);
        return response.send(file.Body);
      }

      //return response.status(200).send([resp, file.body]);
    }
  }

  async getInvestorDocument({ request, response, auth }) {
    let doclink = "#";
    let resp = "No Valid Documents";
    let user_id = auth.user.id;
    const docquery = Document.query();

    docquery.leftJoin(
      "module_documents",
      "module_documents.document_id",
      "documents.id"
    );

    docquery.where("id", request.input("document_id"));
    docquery.select(
      "url",
      "subscription_category",
      "module_documents.module_id as module_id"
    );
    const [result] = (await docquery.fetch()).toJSON();

    if (result) {
      const plans = await MarketPlan.query().where("segment_id", 6).pluck("id");

      const subquery = InvestorSubcription.query();
      subquery.whereRaw(
        `user_id = (?) AND is_active = (?) AND plan_id in (?)`,
        [user_id, true, plans]
      );

      const subsid = await subquery.pluck("id");

      if (subsid && subsid.length > 0) {
        const subresult = (
          await ModuleSubcription.query()
            .whereRaw(`subcription_id IN (?) AND module_id = (?)`, [
              subsid,
              result.module_id,
            ])
            .fetch()
        ).toJSON();

        console.log(subresult);

        if (result) {
          if (subresult) {
            resp = "Valid Subscribed Document";
            doclink = result.url;
          } else {
            resp = "You are not authorized to download this document";
          }
        }
      } else {
        resp = "You are not authorized to download this document";
      }
    } else {
      resp = "No Valid Documents";
    }

    if (doclink == "#") {
      return response.status(423).send([resp]);
    } else {
      //Update Investor Logs Table
      const logquery = await DocumentInvestorLog.create();
      logquery.document_id = request.input("document_id");
      logquery.user_id = user_id;
      await logquery.save();

      const url = doclink;
      const filename = url.replace(process.env.S3_BASE_URL, "");
      const file = await Drive.disk("s3").getObject(filename);

      // attachment for download file
      // inline for read in browser
      response.header("Content-disposition", "inline");
      response.header("content-type", file.ContentType);
      return response.send(file.Body);

      //return response.status(200).send([resp, file.body]);
    }
  }

  async image({ request, response }) {
    const validationOptions = {
      types: ["png", "jpg", "jpeg", "svg"],
      size: "1mb",
    };

    request.multipart.file("file", validationOptions, async (file) => {
      // set file size from stream byteCount, so adonis can validate file size
      file.size = file.stream.byteCount;

      // run validation rules
      await file.runValidations();

      // catches validation errors, if any and then throw exception
      const error = file.error();
      if (error.message) {
        throw new Error(error.message);
      }
      file.clientName = createRandomName(10);
      const result = await Drive.disk("s3").put(file.clientName, file.stream, {
        ContentType: file.headers["content-type"],
        ACL: "public-read",
      });

      if (result) {
        return response
          .status(200)
          .send({ message: "File upload successfully", result: result });
      } else {
        return response.status(500).send({ message: "File uploading failed" });
      }
    });

    await request.multipart.process();
  }

  
  async media({ request, response }) {
    const validationOptions = {
      types: ["png", "jpg", "jpeg", "svg", "mp4", "mov", "quicktime", "pdf"],
      size: "10mb",
    };

    request.multipart.file("file", validationOptions, async (file) => {
      // set file size from stream byteCount, so adonis can validate file size
      file.size = file.stream.byteCount;

      // run validation rules
      await file.runValidations();

      // catches validation errors, if any and then throw exception
      const error = file.error();
      if (error.message) {
        throw new Error(error.message);
      }
      let ogFileName = file.clientName;

      file.clientName = createRandomName(10);
      const result = await Drive.disk("s3").put(file.clientName, file.stream, {
        ContentType: file.headers["content-type"],
        ACL: "public-read",
      });

      if (result) {
        return response
          .status(200)
          .send({ message: "File upload successfully", filename: ogFileName, result: result });
      } else {
        return response.status(500).send({ message: "File uploading failed" });
      }
    });

    await request.multipart.process();
  }

  async uploadDocumentOnGoogleDrive({ request, response }) {
    const validationOptions = {
      types: [
      "doc",
      "docx",
      "vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
      size: "2mb",
    };

    request.multipart.file("file", validationOptions, async (file) => {
      // set file size from stream byteCount, so adonis can validate file size
      file.size = file.stream.byteCount;

      // run validation rules
      await file.runValidations();

      // catches validation errors, if any and then throw exception
      const error = file.error();
      if (error.message) {
        throw new Error(error.message);
      }

      const resAccessToken = await checkAccessToken();

      if(resAccessToken.status == 200)
      {
        const accessToken = resAccessToken.accessToken;
        const filename = file.clientName;
        const headers = {
          'Authorization': `Bearer ${accessToken}` // Replace with your actual access token
        }

        try { 
          const result = await axios.post(
            `https://www.googleapis.com/upload/drive/v3/files?uploadType=media`,
            file.stream,
            {
              headers: headers
            }
          )

          if (result.status == 200) 
          {
            const res = result.data;
            const fileId = res.id;
            
            // Set permissions for the uploaded file to make it publicly accessible
            await axios.post(
                `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
                { role: 'reader', type: 'anyone' },
                {
                  headers: headers
                } 
            );

            // Set file name
            const requestBody = {
              name: filename
            }
            const renameResponse = await axios.patch(`https://www.googleapis.com/drive/v3/files/${fileId}`, requestBody, {
              headers: headers
            })

            // Make a GET request to retrieve the document
            // const retriveDocument = await axios.get(
            //   `https://www.googleapis.com/drive/v3/files/${fileId}?fields=webViewLink`,
            //   {
            //     headers: headers
            //   }
            // );

            let uploadResponse = {
              document_id : fileId,
              // webViewLink : retriveDocument.data.webViewLink,
              file_name : filename,
            }

            return response
              .status(200)
              .send({ message: "File upload successfully", result: uploadResponse });
          } else {
            return response.status(500).send({ message: "File not uploading." });
          }
        } catch (error) {
          return response.status(500).send({ message: "File uploading failed." });
        }
      } 
      else 
      {
        return response.status(500).send({ message: resAccessToken.message });
      }
    });

    await request.multipart.process();
  }

  async getGoogleDriveDocumentWebViewLink({ params, response }) {

    const fileId = params.id; // Assuming the document ID is passed as a route parameter
    const resAccessToken = await checkAccessToken();

    if(resAccessToken.status == 200)
    {
      try {
        const accessToken = resAccessToken.accessToken; // Get the access token from your authentication process
    
        // Make a GET request to retrieve the document
        const retriveDocument = await axios.get(
          `https://www.googleapis.com/drive/v3/files/${fileId}?fields=webViewLink`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
    
        if(retriveDocument.status == 200) {
          return response
          .status(200)
          .send({ message: "File retrived successfully", result: retriveDocument.data });
          
        } else {
          return response.status(500).send('Error retrieving document');
        }
          
      } catch (error) {
        console.error('Error retrieving document:', error.response.data);
        // Handle error
        return response.status(500).send('Error retrieving document');
      }
    }
    else 
    {
      return response.status(500).send({ message: resAccessToken.message });
    }   
  }

  async downloadPostAttachment({ request, response }) 
  {
    const docquery = CommunityPostAttachment.query();
    docquery.where("id", request.input("attachment_id"));
    let result = (await docquery.first()).toJSON();

    if(result)
    {  
      const url = result.url;
      const filename = url.replace(process.env.S3_BASE_URL, "");

      const file = await Drive.disk("s3").getObject(filename);
      // attachment for download file
      // inline for read in browser

      response.header("Content-disposition", "inline");
      response.header("content-type", file.ContentType);
      return response.send(file.Body);
    } else {
      return response.status(423).send("Attachment not found!");
    }  
  }

}

module.exports = FileController;
