

exports.handler = async (event) => {
 const params = new URLSearchParams(event.queryStringParameters);
 const url = params.get('url');
 const method = params.get('method');
 const cookies = event.headers.cookie || '';
 const accessToken = cookies.split('access_token=')[1]?.split(';')[0];

 if (!accessToken) {
 return {
 statusCode: 401,
 body: JSON.stringify({ error: 'Unauthorized' })
 };
 }

 const options = {
 method: method,
 headers: {
 'Authorization': `Bearer ${accessToken}`,
 'Content-Type': 'application/json'
 }
 };

 if (method === 'POST' || method === 'DELETE') {
 options.body = JSON.stringify({});
 }

 try {
 const response = await fetch(url, options);
 const data = await response.json();
 return {
 statusCode: 200,
 headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type'
 },
 body: JSON.stringify(data)
 };
 } catch (err) {
 return {
 statusCode: 500,
 body: JSON.stringify({ error: err.message })
 };
 }
};