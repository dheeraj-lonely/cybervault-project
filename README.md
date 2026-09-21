# CyberVault

CyberVault is a digital-forensics learning simulator built for beginners who need a realistic but safe way to practice investigation workflows.

## Problem statement

Learning digital forensics is difficult for beginners because real investigations involve complex tools, large amounts of evidence, and strict procedures. Students often learn forensic concepts theoretically without the chance to practice the process of collecting, organizing, examining, and documenting digital evidence in a controlled environment.

CyberVault creates fictional investigation cases and uses simulated evidence such as files, timestamps, messages, access logs, and browser history. Students act as investigators, connect relevant information, determine the sequence of events, and prepare a final investigation report. No real devices, accounts, or private data are accessed.

## Tech stack

- Frontend: HTML + CSS + JavaScript + Bootstrap
- Backend: Python + Flask
- Database: SQLite + SQLAlchemy
- Visualization: JavaScript + Chart.js
- Reports: Python

## Project features

- Case-based digital forensics simulator
- Evidence dashboard with timeline and artifact details
- SQLite-backed evidence and report storage
- Chat assistant for guided investigation questions
- Course recommendation engine for beginner to advanced learning paths
- Final report generation with Python logic

## Run locally

1. Open the project folder.
2. Create and activate a virtual environment if needed.
3. Install dependencies:
   pip install -r requirements.txt
4. Start the app:
   python app.py
5. Open the browser at:
   http://127.0.0.1:5000

## Main files

- app.py — Flask app and database models
- templates/index.html — main simulator landing page
- templates/courses.html — training catalog page
- static/css/styles.css — visual design and dashboard layout
- static/js/game.js — front-end case interactions and chart logic
