module.exports.API_TYPE = {
  GOOGLE_TRENDS: "GOOGLE_TRENDS",
  RSS_FEEDS: "RSS_FEEDS",
  IP_PATENTS: "IP_PATENTS",
  FINANCIALS: "FINANCIALS",
  RITE_KITE_API: "RITE_KITE_API",
  LOGO_SCRAPE: "LOGO_SCRAPE",
  WEB_TRAFFIC: "WEB_TRAFFIC",
  TWITTER_API: "TWITTER_API",
};

module.exports.URLS = {
  IP_PATENTS_URL: "https://api.patentsview.org/patents/query",
  ASSIGNEE_DATA_URL: "https://api.patentsview.org/assignees/query",
  FINANCIALS_BASE_URL: "https://www.alphavantage.co/query",
  RITEKITE_URL: "https://api.ritekit.com/v2/company-insights/logo",
  WEB_TRAFFIC_URL: "https://awis.api.alexa.com/api",
  TWITTER_URL_V2: "https://api.twitter.com/2/",
  TWITTER_URL_V1: "https://api.twitter.com/1.1/",
  LINKEDIN_BASIC_INFO_URL: "https://nubela.co/proxycurl/api/linkedin/company",
  LINKEDIN_LOGO_URL:
    "https://nubela.co/proxycurl/api/linkedin/company/profile-picture",
  LINKEDIN_BASIC_LINKEDIN_URL:
    "https://nubela.co/proxycurl/api/linkedin/company/resolve",
  LINKEDIN_PROFILE_URL_FROM_EMAILID_URL:
    "https://nubela.co/proxycurl/api/linkedin/profile/resolve/email",
  LINKEDIN_PROFILE_DETAILS_FROM_LINK:
    "https://nubela.co/proxycurl/api/v2/linkedin",
  PAYPAL_PRODUCT_MANAGEMENT_URL: `${process.env.PAYPAL_URL}/v1/catalogs/products`,
  PAYPAL_GET_TOKEN_URL: `${process.env.PAYPAL_URL}/v1/oauth2/token`,
  PAYPAL_BASE_URL: `${process.env.PAYPAL_URL}`,
  PAYPAL_PLAN_MANAGEMENT_URL: `${process.env.PAYPAL_URL}/v1/billing/plans`,
  PAYPAL_CANCEL_SUBSCRIPTION_URL: `${process.env.PAYPAL_URL}/v1/billing/subscriptions`,
  PHANTOM_BUSTER_AGENT_LAUNCH:
    "https://api.phantombuster.com/api/v2/agents/launch",
  PHANTOM_BUSTER_AGENT_OUTPUT:
    "https://api.phantombuster.com/api/v2/agents/fetch-output",
  PHANTOM_BUSTER_AGENT_CACHE: "https://cache1.phantombooster.com/",
  PHANTOM_BUSTER_AGENT_FETCH:
    "https://api.phantombuster.com/api/v2/agents/fetch",
  PHANTOM_BUSTER_JSON: "https://phantombuster.s3.amazonaws.com", //https://api-m.paypal.com
  SIGNALHIRE_CANDIDATE_SEARCH_URL:
    "https://www.signalhire.com/api/v1/candidate/search",
  SIGNALHIRE_GET_CREDITS_URL: "https://www.signalhire.com/api/v1/credits",
  ZOOM_GET_ACCESS_TOKEN_URL: "https://zoom.us/oauth/token",
  ZOOM_BASE_URL: "https://api.zoom.us/v2",
};

module.exports.KEYS = {
  RITEKIT_CLIENT_ID: "RITEKIT_CLIENT_ID",
  ALPHA_VANTAGE_API_KEY: "ALPHA_VANTAGE_API_KEY",
  ALEXA_KEY: "ALEXA_KEY",
  TWTTER_AUTH_TOKEN: "TWTTER_AUTH_TOKEN",
  NUBELA_AUTH_TOKEN_LINKEDIN: "NUBELA_AUTH_TOKEN_LINKEDIN",
  PAYPAL_AUTH_TOKEN: "PAYPAL_AUTH_TOKEN",
  PAYPAL_CLIENT_ID_SECRET: "PAYPAL_CLIENT_ID_SECRET",
  PAYPAL_GET_AUTH_TOKEN_USERNAME: "PAYPAL_GET_AUTH_TOKEN_USERNAME",
  PAYPAL_GET_AUTH_TOKEN_PASSWORD: "PAYPAL_GET_AUTH_TOKEN_PASSWORD",
  SIGNALHIRE_API_KEY: "SIGNALHIRE_API_KEY",
  TOTAL_PRODUCT_FETCHED_KEY: "TOTAL_PRODUCT_FETCHED",
  ZOOM_GET_AUTH_TOKEN_PASSWORD: "ZOOM_GET_AUTH_TOKEN_PASSWORD",
  ZOOM_GET_AUTH_TOKEN_USERNAME: "ZOOM_GET_AUTH_TOKEN_USERNAME",
  ZOOM_GET_VALIDATION_TOKEN: "ZOOM_GET_VALIDATION_TOKEN",
  ZOOM_GET_ACCOUNT_ID: "ZOOM_GET_ACCOUNT_ID",
  BOOKING_CANCELLATION_PERCENTAGE: "BOOKING_CANCELLATION_PERCENTAGE",
  CONSULTANT_COMMISSION_PERCENTAGE: "CONSULTANT_COMMISSION_PERCENTAGE",
  SUBMIT_ANSWER_POINTS: "SUBMIT_ANSWER_POINTS",
  CORRECT_ANSWER_POINTS: "CORRECT_ANSWER_POINTS",
  UPVOTES_ANSWER_POINTS: "UPVOTES_ANSWER_POINTS",
};

