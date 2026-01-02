  export const config = {
    runtime: 'edge',
  }

  const sendMessage = async (channel, {level, formatted, environment, email, title, culprit, project}) => {
    console.info({channel, level, formatted, environment, email, title, culprit, project});

    const isError = level === "error";
    const blocks = [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `${isError ? ":red_circle:" : ""} *${title || 'Unknown Error'}*`
        }
      },
      {
        "type": "section",
        "fields": [
          {
            "type": "mrkdwn",
            "text": `*Environment:*\n${environment || 'N/A'}`
          },
          {
            "type": "mrkdwn",
            "text": `*Level:*\n${level || 'N/A'}`
          },
          {
            "type": "mrkdwn",
            "text": `*Project:*\n${project || 'N/A'}`
          }
        ]
      },
      {
        "type": "section",
        "fields": [
          {
            "type": "mrkdwn",
            "text": `*User:*\n${email || 'N/A'}`
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
          "text": `*Message:*\n${formatted || 'No message'}`
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `*Culprit:*\n${culprit || 'N/A'}`
        }
      },
      {
        "type": "divider"
      },
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

    // Handle Sentry Internal Integration webhook format
    // Payload is nested under data.event
    const event = body?.data?.event || body?.event || {};

    const level = event.level || 'error';
    const formatted = event.logentry?.formatted || event.message || 'No message';
    const email = event.user?.email || 'N/A';
    const environment = event.environment || event.tags?.find(t => t[0] === 'environment')?.[1] || 'N/A';
    const title = event.metadata?.title || event.title || 'Unknown Error';
    const culprit = event.culprit || 'N/A';
    const project = body?.data?.triggered_rule || event.project || 'Unknown Project';

    await sendMessage(process.env.CHANNEL_ID, {level, formatted, environment, email, title, culprit, project});

    return new Response(`OK`);
  }
