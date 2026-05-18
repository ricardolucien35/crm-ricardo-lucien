export default async function handler(req, res) {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER = 'michael9549';
  const REPO_NAME = 'crm-data';
  const LEADS_FILE = 'leads.json';

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${LEADS_FILE}`,
        {
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (response.status === 404) {
        return res.status(200).json({ leads: [], sha: '' });
      }

      if (!response.ok) {
        return res.status(500).json({ error: 'Failed to fetch from GitHub' });
      }

      const data = await response.json();
      const content = JSON.parse(Buffer.from(data.content, 'base64').toString());
      return res.status(200).json({ leads: content.leads || [], sha: data.sha });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { leads, sha } = req.body;
      const content = Buffer.from(JSON.stringify({ leads, lastUpdated: new Date().toISOString() }, null, 2)).toString('base64');
      
      const response = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${LEADS_FILE}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: 'Update leads',
            content,
            sha: sha || undefined
          })
        }
      );

      if (!response.ok) {
        return res.status(500).json({ error: 'Failed to save to GitHub' });
      }

      const data = await response.json();
      return res.status(200).json({ sha: data.content.sha });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}