module.exports.MI_CONFIG = {
  1: {
    module_subscription: false,
    module_country: false,
    module_region: false,
  },
  2: {
    module_subscription: true,
    module_country: false,
    module_region: false,
  },
  3: {
    module_subscription: true,
    module_country: true,
    module_region: true,
  },
  4: {
    module_subscription: true,
    module_country: false,
    module_region: false,
  },
  5: {
    module_subscription: false,
    module_country: true,
    module_region: true,
  },
  6: {
    module_subscription: true,
    module_country: false,
    module_region: false,
  },
};

module.exports.SERIAL_CODE = {
  SUBSCRIPTION: "MISC",
  TRANSACTION: "MITC",
  INVOICE: "MI",
};

module.exports.EU_SERIAL_CODE = {
  SUBSCRIPTION: "EUSC",
  TRANSACTION: "EUTX",
  INVOICE: "EU",
};

module.exports.HTML_KEY = {
  BASE: [
    {
      key: "##USER##",
      field: "name",
    },
    {
      key: "##EMAIL##",
      field: "email",
    },
    {
      key: "##PHONE##",
      field: "mobile",
    },
  ],
  GENERAL_INFO: [
    { key: "##FOUNDED##", field: "founded" },
    { key: "##COMPANYTYPE##", field: "company_type" },
    { key: "##VENDOR_CATEGORY##", field: "vendor_category_name" },
    { key: "##DATE##", field: "date" },
    { key: "##HEADQUARTER##", field: "head_quarter" },
    { key: "##INDUSTRY##", field: "industry" },
    { key: "##SPECALITY##", field: "specality" },
  ],
  EXECUTIVE_MANAGEMENT: [
    {
      key: "##NAME##",
      field: "name",
    },
    { key: "##DATE##", field: "date" },
  ],
  KEY_PEOPLE: [
    {
      key: "##NAME##",
      field: "name",
    },
    { key: "##DATE##", field: "date" },
  ],
  FUNDING_DETAILS: [{ key: "##DATE##", field: "date" }],
  ACQUISITIONS: [{ key: "##DATE##", field: "date" }],
  PATENTS: [{ key: "##DATE##", field: "date" }],
  ADD_INFO: [{ key: "##DATE##", field: "date" }],
  INVOICE: [
    {
      key: "##INVOICENO##",
      field: "invoice_no",
    },
    {
      key: "##AMOUNT##",
      field: "invoice_amount",
    },
    {
      key: "##DATE##",
      field: "invoice_date",
    },
    {
      key: "##SEGMENT##",
      field: "segment_name",
    },
  ],
  EUINVOICE: [
    {
      key: "##TYPE##",
      field: "invoice_type",
    },
    {
      key: "##AMOUNT##",
      field: "invoice_amount",
    },
    {
      key: "##INVOICENO##",
      field: "invoice_no",
    },
    {
      key: "##INVOICEDATE##",
      field: "date",
    },
    {
      key: "##PLAN##",
      field: "plan_name",
    },
    {
      key: "##DATE##",
      field: "invoicedate",
    },
    {
      key: "##DOCUMENT##",
      field: "document_name",
    },
  ],
  EUBOOKING_RECEIPT: [
    {
      key: "##TYPE##",
      field: "invoice_type",
    },
    {
      key: "##AMOUNT##",
      field: "invoice_amount",
    },
    {
      key: "##INVOICENO##",
      field: "invoice_no",
    },
    {
      key: "##INVOICEDATE##",
      field: "invoicedate",
    },
    {
      key: "##DATE##",
      field: "invoicedate",
    },
    {
      key: "##BOOKINGDATE##",
      field: "date",
    },
    {
      key: "##DURATION##",
      field: "duration",
    },
    {
      key: "##AMOUNTPERHOUR##",
      field: "amount_per_hour",
    },
    {
      key: "##TRANSACTIONID##",
      field: "transaction_Id",
    },
    {
      key: "##TAXES##",
      field: "taxes",
    },
  ],
};
