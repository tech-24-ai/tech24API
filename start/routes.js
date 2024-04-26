"use strict";

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URL's and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.1/routing
|
*/

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use("Route");

Route.on("/").render("welcome");

/*************************  Common System APIs **************************************/

// user module
Route.group(() => {
  Route.post("/register", "AuthController.register").validator("StoreRegister");
  Route.post("/login", "AuthController.login").validator("StoreLogin");
}).prefix("/auth");

//Forgot Password (Without auth)
Route.post(
  "users/forgot_password",
  "Admin/UserModule/UserController.forgotpassword"
);
Route.post(
  "users/forgot_resetpassword",
  "Admin/UserModule/UserController.forgot_resetpassword"
);

// dashboard
Route.group(() => {
  Route.get("/", "Admin/DashboardController.index");
  Route.get("/mi", "Admin/MIDashboardController.index");
  Route.get("/mi_subscribed", "MarketPlanController.getSubscribedPlans");
  Route.get("/consultant", "Admin/DashboardController.consultant");
})
  .prefix("/dashboard_data")
  .middleware("auth");

// start search report
Route.group(() => {
  Route.get("/", "Report/SearchReportController.index");
  Route.get("/:id", "Report/SearchReportController.show");
  Route.delete("/", "Report/SearchReportController.destroy");
})
  .prefix("/search_reports")
  .middleware("auth");

Route.post("/app/search_reports", "Report/SearchReportController.store")
  .validator("StoreSearchReport")
  .middleware("ipblocker");

//Test API (TO add dummy data need to comment later)
Route.post(
  "/app/test/search_reports",
  "Report/SearchReportController.dummyReport"
).middleware("ipblocker");

Route.group(() => {
  Route.get("/products", "Report/SearchReportController.products");
  Route.get("/options", "Report/SearchReportController.options");
})
  .prefix("/reports")
  .middleware("auth");

//Role Module
Route.group(() => {
  Route.get("/", "Admin/UserModule/RoleController.index");
  Route.get("/permissions", "Admin/UserModule/RoleController.permissions");
  Route.get("/:id", "Admin/UserModule/RoleController.show");
  Route.post("/", "Admin/UserModule/RoleController.store").validator(
    "StoreRole"
  );
  Route.put("/:id", "Admin/UserModule/RoleController.update").validator(
    "StoreRole"
  );
  Route.delete("/:id", "Admin/UserModule/RoleController.destroy");
})
  .prefix("/roles")
  .middleware("auth");

//User Profile
Route.group(() => {
  Route.get("/get", "Admin/UserModule/UserController.getProfile");
  Route.put("/update", "Admin/UserModule/UserController.updateProfile");
})
  .prefix("/user_profile")
  .middleware("auth");

//Setting Module
Route.group(() => {
  Route.get("/", "Admin/SettingModule/Cron/CronJobController.index");
  Route.get("/:id", "Admin/SettingModule/Cron/CronJobController.show");
  Route.post("/", "Admin/SettingModule/Cron/CronJobController.store");
  Route.put("/:id", "Admin/SettingModule/Cron/CronJobController.update");
  Route.post(
    "/delete_all",
    "Admin/SettingModule/Cron/CronJobController.bulkDestroy"
  );
  Route.delete("/:id", "Admin/SettingModule/Cron/CronJobController.destroy");
})
  .prefix("/cron-job")
  .middleware("auth");

//Config Module
Route.group(() => {
  Route.get("/", "Admin/SettingModule/ConfigController.index");
  Route.get("/:id", "Admin/SettingModule/ConfigController.show");
  Route.post("/", "Admin/SettingModule/ConfigController.store");
  Route.put("/:id", "Admin/SettingModule/ConfigController.update");
  Route.delete("/:id", "Admin/SettingModule/ConfigController.destroy");
})
  .prefix("/config")
  .middleware("auth");

//Cron Job Logs API
Route.group(() => {
  Route.get("/", "Admin/SettingModule/Cron/CronJobLogController.index");
})
  .prefix("/cron-job-logs")
  .middleware("auth");

//Industry API
Route.group(() => {
  Route.get("/", "Admin/ProductModule/IndustryController.index");
  Route.get("/:id", "Admin/ProductModule/IndustryController.show");
  Route.post("/", "Admin/ProductModule/IndustryController.store").validator(
    "StoreIndustry"
  );
  Route.put("/:id", "Admin/ProductModule/IndustryController.update").validator(
    "StoreIndustry"
  );
  Route.delete("/:id", "Admin/ProductModule/IndustryController.destroy");
})
  .prefix("/industries")
  .middleware("auth");

// Country Group/Region module API
Route.group(() => {
  Route.get("/", "Admin/LocationModule/CountryGroupController.index");
  Route.get("/:id", "Admin/LocationModule/CountryGroupController.show");
  Route.post(
    "/",
    "Admin/LocationModule/CountryGroupController.store"
  ).validator("StoreCountryGroup");
  Route.put(
    "/:id",
    "Admin/LocationModule/CountryGroupController.update"
  ).validator("StoreCountryGroup");
  Route.delete("/:id", "Admin/LocationModule/CountryGroupController.destroy");
})
  .prefix("/country_groups")
  .middleware("auth");

// Rss module
Route.group(() => {
  Route.get("/", "Admin/MasterModule/RssController.index");
  Route.get("/:id", "Admin/MasterModule/RssController.show");
  Route.post("/", "Admin/MasterModule/RssController.store").validator(
    "StoreRss"
  );
  Route.put("/:id", "Admin/MasterModule/RssController.update").validator(
    "StoreRss"
  );
  Route.delete("/:id", "Admin/MasterModule/RssController.destroy");
})
  .prefix("/rss")
  .middleware("auth");

// Currency module
Route.group(() => {
  Route.get("/", "Admin/MasterModule/CurrencyController.index");
  Route.get("/:id", "Admin/MasterModule/CurrencyController.show");
  Route.post("/", "Admin/MasterModule/CurrencyController.store").validator(
    "StoreCurrency"
  );
  Route.put("/:id", "Admin/MasterModule/CurrencyController.update").validator(
    "StoreCurrency"
  );
  Route.delete("/:id", "Admin/MasterModule/CurrencyController.destroy");
})
  .prefix("/currency")
  .middleware("auth");

//Country API
Route.group(() => {
  Route.get("/", "Admin/LocationModule/CountryController.index");
  Route.get("/:id", "Admin/LocationModule/CountryController.show");
  Route.post("/", "Admin/LocationModule/CountryController.store").validator(
    "StoreCountry"
  );
  Route.put("/:id", "Admin/LocationModule/CountryController.update").validator(
    "StoreCountry"
  );
  Route.delete("/:id", "Admin/LocationModule/CountryController.destroy");
})
  .prefix("/countries")
  .middleware("auth");

//Time Zone API
Route.group(() => {
  Route.get("/", "Admin/LocationModule/TimeZoneController.index");
  Route.get("/:id", "Admin/LocationModule/TimeZoneController.show");

  Route.put("/:id", "Admin/LocationModule/TimeZoneController.update").validator(
    "StoreTimeZone"
  );
  Route.post("/", "Admin/LocationModule/TimeZoneController.store").validator(
    "StoreTimeZone"
  );
  Route.delete("/:id", "Admin/LocationModule/TimeZoneController.destroy");
})
  .prefix("/time-zone")
  .middleware("auth");

//User/Industry/Contact/Page Module APIs
Route.group(() => {
  Route.put(
    "users/change_password/:id",
    "Admin/UserModule/UserController.changePassword"
  ).validator("StorePassword");

  Route.resource("users", "Admin/UserModule/UserController").validator(
    new Map([
      [["users.store"], ["StoreUser"]],
      [["users.update"], ["StoreUser"]],
    ])
  );

  Route.resource(
    "permission_groups",
    "Admin/UserModule/PermissionGroupController"
  ).validator(
    new Map([
      [["permission_groups.store"], ["StorePermissionGroup"]],
      [["permission_groups.update"], ["StorePermissionGroup"]],
    ])
  );
  Route.resource(
    "permissions",
    "Admin/UserModule/PermissionController"
  ).validator(
    new Map([
      [["permissions.store"], ["StorePermission"]],
      [["permissions.update"], ["StorePermission"]],
    ])
  );

  // industries
  Route.resource(
    "industries",
    "Admin/ProductModule/IndustryController"
  ).validator(
    new Map([
      [["industries.store"], ["StoreIndustry"]],
      [["industries.update"], ["StoreIndustry"]],
    ])
  );

  // contact module
  Route.resource(
    "contact_types",
    "Admin/ContactModule/ContactTypeController"
  ).validator(
    new Map([
      [["contact_types.store"], ["StoreContactType"]],
      [["contact_types.update"], ["StoreContactType"]],
    ])
  );
  Route.resource("contacts", "Admin/ContactModule/ContactController").validator(
    new Map([
      [["contacts.store"], ["StoreContact"]],
      [["contacts.update"], ["StoreContact"]],
    ])
  );

  // location module
  Route.resource(
    "country_groups",
    "Admin/LocationModule/CountryGroupController"
  ).validator(
    new Map([
      [["country_groups.store"], ["StoreCountryGroup"]],
      [["country_groups.update"], ["StoreCountryGroup"]],
    ])
  );
  Route.resource(
    "countries",
    "Admin/LocationModule/CountryController"
  ).validator(
    new Map([
      [["countries.store"], ["StoreCountryGroup"]],
      [["countries.update"], ["StoreCountryGroup"]],
    ])
  );

  // page module
  Route.resource("pages", "PageController").validator(
    new Map([
      [["pages.store"], ["StorePage"]],
      [["pages.update"], []],
    ])
  );

  // Skill
  // skill for admin by SM
  Route.get("/skills", "Admin/SkillController.index");
  Route.post("/skills", "Admin/SkillController.store");
  Route.put("/skills/:id", "Admin/SkillController.update");
  Route.delete("/skills/:id", "Admin/SkillController.destroy");

  // donations API for admin panel
  Route.get(
    "/donations",
    "Front/ConsultantModule/DonationController.adminIndex"
  );
}).middleware("auth");

// file upload
Route.group(() => {
  Route.post("/document", "FileController.document");
  Route.post("/researchDocument", "FileController.researchDocument");
  Route.get("/document", "FileController.getDocument");
  Route.post("/image", "FileController.image");
})
  .prefix("/upload")
  .middleware("auth");

Route.group(() => {
  Route.get("/", "Admin/SettingModule/AnamolyController.index");
  Route.get(
    "/getopencount",
    "Admin/SettingModule/AnamolyController.getOpenCount"
  );
  Route.get("/:id", "Admin/SettingModule/AnamolyController.show");
  Route.put("/:id", "Admin/SettingModule/AnamolyController.update");
  Route.get(
    "/getcronlog",
    "Admin/SettingModule/AnamolyController.getCronlogdata"
  );
})
  .prefix("/anomaly")
  .middleware("auth");

Route.group(() => {
  Route.get("/", "MarketProductController.index");
})
  .prefix("/market-product")
  .middleware("auth");

/******************  End User Admin APIs ***********************/

//vendor and product export (Auth Not needed , because it's open API)
Route.group(() => {
  Route.get("vendors/export", "Admin/VendorModule/VendorController.export");

  Route.get("products/export", "Admin/ProductModule/ProductController.export");
});

