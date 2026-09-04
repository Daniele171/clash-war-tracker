// cr-api.ts

const CR_API_URL = 'https://proxy.royaleapi.dev/v1';

async function fetchCR(endpoint: string, allow404 = false) {
  const token = process.env.CR_API_KEY;
  if (!token) throw new Error('CR_API_KEY is not defined in environment variables');

  const url = `${CR_API_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    if (response.status === 403) throw new Error('CR API 403: Invalid Token or IP not whitelisted');
    if (response.status === 404) {
      if (allow404) return null;
      throw new Error('CR API 404: Not Found (check clan tag)');
    }
    throw new Error(`CR API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function formatTag(tag: string) {
  if (!tag) return '';
  const cleanTag = tag.toUpperCase().replace(/O/g, '0');
  return cleanTag.startsWith('#') ? cleanTag : `#${cleanTag}`;
}

export async function getClanInfo(tag: string) {
  const formattedTag = encodeURIComponent(formatTag(tag));
  return fetchCR(`/clans/${formattedTag}`);
}

export async function getClanMembers(tag: string) {
  const formattedTag = encodeURIComponent(formatTag(tag));
  return fetchCR(`/clans/${formattedTag}/members`);
}

export async function getCurrentRiverRace(tag: string) {
  const formattedTag = encodeURIComponent(formatTag(tag));
  // Pass true to allow404 so we don't crash if the clan is currently not in a war
  return fetchCR(`/clans/${formattedTag}/currentriverrace`, true);
}

export async function getRiverRaceLog(tag: string) {
  const formattedTag = encodeURIComponent(formatTag(tag));
  return fetchCR(`/clans/${formattedTag}/riverracelog?limit=20`, true);
}
