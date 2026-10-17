# Contributing

1. Read [prd.md](./prd.md) before adding a screen or a dependency.  
2. Implement the next open Must-have in §10.1, in slice order from §16.  
3. Do not add auth, a database, or a second UI kit for the hackathon slice.  
4. Do not call real phone numbers from a shared environment without the parent’s consent.  
5. Keep copy specific. No lorem, no “Welcome to your app.”  
6. After UI work, walk the flow on desktop and a narrow viewport.

```bash
npm install
npm run dev      # http://127.0.0.1:43147
npm run lint
```

New env vars belong in `.env.example` with a comment.