//VEndor Admin Common APIs
Route.group(() => {
  Route.get("/vendor_category", "VendorCategoryController.index");
  Route.post("/vendor_category", "VendorCategoryController.store").validator(
    "StoreVendorCategory"
  );
  Route.delete("/vendor_category/:id", "VendorCategoryController.destroy");
  Route.put(
    "/vendor_category/:id",
    "VendorCategoryController.update"
  ).validator("StoreVendorCategory");
  Route.get("/vendor_category/:id", "VendorCategoryController.show");
  Route.get("/industries", "Admin/VendorModule/VendorController.industries");

  Route.get("/vendorList", "Admin/VendorModule/VendorController.vendor_info");
  Route.get(
    "/updateVendorLinkedinUrl",
    "Admin/VendorModule/VendorController.vendor_linkedinurl"
  );
  Route.post("/import", "Admin/VendorModule/VendorController.import");
  Route.get("/", "Admin/VendorModule/VendorController.index");
  Route.get(
    "/:id/fetch_logo",
    "Admin/VendorModule/VendorController.fetch_logo"
  );
  Route.get(
    "/:id/fetch_info",
    "Admin/VendorModule/VendorController.fetch_info"
  );
  Route.get(
    "/:id/fetch_ritekit_logo",
    "Admin/VendorModule/VendorController.fetch_ritekit_logo"
  );
  Route.get("/:id", "Admin/VendorModule/VendorController.show");

  Route.post("/", "Admin/VendorModule/VendorController.store"); //.validator("StoreVendor");
  Route.put("/:id", "Admin/VendorModule/VendorController.update"); //.validator("StoreVendor");
  Route.delete("/:id", "Admin/VendorModule/VendorController.destroy");
  Route.post("/delete_all", "Admin/VendorModule/VendorController.bulkDestroy");
  Route.put(
    "/change_password/:id",
    "Admin/VendorModule/VendorController.changePassword"
  ).validator("StorePassword");
})
  .prefix("/vendors")
  .middleware("auth");

//Consultant Admin Common APIs
Route.group(() => {
  Route.get(
    "/work-experience",
    "Admin/ConsultantModule/ConsultantWorkExperienceController.index"
  );
  Route.get(
    "/work-experience/:id",
    "Admin/ConsultantModule/ConsultantWorkExperienceController.show"
  );
  Route.post(
    "/work-experience",
    "Admin/ConsultantModule/ConsultantWorkExperienceController.store"
  );
  Route.put(
    "/work-experience/:id",
    "Admin/ConsultantModule/ConsultantWorkExperienceController.update"
  );
  Route.delete(
    "/work-experience/:id",
    "Admin/ConsultantModule/ConsultantWorkExperienceController.destroy"
  );

  // Technologies
  Route.get(
    "technology",
    "Admin/ConsultantModule/ConsultantTechnologyController.index"
  );
  Route.get(
    "/technology/:id",
    "Admin/ConsultantModule/ConsultantTechnologyController.show"
  );
  Route.post(
    "/technology",
    "Admin/ConsultantModule/ConsultantTechnologyController.store"
  );
  Route.put(
    "/technology/:id",
    "Admin/ConsultantModule/ConsultantTechnologyController.update"
  );
  Route.delete(
    "/technology/:id",
    "Admin/ConsultantModule/ConsultantTechnologyController.destroy"
  );

  //Rate Card
  Route.get(
    "/rate-card",
    "Admin/ConsultantModule/ConsultantRateCardController.index"
  );
  Route.post(
    "/rate-card",
    "Admin/ConsultantModule/ConsultantRateCardController.store"
  );
  Route.put(
    "/rate-card/:id",
    "Admin/ConsultantModule/ConsultantRateCardController.update"
  );
  Route.get(
    "/rate-card/:id",
    "Admin/ConsultantModule/ConsultantRateCardController.show"
  );
  Route.delete(
    "/rate-card/:id",
    "Admin/ConsultantModule/ConsultantRateCardController.destroy"
  );

  //Booking
  Route.get(
    "/booking",
    "Admin/ConsultantModule/BookingHistoryController.index"
  );
  Route.get(
    "/booking-transaction",
    "Admin/ConsultantModule/BookingHistoryController.transaction"
  );
  Route.post(
    "/booking",
    "Admin/ConsultantModule/BookingHistoryController.store"
  );
  Route.put(
    "/booking/:id",
    "Admin/ConsultantModule/BookingHistoryController.update"
  );
  Route.get(
    "/booking/:id",
    "Admin/ConsultantModule/BookingHistoryController.show"
  );
  Route.delete(
    "/booking/:id",
    "Admin/ConsultantModule/BookingHistoryController.destroy"
  );

  // Booking log
  Route.post(
    "/booking-log",
    "Admin/ConsultantModule/BookingLogController.store"
  );
  Route.put(
    "/booking-log/:id",
    "Admin/ConsultantModule/BookingLogController.update"
  );
  Route.get(
    "/booking-log",
    "Admin/ConsultantModule/BookingLogController.index"
  );

  // weekly schedule
  Route.post(
    "/schedules",
    "Admin/ConsultantModule/ConsultantScheduleController.store"
  );
  Route.put(
    "/schedules/:id",
    "Admin/ConsultantModule/ConsultantScheduleController.update"
  );
  Route.get(
    "/schedules",
    "Admin/ConsultantModule/ConsultantScheduleController.index"
  );
  Route.get(
    "/schedules/:id",
    "Admin/ConsultantModule/ConsultantScheduleController.show"
  );

  // daily schedule
  Route.post(
    "/daily-schedules",
    "Admin/ConsultantModule/ConsultantDailySlotController.store"
  );
  Route.put(
    "/daily-schedules/:id",
    "Admin/ConsultantModule/ConsultantDailySlotController.update"
  );
  Route.get(
    "/daily-schedules",
    "Admin/ConsultantModule/ConsultantDailySlotController.index"
  );
  Route.get(
    "/daily-schedules/:id",
    "Admin/ConsultantModule/ConsultantDailySlotController.show"
  );
  Route.delete(
    "/daily-schedules/:id",
    "Admin/ConsultantModule/ConsultantDailySlotController.destroy"
  );

  // schedule days
  Route.post(
    "/schedule-days",
    "Admin/ConsultantModule/ConsultantScheduleDayController.store"
  );
  Route.get(
    "/schedule-days",
    "Admin/ConsultantModule/ConsultantScheduleDayController.index"
  );

  // Reviews
  Route.get(
    "/reviews",
    "Admin/ConsultantModule/ConsultantRatingController.index"
  );

  Route.get(
    "/reviews/:id",
    "Admin/ConsultantModule/ConsultantRatingController.show"
  );
  Route.put(
    "/reviews/:id",
    "Admin/ConsultantModule/ConsultantRatingController.update"
  );

  // Chat History
  Route.post(
    "/chat-history",
    "Admin/ConsultantModule/ConsultantChatHistoryController.store"
  );
  Route.put(
    "/chat-history/:id",
    "Admin/ConsultantModule/ConsultantChatHistoryController.update"
  );

  Route.get(
    "/chat-history",
    "Admin/ConsultantModule/ConsultantChatHistoryController.index"
  );
  Route.get(
    "/chat-history/:id",
    "Admin/ConsultantModule/ConsultantChatHistoryController.show"
  );

  // Consultant Payment
  Route.post(
    "/payment",
    "Admin/ConsultantModule/ConsultantPaymentController.store"
  );
  Route.put(
    "/payment/:id",
    "Admin/ConsultantModule/ConsultantPaymentController.update"
  );

  Route.get(
    "/payment",
    "Admin/ConsultantModule/ConsultantPaymentController.index"
  );
  Route.get(
    "/payment/:id",
    "Admin/ConsultantModule/ConsultantPaymentController.show"
  );

  Route.get(
    "/unpaid-booking",
    "Admin/ConsultantModule/ConsultantPaymentController.unpaidBooking"
  );

  // Chat Log
  Route.post(
    "/chat-log",
    "Admin/ConsultantModule/ConsultantChatLogController.store"
  );

  Route.get(
    "/chat-log",
    "Admin/ConsultantModule/ConsultantChatLogController.index"
  );

  // Profile
  Route.get(
    "/profile",
    "Admin/ConsultantModule/ConsultantController.viewProfile"
  );

  Route.put(
    "/profile",
    "Admin/ConsultantModule/ConsultantController.updateProfile"
  );

  // Slots
  Route.get(
    "available-slots",
    "Front/ConsultantModule/ConsultantScheduleController.index"
  );

  Route.get(
    "duration",
    "Front/ConsultantModule/ConsultantScheduleController.duration"
  );
  Route.post(
    "/active/:id",
    "Admin/ConsultantModule/ConsultantController.active"
  );
  Route.post(
    "/reject/:id",
    "Admin/ConsultantModule/ConsultantController.reject"
  );
  Route.post(
    "/activeAll",
    "Admin/ConsultantModule/ConsultantController.activeAll"
  );
  Route.post(
    "/updateLogo",
    "Admin/ConsultantModule/ConsultantController.updateLogo"
  );
  Route.post(
    "/getProfile",
    "Admin/ConsultantModule/ConsultantController.getProfile"
  );
  Route.get(
    "search_logs",
    "Admin/ConsultantModule/ConsultantSearchLogController.index"
  );
  // consultant import API
  Route.post("/import", "Admin/ConsultantModule/ConsultantController.import");

  Route.get("/", "Admin/ConsultantModule/ConsultantController.index");
  Route.get("/:id", "Admin/ConsultantModule/ConsultantController.show");
  Route.post("/", "Admin/ConsultantModule/ConsultantController.store");
  Route.put("/:id", "Admin/ConsultantModule/ConsultantController.update");
  Route.delete("/:id", "Admin/ConsultantModule/ConsultantController.destroy");
})
  .prefix("/consultants")
  .middleware("auth");

Route.group(() => {
  Route.post(
    "visitors/credit_purchase",
    "Admin/VisitorModule/VisitorCreditController.store"
  );

  Route.get(
    "visitors/credit_purchase",
    "Admin/VisitorModule/VisitorCreditController.index"
  );
  Route.get(
    "visitors/credit_history",
    "Admin/VisitorModule/VisitorCreditController.creditHistory"
  );
  Route.get(
    "visitors/credit_purchase/:id",
    "Admin/VisitorModule/VisitorCreditController.show"
  );

  Route.post("complaints", "Admin/ConsultantModule/ComplaintController.store");
  Route.put(
    "complaints/:id",
    "Admin/ConsultantModule/ComplaintController.update"
  );
  Route.put(
    "complaints/response/:id",
    "Admin/ConsultantModule/ComplaintController.response"
  );
  Route.get("complaints", "Admin/ConsultantModule/ComplaintController.index");

  Route.get(
    "complaints/:id",
    "Admin/ConsultantModule/ComplaintController.show"
  );
  // refund request

  Route.get(
    "booking/refund-request",
    "Admin/ConsultantModule/BookingRefundRequestController.index"
  );
  Route.post(
    "booking/refund-request",
    "Admin/ConsultantModule/BookingRefundRequestController.store"
  );

  Route.get(
    "booking/refund-request/:id",
    "Admin/ConsultantModule/BookingRefundRequestController.show"
  );

  Route.put(
    "/refund-approve/:id",
    "Admin/ConsultantModule/BookingRefundRequestController.approve"
  );

  // Booking free Addons
  Route.post(
    "/free-addons",
    "Admin/ConsultantModule/BookingFreeAddonController.store"
  );
  Route.put(
    "/free-addons/:id",
    "Admin/ConsultantModule/BookingFreeAddonController.update"
  );

  Route.get(
    "/free-addons",
    "Admin/ConsultantModule/BookingFreeAddonController.index"
  );
  Route.get(
    "/free-addons/:id",
    "Admin/ConsultantModule/BookingFreeAddonController.show"
  );
}).middleware("auth");

//Consultant reports Common APIs
Route.group(() => {
  Route.get(
    "/consultantreport",
    "Admin/ConsultantModule/ConsultantController.exportReport"
  );
  Route.get(
    "/bookingreport",
    "Admin/ConsultantModule/BookingHistoryController.exportReport"
  );
  Route.get(
    "/bookingtransactionreport",
    "Admin/ConsultantModule/BookingHistoryController.exportTransactionReport"
  );
  Route.get(
    "/bookinglogreport",
    "Admin/ConsultantModule/BookingLogController.exportReport"
  );
  Route.get(
    "/schedulereport",
    "Admin/ConsultantModule/ConsultantScheduleController.exportReport"
  );
  Route.get(
    "/dailyschedulereport",
    "Admin/ConsultantModule/ConsultantDailySlotController.exportReport"
  );
  Route.get(
    "/creditpurchasereport",
    "Admin/VisitorModule/VisitorCreditController.exportReport"
  );
  Route.get(
    "/creditsummaryport",
    "Admin/VisitorModule/VisitorCreditController.exportSummaryReport"
  );
  Route.get(
    "/bookingrefundreport",
    "Admin/ConsultantModule/BookingRefundRequestController.exportReport"
  );
  Route.get(
    "/consultantpaymentreport",
    "Admin/ConsultantModule/ConsultantPaymentController.exportReport"
  );
  Route.get(
    "/freeaddonsreport",
    "Admin/ConsultantModule/BookingFreeAddonController.exportReport"
  );
}).prefix("/reports");

