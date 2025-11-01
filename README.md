 # Pomotica

A simple Pomodoro timer that helps you focus and tracks your progress through Habitica.

## What is this?

Pomotica is a minimal timer app for the Pomodoro Technique (25 minutes of work, 5 minute breaks). It runs in your browser and saves your completed sessions. If you use Habitica, it can automatically update your habits when you finish a work session.

## Features

- 25/5 minute work/break cycles   
- Browser notifications when time is up   
- Optional alarm sound (you'll need to add your own `alarm.mp3` file)   
- Tracks completed sessions by date   
- Export and import your session data   
- Connects to Habitica to score habits automatically   

## How to use

1. Download all files to a folder   
2. Add an `alarm.mp3` file if you want sound notifications   
3. Open `index.html` in your browser   
4. Click Start to begin a session   

That's it. The timer will track your sessions automatically.   

## Habitica setup (optional)

If you use Habitica:   
   
1. Go to Habitica Settings > API   
2. Copy your User ID and API Token   
3. Paste them into the Habitica section in Pomotica   
4. Click "Check" to see your habits   
5. Copy the ID of the habit you want to score   
6. Paste it in the Task ID field   
7. Click Save   

Now every time you complete a work session, Pomotica will score that habit for you.   

## Exporting your data

Click "Export" to download a backup file of your sessions. You can import it later if you switch browsers or want to restore your data.   

## Privacy

Everything stays on your device. Your Habitica credentials are stored in your browser's local storage. No data is sent anywhere except to Habitica's API (if you set it up).   

## Requirements

- A modern web browser   
- Permission to show notifications (the browser will ask)   
- An `alarm.mp3` file if you want sound alerts   

## Technical notes

Built with vanilla HTML, CSS, and JavaScript. No frameworks or build tools needed. The starfield background is a canvas animation that runs continuously.   