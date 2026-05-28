# AI-Based Face Recognition Attendance System
A web-based attendance management system that uses facial 
recognition to automate the attendance process. Built as a 
final year major project. Currently running on localhost 
and being prepared for production deployment.

## Problem It Solves
Manual attendance in institutions is time-consuming, 
error-prone, and easy to manipulate. This system replaces 
it with real-time facial recognition, ensuring accuracy, 
preventing proxy attendance, and maintaining clean records 
automatically.

## Key Features
- Real-time face recognition using OpenCV and face_recognition library
- Liveness detection — rejects photos, accepts only live faces
- QR code-based attendance as an alternative method
- Session-based attendance with time-bound access
- Three fully functional modules: Admin, Teacher, and Student
- Automated attendance records stored in MySQL database
- Alert system for unrecognised or mismatched faces

## My Contributions
- Researched and defined the complete system architecture 
  and optimal workflow
- Assisted in backend development using Django and Python
- Conducted testing and review cycles across all three modules
- Identified and suggested optimisation strategies for 
  recognition accuracy and system performance
- Coordinated project progress tracking

## Tech Stack
| Layer         | Technology                              |
|---------------|-----------------------------------------|
| Frontend      | HTML, CSS, JavaScript, Node.js          |
| Backend       | Python, Django                          |
| AI / Vision   | OpenCV, TensorFlow, face_recognition    |
| Database      | MySQL (MySQL Workbench)                 |
| Auth          | Session-based + QR Code                 |

## System Modules
**Admin** — Manages users, registers faces, views all records  
**Teacher** — Starts sessions, monitors attendance in real time  
**Student** — Views personal attendance history and alerts

## How to Run (Local)
1. Clone this repository
   git clone https://github.com/yourusername/ai-face-attendance
2. Install Python dependencies
   pip install -r requirements.txt
3. Set up MySQL database and update settings.py with credentials
4. Run migrations
   python manage.py migrate
5. Start the server
   python manage.py runserver

## Screenshots
<img width="1505" height="687" alt="Screenshot 2026-05-28 173826" src="https://github.com/user-attachments/assets/ffbaf9b3-0e57-4a6e-a594-52c66291dcff" />
<img width="1504" height="746" alt="Screenshot 2026-05-28 173901" src="https://github.com/user-attachments/assets/927c2b85-dcf6-494b-9ebc-655984f38047" />
<img width="1492" height="633" alt="Screenshot 2026-05-28 174003" src="https://github.com/user-attachments/assets/ad2add3a-f4d9-4ab4-86b6-0998243367e8" />
<img width="1501" height="714" alt="Screenshot 2026-05-28 174013" src="https://github.com/user-attachments/assets/a425c22e-8569-42cb-804c-cb4443f6d46a" />
<img width="1501" height="736" alt="Screenshot 2026-05-28 174053" src="https://github.com/user-attachments/assets/3cee4624-7451-45eb-a749-2cb61f03471e" />
<img width="1508" height="795" alt="Screenshot 2026-05-28 174108" src="https://github.com/user-attachments/assets/28c9c653-4b00-43a9-88aa-8e84a0ebe51b" />


## Status
In Development — Core features complete, 
production deployment in progress.
