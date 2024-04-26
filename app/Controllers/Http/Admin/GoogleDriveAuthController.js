'use strict'

const Env = use('Env')
const axios = require('axios')
const qs = require('querystring')
const { KEYS } = require("../../../Helper/constants");
const Config = use("App/Models/Admin/ConfigModule/Config");
const moment = require("moment");

class GoogleDriveAuthController {
  async redirect({ response }) {
    
    const queryParams = {
      client_id: Env.get('DRIVE_CLIENT_ID'),
      redirect_uri: Env.get('DRIVE_REDIRECT_URI'),
      scope: 'https://www.googleapis.com/auth/drive',
      response_type: 'code',
      access_type: 'offline'
    }

    const authUrl = `https://accounts.google.com/o/oauth2/auth?${qs.stringify(queryParams)}`
    response.redirect(authUrl)
  }

  async callback({ request, response, session }) {
    const code = request.input('code')
    console.log("code = ", code);
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: Env.get('DRIVE_CLIENT_ID'),
      client_secret: Env.get('DRIVE_CLIENT_SECRET'),
      redirect_uri: Env.get('DRIVE_REDIRECT_URI'),
      grant_type: 'authorization_code'
    })
    console.log("google res = ", tokenResponse);

    if(tokenResponse.status == 200)
    {
      const accessToken = tokenResponse.data.access_token;
      const refreshToken = tokenResponse.data.refresh_token;
      const expires_in = tokenResponse.data.expires_in;
      const token_expired_at = moment().add(expires_in, 'seconds').format('YYYY-MM-DD HH:mm:ss');

      const checkAccessToken = await Config.findBy("key", "GOOGLE_DRIVE_ACCESS_TOKEN");

      if(checkAccessToken) {
        checkAccessToken.value = accessToken;
        await checkAccessToken.save();

      } else {
        await Config.create(
          { key: KEYS.GOOGLE_DRIVE_ACCESS_TOKEN, value: accessToken }
        );
      }

      if(refreshToken)
      {
        const checkRefreshToken = await Config.findBy("key", "GOOGLE_DRIVE_REFRESH_TOKEN");

        if(checkRefreshToken) {
          checkRefreshToken.value = refreshToken;
          await checkRefreshToken.save();

        } else {
          await Config.create(
            { key: KEYS.GOOGLE_DRIVE_REFRESH_TOKEN, value: refreshToken }
          );
        }
      }

      const checkExpiredAt = await Config.findBy("key", "GOOGLE_DRIVE_TOKEN_EXPIRED_AT");

      if(checkExpiredAt) {
        checkExpiredAt.value = token_expired_at;
        await checkExpiredAt.save();

      } else {
        await Config.create(
          { key: KEYS.GOOGLE_DRIVE_TOKEN_EXPIRED_AT, value: token_expired_at }
        );
      }

      return response.status(200).json({ status: 200, message: "Google drive authentication successfully." });
    } else {
      return response.status(500).json({ status: 200, message: "Google drive authentication failed." });
    }
    // return tokenResponse.data;
  }

  async refreshToken()
  {
      
  }
}

module.exports = GoogleDriveAuthController