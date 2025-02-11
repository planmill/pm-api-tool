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
            Location: authorizationRedirectUrl,
            // Store these values in cookies for the callback
            'Set-Cookie': [
                `client_id=${client_id}; Path=/; HttpOnly; Secure; SameSite=Lax`,
                `client_secret=${client_secret}; Path=/; HttpOnly; Secure; SameSite=Lax`,
                `token_url=${token_url}; Path=/; HttpOnly; Secure; SameSite=Lax`,
                `callback_url=${callback_url}; Path=/; HttpOnly; Secure; SameSite=Lax`
            ].join(', ')
        }
    };
};