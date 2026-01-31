# MisterLister
<p align="center">
  <a href="https://ml.toolyard.app" target="_blank" rel="noopener noreferrer">
    <img width="180" src="https://ml.toolyard.app/logo.png" alt="Vite logo">
  </a>
  
</p>
<p align="center" style="font-size: 50px;">
  <a href="https://ml.toolyard.app" style="color: rgb(209, 203, 43);" target="_blank" rel="noopener noreferrer">MisterLister</a>
</p>
MisterLister is a minimalistic progressive web app (PWA) to collaboratively manage lists. 
List data is end-to-end encrypted with the master list key stored only on user devices.
The app works offline and syncs changes when back online.
Potential merge conflicts from offline editing are resolved automatically by the server.
  
MisterLister has no user accounts - users are identified only by a chosen pseudonym that must not be unique.
The app also features no access control - anyone who knows the list ID can edit the list.

If you regularly use MisterLister make sure to install it (instructions vary by browser).
This will ensure that the browser does not randomly clear the app data when storage space is needed. Also **make sure to back up your list keys** (there is a button on the home screen) - if you lose them I cannot help you recover your data as I do not have access to it.

**IMPORTANT**:
If you clear your browser data (cookies, local storage etc.) you will lose access to your lists as the list keys and encryption keys are stored only in your browser's local storage! 
If your have a backup of your list keys you can easily regain access to your list by using the *import master keyfile* button on the home screen. 
If you do not have a backup of your list keys you can ask other collaborators to export the list key for you. 
If there are no other collaboratos you just lost your list data.

# Roadmap
- Implement auto sync and notifications using PUSH api

