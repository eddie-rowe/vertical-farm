import React, { useState, useCallback, useEffect } from "react";
import { Row, Rack, Shelf } from "@/types/farm-layout";
import {
  Save,
  Download,
  Upload,
  Trash2,
  Copy,
  FileText,
  Plus,
  Star,
  StarOff,
  Calendar,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "react-hot-toast";

interface LayoutTemplate {
  id: string;
  name: string;
  description?: string;
  layout: {
    rows: Row[];
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
    author?: string;
    tags: string[];
    favorite: boolean;
    version: string;
  };
  stats: {
    totalRows: number;
    totalRacks: number;
    totalShelves: number;
    totalDevices: number;
  };
}

interface LayoutTemplateManagerProps {
  currentLayout: { rows: Row[] };
  onApplyTemplate: (template: LayoutTemplate) => void;
  className?: string;
}

export const LayoutTemplateManager: React.FC<LayoutTemplateManagerProps> = ({
  currentLayout,
  onApplyTemplate,
  className,
}) => {
  const [templates, setTemplates] = useState<LayoutTemplate[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDescription, setNewTemplateDescription] = useState("");
  const [newTemplateTags, setNewTemplateTags] = useState("");
  const [importData, setImportData] = useState("");
  const [selectedTemplate, setSelectedTemplate] =
    useState<LayoutTemplate | null>(null);

  // Load templates from localStorage on mount
  useEffect(() => {
    const savedTemplates = localStorage.getItem("farm-layout-templates");
    if (savedTemplates) {
      try {
        setTemplates(JSON.parse(savedTemplates));
      } catch (error) {
        console.error("Failed to load templates:", error);
        toast.error("Failed to load saved templates");
      }
    }
  }, []);

  // Save templates to localStorage whenever templates change
  useEffect(() => {
    localStorage.setItem("farm-layout-templates", JSON.stringify(templates));
  }, [templates]);

  const calculateStats = useCallback((layout: { rows: Row[] }) => {
    const totalRows = layout.rows.length;
    const totalRacks = layout.rows.reduce(
      (acc, row) => acc + (row.racks?.length || 0),
      0,
    );
    const totalShelves = layout.rows.reduce(
      (acc, row) =>
        acc +
        (row.racks?.reduce(
          (rackAcc, rack) => rackAcc + (rack.shelves?.length || 0),
          0,
        ) || 0),
      0,
    );
    const totalDevices = layout.rows.reduce(
      (acc, row) =>
        acc +
        (row.racks?.reduce(
          (rackAcc, rack) =>
            rackAcc +
            (rack.shelves?.reduce(
              (shelfAcc, shelf) => shelfAcc + (shelf.devices?.length || 0),
              0,
            ) || 0),
          0,
        ) || 0),
      0,
    );

    return { totalRows, totalRacks, totalShelves, totalDevices };
  }, []);

  const saveCurrentLayout = useCallback(() => {
    if (!newTemplateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    const stats = calculateStats(currentLayout);
    const tags = newTemplateTags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const template: LayoutTemplate = {
      id: Date.now().toString(),
      name: newTemplateName.trim(),
      description: newTemplateDescription.trim() || undefined,
      layout: JSON.parse(JSON.stringify(currentLayout)), // Deep clone
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: "Current User", // TODO: Get from auth context
        tags,
        favorite: false,
        version: "1.0.0",
      },
      stats,
    };

    setTemplates((prev) => [template, ...prev]);
    setIsCreateDialogOpen(false);
    setNewTemplateName("");
    setNewTemplateDescription("");
    setNewTemplateTags("");

    toast.success(`Template "${template.name}" saved successfully`);
  }, [
    currentLayout,
    newTemplateName,
    newTemplateDescription,
    newTemplateTags,
    calculateStats,
  ]);

  const deleteTemplate = useCallback(
    (templateId: string) => {
      const template = templates.find((t) => t.id === templateId);
      if (!template) return;

      if (
        confirm(
          `Are you sure you want to delete the template "${template.name}"?`,
        )
      ) {
        setTemplates((prev) => prev.filter((t) => t.id !== templateId));
        toast.success(`Template "${template.name}" deleted`);
      }
    },
    [templates],
  );

  const toggleFavorite = useCallback((templateId: string) => {
    setTemplates((prev) =>
      prev.map((template) =>
        template.id === templateId
          ? {
              ...template,
              metadata: {
                ...template.metadata,
                favorite: !template.metadata.favorite,
              },
            }
          : template,
      ),
    );
  }, []);

  const exportTemplate = useCallback((template: LayoutTemplate) => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${template.name.replace(/\s+/g, "_")}_template.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Template "${template.name}" exported`);
  }, []);

  const importTemplate = useCallback(() => {
    if (!importData.trim()) {
      toast.error("Please paste template data");
      return;
    }

    try {
      const template: LayoutTemplate = JSON.parse(importData);

      // Validate template structure
      if (!template.id || !template.name || !template.layout) {
        throw new Error("Invalid template format");
      }

      // Update metadata
      template.id = Date.now().toString(); // Generate new ID
      template.metadata.updatedAt = new Date().toISOString();

      setTemplates((prev) => [template, ...prev]);
      setIsImportDialogOpen(false);
      setImportData("");

      toast.success(`Template "${template.name}" imported successfully`);
    } catch (error) {
      toast.error("Failed to import template. Please check the format.");
      console.error("Import error:", error);
    }
  }, [importData]);

  const applyTemplate = useCallback(
    (template: LayoutTemplate) => {
      if (
        confirm(
          `Apply template "${template.name}"? This will replace the current layout.`,
        )
      ) {
        onApplyTemplate(template);
        toast.success(`Applied template "${template.name}"`);
      }
    },
    [onApplyTemplate],
  );

  const duplicateTemplate = useCallback((template: LayoutTemplate) => {
    const duplicate: LayoutTemplate = {
      ...JSON.parse(JSON.stringify(template)), // Deep clone
      id: Date.now().toString(),
      name: `${template.name} (Copy)`,
      metadata: {
        ...template.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        favorite: false,
      },
    };

    setTemplates((prev) => [duplicate, ...prev]);
    toast.success(`Template duplicated as "${duplicate.name}"`);
  }, []);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Layout Templates</h3>
        <div className="flex gap-2">
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Save className="w-4 h-4" />
                Save Current
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Layout Template</DialogTitle>
                <DialogDescription>
                  Save the current farm layout as a reusable template
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="Enter template name"
                  />
                </div>
                <div>
                  <Label htmlFor="template-description">
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="template-description"
                    value={newTemplateDescription}
                    onChange={(e) => setNewTemplateDescription(e.target.value)}
                    placeholder="Describe this layout template"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="template-tags">Tags (Optional)</Label>
                  <Input
                    id="template-tags"
                    value={newTemplateTags}
                    onChange={(e) => setNewTemplateTags(e.target.value)}
                    placeholder="Enter tags separated by commas"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={saveCurrentLayout}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Template
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={isImportDialogOpen}
            onOpenChange={setIsImportDialogOpen}
          >
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-2">
                <Upload className="w-4 h-4" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Layout Template</DialogTitle>
                <DialogDescription>
                  Paste the template JSON data to import
                </DialogDescription>
              </DialogHeader>
              <div>
                <Label htmlFor="import-data">Template Data</Label>
                <Textarea
                  id="import-data"
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Paste template JSON data here..."
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsImportDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={importTemplate}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Template
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No templates saved yet.</p>
              <p className="text-sm">
                Save your current layout to create your first template.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">
                        {template.name}
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => toggleFavorite(template.id)}
                      >
                        {template.metadata.favorite ? (
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        ) : (
                          <StarOff className="w-3 h-3 text-slate-400" />
                        )}
                      </Button>
                    </div>
                    {template.description && (
                      <CardDescription className="mt-1">
                        {template.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => applyTemplate(template)}
                      className="gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Apply
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => exportTemplate(template)}
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => duplicateTemplate(template)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteTemplate(template.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-4 gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {template.stats.totalRows}
                    </div>
                    <div className="text-xs text-slate-500">Rows</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {template.stats.totalRacks}
                    </div>
                    <div className="text-xs text-slate-500">Racks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">
                      {template.stats.totalShelves}
                    </div>
                    <div className="text-xs text-slate-500">Shelves</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">
                      {template.stats.totalDevices}
                    </div>
                    <div className="text-xs text-slate-500">Devices</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(template.metadata.createdAt).toLocaleDateString()}
                  </div>
                  {template.metadata.author && (
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {template.metadata.author}
                    </div>
                  )}
                </div>

                {template.metadata.tags.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {template.metadata.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
