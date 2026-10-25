export async function onRequest(context) {
  const auth = context.request.headers.get('Authorization');

  // Request credentials from the browser
  if (!auth) {
    return new Response('Authentication required', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="StoneSMP Admin"' },
    });
  }

  // Decode the Base64 input credentials
  const [scheme, encoded] = auth.split(' ');
  if (scheme !== 'Basic' || !encoded) {
    return new Response('Invalid header', { status: 400 });
  }

  const [username, password] = atob(encoded).split(':');

  // Fetch passcode from Cloudflare Environment Variables (hidden from frontend code)
  const SECRET_PASSCODE = context.env.ADMIN_PASSCODE;

  if (password === SECRET_PASSCODE) {
    return await context.next(); // Access granted
  }

  return new Response('Unauthorized passcode', { status: 401 });
}
