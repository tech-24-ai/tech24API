const axios = use("axios");
const LoggerDebug = use("Logger");
const Vendorswithproducts = use("App/Models/Admin/VendorModule/Vendorswithproducts");
const Vendor = use("App/Models/Admin/VendorModule/Vendor");
const qs = require("qs");
const Drive = use("Drive");
const createRandomName = require("../Helper/randomString");
const Config = use("App/Models/Admin/ConfigModule/Config");
const moment = require("moment");
const _ = require("lodash");
const { URLS, KEYS } = require("../Helper/constants");
const _helperLogoScraper = require("../Helper/logoScraper");


async function getVendorLogos() {

  let index = 0;
  const query = Vendor.query();
  //query.whereIn("name", names);
  query.whereNull("image");
  //query.limit(10);

  const result = await query.fetch();
  const vendorData = result.toJSON();

  if (vendorData && vendorData.length > 0) {


    for (index = 0; index < vendorData.length; index++) {
      //console.log(vendorData[index]);
      // const query = Vendor.query();
      // query.where("name", data[index].Name);
      // query.whereNull("image");

      // const result = await query.fetch();
      // const vendorData = result.toJSON();
      // if(vendorData && vendorData.length > 0){


      // }
      const findVendor = vendorData[index];
     // console.log(findVendor);
      const company_url = findVendor.website;
      console.log("Website",company_url);
      if(company_url != null && company_url != ""){
        let url = await _helperLogoScraper.fetchRiteKiteLogoCronJobs(
          company_url,
          findVendor.id
        );

        if(url != null){
          const updateQuery = await Vendor.findOrFail(findVendor.id);
          updateQuery.image = url;
  
          var result1 = await updateQuery.save();
  
          console.log(result1);
          
        }else {
         
        }

        // const updateData = await Vendorswithproducts.findBy('Name', findVendor.name);
        //   updateData.isProcessed = 1;
        //   await updateData.save()
      }
      else {
        //updated is processed in product table
        //isProcessed
        // const updateData = await Vendorswithproducts.findBy('Name', findVendor.name);
        // updateData.isProcessed = 1;
        //  await updateData.save()
        
      }
      
     

    }
  }

  // const vendorQuery = Vendorswithproducts.query();
  // vendorQuery.where("isProcessed",0);
  // const results = await vendorQuery.fetch();
  // let data = results.toJSON();
  // LoggerDebug.transport("cronfile").info(
  //   `Vendor Logo correction ${data.length}`
  // );


  // if (data && data.length > 0) {
  //  // data = data.slice(0, 20);
  //   let index = 0;
  //   let names = data.map(item => item.Name)
  //   console.log(names);

  //   const query = Vendor.query();
  //   query.whereIn("name", names);
  //   query.whereNull("image");
  //   //query.limit(10);

  //   const result = await query.fetch();
  //   const vendorData = result.toJSON();

  //   if (vendorData && vendorData.length > 0) {


  //     for (index = 0; index < vendorData.length; index++) {
  //       //console.log(vendorData[index]);
  //       // const query = Vendor.query();
  //       // query.where("name", data[index].Name);
  //       // query.whereNull("image");

  //       // const result = await query.fetch();
  //       // const vendorData = result.toJSON();
  //       // if(vendorData && vendorData.length > 0){


  //       // }
  //       const findVendor = vendorData[index];
  //      // console.log(findVendor);
  //       const company_url = findVendor.website;
  //       console.log("Website",company_url);
  //       if(company_url != null && company_url != ""){
  //         let url = await _helperLogoScraper.fetchRiteKiteLogoCronJobs(
  //           company_url,
  //           findVendor.id
  //         );
  
  //         if(url != null){
  //           const updateQuery = await Vendor.findOrFail(findVendor.id);
  //           updateQuery.image = url;
    
  //           var result1 = await updateQuery.save();
    
  //           console.log(result1);
            
  //         }else {
           
  //         }

  //         const updateData = await Vendorswithproducts.findBy('Name', findVendor.name);
  //           updateData.isProcessed = 1;
  //           await updateData.save()
  //       }
  //       else {
  //         //updated is processed in product table
  //         //isProcessed
  //         const updateData = await Vendorswithproducts.findBy('Name', findVendor.name);
  //         updateData.isProcessed = 1;
  //          await updateData.save()
          
  //       }
        
       

  //     }
  //   }


  // }

}

module.exports = {
  getVendorLogos
};
