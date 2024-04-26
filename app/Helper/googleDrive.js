const { KEYS } = require("../Helper/constants");
const Config = use("App/Models/Admin/ConfigModule/Config");
const moment = require("moment");
const axios = require('axios')
const Env = use('Env')

async function checkAccessToken() {
  
  let response = {};
  const getAccessToken = await Config.findBy("key", "GOOGLE_DRIVE_ACCESS_TOKEN");
  const getRefreshToken = await Config.findBy("key", "GOOGLE_DRIVE_REFRESH_TOKEN");
  const tokenExpiredAt = await Config.findBy("key", "GOOGLE_DRIVE_TOKEN_EXPIRED_AT");
  
  let accessToken = (getAccessToken) ? getAccessToken.value : "";
  const refreshToken = (getRefreshToken) ? getRefreshToken.value : "";

  if(accessToken && refreshToken)
  {
    if (moment().isAfter(moment(tokenExpiredAt.value).subtract(10, 'minutes')))
    {
      // Request new access token using refresh token
      const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: Env.get('DRIVE_CLIENT_ID'),
        client_secret: Env.get('DRIVE_CLIENT_SECRET'),
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })

      if(tokenResponse.status == 200)
      {
        accessToken = tokenResponse.data.access_token;
        const expires_in = tokenResponse.data.expires_in;
        const token_expired_at = moment().add(expires_in, 'seconds').format('YYYY-MM-DD HH:mm:ss');

        const updateAccessToken = await Config.findBy("key", "GOOGLE_DRIVE_ACCESS_TOKEN");
        updateAccessToken.value = accessToken;
        await updateAccessToken.save();

        const updateExpiredAt = await Config.findBy("key", "GOOGLE_DRIVE_TOKEN_EXPIRED_AT");
        updateExpiredAt.value = token_expired_at;
        await updateExpiredAt.save();

        response.status = 200;
        response.accessToken = accessToken;
        return response;
      } else {
        response.status = 500;
        response.message = "Something went wrong while generating new access token. Please try to reconfigure your Google account.";
        return response;
      }
    }  else {
      response.status = 200;
      response.accessToken = accessToken;
      return response;
    }
  } else {
    response.status = 500;
    response.message = "Google drive configuration is not connected. Please try to reconfigure your Google account.";
    return response;
  } 
}


module.exports = {
  checkAccessToken
};