//Visitor Transaction APIs
Route.group(() => {
  Route.get(
    "/",
    "Admin/VisitorSubscriptionModule/ItmapEuTransactionHistoryController.index"
  );
  Route.get(
    "/:id",
    "Admin/VisitorSubscriptionModule/ItmapEuTransactionHistoryController.show"
  );
  //Route.post('/', 'Admin/VisitorSubscriptionModule/ItmapEuTransactionHistoryController.store')
  //Route.put('/:id', 'Admin/VisitorSubscriptionModule/ItmapEuTransactionHistoryController.update')
  //Route.delete('/:id', 'Admin/VisitorSubscriptionModule/ItmapEuTransactionHistoryController.destroy')
})
  .prefix("/eutransactions")
  .middleware("auth");

//Product APIs
Route.group(() => {
  Route.post("/import", "Admin/ProductModule/ProductController.import");
  Route.get("/", "Admin/ProductModule/ProductController.index");
  Route.get("/:id", "Admin/ProductModule/ProductController.show");
  Route.post("/", "Admin/ProductModule/ProductController.store").validator(
    "StoreProduct"
  );
  Route.put("/:id", "Admin/ProductModule/ProductController.update").validator(
    "StoreProduct"
  );
  Route.delete("/:id", "Admin/ProductModule/ProductController.destroy");
  Route.post(
    "/delete_all",
    "Admin/ProductModule/ProductController.bulkDestroy"
  );
})
  .prefix("/products")
  .middleware("auth");

//Question Steps APIs
Route.group(() => {
  Route.get("/", "Admin/ProductModule/StepController.index");
  Route.get("/:id", "Admin/ProductModule/StepController.show");
  Route.post("/", "Admin/ProductModule/StepController.store").validator(
    "StoreStep"
  );
  Route.put("/:id", "Admin/ProductModule/StepController.update").validator(
    "StoreStep"
  );
  Route.delete("/:id", "Admin/ProductModule/StepController.destroy");
})
  .prefix("/steps")
  .middleware("auth");

//Module Category APIs
Route.group(() => {
  Route.get("/documents", "Admin/ProductModule/CategoryController.documents");
  Route.get("/", "Admin/ProductModule/CategoryController.index");
  Route.get("/all/", "Admin/ProductModule/CategoryController.indexAll");
  Route.get("/:id", "Admin/ProductModule/CategoryController.show");
  Route.post("/", "Admin/ProductModule/CategoryController.store").validator(
    "StoreCategory"
  );
  Route.put("/:id", "Admin/ProductModule/CategoryController.update").validator(
    "StoreCategory"
  );
  Route.delete("/:id", "Admin/ProductModule/CategoryController.destroy");
})
  .prefix("/categories")
  .middleware("auth");

//Module APIs
Route.group(() => {
  Route.get("/flow", "Admin/ProductModule/ModuleController.modulesWithFlow");
  Route.get(
    "/children_without_flow",
    "Admin/ProductModule/ModuleController.childrenWithoutFlow"
  );
  Route.get("/documents", "Admin/ProductModule/ModuleController.documents");
  Route.get("/", "Admin/ProductModule/ModuleController.index");
  Route.get("/:id", "Admin/ProductModule/ModuleController.show");
  Route.post("/", "Admin/ProductModule/ModuleController.store").validator(
    "StoreModule"
  );
  Route.put("/:id", "Admin/ProductModule/ModuleController.update").validator(
    "StoreModule"
  );
  Route.delete("/:id", "Admin/ProductModule/ModuleController.destroy");
})
  .prefix("/modules")
  .middleware("auth");

//Flow Module APIs
Route.group(() => {
  Route.get("/", "Admin/ProductModule/FlowController.index");
  Route.get(
    "/flow_questions",
    "Admin/ProductModule/FlowController.flow_questions"
  );
  Route.get("/:id", "Admin/ProductModule/FlowController.show");
  Route.post("/", "Admin/ProductModule/FlowController.store").validator(
    "StoreFlow"
  );
  Route.put("/:id", "Admin/ProductModule/FlowController.update").validator(
    "StoreFlow"
  );
  Route.delete("/:id", "Admin/ProductModule/FlowController.destroy");
})
  .prefix("/flows")
  .middleware("auth");

//Questions Option API
Route.group(() => {
  Route.get("/", "Admin/ProductModule/OptionController.index");
  Route.get("/sub_options", "Admin/ProductModule/OptionController.subOptions");
  Route.get("/:id", "Admin/ProductModule/OptionController.show");
  Route.post("/", "Admin/ProductModule/OptionController.store").validator(
    "StoreOption"
  );
  Route.put("/:id", "Admin/ProductModule/OptionController.update").validator(
    "StoreOption"
  );
  Route.delete("/:id", "Admin/ProductModule/OptionController.destroy");
})
  .prefix("/options")
  .middleware("auth");

//Questions Sub-Option API
Route.group(() => {
  Route.get("/", "Admin/ProductModule/SubOptionController.index");
  Route.get("/:id", "Admin/ProductModule/SubOptionController.show");
  Route.post("/", "Admin/ProductModule/SubOptionController.store").validator(
    "StoreSubOption"
  );
  Route.put("/:id", "Admin/ProductModule/SubOptionController.update").validator(
    "StoreSubOption"
  );
  Route.delete("/:id", "Admin/ProductModule/SubOptionController.destroy");
})
  .prefix("/sub_options")
  .middleware("auth");

//Questions API
Route.group(() => {
  Route.get("/", "Admin/ProductModule/QuestionController.index");
  Route.get(
    "/question_options",
    "Admin/ProductModule/QuestionController.question_options"
  );
  Route.get("/:id", "Admin/ProductModule/QuestionController.show");
  Route.post("/", "Admin/ProductModule/QuestionController.store").validator(
    "StoreQuestion"
  );
  Route.put("/:id", "Admin/ProductModule/QuestionController.update").validator(
    "StoreQuestion"
  );
  Route.delete("/:id", "Admin/ProductModule/QuestionController.destroy");
})
  .prefix("/questions")
  .middleware("auth");

// Contact Type API
Route.group(() => {
  Route.get("/", "Admin/ContactModule/ContactTypeController.index");
  Route.get("/:id", "Admin/ContactModule/ContactTypeController.show");
  Route.post("/", "Admin/ContactModule/ContactTypeController.store").validator(
    "StoreContactType"
  );
  Route.put(
    "/:id",
    "Admin/ContactModule/ContactTypeController.update"
  ).validator("StoreContactType");
  Route.delete("/:id", "Admin/ContactModule/ContactTypeController.destroy");
})
  .prefix("/contact_types")
  .middleware("auth");

// Contact API

Route.group(() => {
  Route.get("/", "Admin/ContactModule/ContactController.index");
  Route.get("/:id", "Admin/ContactModule/ContactController.show");
  Route.post("/", "Admin/ContactModule/ContactController.store").validator(
    "StoreContact"
  );
  Route.put("/:id", "Admin/ContactModule/ContactController.update").validator(
    "StoreContact"
  );
  Route.delete("/:id", "Admin/ContactModule/ContactController.destroy");
})
  .prefix("/contacts")
  .middleware("auth");

//Excel Reports (ToDiscuss Auth)
Route.group(() => {
  Route.get(
    "/contactreport",
    "Admin/ContactModule/ContactController.exportReport"
  );
  Route.get(
    "/documentreport",
    "Admin/DocumentModule/DocumentController.exportReport"
  );
  Route.get(
    "/countryreport",
    "Admin/LocationModule/CountryController.exportReport"
  );
  Route.get(
    "/industryreport",
    "Admin/ProductModule/IndustryController.exportReport"
  );
}).prefix("/reports");

//(ToDiscuss Auth as used in Admin only)
Route.get("visitors/ips", "Front/VisitorModule/IpLogController.index");
Route.get("visitors/api-logs", "Front/VisitorModule/APILogController.index");
Route.get(
  "visitors/nubela-logs",
  "Front/VisitorModule/NubelaLogController.index"
);
Route.get(
  "visitors/signalhire-logs",
  "Front/VisitorModule/SignalHireLogController.index"
);
Route.get(
  "visitors/login-history",
  "Front/VisitorModule/UserLogController.index"
);

//Various Modules/Visitors/Questions related APIs
Route.group(() => {
  // visitor module
  Route.get(
    "visitor_groups/modules",
    "Admin/VisitorModule/VisitorGroupController.modules"
  );
  Route.resource(
    "visitor_groups",
    "Admin/VisitorModule/VisitorGroupController"
  ).validator(
    new Map([
      [["visitor_groups.store"], ["StoreVisitorGroup"]],
      [["visitor_groups.update"], ["StoreVisitorGroup"]],
    ])
  );
  Route.put(
    "visitors/change_password/:id",
    "Admin/VisitorModule/VisitorController.changePassword"
  ).validator("StorePassword");
  Route.resource("visitors", "Admin/VisitorModule/VisitorController").validator(
    new Map([
      [["visitors.store"], ["StoreVisitor"]],
      [["visitors.update"], ["StoreVisitor"]],
    ])
  );

  Route.get(
    "guestvisitors",
    "Admin/VisitorModule/VisitorController.guestusers"
  );
  Route.put(
    "visitors/block_status/:id",
    "Admin/VisitorModule/VisitorController.updateBlockStatus"
  );

  // products

  Route.resource("products", "Admin/ProductModule/ProductController").validator(
    new Map([
      [["products.store"], ["StoreProduct"]],
      [["products.update"], ["StoreProduct"]],
    ])
  );

  // steps
  Route.resource("steps", "Admin/ProductModule/StepController").validator(
    new Map([
      [["steps.store"], ["StoreStep"]],
      [["steps.update"], ["StoreStep"]],
    ])
  );

  // categories
  Route.resource(
    "categories",
    "Admin/ProductModule/CategoryController"
  ).validator(
    new Map([
      [["categories.store"], ["StoreCategory"]],
      [["categories.update"], ["StoreCategory"]],
    ])
  );

  // modules
  Route.resource("modules", "Admin/ProductModule/ModuleController").validator(
    new Map([
      [["modules.store"], ["StoreModule"]],
      [["modules.update"], ["StoreModule"]],
    ])
  );

  Route.resource("flows", "Admin/ProductModule/FlowController").validator(
    new Map([
      [["flows.store"], ["StoreFlow"]],
      [["flows.update"], ["StoreFlow"]],
    ])
  );

  Route.resource(
    "questions",
    "Admin/ProductModule/QuestionController"
  ).validator(
    new Map([
      [["questions.store"], ["StoreQuestion"]],
      [["questions.update"], ["StoreQuestion"]],
    ])
  );

  Route.resource("options", "Admin/ProductModule/OptionController").validator(
    new Map([
      [["options.store"], ["StoreOption"]],
      [["options.update"], ["StoreOption"]],
    ])
  );

  Route.resource(
    "sub_options",
    "Admin/ProductModule/SubOptionController"
  ).validator(
    new Map([
      [["sub_options.store"], ["StoreSubOption"]],
      [["sub_options.update"], ["StoreSubOption"]],
    ])
  );

  // document module
  Route.resource(
    "document_types",
    "Admin/DocumentModule/DocumentTypeController"
  ).validator(
    new Map([
      [["document_types.store"], ["StoreDocumentType"]],
      [["document_types.update"], ["StoreDocumentType"]],
    ])
  );
  Route.resource(
    "documents",
    "Admin/DocumentModule/DocumentController"
  ).validator(
    new Map([
      [["documents.store"], ["StoreDocument"]],
      [["documents.update"], ["StoreDocument"]],
    ])
  );
}).middleware("auth");

