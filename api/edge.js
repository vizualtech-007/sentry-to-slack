 export const config = {
    runtime: 'edge',
  }

  const sendMessage = async (channel, {level, formatted, environment, email, title, culprit, project, url}) => {
    console.info({channel, level, formatted, environment, email, title, culprit, project});

    const isError = level === "error";
    const blocks = [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `${isError ? ":red_circle:" : ""} *${title}*`
        }
      },
      {
        "type": "section",
        "fields": [
          {
            "type": "mrkdwn",
            "text": `*Environment:*\n${environment}`
          },
          {
            "type": "mrkdwn",
            "text": `*Level:*\n${level}`
          },
          {
            "type": "mrkdwn",
            "text": `*Project:*\n${project}`
          }
        ]
      },
      {
        "type": "section",
        "fields": [
          {
            "type": "mrkdwn",
            "text": `*User:*\n${email}`
          }
        ]
      },
      {
        "type": "divider"
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `*Message:*\n${formatted}`
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `*Culprit:*\n${culprit}`
        }
      },
      {
        "type": "context",
        "elements": [
          {
            "type": "mrkdwn",
            "text": `<${url}|View in Sentry>`
          }
        ]
      }
    ];

    try {
      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${process.env.SLACK_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          channel,
          blocks,
        }),
      });

      const result = await response.json();
      console.log('Slack API response:', JSON.stringify(result));
      return result;
    } catch(e) {
      console.error('Slack error:', e);
    }
  }

  export default async (req) => {
    const body = await req.json();
    console.log('Received payload:', JSON.stringify(body));

    // Sentry Internal Integration sends data under body.data.event
    const event = body?.data?.event || {};

    // Extract fields from Sentry payload
    const level = event.level || 'error';
    const formatted = event.logentry?.formatted || event.message || 'No message';
    const email = event.user?.email || 'N/A';
    const environment = event.environment || 'production';
    const title = event.title || event.metadata?.title || 'Error';
    const culprit = event.culprit || event.metadata?.filename || 'N/A';
    const url = event.web_url || 'https://sentry.io';

    // Extract project name from web_url
    // URL: https://sentry.io/organizations/mizual/issues/123/events/456/
    const urlParts = url.split('/');
    const projectIndex = urlParts.indexOf('organizations');
    const project = projectIndex !== -1 ? urlParts[projectIndex + 1] : 'unknown';

    await sendMessage(process.env.CHANNEL_ID, {level, formatted, environment, email, title, culprit, project, url});

    return new Response('OK');
  }
