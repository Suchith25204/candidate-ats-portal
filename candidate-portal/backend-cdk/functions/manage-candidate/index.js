const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");

// Initialize the DynamoDB Client
const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  // AppSync routes different requests using the "fieldName"
  const fieldName = event.info.fieldName;

  // --- ACTION 1: CREATE A CANDIDATE ---
  if (fieldName === "createCandidate") {
    const { name, role } = event.arguments; 
    
    // Generate unique credentials
    const username = name.toLowerCase().replace(/\s+/g, '_') + Math.floor(Math.random() * 1000);
    const password = Math.random().toString(36).slice(-8);
    
    const candidateItem = {
      username: username,
      password: password,
      name: name,
      role: role,
      stage: "Applied",
      hasPendingTest: true,
      uniqueQuestions: null
    };

    // Save directly to DynamoDB
    await docClient.send(new PutCommand({
      TableName: process.env.CANDIDATES_TABLE,
      Item: candidateItem
    }));

    console.log(`Created candidate: ${username}`);
    return candidateItem;
  }

  // --- ACTION 2: SAVE AI GENERATED QUESTIONS ---
  if (fieldName === "saveQuestions") {
    const { username, generatedQuestions } = event.arguments;

    const params = {
      TableName: process.env.CANDIDATES_TABLE,
      Key: { username: username },
      UpdateExpression: "SET uniqueQuestions = :q",
      ExpressionAttributeValues: {
        ":q": generatedQuestions
      },
      ReturnValues: "ALL_NEW"
    };

    const response = await docClient.send(new UpdateCommand(params));
    return response.Attributes;
  }

  throw new Error(`Unknown GraphQL field: ${fieldName}`);
};