//Visitor Plans, Subscriptions and Purchases
Route.group(() => {
  Route.get(
    "/eu_plans",
    "Admin/VisitorSubscriptionModule/ItmapEuMarketPlanController.index"
  );
  Route.post(
    "/eu_plans",
    "Admin/VisitorSubscriptionModule/ItmapEuMarketPlanController.store"
  );
  Route.get(
    "/eu_plans/:id",
    "Admin/VisitorSubscriptionModule/ItmapEuMarketPlanController.show"
  );
  //Route.delete('/eu_plans/:id', 'Admin/VisitorSubscriptionModule/ItmapEuMarketPlanController.destroy')
  Route.put(
    "/eu_plans/:id",
    "Admin/VisitorSubscriptionModule/ItmapEuMarketPlanController.update"
  );

  Route.get(
    "/subscriptions",
    "Admin/VisitorSubscriptionModule/ItmapEuSubcriptionController.index"
  );
  Route.post(
    "/subscriptions",
    "Admin/VisitorSubscriptionModule/ItmapEuSubcriptionController.store"
  );
  Route.delete(
    "/subscriptions/:id",
    "Admin/VisitorSubscriptionModule/ItmapEuSubcriptionController.destroy"
  );
  Route.get(
    "/subscriptions/:id",
    "Admin/VisitorSubscriptionModule/ItmapEuSubcriptionController.show"
  );
  Route.put(
    "/subscriptions/:id",
    "Admin/VisitorSubscriptionModule/ItmapEuSubcriptionController.update"
  );
  Route.post(
    "/getinvoice",
    "Admin/VisitorSubscriptionModule/ItmapEuSubcriptionController.getInvoice"
  );

  Route.get(
    "/purchase",
    "Admin/VisitorSubscriptionModule/ItmapEuDocPurchasesController.index"
  );
  Route.post(
    "/purchase",
    "Admin/VisitorSubscriptionModule/ItmapEuDocPurchasesController.store"
  );
  //Route.delete('/purchase/:id', 'Admin/VisitorSubscriptionModule/ItmapEuDocPurchasesController.destroy')
  Route.get(
    "/purchase/:id",
    "Admin/VisitorSubscriptionModule/ItmapEuDocPurchasesController.show"
  );
  Route.put(
    "/purchase/:id",
    "Admin/VisitorSubscriptionModule/ItmapEuDocPurchasesController.update"
  );
  Route.post(
    "/getdocinvoice",
    "Admin/VisitorSubscriptionModule/ItmapEuDocPurchasesController.getInvoice"
  );

  Route.put(
    "/approve_subscription/:id",
    "Admin/VisitorSubscriptionModule/ItmapEuSubcriptionController.approveSubscription"
  );
  Route.put(
    "/reject_subscription/:id",
    "Admin/VisitorSubscriptionModule/ItmapEuSubcriptionController.rejectSubscription"
  );

  Route.get(
    "/pendingSubscriptions",
    "Admin/VisitorSubscriptionModule/ItmapEuSubcriptionController.pendingSubscriptions"
  );
})
  .prefix("/eusubscription")
  .middleware("auth");

// FAQ Admin module
Route.group(() => {
  Route.get("/", "Admin/FaqModule/FaqCategoryController.index");
  Route.get("/:id", "Admin/FaqModule/FaqCategoryController.show");
  Route.post("/", "Admin/FaqModule/FaqCategoryController.store").validator(
    "StoreFaqCategory"
  );
  Route.put("/:id", "Admin/FaqModule/FaqCategoryController.update").validator(
    "StoreFaqCategory"
  );
  Route.delete("/:id", "Admin/FaqModule/FaqCategoryController.destroy");
})
  .prefix("/faq_categories")
  .middleware("auth");

Route.group(() => {
  Route.get("/", "Admin/FaqModule/FaqController.index");
  Route.get("/:id", "Admin/FaqModule/FaqController.show");
  Route.post("/", "Admin/FaqModule/FaqController.store").validator("StoreFaq");
  Route.put("/:id", "Admin/FaqModule/FaqController.update").validator(
    "StoreFaq"
  );
  Route.delete("/:id", "Admin/FaqModule/FaqController.destroy");
})
  .prefix("/faqs")
  .middleware("auth");

// Blog Admin module
Route.group(() => {
  Route.get("/", "Admin/BlogModule/BlogTopicController.index");
  Route.get("/:id", "Admin/BlogModule/BlogTopicController.show");
  Route.post("/", "Admin/BlogModule/BlogTopicController.store").validator(
    "StoreBlogTopic"
  );
  Route.put("/:id", "Admin/BlogModule/BlogTopicController.update").validator(
    "StoreBlogTopic"
  );
  Route.delete("/:id", "Admin/BlogModule/BlogTopicController.destroy");
})
  .prefix("/blog_topics")
  .middleware("auth");

Route.group(() => {
  Route.get("/", "Admin/BlogModule/BlogController.index");
  Route.get("/:id", "Admin/BlogModule/BlogController.show");
  Route.post("/", "Admin/BlogModule/BlogController.store").validator(
    "StoreBlog"
  );
  Route.put("/:id", "Admin/BlogModule/BlogController.update").validator(
    "StoreBlog"
  );
  Route.delete("/:id", "Admin/BlogModule/BlogController.destroy");
})
  .prefix("/blogs")
  .middleware("auth");

/*************************** End User Frontend APIs ****************************/

// app routes (TODiscuss which all apis auth can be added)
Route.group(() => {
  Route.get("/page/:id", "PageController.showBySlug");
  Route.get("/countries", "Front/LocationModule/CountryController.index");
  Route.get(
    "/country_groups",
    "Front/LocationModule/CountryGroupController.index"
  );
  Route.get(
    "/contact_types",
    "Front/ContactModule/ContactTypeController.index"
  );
  Route.post(
    "/contacts",
    "Front/ContactModule/ContactController.index"
  ).validator("StoreContact");
  Route.get("/categories", "Front/ProductModule/CategoryController.index");
  Route.get("/products", "Front/ProductModule/ProductController.index");
  Route.get(
    "/products/click/:id",
    "Front/ProductModule/ProductController.clicked"
  );
  Route.get(
    "/products/exportpdf",
    "Front/ProductModule/ProductController.exportPdf"
  ).validator("SearchProduct");
  Route.post(
    "/products/sendmail",
    "Front/ProductModule/ProductController.sendMail"
  ).validator("SearchProduct");
  Route.get("/categories/:id", "Front/ProductModule/CategoryController.show");
  Route.get("/modules", "Front/ProductModule/ModuleController.index");
  Route.get(
    "/module/children",
    "Front/ProductModule/ModuleController.children"
  );
  Route.get(
    "/module/categories",
    "Front/ProductModule/ModuleController.categories"
  );
  Route.get("/module/parent", "Front/ProductModule/ModuleController.parent");
  Route.get("/documents", "Front/ProductModule/DocumentController.index");
  Route.get("/documents/types", "Front/ProductModule/DocumentController.types");
  Route.get("/documents/list", "Front/ProductModule/DocumentController.list");
  Route.get(
    "/documents/children",
    "Front/ProductModule/DocumentController.children"
  );
  Route.post(
    "/documents/sendmail",
    "Front/ProductModule/DocumentController.sendMail"
  );
  Route.get("/modules/:id", "Front/ProductModule/ModuleController.show");
  Route.get(
    "/module_check_permission/:id",
    "Front/ProductModule/ModuleController.checkPermission"
  );
  Route.get("/steps", "Front/ProductModule/StepController.index");
  Route.get("/industries", "Front/ProductModule/IndustryController.index");
  Route.post(
    "/linkedin_login",
    "Front/VisitorModule/VisitorController.linkedInLogin"
  );
  Route.get("/faq", "Front/FaqModule/FaqController.index");
  Route.get("/faqcategory", "Front/FaqModule/FaqCategoryController.index");
  Route.get("/blogs", "Front/BlogModule/BlogController.index");
  Route.get("/blogs/show/:id", "Front/BlogModule/BlogController.show");
  Route.get("/blogs/:id", "Front/BlogModule/BlogController.showBySlug");
  Route.get("/blogtopic", "Front/BlogModule/BlogTopicController.index");
  Route.get(
    "/list_plans",
    "Admin/VisitorSubscriptionModule/ItmapEuMarketPlanController.listPlans"
  );
  Route.get(
    "/plans",
    "Admin/VisitorSubscriptionModule/ItmapEuMarketPlanController.euplans"
  );
})
  .prefix("/app")
  .middleware(["ipblocker"]);

//ToDisucss -  Company Sizes - Auth

Route.group(() => {
  Route.post(
    "/register",
    "Front/VisitorModule/VisitorController.register"
  ).validator("StoreVisitorRegister");
  Route.post("/login", "Front/VisitorModule/VisitorController.login").validator(
    "StoreLogin"
  );
  Route.get("/guest", "Front/VisitorModule/VisitorController.guest_user");
  Route.get(
    "/getcompanysizes",
    "Front/VisitorModule/VisitorController.companysizes"
  );
}).prefix("/app");

Route.group(() => {
  Route.get(
    "/purchase_history",
    "Admin/VisitorSubscriptionModule/ItmapEuDocPurchasesController.history"
  );
  Route.get(
    "/subscription_history",
    "Admin/VisitorSubscriptionModule/ItmapEuSubcriptionController.history"
  );
  Route.get(
    "/get_subscription",
    "Front/VisitorModule/VisitorController.getsubscription"
  );
  Route.get(
    "/checkPurchase",
    "Front/VisitorModule/VisitorController.checkPurchase"
  );
  Route.post(
    "/addpurchase",
    "Front/VisitorModule/VisitorController.addPurchase"
  );
  Route.post(
    "/addsubscription",
    "Front/VisitorModule/VisitorController.addSubscription"
  );
  Route.post(
    "/addtransaction",
    "Front/VisitorModule/VisitorController.addTransaction"
  );
  Route.get("/document", "FileController.getVisitorDocument");
  Route.get(
    "/checkTemplatedocumentLimit",
    "FileController.checkVisitorTemplateToolkitLimit"
  );
  Route.get("/test", "Front/VisitorModule/VisitorController.testfunc");
  Route.post(
    "/download-invoice",
    "Front/VisitorModule/VisitorController.createPdf"
  );
  Route.get(
    "/getinvoicenumber",
    "Front/VisitorModule/VisitorController.getInvoiceNumber"
  );
  Route.get(
    "/documents/checkDocPaymentStatus",
    "Front/ProductModule/DocumentController.checkDocPaymentStatus"
  );
  Route.get(
    "/documents/listdata",
    "Front/ProductModule/DocumentController.listdata"
  );
  Route.get(
    "/isUserLoggedIn",
    "Front/VisitorModule/VisitorController.isUserLoggedIn"
  );
})
  .prefix("/app")
  .middleware("auth:visitorAuth");

// Consultant APIs
Route.group(() => {
  Route.post(
    "/schedule_booking",
    "Front/ConsultantModule/BookingHistoryController.store"
  );

  Route.get(
    "/test_booking",
    "Front/ConsultantModule/BookingHistoryController.test"
  );

  Route.get(
    "/booking_history",
    "Front/ConsultantModule/BookingHistoryController.index"
  );
  Route.post(
    "/booking/cancel",
    "Front/ConsultantModule/BookingHistoryController.cancel"
  );
  Route.get(
    "visitor_credit/",
    "Admin/VisitorModule/VisitorCreditController.credit"
  );
  Route.get(
    "credit_purchase_history/",
    "Admin/VisitorModule/VisitorCreditController.purchaseHistory"
  );
  Route.get(
    "credit_redeem_history/",
    "Admin/VisitorModule/VisitorCreditController.redeemHistory"
  );
  Route.post(
    "/credit_purchase",
    "Admin/VisitorModule/VisitorCreditController.visitorCreditPurchase"
  );

  Route.post(
    "reviews/",
    "Admin/ConsultantModule/ConsultantRatingController.store"
  );
  Route.get(
    "booked_consultants/",
    "Front/ConsultantModule/BookingHistoryController.bookedConsultant"
  );
  Route.get(
    "consultant_booking/",
    "Front/ConsultantModule/BookingHistoryController.consultantBooking"
  );
  // complaint
  Route.post("complaints", "Front/ConsultantModule/ComplaintController.store");
  Route.get("complaints", "Front/ConsultantModule/ComplaintController.index");
  Route.get(
    "complaints/:id",
    "Front/ConsultantModule/ComplaintController.show"
  );

  Route.get(
    "slots",
    "Front/ConsultantModule/ConsultantScheduleController.index_old"
  );
  Route.get(
    "available-slots",
    "Front/ConsultantModule/ConsultantScheduleController.index"
  );

  Route.get(
    "duration",
    "Front/ConsultantModule/ConsultantScheduleController.duration"
  );
  Route.post(
    "chat-log",
    "Front/ConsultantModule/ConsultantChatLogController.store"
  );
  Route.get(
    "chat-log",
    "Front/ConsultantModule/ConsultantChatLogController.index"
  );
  Route.get("time-zone", "Admin/LocationModule/TimeZoneController.index");
  Route.post(
    "/consultants/search_logs",
    "Admin/ConsultantModule/ConsultantSearchLogController.store"
  );
})
  .prefix("/app")
  .middleware("auth:visitorAuth");

