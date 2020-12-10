// Requires
const axios = require('axios').default;
const base64 = require('base-64');
const fs = require('fs');
const path = require('path');

// Envars - required
const CLIENT_ID = process.env.CMNSRV_CLIENTID;
const CLIENT_SECRET = process.env.CMNSRV_CLIENTSECRET;

// Envars - optional (clip url trailing slashes)
const FILE_NAME = process.env.FILE_NAME || 'results.xlsx';
const SENDER = process.env.EMAIL_SENDER || 'example@gov.bc.ca';
const TEMPLATE = process.env.PATH_TEMPLATE || './src/assets/templates/CEM_template.xlsx';
const TOKEN_URL = (process.env.TOKEN_URL || 'https://dev.oidc.gov.bc.ca/auth/realms/jbd6rnxw/protocol/openid-connect/token').replace(/\/$/, '');
const CDOGS_URL = (process.env.CDOGS_URL || 'https://cdogs-dev.pathfinder.gov.bc.ca/api/v2').replace(/\/$/, '');
const CHES_URL = (process.env.CHES_URL || 'https://ches-dev.pathfinder.gov.bc.ca/api/v1').replace(/\/$/, '');

// Get token from DocGen SSO
function getToken() {
  // URL query string and config with headers
  const data = `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`;
  const config = {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  };
  // Return access token from response
  return new Promise((resolve, reject) => {
    axios
      .post(TOKEN_URL, data, config)
      .then((res) => resolve(res.data.access_token))
      .catch((err) => reject(err));
  });
}

// Return a completed document from a template and contexts
async function getDocument(contexts) {
  // Setup axios
  const token = await getToken();
  axios.defaults.headers.Authorization = `Bearer ${token}`;
  axios.defaults.baseURL = CDOGS_URL;

  // Read contexts and template (base64 encoded), use in CDOGS schema
  const template = base64.encode(fs.readFileSync(TEMPLATE, 'binary'));
  const fileExt = path.extname(FILE_NAME).replace(/^./, '');

  const bodyCDOGS = {
    data: contexts,
    options: {
      overwrite: true,
      reportName: FILE_NAME,
    },
    template: {
      content: template,
      encodingType: 'base64',
      fileType: fileExt,
    },
  };

  // Generate and save file using a template and contexts
  const config = { responseType: 'arraybuffer' };
  const file = await new Promise((resolve, reject) => {
    axios
      .post('/template/render', bodyCDOGS, config)
      .then((res) => resolve(res.data))
      .catch((err) => reject(err));
  });
  return file;
}

// Send a file by email
async function sendFile(file, recipient) {
  // Setup axios
  const token = await getToken();
  axios.defaults.headers.Authorization = `Bearer ${token}`;
  axios.defaults.baseURL = CHES_URL;

  // Payload
  const attachment = file.toString('base64');
  const bodyCHES = {
    attachments: [
      {
        content: attachment,
        encoding: 'base64',
        filename: FILE_NAME,
      },
    ],
    bodyType: 'html',
    body: 'Email message body',
    delayTS: '0',
    from: SENDER,
    subject: 'Email subject',
    to: [recipient],
  };

  // Send email
  const config = { responseType: 'arraybuffer' };
  await new Promise((resolve, reject) => {
    axios
      .post('/email', bodyCHES, config)
      .then((res) => resolve(res.statusText))
      .catch((err) => reject(err));
  });
}

// Create file from template and contexts, send by email
async function templateToEmail(contexts, recipient) {
  const file = await getDocument(contexts);
  await sendFile(file, recipient);
}

// Exports
exports.getDocument = getDocument;
exports.sendFile = sendFile;
exports.templateToEmail = templateToEmail;
