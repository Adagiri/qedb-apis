const AWS = require('aws-sdk');
const { default: axios } = require('axios');

const emailReplyToAddress = 'no-reply@krowdee.com';
const emailSource = 'Qedb <support@krowdee.com>';

const sns = new AWS.SNS({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

const ses = new AWS.SES({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

const createEmailParam = (to, subject, message) => {
  return {
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: message,
        },
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject,
      },
    },
    Source: emailSource,
    ReplyToAddresses: [emailReplyToAddress],
  };
};

// Send sms to a phone number using aws sns api
const sendSms = (message, phone) => {
  console.log(message, phone);
  const snsParams = {
    MessageAttributes: {
      'AWS.SNS.SMS.SenderID': {
        DataType: 'String',
        StringValue: 'Qdb',
      },

      'AWS.SNS.SMS.SMSType': {
        DataType: 'String',
        StringValue: 'Transactional',
      },
    },
    Message: message,
    PhoneNumber: phone,
  };

  const bulksmsParams = {
    url: '/messages',
    method: 'post',
    baseURL: 'https://api.bulksms.com/v1/',
    headers: {
      'Content-Type': 'application/json',
    },
    data: {
      to: [phone],
      body: message,
    },
    auth: {
      username: process.env.BULKSMS_USERNAME,
      password: process.env.BULKSMS_PASSWORD,
    },
  };

  if (process.env.SMS_HANDLER === 'aws_sns') {
    // send sms using aws sns
    return sns.publish(snsParams).promise();
  } else {
    // send sms using bulksms api
    return axios(bulksmsParams);
  }
};

// Send mail to an email using amazon ses

const sendEmail = (params) => {
  // Create the promise and SES service object
  return ses.sendEmail(params).promise();
};

sendPushNotifications = async function (tokenIds, title, body) {
  return axios({
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `key=${process.env.FIREBASE_SERVER_KEY}`,
    },
    url: 'https://fcm.googleapis.com/fcm/send',
    data: {
      registration_ids: tokenIds,
      data: {
        notification: {
          title,
          body,
        },
      },
    },
  });
};

module.exports = {
  sendSms,
  sendEmail,
  createEmailParam,
  sendPushNotifications,
};
