# Setting Up Firebase Security Rules

To fix the "Missing or insufficient permissions" error, you need to deploy the Firestore security rules.

## Option 1: Using the Firebase Console

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to Firestore Database
4. Click on the "Rules" tab
5. Replace the existing rules with the content from the `firestore.rules` file
6. Click "Publish"

## Option 2: Using Firebase CLI

1. Install the Firebase CLI if you haven't already:
