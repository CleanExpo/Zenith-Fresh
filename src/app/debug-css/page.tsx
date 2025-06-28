export default function DebugCSS() {
  return (
    <html>
      <head>
        <title>Debug CSS Test</title>
        <style>{`
          body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          }
          .title {
            color: #333;
            font-size: 2em;
            margin-bottom: 20px;
            text-align: center;
          }
          .test-box {
            background: #f0f9ff;
            border: 2px solid #0ea5e9;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .success {
            background: #dcfce7;
            border-color: #16a34a;
            color: #166534;
            font-weight: bold;
            text-align: center;
            padding: 15px;
            border-radius: 8px;
            margin-top: 30px;
          }
          .bounce {
            width: 50px;
            height: 50px;
            background: #ef4444;
            border-radius: 50%;
            margin: 20px auto;
            animation: bounce 1s infinite;
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <h1 className="title">🎨 CSS Debug Test</h1>
          
          <div className="test-box">
            <h2>Inline CSS Test</h2>
            <p>This page uses inline CSS to test if styling works at all.</p>
            <div className="bounce"></div>
            <p>You should see a red bouncing circle above.</p>
          </div>

          <div className="test-box">
            <h2>Layout Test</h2>
            <p>This should be in a blue-bordered box with light blue background.</p>
          </div>

          <div className="success">
            ✅ If you can see proper styling, colors, borders, shadows, and animation, 
            then the issue is specifically with Tailwind CSS loading!
          </div>
        </div>
      </body>
    </html>
  );
}