Route.group(() => {
  Route.get(
    "/consultants",
    "Front/ConsultantModule/ConsultantController.index"
  );
  Route.post(
    "/consultants/signup",
    "Front/ConsultantModule/ConsultantController.store"
  );

  Route.get("/skills", "SkillController.skills");
  Route.get("/sub-skills", "SkillController.subSkills");
  Route.get(
    "/technologies",
    "Admin/ConsultantModule/ConsultantTechnologyController.technologies"
  );
  Route.get("/location", "Front/LocationModule/CountryController.list");
}).prefix("/app");

/**************************** MI Admin APIs ****************************/

//Key People Module
Route.group(() => {
  Route.get("/", "Admin/VendorModule/VendorKeyPeopleController.index");
  Route.get("/:id", "Admin/VendorModule/VendorKeyPeopleController.show");
  Route.post(
    "/",
    "Admin/VendorModule/VendorKeyPeopleController.store"
  ).validator("StoreVendorKeyPeople");
  Route.put(
    "/:id",
    "Admin/VendorModule/VendorKeyPeopleController.update"
  ).validator("StoreVendorKeyPeople");
  Route.delete("/:id", "Admin/VendorModule/VendorKeyPeopleController.destroy");
  Route.post(
    "/delete_all",
    "Admin/VendorModule/VendorKeyPeopleController.bulkDestroy"
  );
})
  .prefix("/key-people/:vendor_id")
  .middleware("auth");

Route.group(() => {
  Route.post("/import", "Admin/VendorModule/VendorKeyPeopleController.import");
})
  .prefix("/keypeople")
  .middleware("auth");

//Location Module
Route.group(() => {
  Route.get("/", "Admin/VendorModule/VendorLocationController.index");
  Route.get("/:id", "Admin/VendorModule/VendorLocationController.show");
  Route.post(
    "/",
    "Admin/VendorModule/VendorLocationController.store"
  ).validator("StoreVendorLocations");
  Route.put(
    "/:id",
    "Admin/VendorModule/VendorLocationController.update"
  ).validator("StoreVendorLocations");
  Route.post(
    "/delete_all",
    "Admin/VendorModule/VendorLocationController.bulkDestroy"
  );
  Route.delete("/:id", "Admin/VendorModule/VendorLocationController.destroy");
})
  .prefix("/locations/:vendor_id")
  .middleware("auth");

//Financial Module
Route.group(() => {
  Route.get("/", "Admin/VendorModule/VendorFinancialController.index");
  Route.get("/fetch", "Admin/VendorModule/VendorFinancialController.fetch");
  Route.get("/:id", "Admin/VendorModule/VendorFinancialController.show");
  Route.post(
    "/",
    "Admin/VendorModule/VendorFinancialController.store"
  ).validator("StoreVendorFinancials");
  Route.put(
    "/:id",
    "Admin/VendorModule/VendorFinancialController.update"
  ).validator("StoreVendorFinancials");
  Route.post(
    "/delete_all",
    "Admin/VendorModule/VendorFinancialController.bulkDestroy"
  );
  Route.delete("/:id", "Admin/VendorModule/VendorFinancialController.destroy");
})
  .prefix("/financials/:vendor_id")
  .middleware("auth");

//Funding List Module
Route.group(() => {
  Route.get("/", "Admin/VendorModule/VendorFundingController.index");
  Route.get("/:id", "Admin/VendorModule/VendorFundingController.show");
  Route.post("/", "Admin/VendorModule/VendorFundingController.store").validator(
    "StoreFunding"
  );
  Route.put(
    "/:id",
    "Admin/VendorModule/VendorFundingController.update"
  ).validator("StoreFunding");
  Route.post(
    "/delete_all",
    "Admin/VendorModule/VendorFundingController.bulkDestroy"
  );
  Route.delete("/:id", "Admin/VendorModule/VendorFundingController.destroy");
})
  .prefix("/funding-list/:vendor_id")
  .middleware("auth");

//Employee Job Counts Module
Route.group(() => {
  Route.get("/", "Admin/VendorModule/VendorEmployeeJobCountController.index");
  Route.get("/:id", "Admin/VendorModule/VendorEmployeeJobCountController.show");
  Route.post(
    "/",
    "Admin/VendorModule/VendorEmployeeJobCountController.store"
  ).validator("StoreEmployeeJobCount");
  Route.put(
    "/:id",
    "Admin/VendorModule/VendorEmployeeJobCountController.update"
  ).validator("StoreEmployeeJobCount");
  Route.post(
    "/delete_all",
    "Admin/VendorModule/VendorEmployeeJobCountController.bulkDestroy"
  );
  Route.delete(
    "/:id",
    "Admin/VendorModule/VendorEmployeeJobCountController.destroy"
  );
})
  .prefix("/employee-job-count/:vendor_id")
  .middleware("auth");

//Google Trend Module
Route.group(() => {
  Route.get("/", "Admin/VendorModule/VendorGoogleTrendController.index");
  Route.get("/fetch", "Admin/VendorModule/VendorGoogleTrendController.fetch");
  Route.get("/:id", "Admin/VendorModule/VendorGoogleTrendController.show");
  Route.post(
    "/",
    "Admin/VendorModule/VendorGoogleTrendController.store"
  ).validator("StoreGoogleTrend");
  Route.put(
    "/:id",
    "Admin/VendorModule/VendorGoogleTrendController.update"
  ).validator("StoreGoogleTrend");
  Route.post(
    "/delete_all",
    "Admin/VendorModule/VendorGoogleTrendController.bulkDestroy"
  );
  Route.delete(
    "/:id",
    "Admin/VendorModule/VendorGoogleTrendController.destroy"
  );
})
  .prefix("/google-trends/:vendor_id")
  .middleware("auth");

//Patent/IPs Count Module
Route.group(() => {
  Route.get("/", "Admin/VendorModule/VendorIpController.index");
  Route.get("/fetch", "Admin/VendorModule/VendorIpController.fetch");
  Route.get("/:id", "Admin/VendorModule/VendorIpController.show");
  Route.post("/", "Admin/VendorModule/VendorIpController.store").validator(
    "StoreIps"
  );
  Route.put("/:id", "Admin/VendorModule/VendorIpController.update").validator(
    "StoreIps"
  );
  Route.post(
    "/delete_all",
    "Admin/VendorModule/VendorIpController.bulkDestroy"
  );
  Route.delete("/:id", "Admin/VendorModule/VendorIpController.destroy");
})
  .prefix("/ips/:vendor_id")
  .middleware("auth");

//Patent/IPs List Module
Route.group(() => {
  Route.get("/", "Admin/VendorModule/VednorPatentListController.index");
  Route.get("/:id", "Admin/VendorModule/VednorPatentListController.show");
  Route.post(
    "/",
    "Admin/VendorModule/VednorPatentListController.store"
  ).validator("StorePatent");
  Route.put(
    "/:id",
    "Admin/VendorModule/VednorPatentListController.update"
  ).validator("StorePatent");
  Route.post(
    "/delete_all",
    "Admin/VendorModule/VednorPatentListController.bulkDestroy"
  );
  Route.delete("/:id", "Admin/VendorModule/VednorPatentListController.destroy");
})
  .prefix("/patent-list/:vendor_id")
  .middleware("auth");

//ITMAP score Module
Route.group(() => {
  Route.get("/", "Admin/VendorModule/VendorItMapScoreController.index");
  Route.get("/:id", "Admin/VendorModule/VendorItMapScoreController.show");
  Route.post(
    "/",
    "Admin/VendorModule/VendorItMapScoreController.store"
  ).validator("StoreItmapScore");
  Route.put(
    "/:id",
    "Admin/VendorModule/VendorItMapScoreController.update"
  ).validator("StoreItmapScore");
  Route.post(
    "/delete_all",
    "Admin/VendorModule/VendorItMapScoreController.bulkDestroy"
  );
  Route.delete("/:id", "Admin/VendorModule/VendorItMapScoreController.destroy");
})
  .prefix("/itmap-scores/:vendor_id")
  .middleware("auth");

//Twitter Data Module
Route.group(() => {
  Route.get("/", "Admin/VendorModule/VendorTwitterDataController.index");
  Route.get("/fetch", "Admin/VendorModule/VendorTwitterDataController.fetch");
  Route.get("/:id", "Admin/VendorModule/VendorTwitterDataController.show");
  Route.post(
    "/",
    "Admin/VendorModule/VendorTwitterDataController.store"
  ).validator("StoreTwitterData");
  Route.put(
    "/:id",
    "Admin/VendorModule/VendorTwitterDataController.update"
  ).validator("StoreTwitterData");
  Route.post(
    "/delete_all",
    "Admin/VendorModule/VendorTwitterDataController.bulkDestroy"
  );
  Route.delete(
    "/:id",
    "Admin/VendorModule/VendorTwitterDataController.destroy"
  );
})
  .prefix("/twitter-data/:vendor_id")
  .middleware("auth");

//Web Traffic Module
Route.group(() => {
  Route.get("/", "Admin/VendorModule/VendorWebTrafficController.index");
  Route.get("/fetch", "Admin/VendorModule/VendorWebTrafficController.fetch");
  Route.get("/:id", "Admin/VendorModule/VendorWebTrafficController.show");
  Route.post(
    "/",
    "Admin/VendorModule/VendorWebTrafficController.store"
  ).validator("StoreWebTraffic");
  Route.put(
    "/:id",
    "Admin/VendorModule/VendorWebTrafficController.update"
  ).validator("StoreWebTraffic");
  Route.post(
    "/delete_all",
    "Admin/VendorModule/VendorWebTrafficController.bulkDestroy"
  );
  Route.delete("/:id", "Admin/VendorModule/VendorWebTrafficController.destroy");
})
  .prefix("/web-traffic/:vendor_id")
  .middleware("auth");

//Acquisition Module
Route.group(() => {
  Route.get("/", "Admin/VendorModule/VendorAcquisitionController.index");
  Route.get("/:id", "Admin/VendorModule/VendorAcquisitionController.show");
  Route.post(
    "/",
    "Admin/VendorModule/VendorAcquisitionController.store"
  ).validator("StoreAcquisition");
  Route.put(
    "/:id",
    "Admin/VendorModule/VendorAcquisitionController.update"
  ).validator("StoreAcquisition");
  Route.post(
    "/delete_all",
    "Admin/VendorModule/VendorAcquisitionController.bulkDestroy"
  );
  Route.delete(
    "/:id",
    "Admin/VendorModule/VendorAcquisitionController.destroy"
  );
})
  .prefix("/acquisition/:vendor_id")
  .middleware("auth");

//Vendor Documents List Module
Route.group(() => {
  Route.get("/", "Admin/VendorModule/VendorDocumentsListController.index");
  Route.get("/:id", "Admin/VendorModule/VendorDocumentsListController.show");
  Route.post(
    "/",
    "Admin/VendorModule/VendorDocumentsListController.store"
  ).validator("StoreDocumentList");
  Route.put(
    "/:id",
    "Admin/VendorModule/VendorDocumentsListController.update"
  ).validator("StoreDocumentList");
  Route.post(
    "/delete_all",
    "Admin/VendorModule/VendorDocumentsListController.bulkDestroy"
  );
  Route.delete(
    "/:id",
    "Admin/VendorModule/VendorDocumentsListController.destroy"
  );
})
  .prefix("/documents-list/:vendor_id")
  .middleware("auth");

