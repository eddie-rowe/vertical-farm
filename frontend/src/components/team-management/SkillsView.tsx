"use client";

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { FaUser, FaCertificate, FaBook, FaChartLine, FaPlus, FaSearch, FaFilter, FaStar } from 'react-icons/fa'

interface Employee {
  id: string
  name: string
  role: string
  avatar: string
  skills: Skill[]
  certifications: Certification[]
  trainingProgress: TrainingProgress[]
}

interface Skill {
  id: string
  name: string
  category: string
  level: number // 1-5 (Beginner to Expert)
  lastAssessed: string
  certified: boolean
}

interface Certification {
  id: string
  name: string
  issuedBy: string
  issuedDate: string
  expiryDate: string
  status: 'active' | 'expired' | 'expiring'
}

interface TrainingProgress {
  id: string
  courseName: string
  progress: number
  startDate: string
  estimatedCompletion: string
  priority: 'high' | 'medium' | 'low'
}

const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    role: 'Farm Manager',
    avatar: '/avatars/sarah.jpg',
    skills: [
      { id: '1', name: 'Crop Management', category: 'Horticulture', level: 5, lastAssessed: '2024-12-01', certified: true },
      { id: '2', name: 'Team Leadership', category: 'Management', level: 4, lastAssessed: '2024-11-15', certified: true },
      { id: '3', name: 'Quality Control', category: 'Operations', level: 5, lastAssessed: '2024-11-30', certified: true },
      { id: '4', name: 'Budget Management', category: 'Finance', level: 3, lastAssessed: '2024-10-15', certified: false }
    ],
    certifications: [
      { id: '1', name: 'Certified Agriculture Manager', issuedBy: 'AgTech Institute', issuedDate: '2023-06-15', expiryDate: '2026-06-15', status: 'active' },
      { id: '2', name: 'Organic Farming Certification', issuedBy: 'USDA Organic', issuedDate: '2024-01-10', expiryDate: '2025-01-10', status: 'expiring' }
    ],
    trainingProgress: [
      { id: '1', courseName: 'Advanced Hydroponic Systems', progress: 75, startDate: '2024-11-01', estimatedCompletion: '2024-12-30', priority: 'high' },
      { id: '2', courseName: 'Leadership Excellence', progress: 45, startDate: '2024-10-15', estimatedCompletion: '2025-01-15', priority: 'medium' }
    ]
  },
  {
    id: '2',
    name: 'Mike Chen',
    role: 'Growth Technician',
    avatar: '/avatars/mike.jpg',
    skills: [
      { id: '5', name: 'Hydroponic Systems', category: 'Technology', level: 4, lastAssessed: '2024-12-05', certified: true },
      { id: '6', name: 'Nutrient Management', category: 'Horticulture', level: 4, lastAssessed: '2024-11-20', certified: true },
      { id: '7', name: 'Equipment Maintenance', category: 'Operations', level: 3, lastAssessed: '2024-11-10', certified: false },
      { id: '8', name: 'Data Analysis', category: 'Technology', level: 2, lastAssessed: '2024-10-01', certified: false }
    ],
    certifications: [
      { id: '3', name: 'Hydroponic Specialist', issuedBy: 'Hydro Institute', issuedDate: '2024-03-20', expiryDate: '2027-03-20', status: 'active' },
      { id: '4', name: 'Plant Nutrition Expert', issuedBy: 'AgriEd', issuedDate: '2023-08-15', expiryDate: '2024-08-15', status: 'expired' }
    ],
    trainingProgress: [
      { id: '3', courseName: 'IoT Sensor Integration', progress: 30, startDate: '2024-11-15', estimatedCompletion: '2025-02-15', priority: 'high' },
      { id: '4', courseName: 'Advanced Plant Nutrition', progress: 60, startDate: '2024-09-01', estimatedCompletion: '2024-12-15', priority: 'medium' }
    ]
  },
  {
    id: '3',
    name: 'Emily Davis',
    role: 'Harvest Specialist',
    avatar: '/avatars/emily.jpg',
    skills: [
      { id: '9', name: 'Harvest Timing', category: 'Horticulture', level: 5, lastAssessed: '2024-12-03', certified: true },
      { id: '10', name: 'Post-Harvest Handling', category: 'Operations', level: 4, lastAssessed: '2024-11-25', certified: true },
      { id: '11', name: 'Quality Assessment', category: 'Quality Control', level: 4, lastAssessed: '2024-11-18', certified: true },
      { id: '12', name: 'Food Safety', category: 'Compliance', level: 3, lastAssessed: '2024-10-20', certified: false }
    ],
    certifications: [
      { id: '5', name: 'Food Safety Certification', issuedBy: 'FDA', issuedDate: '2024-01-05', expiryDate: '2025-01-05', status: 'expiring' },
      { id: '6', name: 'Harvest Quality Expert', issuedBy: 'Farm Institute', issuedDate: '2023-11-10', expiryDate: '2026-11-10', status: 'active' }
    ],
    trainingProgress: [
      { id: '5', courseName: 'HACCP Implementation', progress: 85, startDate: '2024-10-01', estimatedCompletion: '2024-12-20', priority: 'high' },
      { id: '6', courseName: 'Packaging Innovation', progress: 20, startDate: '2024-11-20', estimatedCompletion: '2025-03-01', priority: 'low' }
    ]
  }
]

