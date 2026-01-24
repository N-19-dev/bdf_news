// Base64 encode (btoa equivalent for React Native)
function btoa(input: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  for (let i = 0; i < input.length; i += 3) {
    const a = input.charCodeAt(i);
    const b = input.charCodeAt(i + 1) || 0;
    const c = input.charCodeAt(i + 2) || 0;

    const index1 = a >> 2;
    const index2 = ((a & 3) << 4) | (b >> 4);
    const index3 = ((b & 15) << 2) | (c >> 6);
    const index4 = c & 63;

    output += chars[index1] + chars[index2];
    output += i + 1 < input.length ? chars[index3] : '=';
    output += i + 2 < input.length ? chars[index4] : '=';
  }
  return output;
}

// Generate article ID - must match web app algorithm
export function generateArticleId(url: string, title: string): string {
  const str = `${url}${title}`;
  return btoa(str).slice(0, 40);
}
