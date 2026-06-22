# AcmeHire: Candidate Momentum Platform

A full-stack, AI-powered Applicant Tracking System (ATS) and candidate portal. This platform allows recruiters to seamlessly manage roles, review applications, and automatically generate and evaluate candidate coding assessments using AI.

## 🚀 Tech Stack

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: TailwindCSS
- **Routing**: React Router DOM
- **Authentication**: Stytch (B2B Magic Links & OTP)

### Backend & Infrastructure
- **Server**: Node.js & Express
- **AI Integration**: Groq API (Llama 3) for dynamic technical test generation
- **Local AWS Emulation**: Floci (Docker container)
- **Database**: AWS DynamoDB (running locally via Floci)
- **Serverless**: AWS Lambda (running locally via Floci)
- **SDK**: AWS SDK v3 (`@aws-sdk/client-dynamodb`, `@aws-sdk/client-lambda`)

---

## 🛠️ Local Development Setup

To run this application locally, you will need **Node.js** and **Docker Desktop** installed.

### 1. Start the AWS Emulator (Floci)
We use Floci to emulate AWS DynamoDB and AWS Lambda locally.
Make sure Docker Desktop is open and running, then execute:
```bash
docker-compose up -d
```
This spins up the Floci emulator on port `4566`.

### 2. Environment Variables
Create a `.env` file inside the `local-proxy` directory with your secrets:
```env
VITE_AI_API_KEY=your_groq_api_key
PORT=3001
STYTCH_PROJECT_ID=your_stytch_project_id
STYTCH_SECRET=your_stytch_secret
```

### 3. Deploy the Database & Serverless Functions
Navigate into the `local-proxy` directory and run the initialization script. 
This script automatically creates the DynamoDB tables (`Candidates`, `Roles`, `Recruiters`), zips the AI generation logic into a deployment package, and deploys it as an AWS Lambda function:
```bash
cd local-proxy
npm install
node init-floci.js
```
*(Optional) To seed an initial Admin recruiter account, run:*
```bash
node seedRecruiter.js your_email@example.com
```

### 4. Start the Backend Server
Inside the `local-proxy` directory, start the Node Express server:
```bash
node server.js
```
*The proxy will run on http://localhost:3001*

### 5. Start the Frontend
In a separate terminal, navigate to the `candidate-portal` directory:
```bash
cd candidate-portal
npm install
npm run dev
```
*The app will run on http://localhost:5173*

---

## ✨ Features

- **Recruiter Dashboard**: View all candidates in a Kanban-style pipeline based on their ATS stage (Applied -> Test Enabled -> Test Completed -> Interview -> Hired).
- **Role Management**: Add, modify, and delete active job postings.
- **Serverless AI Assessments**: When a recruiter enables a test, an AWS Lambda function queries the Groq API to generate a personalized, role-specific technical assessment (10 MCQs + 1 DSA question).
- **Candidate Portal**: Candidates log in securely via OTP, apply for roles, and complete their integrated AI-generated assessments in a built-in code editor.
