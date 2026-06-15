"# Prodesk-IT-Sprint-2" 
# Cash-Flow: Engineering & Logic Module

A high-performance Salary and Expense Tracker built with pure Vanilla JavaScript. This project focuses on manual DOM manipulation, state management, and data persistence without the use of modern abstraction frameworks.

##  Engineering Objectives
*   **State Management:** Implemented a single-source-of-truth state architecture.
*   **DOM Manipulation:** Manual interface updates using the `document` API.
*   **Persistence:** JSON serialization for LocalStorage state retention.
*   **Visualization:** Dynamic data mapping using the Chart.js library.
*   **API Integration:** Real-time currency conversion via external fetch calls.

## 🛠️ Technical Stack
*   **Logic:** Vanilla JavaScript (ES6+)
*   **Styling:** Tailwind CSS (via CDN)
*   **Graphs:** Chart.js
*   **Icons:** FontAwesome
*   **API:** Frankfurter (Exchange Rate Data)

## 📋 Features implemented
*   **Phase 1 (Base MVP):** Total salary input, expense logging, and real-time calculation of remaining balance.
*   **Phase 2 (Persistence):** Full data retention across browser reloads and manual delete operations for ledger entries.
*   **Phase 3 (Logic & Alerts):** 
    *   **Threshold Detection:** Automated UI trigger (Red State) when balance drops below 10%.
    *   **Currency Toggle:** Real-time state conversion between INR and USD.
   
## 🔧 Core Logic Architecture
The application follows a **Unidirectional Data Flow**:
1.  **Capture:** Inputs are parsed into numbers and validated.
2.  **State Update:** The global `state` object and `localStorage` are updated.
3.  **Synchronize:** The `synchronizeDOM()` function clears the current view and rebuilds the UI from the fresh state.
4.  **Visualize:** The Chart.js instance is destroyed and re-rendered to prevent canvas ghosting.
