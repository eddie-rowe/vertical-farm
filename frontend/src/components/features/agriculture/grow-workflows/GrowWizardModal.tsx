import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
// Using simple date input instead of calendar component
import { cn } from '@/lib/utils'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Leaf,
  Clock,
  BookOpen,
  CheckCircle
} from 'lucide-react'

// Helper function to format dates without date-fns
const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

interface GrowWizardModalProps {
  isOpen: boolean
  onClose: () => void
  shelfId: string
  shelfName: string
  onSubmit: (growData: GrowSetupData) => void
}

interface GrowSetupData {
  cropType: string
  variety: string
  recipeId: string
  customRecipe?: {
    name: string
    description: string
    duration: number
    stages: GrowStage[]
  }
  startDate: Date
  estimatedHarvestDate: Date
  notes: string
}

interface GrowStage {
  name: string
  duration: number
  lightHours: number
  temperature: number
  humidity: number
  nutrients: string
}

const CROP_TYPES = [
  { value: 'lettuce', label: 'Lettuce', varieties: ['Buttercrunch', 'Romaine', 'Red Oak', 'Green Leaf'] },
  { value: 'basil', label: 'Basil', varieties: ['Genovese', 'Thai', 'Purple', 'Lemon'] },
  { value: 'spinach', label: 'Spinach', varieties: ['Baby Leaf', 'Savoy', 'Flat Leaf'] },
  { value: 'kale', label: 'Kale', varieties: ['Curly', 'Lacinato', 'Red Russian'] },
  { value: 'arugula', label: 'Arugula', varieties: ['Wild', 'Astro', 'Slow Bolt'] },
  { value: 'microgreens', label: 'Microgreens', varieties: ['Radish', 'Pea', 'Sunflower', 'Broccoli'] }
]

const PRESET_RECIPES = [
  { 
    id: 'lettuce-basic', 
    name: 'Basic Lettuce (30 days)', 
    crop: 'lettuce',
    duration: 30,
    description: 'Standard lettuce growing recipe with 16h light cycle'
  },
  { 
    id: 'basil-intensive', 
    name: 'Intensive Basil (35 days)', 
    crop: 'basil',
    duration: 35,
    description: 'High-yield basil recipe with extended light periods'
  },
  { 
    id: 'microgreens-fast', 
    name: 'Fast Microgreens (14 days)', 
    crop: 'microgreens',
    duration: 14,
    description: 'Quick turnaround microgreens for continuous harvest'
  }
]

