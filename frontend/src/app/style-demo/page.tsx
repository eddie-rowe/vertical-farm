"use client"

import { 
  FarmControlButton, 
  PlantCard, 
  SensorPanel, 
  FarmLayout, 
  RackSection, 
  ShelfRow 
} from "@/components/ui"
import { 
  Thermometer, 
  Droplets, 
  Sun, 
  Leaf, 
  Settings,
  Power,
  Activity,
  Lightbulb
} from "lucide-react"

export default function StyleDemoPage() {
  return (
    <div className="container mx-auto p-6 space-y-12">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <h1 className="text-farm-title text-4xl">Phase 1 Style Standardization Demo</h1>
        <p className="text-control-label text-lg max-w-2xl mx-auto">
          Showcasing the enhanced utility system, farm-specific components, and improved design tokens
        </p>
      </div>

      {/* Typography System Demo */}
      <section className="space-y-6">
        <h2 className="text-farm-title text-2xl">Typography System</h2>
        <div className="glass p-6 space-y-4">
          <div className="text-farm-title">Farm Title - Main headings and titles</div>
          <div className="text-sensor-value">24.5°C - Sensor values and measurements</div>
          <div className="text-control-label">Control Label - Form labels and descriptions</div>
          <div className="text-plant-label">Plant Label - Secondary text and metadata</div>
        </div>
      </section>

      {/* Farm Control Buttons Demo */}
      <section className="space-y-6">
        <h2 className="text-farm-title text-2xl">Farm Control Buttons</h2>
        <div className="glass p-6">
          <div className="flex flex-wrap gap-4">
            <FarmControlButton variant="default" icon={<Settings />} />
            <FarmControlButton variant="primary" icon={<Power />} />
            <FarmControlButton variant="maintenance" icon={<Activity />} />
            <FarmControlButton variant="growing" icon={<Leaf />} animation="float" />
            <FarmControlButton variant="offline" icon={<Lightbulb />} />
          </div>
          <p className="text-control-label mt-4">
            Different states: Default, Primary (Active), Maintenance, Growing (with animation), Offline
          </p>
        </div>
      </section>

      {/* Sensor Panels Demo */}
      <section className="space-y-6">
        <h2 className="text-farm-title text-2xl">Sensor Panels</h2>
        <div className="glass p-6">
          <div className="flex flex-wrap gap-4">
            <SensorPanel
              status="online"
              sensorType="Temperature"
              value="24.5"
              unit="°C"
              trend="up"
              icon={<Thermometer />}
              lastUpdated="2 min ago"
            />
            <SensorPanel
              status="online"
              sensorType="Humidity"
              value="65"
              unit="%"
              trend="stable"
              icon={<Droplets />}
              lastUpdated="1 min ago"
            />
            <SensorPanel
              status="warning"
              sensorType="Light"
              value="850"
              unit="lux"
              trend="down"
              icon={<Sun />}
              lastUpdated="5 min ago"
            />
            <SensorPanel
              status="offline"
              sensorType="pH"
              value="—"
              icon={<Activity />}
              lastUpdated="15 min ago"
            />
          </div>
        </div>
      </section>

      {/* Plant Cards Demo */}
      <section className="space-y-6">
        <h2 className="text-farm-title text-2xl">Plant Cards</h2>
        <div className="farm-grid">
          <PlantCard
            status="healthy"
            plantName="Basil"
            variety="Sweet Genovese"
            stage="Vegetative"
            plantedDate="Mar 15"
            health={92}
            icon={<Leaf className="text-green-500" />}
          />
          <PlantCard
            status="growing"
            plantName="Lettuce"
            variety="Buttercrunch"
            stage="Flowering"
            plantedDate="Mar 10"
            health={88}
            icon={<Leaf className="text-green-400" />}
          />
          <PlantCard
            status="maintenance"
            plantName="Tomato"
            variety="Cherry"
            stage="Fruiting"
            plantedDate="Feb 28"
            health={76}
            icon={<Leaf className="text-yellow-500" />}
          />
          <PlantCard
            status="issue"
            plantName="Spinach"
            variety="Space"
            stage="Seedling"
            plantedDate="Mar 20"
            health={45}
            icon={<Leaf className="text-red-500" />}
          />
        </div>
      </section>

      {/* Layout System Demo */}
      <section className="space-y-6">
        <h2 className="text-farm-title text-2xl">Farm Layout System</h2>
        
        {/* Rack Layout Demo */}
        <RackSection rackName="Rack A">
          <ShelfRow shelfNumber={1}>
            <PlantCard
              size="sm"
              status="healthy"
              plantName="Herbs"
              health={95}
              icon={<Leaf className="text-green-500" />}
            />
            <SensorPanel
              size="sm"
              status="online"
              sensorType="Temp"
              value="22"
              unit="°C"
              icon={<Thermometer />}
            />
            <SensorPanel
              size="sm"
              status="online"
              sensorType="Humidity"
              value="70"
              unit="%"
              icon={<Droplets />}
            />
          </ShelfRow>
          
          <ShelfRow shelfNumber={2}>
            <PlantCard
              size="sm"
              status="growing"
              plantName="Greens"
              health={87}
              icon={<Leaf className="text-green-400" />}
            />
            <SensorPanel
              size="sm"
              status="online"
              sensorType="Light"
              value="800"
              unit="lux"
              icon={<Sun />}
            />
            <FarmControlButton size="sm" variant="primary" icon={<Settings />} />
          </ShelfRow>
        </RackSection>
      </section>

      {/* State Patterns Demo */}
      <section className="space-y-6">
        <h2 className="text-farm-title text-2xl">State Pattern Utilities</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass p-4 state-active">
            <div className="text-control-label">Active State</div>
            <div className="text-sensor-value">System Online</div>
          </div>
          <div className="glass p-4 state-maintenance">
            <div className="text-control-label">Maintenance State</div>
            <div className="text-sensor-value">Scheduled Cleaning</div>
          </div>
          <div className="glass p-4 state-offline">
            <div className="text-control-label">Offline State</div>
            <div className="text-sensor-value">Connection Lost</div>
          </div>
          <div className="glass p-4 state-growing">
            <div className="text-control-label">Growing State</div>
            <div className="text-sensor-value">Active Growth</div>
          </div>
        </div>
      </section>

      {/* Animation Demo */}
      <section className="space-y-6">
        <h2 className="text-farm-title text-2xl">Animation System</h2>
        <div className="glass p-6 flex gap-6 items-center justify-center">
          <div className="animate-pop p-4 bg-primary/10 rounded-lg">
            <div className="text-control-label">Pop Animation</div>
          </div>
          <div className="animate-float p-4 bg-green-500/10 rounded-lg">
            <div className="text-control-label">Float Animation</div>
          </div>
          <div className="animate-pulse-slow p-4 bg-blue-500/10 rounded-lg">
            <div className="text-control-label">Pulse Glow</div>
          </div>
        </div>
      </section>

      {/* Shadow System Demo */}
      <section className="space-y-6">
        <h2 className="text-farm-title text-2xl">Enhanced Shadow System</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-shadow p-6 bg-card rounded-lg">
            <div className="text-control-label">Card Shadow</div>
            <div className="text-plant-label">Standard component shadow</div>
          </div>
          <div className="sensor-shadow p-6 bg-card rounded-lg">
            <div className="text-control-label">Sensor Shadow</div>
            <div className="text-plant-label">Subtle sensor panel shadow</div>
          </div>
          <div className="control-shadow p-6 bg-card rounded-lg">
            <div className="text-control-label">Control Shadow</div>
            <div className="text-plant-label">Elevated control shadow</div>
          </div>
        </div>
      </section>
    </div>
  )
} 