//Vendor News List Module
Route.group(() => {
  Route.get("/", "Admin/VendorModule/VendorNewsListController.index");
  Route.get("/fetch", "Admin/VendorModule/VendorNewsListController.fetch");
  Route.get("/:id", "Admin/VendorModule/VendorNewsListController.show");
  Route.post(
    "/",
    "Admin/VendorModule/VendorNewsListController.store"
  ).validator("StoreNewsList");
  Route.put(
    "/:id",
    "Admin/VendorModule/VendorNewsListController.update"
  ).validator("StoreNewsList");
  Route.post(
    "/delete_all",
    "Admin/VendorModule/VendorNewsListController.bulkDestroy"
  );
  Route.delete("/:id", "Admin/VendorModule/VendorNewsListController.destroy");
})
  .prefix("/news-list/:vendor_id")
  .middleware("auth");

//VEndor Competitive Dynamic Module
Route.group(() => {
  Route.get("/", "Admin/VendorModule/VendorCompetitiveDynamicController.index");
  Route.get(
    "/:id",
    "Admin/VendorModule/VendorCompetitiveDynamicController.show"
  );
  Route.post(
    "/",
    "Admin/VendorModule/VendorCompetitiveDynamicController.store"
  ).validator("StoreCompetitiveDynamic");
  Route.put(
    "/:id",
    "Admin/VendorModule/VendorCompetitiveDynamicController.update"
  ).validator("StoreCompetitiveDynamic");
  Route.post(
    "/delete_all",
    "Admin/VendorModule/VendorCompetitiveDynamicController.bulkDestroy"
  );
  Route.delete(
    "/:id",
    "Admin/VendorModule/VendorCompetitiveDynamicController.destroy"
  );
})
  .prefix("/competitive-dynamic/:vendor_id")
  .middleware("auth");
Route.get(
  "/module/categories",
  "Admin/VendorModule/VendorCompetitiveDynamicController.categories"
);

//Geenric Competitive Landscape Module
Route.group(() => {
  Route.get(
    "/",
    "Admin/CompetitiveLandscape/CompetitiveLandscapeController.index"
  );
  Route.get(
    "/:id",
    "Admin/CompetitiveLandscape/CompetitiveLandscapeController.show"
  );
  Route.post(
    "/",
    "Admin/CompetitiveLandscape/CompetitiveLandscapeController.store"
  ).validator("StoreCompetitiveDynamic");
  Route.put(
    "/:id",
    "Admin/CompetitiveLandscape/CompetitiveLandscapeController.update"
  ).validator("StoreCompetitiveDynamic");
  Route.post(
    "/delete_all",
    "Admin/CompetitiveLandscape/CompetitiveLandscapeController.bulkDestroy"
  );
  Route.delete(
    "/:id",
    "Admin/CompetitiveLandscape/CompetitiveLandscapeController.destroy"
  );
})
  .prefix("/competitive-landscape")
  .middleware("auth");
Route.get(
  "/module/categories",
  "Admin/CompetitiveLandscape/CompetitiveLandscapeController.categories"
);

//MI Segment Module
Route.group(() => {
  Route.get("/", "Admin/MISegmentModule/MISegmentController.index");
  Route.get("/:id", "Admin/MISegmentModule/MISegmentController.show");
  Route.post("/", "Admin/MISegmentModule/MISegmentController.store").validator(
    "StoreMISegment"
  );
  Route.put(
    "/:id",
    "Admin/MISegmentModule/MISegmentController.update"
  ).validator("StoreMISegment");
  Route.post(
    "/delete_all",
    "Admin/VendorModule/MISegmentController.bulkDestroy"
  );
  Route.delete("/:id", "Admin/MISegmentModule/MISegmentController.destroy");
})
  .prefix("/mi-segment")
  .middleware("auth");

//Partner Module
Route.group(() => {
  Route.get("/", "Admin/PartnerModule/PartnerListController.index");
  Route.get("/:id", "Admin/PartnerModule/PartnerListController.show");
  Route.post("/", "Admin/PartnerModule/PartnerListController.store").validator(
    "StorePartner"
  );
  Route.put(
    "/:id",
    "Admin/PartnerModule/PartnerListController.update"
  ).validator("StorePartner");
  Route.post(
    "/delete_all",
    "Admin/VendorModule/PartnerListController.bulkDestroy"
  );
  Route.delete("/:id", "Admin/PartnerModule/PartnerListController.destroy");
})
  .prefix("/partners")
  .middleware("auth");

//MI Transactions APIs
Route.group(() => {
  Route.get("/", "TranscationHistoryController.index");
  Route.get("/:id", "TranscationHistoryController.show");
  Route.post("/", "TranscationHistoryController.store");
  Route.put("/:id", "TranscationHistoryController.update");
  Route.delete("/:id", "TranscationHistoryController.destroy");
})
  .prefix("/mitransactions")
  .middleware("auth");

//Partner Type Module
Route.group(() => {
  Route.get("/", "Admin/PartnerModule/PartnerTypeListController.index");
  Route.get("/:id", "Admin/PartnerModule/PartnerTypeListController.show");
  Route.post(
    "/",
    "Admin/PartnerModule/PartnerTypeListController.store"
  ).validator("StorePartnerType");
  Route.put(
    "/:id",
    "Admin/PartnerModule/PartnerTypeListController.update"
  ).validator("StorePartnerType");
  Route.post(
    "/delete_all",
    "Admin/VendorModule/PartnerTypeListController.bulkDestroy"
  );
  Route.delete("/:id", "Admin/PartnerModule/PartnerTypeListController.destroy");
})
  .prefix("/partner-types")
  .middleware("auth");

//Excel Reports (ToDiscuss Auth)
Route.group(() => {
  Route.get("/blogreport", "Admin/BlogModule/BlogController.exportReport");
  Route.get("/faqreport", "Admin/FaqModule/FaqController.exportReport");
  Route.get(
    "/partnerreport",
    "Admin/PartnerModule/PartnerListController.exportReport"
  );
  Route.get(
    "/visitordocpurchasedreport",
    "Admin/VisitorSubscriptionModule/ItmapEuDocPurchasesController.exportReport"
  );
  Route.get(
    "/visitorsubscriptionsreport",
    "Admin/VisitorSubscriptionModule/ItmapEuSubcriptionController.exportReport"
  );
  Route.get(
    "/visitortransactionsreport",
    "Admin/VisitorSubscriptionModule/ItmapEuTransactionHistoryController.exportReport"
  );
  Route.get("/micontactreport", "MI/Admin/MiContactController.exportReport");
  Route.get("/investorreport", "InvestorController.exportReport");
  Route.get(
    "/investorsubscriptionsreport",
    "SubcriptionController.exportReport"
  );
  Route.get(
    "/investortransactionsreport",
    "TranscationHistoryController.exportReport"
  );
  Route.get("/mimarketplanreport", "MarketPlanController.exportReport");
}).prefix("/reports");

//MI Venodr related APIs
Route.group(() => {
  Route.resource("vendor_acquisition_lists", "VendorAcquisitionListController");
  Route.resource("vendor_alpha_vantages", "VendorAlphaVantageController");
  Route.resource(
    "vendor_competitive_dynamics",
    "VendorCompetitiveDynamicController"
  );
  Route.resource("vendor_documents", "VendorDocumentController");
  Route.resource(
    "vendor_employee_job_counts",
    "VendorEmployeeJobCountController"
  );
  Route.resource("vendor_financials", "VendorFinancialController");
  Route.resource("vendor_funding_lists", "VendorFundingListController");
  Route.resource("vendor_google_trends", "VendorGoogleTrendController");
  Route.resource("vendor_ips", "VendorIpController");
  Route.resource("vendor_itmap_scores", "VendorItmapScoreController");
  Route.resource("vendor_key_persons", "VendorKeyPersonController");
  Route.resource("vendor_locations", "VendorLocationController");
  Route.resource("vendor_news_lists", "VendorNewsListController");
  Route.resource("vendor_twitter_datas", "VendorTwitterDatumController");
  Route.resource("vendor_web_traffics", "VendorWebTrafficController");
}).middleware("auth");

//Vendor Locations
Route.group(() => {
  Route.get("/", "Admin/VendorModule/VendorLocationController.index");
  Route.get("/:id", "Admin/VendorModule/VendorLocationController.show");
  Route.post(
    "/",
    "Admin/VendorModule/VendorLocationController.store"
  ).validator("StoreVendorLocation");
  Route.put(
    "/:id",
    "Admin/VendorModule/VendorLocationController.update"
  ).validator("StoreVendorLocation");
  Route.delete("/:id", "Admin/VendorModule/VendorLocationController.destroy");
})
  .prefix("/vendorlocations")
  .middleware("auth");

//Vendor Employee Job Count
Route.group(() => {
  Route.get("/", "Admin/VendorModule/VendorEmployeeJobCountController.index");
  Route.get("/:id", "Admin/VendorModule/VendorEmployeeJobCountController.show");
  Route.post("/", "Admin/VendorModule/VendorEmployeeJobCountController.store");
  Route.put(
    "/:id",
    "Admin/VendorModule/VendorEmployeeJobCountController.update"
  );
  Route.delete(
    "/:id",
    "Admin/VendorModule/VendorEmployeeJobCountController.destroy"
  );
})
  .prefix("/vendoremployeejob")
  .middleware("auth");

//Vendor Funding List
Route.group(() => {
  Route.get("/", "Admin/VendorModule/VendorFundingListController.index");
  Route.get("/:id", "Admin/VendorModule/VendorFundingListController.show");
  Route.post("/", "Admin/VendorModule/VendorFundingListController.store");
  Route.put("/:id", "Admin/VendorModule/VendorFundingListController.update");
  Route.delete(
    "/:id",
    "Admin/VendorModule/VendorFundingListController.destroy"
  );
})
  .prefix("/vendorfundinglist")
  .middleware("auth");

// Pricing Insight (TODIscuss)

Route.get("/pricingInsight/export", "PricingInsightsController.export");

Route.group(() => {
  Route.get("/pricing_model", "PricingModelController.index");
  Route.post("/pricing_model", "PricingModelController.store");
  Route.get("/pricing_model/:id", "PricingModelController.show");
  Route.put("/pricing_model/:id", "PricingModelController.update");
  Route.delete("/pricing_model/:id", "PricingModelController.destroy");

  Route.get("/pricing_configuration", "PricingConfigurationController.index");
  Route.post("/pricing_configuration", "PricingConfigurationController.store");
  Route.get(
    "/pricing_configuration/:id",
    "PricingConfigurationController.show"
  );
  Route.delete(
    "/pricing_configuration/:id",
    "PricingConfigurationController.destroy"
  );
  Route.put(
    "/pricing_configuration/:id",
    "PricingConfigurationController.update"
  );
  Route.post("/import", "PricingInsightsController.import");
})
  .prefix("/pricingInsight")
  .middleware("auth");

Route.group(() => {
  Route.get("/market_plans", "MarketPlanController.index");
  Route.post("/market_plans", "MarketPlanController.store");
  Route.get("/market_plans/:id", "MarketPlanController.show");
  Route.delete("/market_plans/:id", "MarketPlanController.destroy");
  Route.put("/market_plans/:id", "MarketPlanController.update");
  Route.get("/market_plan/:id", "MarketPlanController.getMarketPlan");

  Route.get("/subscriptions", "SubcriptionController.index");
  Route.post("/subscriptions", "SubcriptionController.create");

  Route.post("/subscriptionsData", "SubcriptionController.store");

  Route.post("/transaction", "SubcriptionController.store_transaction");
  Route.delete("/subscriptions/:id", "SubcriptionController.destroy");
  Route.get("/subscriptions/:id", "SubcriptionController.show");
  Route.put("/subscriptionsData/:id", "SubcriptionController.update");
  Route.post("/cancel", "SubcriptionController.cancel");
  Route.post("/create_product", "MarketPlanController.createProduct");
  Route.get("/list_plans", "MarketPlanController.listPlans");
  Route.post("/getinvoice", "SubcriptionController.getAdminInvoice");
})
  .prefix("/subscription")
  .middleware("auth");

Route.group(() => {
  Route.get("/", "MI/Admin/MiContactController.index");
  Route.get("/:id", "MI/Admin/MiContactController.show");
  Route.post("/", "MI/Admin/MiContactController.store").validator(
    "StoreMiContact"
  );
  Route.put("/:id", "MI/Admin/MiContactController.update").validator(
    "StoreMiContact"
  );
  Route.delete("/:id", "MI/Admin/MiContactController.destroy");
})
  .prefix("/mi_contacts")
  .middleware("auth");

