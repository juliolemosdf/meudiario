import * as FileSystem from 'expo-file-system';

export const generateHTMLContent = async (messages) => {
  let content = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f3f2ef;
          }
          .timeline {
            position: relative;
            padding-left: 30px;
          }
          .timeline::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 2px;
            background: #0a66c2;
          }
          .message {
            background: white;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
            position: relative;
          }
          .message::before {
            content: '';
            position: absolute;
            left: -34px;
            top: 20px;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #0a66c2;
            border: 2px solid white;
          }
          .image {
            text-align: center;
            margin-bottom: 10px;
          }
          .image img {
            max-width: 100%;
            height: auto;
            border-radius: 4px;
          }
          .caption {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
          }
          .timestamp {
            font-size: 12px;
            color: #0a66c2;
            margin-top: 10px;
          }
          h1 {
            text-align: center;
            color: #0a66c2;
          }
        </style>
      </head>
      <body>
        <h1>Relatório de Chat</h1>
        <div class="timeline">
  `;

  let imageCounter = 1;

  for (const msg of messages) {
    content += `<div class="message">`;

    if (msg.text && !msg.image && !msg.video) {
      content += `<p>${msg.text}</p>`;
    }

    if (msg.image) {
      try {
        const base64Image = await FileSystem.readAsStringAsync(msg.image, {
          encoding: FileSystem.EncodingType.Base64,
        });
        content += `
          <div class="image">
            <img src="data:image/png;base64,${base64Image}" alt="Figura ${imageCounter}" />
          </div>
        `;
        if (msg.text) {
          content += `<div class="caption">Figura ${imageCounter} - ${msg.text}</div>`;
        } else {
          content += `<div class="caption">Figura ${imageCounter}</div>`;
        }
        imageCounter++;
      } catch (error) {
        console.error('Error reading image file:', error);
      }
    }

    if (msg.video) {
      content += `<p>[Vídeo não suportado na visualização do relatório]</p>`;
      if (msg.text) {
        content += `<div class="caption">Vídeo - ${msg.text}</div>`;
      }
    }

    content += `<div class="timestamp">${new Date(msg.createdAt).toLocaleString()}</div></div>`;
  }

  content += '</div></body></html>';
  return content;
};