export const GrowWizardModal: React.FC<GrowWizardModalProps> = ({
  isOpen,
  onClose,
  shelfId,
  shelfName,
  onSubmit
}) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [growData, setGrowData] = useState<Partial<GrowSetupData>>({
    startDate: new Date()
  })

  const steps = [
    { id: 1, title: 'Select Crop', icon: Leaf },
    { id: 2, title: 'Choose Recipe', icon: BookOpen },
    { id: 3, title: 'Set Schedule', icon: Clock },
    { id: 4, title: 'Review & Start', icon: CheckCircle }
  ]

  const selectedCrop = CROP_TYPES.find(crop => crop.value === growData.cropType)
  const availableRecipes = PRESET_RECIPES.filter(recipe => 
    !growData.cropType || recipe.crop === growData.cropType
  )

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = () => {
    if (isFormValid()) {
      onSubmit(growData as GrowSetupData)
      onClose()
      resetForm()
    }
  }

  const resetForm = () => {
    setCurrentStep(1)
    setGrowData({ startDate: new Date() })
  }

  const isFormValid = () => {
    return growData.cropType && 
           growData.variety && 
           (growData.recipeId || growData.customRecipe) && 
           growData.startDate
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return growData.cropType && growData.variety
      case 2:
        return growData.recipeId || growData.customRecipe
      case 3:
        return growData.startDate
      case 4:
        return isFormValid()
      default:
        return false
    }
  }

  const calculateHarvestDate = () => {
    if (growData.startDate && growData.recipeId) {
      const recipe = PRESET_RECIPES.find(r => r.id === growData.recipeId)
      if (recipe) {
        const harvestDate = new Date(growData.startDate)
        harvestDate.setDate(harvestDate.getDate() + recipe.duration)
        return harvestDate
      }
    }
    return null
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="crop-type">Crop Type</Label>
              <Select 
                value={growData.cropType} 
                onValueChange={(value) => setGrowData({...growData, cropType: value, variety: ''})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a crop type" />
                </SelectTrigger>
                <SelectContent>
                  {CROP_TYPES.map((crop) => (
                    <SelectItem key={crop.value} value={crop.value}>
                      {crop.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCrop && (
              <div>
                <Label htmlFor="variety">Variety</Label>
                <Select 
                  value={growData.variety} 
                  onValueChange={(value) => setGrowData({...growData, variety: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a variety" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCrop.varieties.map((variety) => (
                      <SelectItem key={variety} value={variety}>
                        {variety}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label>Choose Growing Recipe</Label>
              <div className="grid gap-3 mt-2">
                {availableRecipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    className={cn(
                      "p-4 border rounded-lg cursor-pointer transition-colors",
                      growData.recipeId === recipe.id
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    )}
                    onClick={() => setGrowData({...growData, recipeId: recipe.id})}
                  >
                    <div className="font-medium">{recipe.name}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {recipe.description}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Duration: {recipe.duration} days
                    </div>
                  </div>
                ))}
                
                <div 
                  className={cn(
                    "p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                    growData.recipeId === 'custom'
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : "border-slate-300 dark:border-slate-600 hover:border-slate-400"
                  )}
                  onClick={() => setGrowData({...growData, recipeId: 'custom'})}
                >
                  <div className="text-center text-slate-600 dark:text-slate-400">
                    + Create Custom Recipe
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={growData.startDate ? growData.startDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setGrowData({...growData, startDate: new Date(e.target.value)})}
                className="w-full"
              />
            </div>

            {calculateHarvestDate() && (
              <div>
                <Label>Estimated Harvest Date</Label>
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  {formatDate(calculateHarvestDate()!)}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this grow..."
                value={growData.notes || ''}
                onChange={(e) => setGrowData({...growData, notes: e.target.value})}
              />
            </div>
          </div>
        )

      case 4:
        const selectedRecipe = PRESET_RECIPES.find(r => r.id === growData.recipeId)
        return (
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <h3 className="font-medium mb-3">Grow Summary</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Location:</span> {shelfName}</div>
                <div><span className="font-medium">Crop:</span> {selectedCrop?.label} - {growData.variety}</div>
                <div><span className="font-medium">Recipe:</span> {selectedRecipe?.name}</div>
                <div><span className="font-medium">Start Date:</span> {growData.startDate ? formatDate(growData.startDate) : 'Not set'}</div>
                {calculateHarvestDate() && (
                  <div><span className="font-medium">Estimated Harvest:</span> {formatDate(calculateHarvestDate()!)}</div>
                )}
                {growData.notes && (
                  <div><span className="font-medium">Notes:</span> {growData.notes}</div>
                )}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Leaf className="w-5 h-5" />
            Start New Grow - {shelfName}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2",
                  isActive && "border-green-500 bg-green-500 text-white",
                  isCompleted && "border-green-500 bg-green-500 text-white",
                  !isActive && !isCompleted && "border-slate-300 text-slate-400"
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="ml-2">
                  <div className={cn(
                    "text-sm font-medium",
                    (isActive || isCompleted) && "text-green-600 dark:text-green-400",
                    !isActive && !isCompleted && "text-slate-400"
                  )}>
                    {step.title}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "w-8 h-0.5 mx-4",
                    isCompleted ? "bg-green-500" : "bg-slate-200 dark:bg-slate-700"
                  )} />
                )}
              </div>
            )
          })}
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">
          {renderStep()}
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            {currentStep < steps.length ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed()}
                className="bg-green-600 hover:bg-green-700"
              >
                Start Grow
                <Leaf className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 