/**************************** MI Frontend APIs ****************************/

// (TODiscuss) app routes
Route.group(() => {
  Route.post("/mi_contacts", "MI/Front/MiContactController.index");
  Route.get("/mi-segment", "Front/ProductModule/MISegmentController.index");
  Route.get(
    "/module/buyerinsightcategories",
    "Front/ProductModule/ModuleController.buyerinsightcategories"
  );
  Route.get(
    "/module/leadgenerationcategories",
    "Front/ProductModule/ModuleController.leadgenerationcategories"
  );
  Route.get(
    "/module/channelinsightcategories",
    "Front/ProductModule/ModuleController.channelinsightcategories"
  );
  Route.get(
    "/module/pricingconfigcategories",
    "Front/ProductModule/ModuleController.pricingconfigcategories"
  );
  Route.get("/org-size", "OrgSizeController.index");
})
  .prefix("/app")
  .middleware(["ipblocker"]);

Route.group(() => {
  Route.post("/mi_guest_contacts", "MI/Front/MiContactController.guest");
}).prefix("/app");

//MI Vendor frontend APIs
Route.group(() => {
  Route.get("/vendors", "VendorController.index");
  Route.get("/vendors_competitive/:id", "VendorController.competitive");
  Route.get("/vendors/search", "VendorController.search");
  Route.get("/vendors/filterName", "VendorController.filterName");
  Route.post("vendors", "VendorController.showByName");
  Route.get(
    "/vendors/buyers_interest_meta",
    "VendorController.buyersInterestMeta"
  );
  Route.get("/vendors/buyers_interest", "VendorController.buyersInterest");
  Route.get("/industries", "Front/ProductModule/IndustryController.index");
  Route.get("/categories", "Front/ProductModule/CategoryController.index");
  Route.get(
    "/module/categories",
    "Front/ProductModule/ModuleController.categories"
  );
  Route.get(
    "/module/categories_subscribed",
    "Front/ProductModule/ModuleController.categoriesSubscribed"
  );
  Route.get(
    "/module/subscription_categories",
    "Front/ProductModule/ModuleController.categoriesForSubscription"
  );
  Route.get("/countries", "Front/LocationModule/CountryController.index");
  Route.get(
    "/subscription_countries",
    "Front/LocationModule/CountryController.subscriptionCountries"
  );
  Route.get(
    "/countries_subscribed",
    "Front/LocationModule/CountryController.countriesSubscribed"
  );
  Route.get("vendors/profile/:id", "VendorController.profile");
  Route.post("download-pdf", "VendorController.createPdf");
  Route.post("send-email", "VendorController.sendEmail");
  Route.get("vendor_locations", "VendorLocationController.index");
  Route.get("vendor_key_persons", "VendorKeyPersonController.index");
  Route.get(
    "vendor_employee_job_counts/total_employee/stats/:id",
    "VendorEmployeeJobCountController.total_employee_stats"
  );
  Route.get(
    "vendor_employee_job_counts/total_jobs/stats/:id",
    "VendorEmployeeJobCountController.total_jobs_stats"
  );
  Route.get("vendor_financials/stats/:id", "VendorFinancialController.stats");
  Route.get("vendor_funding_lists", "VendorFundingListController.index");
  Route.get(
    "vendor_acquisition_lists",
    "VendorAcquisitionListController.index"
  );
  Route.get("vendor_financials", "VendorFinancialController.frontend");
  Route.get("vendor_itmap_scores", "VendorItmapScoreController.index");
  Route.get("vendor_ips/stats/:id", "VendorIpController.ips_stats");
  Route.get("vendor_patent_list", "VednorPatentListController.index");
  Route.get("vendor_twitter_datas", "VendorTwitterDataController.index");
  Route.get(
    "vendor_web_traffics/stats/:id",
    "VendorWebTrafficController.stats"
  );
  Route.get("vendor_web_traffics", "VendorWebTrafficController.index");
  Route.get(
    "vendor_twitter_datas/stats/:id",
    "VendorTwitterDataController.stats"
  );
  Route.get("vendor_google_trends", "VendorGoogleTrendController.index");
  Route.get(
    "vendor_google_trends/stats/:id",
    "VendorGoogleTrendController.stats"
  );
  Route.get(
    "vendor_competitive_dynamics",
    "VendorCompetitiveDynamicController.index"
  );
  Route.get(
    "vendor_competitive_dynamics/market",
    "VendorCompetitiveDynamicController.market"
  );
  Route.get("vendor_news_lists", "VendorNewsListController.index");
  Route.get("vendor_documents", "VendorDocumentController.index");
  Route.get(
    "/country_groups",
    "Front/LocationModule/CountryGroupController.index"
  );
  Route.get(
    "/country_groups_subscribed",
    "Front/LocationModule/CountryGroupController.countryGroupsSubscribed"
  );
  Route.get(
    "/subscription_country_groups",
    "Front/LocationModule/CountryGroupController.subscriptionCountryGroups"
  );
  Route.get(
    "competitive_landscape",
    "VendorCompetitiveLandscapeController.index"
  );
  Route.get(
    "competitive_landscape/market",
    "VendorCompetitiveLandscapeController.market"
  );
  Route.get(
    "competitive_landscape/marketSubscription",
    "VendorCompetitiveLandscapeController.getMarketforSubscription"
  );
  Route.get("/vendor_category", "VendorCategoryController.index");
  Route.get(
    "/getcompanysizes",
    "Front/VisitorModule/VisitorController.getCompanysizes"
  );
}).prefix("/investor");

Route.group(() => {
  Route.get("vendors/:id", "VendorController.show");
  Route.get("vendor_alpha_vantages", "VendorAlphaVantageController.index");
  Route.get(
    "vendor_employee_job_counts",
    "VendorEmployeeJobCountController.index"
  );
  Route.get("vendor_financials/graph", "VendorFinancialController.graph");
  Route.get("vendor_ips", "VendorIpController.index");
  Route.get("/modules", "Front/ProductModule/ModuleController.indexauth");
  Route.get(
    "/module/children",
    "Front/ProductModule/ModuleController.childrenauth"
  );
  Route.get(
    "/module/parent",
    "Front/ProductModule/ModuleController.parentauth"
  );
  Route.post("/set_filter", "InvestorFilterController.store");
  Route.get("/get_filter/:id", "InvestorFilterController.show");
  Route.get("/subscriptionlist", "SubcriptionController.history");
  Route.get(
    "/isexistmisubscription",
    "SubcriptionController.isExistMISubscription"
  );
  Route.get("/document", "FileController.getInvestorDocument");
  Route.get(
    "competitive_landscape/getsubscribeddocuments",
    "VendorCompetitiveLandscapeController.getDocumentsforSubscribedMarket"
  );
  Route.post("/subscriptions", "SubcriptionController.store");
})
  .prefix("/investor")
  .middleware("auth:investorAuth");

Route.group(() => {
  Route.get("/", "Front/BuyersModules/BuyersController.index");
  Route.get("/modules", "Front/BuyersModules/BuyersController.modules");
})
  .prefix("/buyers")
  .middleware("auth:investorAuth");

Route.group(() => {
  Route.get("/", "Front/PartnerModule/PartnerController.index");
  Route.get(
    "/partner-types",
    "Front/PartnerModule/PartnerController.PartnerTypes"
  );
})
  .prefix("/channel")
  .middleware("auth:investorAuth");

Route.group(() => {
  Route.get("/", "Front/LeadGenerationModule/LeadGenerationController.index");
  Route.get(
    "/search",
    "Front/LeadGenerationModule/LeadGenerationController.search"
  );
})
  .prefix("/leads")
  .middleware("auth:investorAuth");

Route.group(() => {
  Route.get("/", "BookmarkController.index");
  Route.get("/:id", "BookmarkController.show");
  Route.post("/", "BookmarkController.store").validator("StoreBookmark");
  Route.put("/:id", "BookmarkController.update").validator("StoreBookmark");
  Route.post("/delete_all", "BookmarkController.bulkDestroy");
  Route.delete("/:id", "BookmarkController.destroy");
})
  .prefix("/investor/bookmark")
  .middleware("auth:investorAuth");
// investor routes

Route.resource("investors", "InvestorController").validator(
  new Map([
    [["investors.store"], ["StoreInvestor"]],
    [["investors.update"], ["StoreInvestor"]],
  ])
);

Route.group(() => {
  Route.put(
    "/change_password/:id",
    "InvestorController.changePassword"
  ).validator("StorePassword");
})
  .prefix("/investors")
  .middleware("auth");

Route.group(() => {
  Route.post("/register", "InvestorController.register").validator(
    "StoreInvenstorRegister"
  );
  Route.post("/login", "InvestorController.login").validator("StoreLogin");
  Route.post("/forgot_password", "InvestorController.forgotpassword");
  Route.post(
    "/forgot_resetpassword",
    "InvestorController.forgot_resetpassword"
  );
  Route.post("/resetpassword", "InvestorController.resetpassword");
}).prefix("/investor");

Route.get("/investor/auth/dashboard", "InvestorController.dashboard");

Route.group(() => {
  Route.get("/profile", "InvestorController.getProfile");
  Route.get("/activate", "InvestorController.activateAccount");
  Route.post("/profile", "InvestorController.updateProfile");
  Route.get("/subscriptions", "InvestorController.subscription_details");
  Route.get("/transactions", "InvestorController.transaction_details");
  Route.post("/transaction", "SubcriptionController.store_transaction");
})
  .prefix("/investor/auth")
  .middleware("auth:investorAuth");

Route.group(() => {
  Route.get("/getplans", "MarketPlanController.getmiplans");
  Route.get("/getplans/:id", "MarketPlanController.getMarketPlan");
  Route.post("/download-pdf", "VendorController.createinvoiceauth");
})
  .prefix("/subscription")
  .middleware("auth:investorAuth");

Route.group(() => {
  Route.get("/pricing_insights", "PricingInsightsController.index");
  Route.get("/pricing_insights_graph", "PricingInsightsController.graphIndex");
})
  .prefix("/pricingInsight")
  .middleware("auth:investorAuth");

Route.get(
  "searchCondidateData",
  "Admin/VisitorModule/VisitorController.fetchCondidateData"
);

Route.post(
  "fetchCondidateCallback",
  "Admin/VisitorModule/VisitorController.fetchCondidateCallback"
);

/***********************************  UIPath BOT APIs *************************************/

Route.get(
  "incomplete_profile",
  "Admin/VisitorModule/VisitorController.incompleteProfile"
).middleware("secureAccess");
Route.post(
  "update_profiles",
  "Admin/VisitorModule/VisitorController.updateProfiles"
).middleware("secureAccess");
Route.post(
  "update_profile",
  "Admin/VisitorModule/VisitorController.updateProfile"
).middleware("secureAccess");
Route.get(
  "company/incomplete_job_count",
  "Admin/VendorModule/VendorEmployeeJobCountController.incompleteJobCount"
).middleware("secureAccess");
Route.post(
  "company/update_job_count",
  "Admin/VendorModule/VendorEmployeeJobCountController.updateJobCount"
).middleware("secureAccess");

Route.get(
  "getVendorList",
  "Admin/VendorModule/VendorController.getVendorLinkedList"
).middleware("secureAccess");

Route.post(
  "updateVendorLinkedIn",
  "Admin/VendorModule/VendorController.updateVendorLinkedIn"
).middleware("secureAccess");

Route.post(
  "zoomMeetingEvent",
  "Admin/ConsultantModule/BookingLogController.zoomMeetingEvent"
);
Route.post(
  "zoomMeetingEventAuth",
  "Admin/ConsultantModule/BookingLogController.zoomMeetingEventAuth"
);

Route.get(
  "zoomMeetingReport",
  "Admin/ConsultantModule/BookingHistoryController.getZoomMeetingReport"
);

// Route.post(
//   "zoomMeetingEventWebhook",
//   "Admin/ConsultantModule/BookingLogController.zoomMeetingEventWebhook"
// );

