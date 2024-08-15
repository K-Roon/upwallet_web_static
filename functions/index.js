const functions = require('firebase-functions');
const express = require('express');
const bodyParser = require('body-parser');
const Passkit = require('passkit-generator');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/create-pass', async (req, res) => {
  const { number } = req.body;

  const template = path.join(__dirname, 'passTemplate', 'pass.json');
  const pass = await Passkit.from.template(template);

  pass.setHeaderField('number', {
    label: 'Number',
    value: number,
  });

  const wwdr = fs.readFileSync(path.join(__dirname, 'certs', 'WWDR.pem'));
  const signerCert = fs.readFileSync(path.join(__dirname, 'certs', 'signerCert.pem'));
  const signerKey = fs.readFileSync(path.join(__dirname, 'certs', 'signerKey.pem'));

  pass.sign(signerCert, signerKey, 'your-passphrase', wwdr);

  const passBuffer = await pass.asBuffer();

  res.set({
    'Content-Type': 'application/vnd.apple.pkpass',
    'Content-Disposition': `attachment; filename=pass.pkpass`,
  });
  res.send(passBuffer);
});

exports.createPass = functions.https.onRequest(app);
