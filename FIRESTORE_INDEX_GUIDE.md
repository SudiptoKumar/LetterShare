# Creating Required Firestore Indexes

## About Firestore Indexes

Firebase Firestore requires composite indexes for queries that:
1. Filter on one or more fields and
2. Sort the results

In our application, we need a composite index for the comments collection to filter by `letterId` and sort by `createdAt`.

## How to Create the Required Index

### Option 1: Using the Link in the Error Message

1. When you see the warning in the comments section, click on the "Create Firestore Index" link.
2. This will take you directly to the Firebase Console with the index pre-configured.
3. Click "Create index" to confirm.
4. Wait for the index to finish building (this may take a few minutes).

### Option 2: Manual Creation

If the link doesn't work, you can create the index manually:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to Firestore Database
4. Click on the "Indexes" tab
5. Click "Add index"
6. Fill in the following details:
   - Collection ID: `comments`
   - Fields to index:
     - Field path: `letterId`, Order: `Ascending`
     - Field path: `createdAt`, Order: `Ascending`
   - Query scope: `Collection`
7. Click "Create"

## After Creating the Index

After creating the index, it may take a few minutes for it to become active. Once the index is built:

1. Refresh the page
2. The warning message should disappear
3. Comments will be properly sorted by creation time