Route.group(() => {
  Route.post("chat_gpt", "Front/GPTModule/GptChatController.store").validator(
    "App/Validators/GptChat"
  );
  Route.get("chat_gpt", "Front/GPTModule/GptChatController.index");

  Route.post("chat-response", "Front/GPTModule/GptChatLogController.store");
  Route.get("chat-response", "Front/GPTModule/GptChatLogController.index");

  // for gpt_chats_responses table
  Route.post("chat-table", "Front/GPTModule/GptChatTableController.store");
  // .validator("App/Validators/GptChatTable");
  Route.get("chat-table", "Front/GPTModule/GptChatTableController.index");

  Route.post("chatting", "Front/GPTModule/OpenAIController.generateCompletion");
  Route.get("chatting", "Front/GPTModule/OpenAIController.index");
})
  .prefix("/app/openai")
  .middleware("auth:visitorAuth");

// consultant import API
Route.group(() => {
  Route.post("/import", "Admin/ConsultantModule/ConsultantController.import");
})
  .prefix("/consultant")
  .middleware("auth");

Route.group(() => {
  // consultant donations API
  Route.get("/donations", "Front/ConsultantModule/DonationController.index");
  Route.post("/donations", "Front/ConsultantModule/DonationController.create");
})
  .prefix("/app")
  .middleware("auth:visitorAuth");

Route.post(
  "updateScheduleTime",
  "Admin/ConsultantModule/ConsultantScheduleController.updateScheduleTime"
);


//Community module Admin APIs
Route.group(() => {
	
	// Community Tag APIs
	Route.get("/tags", "Admin/CommunityModule/TagController.index");
	Route.post("/tags", "Admin/CommunityModule/TagController.store").validator("StoreCommunityTag");
	Route.get("/tags/:id", "Admin/CommunityModule/TagController.show");
	Route.put("/tags/:id", "Admin/CommunityModule/TagController.update").validator("StoreCommunityTag");
	Route.delete("/tags/:id", "Admin/CommunityModule/TagController.destroy");
	
	Route.get("/posts", "Admin/CommunityModule/CommunityPostController.index");
	Route.get("/posts/:id", "Admin/CommunityModule/CommunityPostController.show");
	Route.put("/posts/status_update/:id", "Admin/CommunityModule/CommunityPostController.status_update");
	Route.delete("/posts/:id", "Admin/CommunityModule/CommunityPostController.destroy");
	
	Route.get("/posts_reply", "Admin/CommunityModule/CommunityPostReplyController.index");
  Route.get("/posts_reply/:id", "Admin/CommunityModule/CommunityPostReplyController.show");
	Route.put("/posts_reply/status_update/:id", "Admin/CommunityModule/CommunityPostReplyController.status_update");
	Route.delete("/posts_reply/:id", "Admin/CommunityModule/CommunityPostReplyController.destroy");
  Route.get("/posts_reply_comments", "Admin/CommunityModule/CommunityPostReplyController.get_reply_comments");
  Route.post("/reply_mark_correct_answer", "Admin/CommunityModule/CommunityPostReplyController.mark_correct_answer");
	
  // Badge
	Route.get("/badge", "Admin/CommunityModule/BadgeController.index");
	Route.post("/badge", "Admin/CommunityModule/BadgeController.store").validator("StoreBadge");
	Route.get("/badge/:id", "Admin/CommunityModule/BadgeController.show");
	Route.put("/badge/:id", "Admin/CommunityModule/BadgeController.update").validator("StoreBadge");
	Route.delete("/badge/:id", "Admin/CommunityModule/BadgeController.destroy");
	
  // Community Visitory Profile
  Route.get("/visitor_profile", "Admin/CommunityModule/VisitorCommunityPorfileController.index");
  Route.get("/visitor_profile/:id", "Admin/CommunityModule/VisitorCommunityPorfileController.show");

	// Community APIs
	Route.get("/", "Admin/CommunityModule/CommunityController.index");
	Route.get("/members", "Admin/CommunityModule/CommunityController.community_members");
	Route.delete("/remove_member/:id", "Admin/CommunityModule/CommunityController.remove_community_member");
	Route.post("/", "Admin/CommunityModule/CommunityController.store").validator("StoreCommunity");
	Route.get("/:id", "Admin/CommunityModule/CommunityController.show");
	Route.put("/:id", "Admin/CommunityModule/CommunityController.update").validator("StoreCommunity");
	Route.delete("/:id", "Admin/CommunityModule/CommunityController.destroy");

}).prefix("/community").middleware("auth");

Route.group(() => {
	
	// Technology APIs
	Route.get("/", "Admin/TechnologyController.index");
	Route.post("/", "Admin/TechnologyController.store").validator("StoreTechnology");
	Route.get("/:id", "Admin/TechnologyController.show");
	Route.put("/:id", "Admin/TechnologyController.update").validator("StoreTechnology");
	Route.delete("/:id", "Admin/TechnologyController.destroy");
	
}).prefix("/technology").middleware("auth");

Route.group(() => {
	
	// Report Abuse Type APIs
	Route.get("/type", "Admin/CommunityModule/ReportAbuseTypeController.index");
	Route.post("/type", "Admin/CommunityModule/ReportAbuseTypeController.store").validator("StoreReportAbuseType");
	Route.get("/type/:id", "Admin/CommunityModule/ReportAbuseTypeController.show");
	Route.put("/type/:id", "Admin/CommunityModule/ReportAbuseTypeController.update").validator("StoreReportAbuseType");
	Route.delete("/type/:id", "Admin/CommunityModule/ReportAbuseTypeController.destroy");
	
	// Report Abuse APIs
	Route.get("/", "Admin/CommunityModule/ReportAbuseController.index");
	Route.get("/:id", "Admin/CommunityModule/ReportAbuseController.show");
	Route.delete("/:id", "Admin/CommunityModule/ReportAbuseController.destroy");
	
}).prefix("/report_abuse").middleware("auth");

Route.group(() => {
  Route.get("/", "Admin/CommunityModule/CommunityNewsAnnouncementController.index");
	Route.post("/", "Admin/CommunityModule/CommunityNewsAnnouncementController.store").validator("StoreCommunityNewsAnnouncement");
  Route.get("/:id", "Admin/CommunityModule/CommunityNewsAnnouncementController.show");
	Route.put("/:id", "Admin/CommunityModule/CommunityNewsAnnouncementController.update").validator("StoreCommunityNewsAnnouncement");
	Route.delete("/:id", "Admin/CommunityModule/CommunityNewsAnnouncementController.destroy");
}).prefix("/news_announcements").middleware("auth"); 

//Community module App APIs
Route.group(() => {
	
	Route.get("/tags", "Admin/CommunityModule/TagController.index");
	
	// Get Community lists APIs
	Route.get("/community", "Front/CommunityModule/CommunityController.index");
	Route.get("/community/details/:slug", "Front/CommunityModule/CommunityController.show");
  Route.post("/community/join", "Front/CommunityModule/CommunityController.join_community").validator("StoreJoinCommunity");
  Route.post("/community/leave", "Front/CommunityModule/CommunityController.leave_community").validator("StoreJoinCommunity");
	
	// Community post APIs
  Route.get("/tranding_question", "Front/CommunityModule/CommunityPostController.tranding_question");
	Route.get("/communitypost/:community_slug", "Front/CommunityModule/CommunityPostController.index");
	Route.get("/communitypost/details/:slug", "Front/CommunityModule/CommunityPostController.show");
	Route.post("/communitypost", "Front/CommunityModule/CommunityPostController.store").validator('StoreCommunityPost');
  Route.put("/communitypost/:id", "Front/CommunityModule/CommunityPostController.update").validator('StoreCommunityPost');
	Route.post("/communitypost/vote", "Front/CommunityModule/CommunityPostController.voting").validator('StoreCommunityPostVote');
	
	// Community post reply APIs
	Route.get("/communitypostreply", "Front/CommunityModule/CommunityPostReplyController.index");
	Route.post("/communitypostreply", "Front/CommunityModule/CommunityPostReplyController.store").validator('StoreCommunityPostReply');
	Route.post("/communitypostreply/vote", "Front/CommunityModule/CommunityPostReplyController.voting").validator('StoreCommunityPostReplyVote');
	Route.post("/communitypostreply/mark_correct_answer", "Front/CommunityModule/CommunityPostReplyController.mark_correct_answer");
	Route.get("/communitypostreply/comments", "Front/CommunityModule/CommunityPostReplyController.get_reply_comments");

	Route.get("/repost_abuse/types", "Front/CommunityModule/ReportAbuseController.getTypes");
	Route.post("/repost_abuse", "Front/CommunityModule/ReportAbuseController.store").validator('StoreReportAbuse');
	
	Route.get("/visitorcommunityprofile", "Front/CommunityModule/VisitorCommunityPorfileController.index");
	Route.get("/visitorprofile", "Front/CommunityModule/VisitorCommunityPorfileController.show");
	Route.put("/visitorprofile/:id", "Front/CommunityModule/VisitorCommunityPorfileController.update").validator('UpdateVisitorProfile');
	Route.get("/visitor_community", "Front/CommunityModule/VisitorCommunityPorfileController.visitor_community");
	Route.get("/visitor_queries_history", "Front/CommunityModule/VisitorCommunityPorfileController.queries_history");
	Route.get("/visitor_answer_history", "Front/CommunityModule/VisitorCommunityPorfileController.visitor_answer_history");
  Route.get("/visitor_profile_levels", "Front/CommunityModule/VisitorCommunityPorfileController.visitor_profile_levels");
  Route.get("/visitor_activity_counter", "Front/CommunityModule/VisitorCommunityPorfileController.visitor_activity_counter");
  Route.get("/visitor_activities", "Front/CommunityModule/VisitorCommunityPorfileController.visitor_activities");
	
  Route.get("/get_news_announcements", "Front/CommunityModule/CommunityNewsAnnouncementController.index");
  Route.get("/get_news_announcements/:id", "Front/CommunityModule/CommunityNewsAnnouncementController.show");

  Route.post("/uploadimage", "FileController.image");
  Route.post("/uploadmedia", "FileController.media");

}).prefix("/app").middleware("auth:visitorAuth");

Route.group(() => {
  
  Route.get("/research_topics", "Front/MarketResearchModule/MarketResearchController.reseachTopics");
  Route.get("/research_tags", "Front/MarketResearchModule/MarketResearchController.reseachTags");
  Route.get("/research_document_types", "Front/MarketResearchModule/MarketResearchController.reseachDocumentTypes");
  Route.get("/research_categories", "Front/MarketResearchModule/MarketResearchController.reseachCategories");

  Route.get("/market_research", "Front/MarketResearchModule/MarketResearchController.index");
  Route.get("/market_research/:id", "Front/MarketResearchModule/MarketResearchController.show");
  Route.get("/market_research/show/:slug", "Front/MarketResearchModule/MarketResearchController.showBySlug");

}).prefix("/app").middleware(["ipblocker"]);

Route.group(() => {
  Route.get("/", "Admin/DocumentModule/ResearchTopicController.index");
	Route.post("/", "Admin/DocumentModule/ResearchTopicController.store").validator("StoreResearchTopic");
  Route.get("/:id", "Admin/DocumentModule/ResearchTopicController.show");
	Route.put("/:id", "Admin/DocumentModule/ResearchTopicController.update").validator("StoreResearchTopic");
	Route.delete("/:id", "Admin/DocumentModule/ResearchTopicController.destroy");
}).prefix("/research_topics").middleware("auth"); 

Route.group(() => {
  Route.get("/", "Admin/DocumentModule/ResearchTagController.index");
	Route.post("/", "Admin/DocumentModule/ResearchTagController.store");
  Route.get("/:id", "Admin/DocumentModule/ResearchTagController.show");
	Route.put("/:id", "Admin/DocumentModule/ResearchTagController.update");
	Route.delete("/:id", "Admin/DocumentModule/ResearchTagController.destroy");
}).prefix("/research_tags").middleware("auth"); 

Route.group(() => {
  Route.post("uploadDocumentOnGoogleDrive", "FileController.uploadDocumentOnGoogleDrive");
  Route.get('getGoogleDriveDocument/:id', 'FileController.getGoogleDriveDocument')
}).middleware("auth");

Route.get('auth/google', 'Admin/GoogleDriveAuthController.redirect')
Route.get('auth/google/callback', 'Admin/GoogleDriveAuthController.callback')
Route.get('auth/refreshToken', 'Admin/GoogleDriveAuthController.refreshToken')