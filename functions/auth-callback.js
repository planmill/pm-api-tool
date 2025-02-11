exports.handler = async (event) => {
    // Get stored values from cookies
    const cookies = parseCookies(event.headers.cookie || '');
    const client_id = cookies.client_id;
    const client_secret = cookies.client_secret;
    const token_url = cookies.token_url;
    const callback_url = cookies.callback_url;
    const code = event.queryStringParameters.code;

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

    // Clear the temporary cookies and set the access token
    return {
        statusCode: 302,
        headers: {
            'Set-Cookie': [
                `access_token=${accessToken}; Path=/; HttpOnly; Secure; SameSite=Lax`,
                'client_id=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
                'client_secret=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
                'token_url=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
                'callback_url=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
            ].join(', '),
            Location: '/form.html'
        }
    };
};

function parseCookies(cookieString) {
    return cookieString.split(';')
        .map(pair => pair.trim().split('='))
        .reduce((acc, [key, value]) => ({
            ...acc,
            [key]: decodeURIComponent(value)
        }), {});
}