const skillCategories = ['All', 'Horticulture', 'Technology', 'Operations', 'Management', 'Quality Control', 'Finance', 'Compliance']

export default function SkillsView() {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showTrainingModal, setShowTrainingModal] = useState(false)

  const getSkillLevelText = (level: number) => {
    const levels = ['', 'Beginner', 'Novice', 'Intermediate', 'Advanced', 'Expert']
    return levels[level] || 'Unknown'
  }

  const getSkillLevelColor = (level: number) => {
    const colors = ['', 'bg-red-100 text-red-800', 'bg-orange-100 text-orange-800', 'bg-yellow-100 text-yellow-800', 'bg-blue-100 text-blue-800', 'bg-green-100 text-green-800']
    return colors[level] || 'bg-gray-100 text-gray-800'
  }

  const getCertificationStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'expired':
        return 'bg-red-100 text-red-800'
      case 'expiring':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredEmployees = mockEmployees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         employee.role.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || 
                           employee.skills.some(skill => skill.category === selectedCategory)
    return matchesSearch && matchesCategory
  })

  const renderSkillsMatrix = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Skills Overview */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <FaChartLine className="text-blue-600" />
          <h3 className="text-lg font-semibold">Skills Matrix Overview</h3>
        </div>
        <div className="space-y-4">
          {skillCategories.slice(1).map(category => {
            const categorySkills = mockEmployees.flatMap(emp => 
              emp.skills.filter(skill => skill.category === category)
            )
            const avgLevel = categorySkills.length > 0 
              ? categorySkills.reduce((sum, skill) => sum + skill.level, 0) / categorySkills.length 
              : 0
            const certifiedCount = categorySkills.filter(skill => skill.certified).length
            
            return (
              <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{category}</p>
                  <p className="text-sm text-gray-600">{categorySkills.length} skills tracked</p>
                </div>
                <div className="text-right">
                  <Badge className={getSkillLevelColor(Math.round(avgLevel))}>
                    Avg: {getSkillLevelText(Math.round(avgLevel))}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-1">{certifiedCount} certified</p>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Training Programs */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FaBook className="text-green-600" />
            <h3 className="text-lg font-semibold">Active Training Programs</h3>
          </div>
          <Button onClick={() => setShowTrainingModal(true)}>
            <FaPlus className="mr-2" />
            Add Training
          </Button>
        </div>
        <div className="space-y-3">
          {mockEmployees.flatMap(emp => emp.trainingProgress).slice(0, 5).map(training => (
            <div key={training.id} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">{training.courseName}</p>
                <Badge className={training.priority === 'high' ? 'bg-red-100 text-red-800' : 
                                training.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-gray-100 text-gray-800'}>
                  {training.priority}
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${training.progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{training.progress}% complete</span>
                <span>Due: {new Date(training.estimatedCompletion).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )

  const renderEmployeeDetails = () => {
    if (!selectedEmployee) return null

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employee Skills */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FaStar className="text-yellow-600" />
            <h3 className="text-lg font-semibold">Skills & Competencies</h3>
          </div>
          <div className="space-y-3">
            {selectedEmployee.skills.map(skill => (
              <div key={skill.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{skill.name}</p>
                  <p className="text-sm text-gray-600">{skill.category}</p>
                  <p className="text-xs text-gray-500">Last assessed: {new Date(skill.lastAssessed).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <Badge className={getSkillLevelColor(skill.level)}>
                    Level {skill.level} - {getSkillLevelText(skill.level)}
                  </Badge>
                  {skill.certified && (
                    <div className="flex items-center gap-1 mt-1">
                      <FaCertificate className="text-green-600 text-xs" />
                      <span className="text-xs text-green-600">Certified</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Certifications & Training */}
        <div className="space-y-6">
          {/* Certifications */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <FaCertificate className="text-purple-600" />
              <h3 className="text-lg font-semibold">Certifications</h3>
            </div>
            <div className="space-y-3">
              {selectedEmployee.certifications.map(cert => (
                <div key={cert.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{cert.name}</p>
                    <Badge className={getCertificationStatusColor(cert.status)}>
                      {cert.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{cert.issuedBy}</p>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Issued: {new Date(cert.issuedDate).toLocaleDateString()}</span>
                    <span>Expires: {new Date(cert.expiryDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Training Progress */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <FaBook className="text-blue-600" />
              <h3 className="text-lg font-semibold">Training Progress</h3>
            </div>
            <div className="space-y-3">
              {selectedEmployee.trainingProgress.map(training => (
                <div key={training.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{training.courseName}</p>
                    <Badge className={training.priority === 'high' ? 'bg-red-100 text-red-800' : 
                                    training.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                                    'bg-gray-100 text-gray-800'}>
                      {training.priority}
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${training.progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{training.progress}% complete</span>
                    <span>Est. completion: {new Date(training.estimatedCompletion).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Skills Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FaUser className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">8</p>
              <p className="text-sm text-gray-600">Total Employees</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FaStar className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">42</p>
              <p className="text-sm text-gray-600">Total Skills</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FaCertificate className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">15</p>
              <p className="text-sm text-gray-600">Active Certifications</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FaBook className="text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">6</p>
              <p className="text-sm text-gray-600">Training Programs</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      {!selectedEmployee ? (
        <>
          {/* Skills Matrix */}
          {renderSkillsMatrix()}

          {/* Employee List */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Team Skills & Development</h3>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search employees..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                >
                  {skillCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredEmployees.map(employee => (
                <div
                  key={employee.id}
                  className="p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedEmployee(employee)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <FaUser className="text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">{employee.name}</p>
                      <p className="text-sm text-gray-600">{employee.role}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Skills:</span>
                      <span className="font-medium">{employee.skills.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Certifications:</span>
                      <span className="font-medium">{employee.certifications.filter(c => c.status === 'active').length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Training:</span>
                      <span className="font-medium">{employee.trainingProgress.length} active</span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {employee.skills.slice(0, 3).map(skill => (
                      <Badge key={skill.id} className="text-xs">
                        {skill.name}
                      </Badge>
                    ))}
                    {employee.skills.length > 3 && (
                      <Badge className="text-xs bg-gray-100 text-gray-600">
                        +{employee.skills.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      ) : (
        <>
          {/* Employee Details Header */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <FaUser className="text-gray-600 text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{selectedEmployee.name}</h2>
                  <p className="text-gray-600">{selectedEmployee.role}</p>
                </div>
              </div>
              <Button onClick={() => setSelectedEmployee(null)}>
                Back to Overview
              </Button>
            </div>
          </Card>

          {/* Employee Details */}
          {renderEmployeeDetails()}
        </>
      )}
    </div>
  )
} 