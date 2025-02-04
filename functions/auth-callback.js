

exports.handler = async (event) => {
 const params = new URLSearchParams(event.queryStringParameters);
 const client_id = params.get('client_id');
 const client_secret = params.get('client_secret');
 const token_url = params.get('token_url');
 const callback_url = params.get('callback_url');
 const code = params.get('code');

 const response = await fetch(token_url, {
 method: 'POST',
 headers: {
 'Content-Type': 'application/x-www-form-urlencoded'
 },
 body: new URLSearchParams({
 grant_type: 'authorization_code',
 code: code,
 redirect_uri: callback_url,
 client_id: client_id,
 client_secret: client_secret
 })
 });

 const data = await response.json();

 if (data.error) {
 return {
 statusCode: 400,
 body: JSON.stringify(data)
 };
 }

 const accessToken = data.access_token;

 return {
 statusCode: 302,
 headers: {
 'Set-Cookie': `access_token=${accessToken}; Path=/`,
 Location: '/form.html'
 }
 };
};