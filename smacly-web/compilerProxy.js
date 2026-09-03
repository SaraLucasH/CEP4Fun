const http = require('http');
const https = require('https');
const { URL } = require('url');

const COMPILADOR_URL = process.env.COMPILADOR_URL || 'http://localhost:8080';

function rawRequest(targetUrl, { method = 'GET', headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(targetUrl);
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.request(parsed, { method, headers }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks).toString('utf8')
        });
      });
    });
    req.on('error', reject);
    if (body != null) {
      req.write(body);
    }
    req.end();
  });
}

/*
Inicia sesión contra el backend Java (Spring Security, login por formulario) con las
credenciales de un usuario real de smacly-web y devuelve la cookie de sesión (JSESSIONID)
que hay que reenviar en las siguientes llamadas a /api/** en nombre de ese usuario.
*/
async function login(username, password) {
  const params = new URLSearchParams();
  params.set('username', username);
  params.set('password', password);
  const body = params.toString();

  const response = await rawRequest(`${COMPILADOR_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body)
    },
    body
  });

  const setCookie = response.headers['set-cookie'];
  const location = response.headers['location'] || '';
  const failed = !setCookie || location.includes('error=true') || location.includes('loginSmaCly');

  if (failed) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    throw error;
  }

  return setCookie.map((c) => c.split(';')[0]).join('; ');
}

/*
Llama a un endpoint /api/** del compilador con la cookie de sesión de un usuario ya
autenticado (ver login()). No reintenta: si la sesión caducó, el llamador (server.js)
debe capturar el 401/302 y mandar al usuario de vuelta a /login.
*/
async function call(cookie, method, pathName, payload) {
  const headers = { Cookie: cookie };
  let body;
  if (payload !== undefined) {
    body = JSON.stringify(payload);
    headers['Content-Type'] = 'application/json';
    headers['Content-Length'] = Buffer.byteLength(body);
  }

  const response = await rawRequest(`${COMPILADOR_URL}${pathName}`, { method, headers, body });

  if (response.status === 302 || response.status === 401 || response.status === 403) {
    const error = new Error('Session expired or not authorized');
    error.status = response.status === 302 ? 401 : response.status;
    throw error;
  }

  let data = null;
  if (response.body) {
    try {
      data = JSON.parse(response.body);
    } catch (error) {
      const parseError = new Error('Invalid response from compilador service (HTTP ' + response.status + ')');
      parseError.status = 502;
      throw parseError;
    }
  }

  if (response.status < 200 || response.status >= 300) {
    const message = (data && (data.mensaje || data.message)) || ('HTTP ' + response.status);
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

module.exports = { login, call };
