import React from 'react';
import { FaCreditCard, FaKey, FaStore, FaCheck, FaExternalLinkAlt, FaInfoCircle } from 'react-icons/fa';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SquareSetupGuideProps {
  onComplete?: () => void;
}

export default function SquareSetupGuide({ onComplete }: SquareSetupGuideProps) {
  const setupSteps = [
    {
      id: 1,
      title: 'Create Square Developer Account',
      description: 'Sign up for a Square Developer account to access API credentials',
      icon: <FaCreditCard className="text-green-600" />,
      status: 'pending',
      action: {
        label: 'Go to Square Developer',
        url: 'https://developer.squareup.com/',
        external: true
      },
      details: [
        'Visit the Square Developer portal',
        'Sign up or log in with your Square account',
        'Accept the developer terms of service',
        'Verify your email address'
      ]
    },
    {
      id: 2,
      title: 'Create a New Application',
      description: 'Set up a new application in your Square Developer dashboard',
      icon: <FaStore className="text-green-600" />,
      status: 'pending',
      details: [
        'Navigate to "My Applications" in the developer dashboard',
        'Click "New Application"',
        'Enter your application name (e.g., "Vertical Farm POS")',
        'Choose "Web" as the application type',
        'Set your application URL and redirect URI'
      ]
    },
    {
      id: 3,
      title: 'Get API Credentials',
      description: 'Obtain your Application ID and Access Token',
      icon: <FaKey className="text-green-600" />,
      status: 'pending',
      details: [
        'Open your newly created application',
        'Go to the "Credentials" tab',
        'Copy your Application ID (starts with "sq0idp-")',
        'Copy your Access Token (starts with "EAAA")',
        'Note: Use Sandbox credentials for testing'
      ]
    },
    {
      id: 4,
      title: 'Configure Integration',
      description: 'Enter your credentials in the setup form above',
      icon: <FaCheck className="text-green-600" />,
      status: 'pending',
      details: [
        'Enter a descriptive configuration name',
        'Paste your Application ID',
        'Paste your Access Token',
        'Choose Sandbox for testing or Production for live use',
        'Click "Test Connection" to verify'
      ]
    }
  ];

  const permissions = [
    'PAYMENTS_READ - Read payment information',
    'PAYMENTS_WRITE - Process payments',
    'ORDERS_READ - Read order information', 
    'ORDERS_WRITE - Create and modify orders',
    'ITEMS_READ - Read product catalog',
    'ITEMS_WRITE - Manage product catalog',
    'MERCHANT_PROFILE_READ - Read business information',
    'CUSTOMERS_READ - Read customer information',
    'INVENTORY_READ - Read inventory levels'
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FaCreditCard className="text-green-600" />
            <span>Square Integration Setup Guide</span>
          </CardTitle>
          <CardDescription>
            Follow these steps to connect your Square account for payment processing and sales management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <FaInfoCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Start with Sandbox credentials for testing. Switch to Production credentials only when you're ready to process real payments.
            </AlertDescription>
          </Alert>

          <div className="space-y-6">
            {setupSteps.map((step, index) => (
              <div key={step.id} className="flex space-x-4">
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900">
                    {step.icon}
                  </div>
                  {index < setupSteps.length - 1 && (
                    <div className="w-px h-16 bg-gray-200 dark:bg-gray-700 mt-2"></div>
                  )}
                </div>
                
                <div className="flex-1 pb-8">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {step.title}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      Step {step.id}
                    </Badge>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    {step.description}
                  </p>
                  
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {step.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-start space-x-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {step.action && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(step.action.url, '_blank')}
                      className="flex items-center space-x-2"
                    >
                      <span>{step.action.label}</span>
                      {step.action.external && <FaExternalLinkAlt className="w-3 h-3" />}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Required Permissions</CardTitle>
          <CardDescription>
            Your Square application will need these permissions to function properly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {permissions.map((permission, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <FaCheck className="text-green-600 w-3 h-3" />
                <span>{permission}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Environment Information</CardTitle>
          <CardDescription>
            Understanding the difference between Sandbox and Production environments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-green-600">Sandbox Environment</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>• Safe testing environment</li>
                <li>• No real money transactions</li>
                <li>• Test credit card numbers work</li>
                <li>• Separate from production data</li>
                <li>• Ideal for development and testing</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-orange-600">Production Environment</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>• Live payment processing</li>
                <li>• Real money transactions</li>
                <li>• Actual customer data</li>
                <li>• Requires business verification</li>
                <li>• Use only when ready for live sales</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting</CardTitle>
          <CardDescription>
            Common issues and solutions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Connection Test Failed</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>• Verify your Application ID and Access Token are correct</li>
                <li>• Ensure you're using the right environment (Sandbox vs Production)</li>
                <li>• Check that your Square application has the required permissions</li>
                <li>• Make sure your access token hasn't expired</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">No Locations Found</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>• Ensure your Square account has at least one location set up</li>
                <li>• Verify your application has MERCHANT_PROFILE_READ permission</li>
                <li>• Try clicking the "Sync Locations" button to refresh</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Permission Denied Errors</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>• Review your application's permission settings in Square Developer</li>
                <li>• Regenerate your access token if permissions were recently changed</li>
                <li>• Contact Square support if you need additional permissions</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {onComplete && (
        <div className="flex justify-center">
          <Button onClick={onComplete} className="flex items-center space-x-2">
            <FaCheck className="w-4 h-4" />
            <span>I've Completed the Setup</span>
          </Button>
        </div>
      )}
    </div>
  );
} 