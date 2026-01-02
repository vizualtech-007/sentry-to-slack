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

    const {
      project,
      culprit,
      event: {
        level,
        logentry: { formatted },
        user: { email },
        environment,
        metadata: { title }
      }
    } = body;

    await sendMessage(process.env.CHANNEL_ID, {level, formatted, environment, email, title, culprit, project});

    return new Response(`Hello from Edge.js!`);
  }
