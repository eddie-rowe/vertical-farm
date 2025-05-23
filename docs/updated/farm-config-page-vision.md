Okay, this is a great vision for the farms configuration page! Let's break down how we can implement this.
Here's a plan focusing on the structure and components, leveraging ShadCN/UI:
Phase 0: Setup and Initial Refactor of farms/page.tsx
Rename Page Component:
In vertical-farm/frontend/src/app/dashboard/farms/page.tsx, rename the main exported function from LayoutPage to something more descriptive like FarmsPage.
Initial State Management:
In FarmsPage, set up basic state management (using React useState for now) for:
currentView: To switch between 'top-down' and 'side-view' (default: 'top-down').
editMode: A boolean to toggle between view and edit modes (default: false).
selectedRackId: To store the ID of the rack clicked in the top-down view (default: null).
farmData: (We'll need to decide how this data is fetched or initialized. For now, we can use mock data).
Mode Toggle UI:
Add a global toggle (e.g., ShadCN/UI Switch or a styled Button) in FarmsPage that updates the editMode state.
Phase 1: Top-Down View (Component: TopDownFarmView.tsx)
Component Creation:
Create a new component, say components/farm-config/TopDownFarmView.tsx.
This component will receive farmData and editMode as props, and an onRackClick callback function.
The existing FarmLayoutConfigurator might be a good starting point for this view, or we might refactor parts of it.
View Mode (editMode === false):
Display rows and racks based on farmData.
Use ShadCN/UI elements like Card for racks to make them visually distinct and clickable.
When a rack is clicked, it should call onRackClick(rackId), passing the ID of the clicked rack.
Edit Mode (editMode === true):
Display controls (e.g., ShadCN/UI Button with icons) for:
Adding a new row.
Adding a new rack to an existing row.
Editing properties of a row/rack (perhaps via a Dialog or Sheet).
Deleting a row/rack.
These actions would eventually modify the farmData state.
Phase 2: Side-View / Rack Detail View (Component: RackDetailView.tsx)
Component Creation:
Create components/farm-config/RackDetailView.tsx.
This component will receive rackData (the data for the selectedRackId) and editMode as props.
View Mode (editMode === false):
Display the shelves within the selected rack.
For each shelf, display any assigned devices/sensors.
Use ShadCN/UI elements for clear presentation (e.g., Table, List, Accordion).
Edit Mode (editMode === true):
Display controls for:
Adding a new shelf to the rack.
Editing shelf properties.
Deleting a shelf.
Assigning/unassigning devices/sensors to a shelf (perhaps using a Select or Popover with a list of available devices).
Phase 3: Integrating Views in FarmsPage.tsx
Conditional Rendering:
In FarmsPage.tsx, use the currentView state to conditionally render either <TopDownFarmView /> or <RackDetailView />.
View Switching Logic:
Implement the handleRackClick function: when called from TopDownFarmView, it will set selectedRackId and change currentView to 'side-view'.
RackDetailView will need a "Back" button (or similar UI element) that, when clicked, resets selectedRackId to null and sets currentView back to 'top-down'.
Data Flow:
Pass the relevant part of farmData (e.g., data for the specific rack) to RackDetailView when currentView is 'side-view'.
Data Structure Considerations (High-Level):
We'll need a clear data structure for:
Farm: Contains a list of Rows.
Row: Contains an ID, properties, and a list of Racks.
Rack: Contains an ID, properties, and a list of Shelves.
Shelf: Contains an ID, properties, and a list of Devices/Sensors.
Device/Sensor: Contains an ID and properties.
The edit mode functionalities will involve updating this data structure. Initially, this can be managed in the local state of FarmsPage, and later hooked up to an API for persistence.
Next Steps & Questions:
Refactor farms/page.tsx: Shall we start by renaming the component and setting up the basic states (currentView, editMode, selectedRackId)?
FarmLayoutConfigurator: How much of the existing FarmLayoutConfigurator do you think can be reused or adapted for the TopDownFarmView? Or should we plan to build the TopDownFarmView from scratch?
Data: How is farmData currently managed or fetched by FarmLayoutConfigurator? We'll need to integrate this into our new structure.
This is a high-level plan. We can break each phase into smaller, more manageable sub-steps. How does this initial plan sound to you?
