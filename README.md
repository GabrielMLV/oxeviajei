# OxeViajei - Full Project (with payments & image upload)

Features:
- React + TypeScript + Vite
- Firebase Auth (Email/Password + Google)
- Firestore: viagens -> contas -> pagamentos
- Upload de comprovante (Firebase Storage)
- Bootstrap for styling
- Private routes, navbar hidden until login

Setup:
1. Edit `src/firebaseConfig.ts` with your Firebase config and enable Storage.
2. Run:
   npm install
   npm run dev
3. Open http://localhost:5173

Notes:
- To make a user admin, set a custom claim `admin=true` via Firebase Admin SDK.
- Storage rules should allow upload for authenticated users.
