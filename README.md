# HousePlan Helper

**HousePlan Helper** is an interactive web application designed to help users measure, plan, and furnish house plans directly in the browser. Upload any floor plan image, calibrate the scale using a known distance, and start planning your space with precision.

## Key Features

- **📏 Auto Ruler & Calibration:** accurate measurements by drawing a reference line over a known distance (e.g., a door or scale bar).
- **📐 Area Calculator:** Calculate room areas in square meters or feet by drawing polygons.
- **🛋️ Furniture Planner:** Drag and drop furniture (Beds, Sofas, Tables, Desks) that automatically scales to the real-world dimensions of your plan.
- **🎨 Customization:** Rename measurements, change colors, and resize furniture items via the sidebar.
- **🔍 Precision Mode:** A toggleable magnifier for placing points with high accuracy.
- **💾 Save & Export:** Save your project state (`.json`) to resume later, or export the finished plan as a high-quality image.
- **🖱️ Interactive Viewer:** Smooth zooming and panning for detailed inspection.

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **UI/Styling:** React 19, Tailwind CSS v4, Lucide React (Icons)
- **Core Libraries:**
  - `react-zoom-pan-pinch`: For the measuring canvas.
  - `react-draggable`: For interactive furniture placement.
  - `html-to-image`: For exporting the view.

## How to Run

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Start the development server:**
    ```bash
    npm run dev
    ```

3.  **Open the app:**
    Visit [http://localhost:3000](http://localhost:3000) in your browser.