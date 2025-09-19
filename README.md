# Student Task Manager
Our project will be to create a task management website for groups. It will have a website that shows tasks, deadlines, and assignees, and the website will have a “chatbot” so you can tell it to add new tasks (not with ChatGPT or an LLM, we will write our own algorithm to parse text). The raspberry pi will host the website and also contain a database and an API for adding, viewing, and changing tasks.

## Methods and Tools
* We will be hosting the website on a raspberry pi. 
* It will run an API using python/flask and a frontend that uses HTML/CSS/Javascript. 
* We will use gunicorn and nginx to serve the website and sqlite for the database
* The chatbot will be written using a combination of javascript and python (probably no third-party packages)

## Test Plan:
**A. Login and Accounts:**
  * Can create account
  * Can log in / log out
  * Wrong password rejected
  
**B. Tasks:**
  * Add a task (title, deadline, assignee)
  * View a task
  * Edit a task
  * Delete a task
  
**C. Chatbot:**
  * Add task via chatbot command
  * Invalid input handled gracefully
  
**D. API:**
  * POST /tasks adds a task
  * GET /tasks lists tasks
  * PUT /tasks/:id updates a task
  * DELETE /tasks/:id removes a task
  
**E. Frontend & UI**
  * Website loads on desktop & mobile browser
  * Tasks display correctly with deadline & assignee
  * Pages load in < 2 seconds on Raspberry Pi LAN
  
**F. Raspberry Pi Hosting**
  * Website starts after Pi reboot
  * Gunicorn + nginx serving correctly
  * Database stores tasks persistently
## Project Timeline:
* Week 37: Finalize idea ✅
* Week 38: Simple prototype for website + api (log in, add a task, view a task)
* Week 39: Finalize database and authentication API, chatbot prototype
* Week 40: Finalize webpages and web functionality, finalize chatbot, start presentation
* Week 41: Internal testing, draft final report, finalize presentation
* Week 42: Deployment, practice + present Presentation, finalize report
