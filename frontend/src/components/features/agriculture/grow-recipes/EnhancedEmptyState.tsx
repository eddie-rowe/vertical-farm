"use client";

import {
  Plus,
  BookOpen,
  Download,
  Sprout,
  Leaf,
  FlaskConical,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface TemplateCardProps {
  title: string;
  description: string;
  species: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  icon: React.ComponentType<{ className?: string }>;
  onSelect: () => void;
}

function TemplateCard({
  title,
  description,
  species,
  difficulty,
  duration,
  icon: Icon,
  onSelect,
}: TemplateCardProps) {
  const getDifficultyColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "Advanced":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  return (
    <Card
      className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer border-dashed border-2 hover:border-solid hover:border-primary/50"
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="text-sm">{species}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-3">{description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge className={`text-xs ${getDifficultyColor(difficulty)}`}>
              {difficulty}
            </Badge>
            <span className="text-xs text-muted-foreground">{duration}</span>
          </div>
          <Button variant="ghost" size="sm" className="text-primary">
            Use Template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface EnhancedEmptyStateProps {
  onCreateNew: () => void;
  onImport: () => void;
  onUseTemplate: (templateId: string) => void;
}

export function EnhancedEmptyState({
  onCreateNew,
  onImport,
  onUseTemplate,
}: EnhancedEmptyStateProps) {
  const templates = [
    {
      id: "lettuce-hydroponic",
      title: "Hydroponic Lettuce",
      description:
        "Perfect starter recipe for leafy greens with high success rate and quick turnaround.",
      species: "Lactuca sativa",
      difficulty: "Beginner" as const,
      duration: "4-6 weeks",
      icon: Leaf,
    },
    {
      id: "basil-aeroponic",
      title: "Aeroponic Basil",
      description:
        "Aromatic herbs with optimized nutrient delivery for maximum flavor development.",
      species: "Ocimum basilicum",
      difficulty: "Intermediate" as const,
      duration: "6-8 weeks",
      icon: Sprout,
    },
    {
      id: "microgreens-mix",
      title: "Microgreens Mix",
      description:
        "Fast-growing nutrient-dense greens perfect for continuous harvest cycles.",
      species: "Mixed varieties",
      difficulty: "Beginner" as const,
      duration: "1-2 weeks",
      icon: FlaskConical,
    },
  ];

  return (
    <div className="min-h-[600px] flex flex-col items-center justify-center p-8">
      {/* Welcome Section */}
      <div className="text-center mb-8 max-w-2xl">
        <div className="mb-4">
          <div className="p-4 rounded-full bg-primary/10 w-20 h-20 mx-auto flex items-center justify-center">
            <BookOpen className="h-10 w-10 text-primary" />
          </div>
        </div>
        <h2 className="text-3xl font-bold mb-3">
          Welcome to your Grow Recipe Library
        </h2>
        <p className="text-lg text-muted-foreground mb-6">
          Start optimizing your harvests with proven growing parameters. Create
          custom recipes or choose from our expert-crafted templates.
        </p>

        {/* Quick Start Actions */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          <Button onClick={onCreateNew} size="lg" className="px-6">
            <Plus className="h-5 w-5 mr-2" />
            Create from Scratch
          </Button>
          <Button
            onClick={onImport}
            variant="outline"
            size="lg"
            className="px-6"
          >
            <Download className="h-5 w-5 mr-2" />
            Import Recipe
          </Button>
        </div>
      </div>

      {/* Template Gallery */}
      <div className="w-full max-w-6xl">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold mb-2">Start with a Template</h3>
          <p className="text-muted-foreground">
            These proven recipes will help you get started with optimal growing
            parameters
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              title={template.title}
              description={template.description}
              species={template.species}
              difficulty={template.difficulty}
              duration={template.duration}
              icon={template.icon}
              onSelect={() => onUseTemplate(template.id)}
            />
          ))}
        </div>

        {/* Help Section */}
        <Card className="border-dashed border-2 bg-muted/20">
          <CardContent className="p-6 text-center">
            <h4 className="font-semibold mb-2">Need help getting started?</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Check out our growing guide or contact support for personalized
              recommendations based on your setup.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="ghost" size="sm">
                View Growing Guide
              </Button>
              <Button variant="ghost" size="sm">
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
