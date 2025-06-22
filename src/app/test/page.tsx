export default function TestPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>🎯 Platform Test Page</h1>
      <p>✅ Next.js is working</p>
      <p>✅ React is working</p>
      <p>✅ TypeScript is working</p>
      <p>Environment: {process.env.NODE_ENV}</p>
      <p>Time: {new Date().toISOString()}</p>
    </div>
  );
}
