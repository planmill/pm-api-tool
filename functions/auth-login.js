exports.handler = async (event) => {
    const params = new URLSearchParams(event.body);
    const client_id = params.get('client_id');
    const client_secret = params.get('client_secret');
    const authorization_url = params.get('authorization_url');
    const token_url = params.get('token_url');
    const callback_url = params.get('callback_url');
   
    const authorizationRedirectUrl = `${authorization_url}?client_id=${client_id}&redirect_uri=${callback_url}&response_type=code`;
   
    return {
    statusCode: 302,
    headers: {
    Location: authorizationRedirectUrl
    }
    };
   };